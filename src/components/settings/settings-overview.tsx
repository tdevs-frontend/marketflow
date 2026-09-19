"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants/app";
import { NOTIFICATION_EVENTS, SETTINGS_SECTIONS } from "@/constants/settings";
import { WORKSPACE_CURRENCIES } from "@/constants/workspace";
import { PLANS } from "@/constants/pricing";
import {
  useAccount,
  useNotificationPolicy,
  useNotificationPreferences,
  useSecurityState,
  useSubscription,
} from "@/lib/account-store";
import { useApiKeys } from "@/lib/api-key-store";
import { useWebhooks } from "@/lib/webhook-store";
import { useWorkspaceSettings } from "@/lib/workspace-settings-store";
import { displayName } from "@/types/account";

/**
 * Settings — the account hub.
 *
 * This page used to be "General", and General was a second editor for the
 * workspace name, slug, timezone, currency, business details and default
 * senders. Every one of those already had an owner in Workspace Settings, which
 * has held General, Business, Branding, Defaults and Data & Preferences all
 * along. Two editors for one value is not a convenience — it is a question
 * about which screen is telling the truth, and a merchant has no way to answer
 * it. The forms are gone; the *values* stay, read-only, with one link to the
 * screen that owns them.
 *
 * The separation this page exists to make obvious:
 *
 *   /dashboard/settings            who I am, what reaches me, how I am
 *                                  protected, what we pay for, how systems
 *                                  connect
 *
 *   /dashboard/workspace/settings  how the business itself is configured
 *
 * Deleting the route outright was the other option and would have been worse:
 * "the workspace name" is something people look for under Settings, and a
 * section that quietly stops existing sends them hunting.
 *
 * Every card carries a live status line rather than a description alone. A hub
 * of five identical links is a table of contents; a hub that says "Two-factor:
 * Disabled" and "3 active keys" is a status board, and it is the one thing on
 * the route worth loading.
 */

export function SettingsOverview() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account, notifications, security and subscription."
      />

      <WorkspaceSummary />

      <section aria-labelledby="settings-sections" className="space-y-3">
        <h2
          id="settings-sections"
          className="text-meta font-semibold tracking-wide text-text-muted uppercase"
        >
          Your account
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_SECTIONS.map((section) => (
            <SectionCard key={section.href} section={section} />
          ))}
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The workspace, as three facts and a door.
 *
 * Read-only on purpose, and the three chosen are the ones people come to
 * Settings to check rather than to change: what this workspace is called, what
 * timezone its schedules run in, what currency its money is in. Anything else —
 * slug, business details, branding, senders, retention — is one click away in
 * the editor that owns it.
 */
function WorkspaceSummary() {
  const settings = useWorkspaceSettings();
  const { general } = settings;

  const currency =
    WORKSPACE_CURRENCIES.find((option) => option.value === general.currency)
      ?.label ?? general.currency;

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary-dark">
          <Building2 className="size-5" aria-hidden />
        </span>

        <div className="min-w-0">
          <p className="text-meta font-semibold tracking-wide text-text-muted uppercase">
            Workspace
          </p>
          <p className="mt-0.5 truncate text-base font-bold text-text-primary">
            {general.name}
          </p>
          <p className="mt-0.5 text-sm font-medium text-text-secondary">
            {general.timezone.replace("_", " ")} · {currency}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <Link
          href={APP_ROUTES.workspaceSettings}
          className={buttonVariants({ variant: "outline", size: "compact" })}
        >
          Manage workspace settings
          <ArrowUpRight aria-hidden />
        </Link>
        <p className="mt-2 max-w-xs text-sm text-text-muted sm:text-right">
          Business details, branding, defaults and data retention are managed
          separately.
        </p>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Section cards                                                              */
/* -------------------------------------------------------------------------- */

interface Status {
  label: string;
  tone: BadgeTone;
  /** The line under the title. Replaces the static summary when present. */
  detail?: string;
}

/**
 * What each section says about itself right now.
 *
 * Derived from the same stores the sections themselves read, so the hub cannot
 * fall behind them: turn two-factor on and this card says Enabled before the
 * dialog has closed.
 */
function useSectionStatus(href: string): Status | null {
  const user = useAccount();
  const security = useSecurityState();
  const subscription = useSubscription();
  const preferences = useNotificationPreferences();
  const policy = useNotificationPolicy();
  const keys = useApiKeys();
  const webhooks = useWebhooks();

  switch (href) {
    case APP_ROUTES.settingsProfile:
      return {
        label: user.roleName,
        tone: "brand",
        detail: `${displayName(user)} · ${user.email}`,
      };

    case APP_ROUTES.settingsNotifications: {
      const available = NOTIFICATION_EVENTS.filter(
        (event) => policy.enabled[event.key] !== false,
      );
      const on = available.filter(
        (event) => (preferences.channels[event.key] ?? []).length > 0,
      ).length;

      return {
        label: `${on} of ${available.length} on`,
        tone: on === 0 ? "warning" : "neutral",
        detail:
          on === 0
            ? "Everything is muted — you will not be told about failures."
            : "Across campaigns, leads, messaging, automations, orders and security.",
      };
    }

    case APP_ROUTES.settingsSecurity: {
      const enabled = security.twoFactor === "enabled";
      return {
        label: enabled ? "2FA enabled" : "2FA disabled",
        tone: enabled ? "success" : "warning",
        detail: enabled
          ? "Your account is protected with an authenticator app."
          : "Add an authenticator app so a stolen password is not enough.",
      };
    }

    case APP_ROUTES.settingsBilling: {
      const plan = PLANS.find((item) => item.id === subscription.planId);
      return {
        label: subscription.status === "active" ? "Active" : subscription.status,
        tone: subscription.status === "active" ? "success" : "warning",
        detail: `${plan?.name ?? subscription.planId} · $${subscription.amount} / ${
          subscription.period === "yearly" ? "year" : "month"
        }`,
      };
    }

    case APP_ROUTES.settingsApi: {
      const active = keys.filter((key) => key.status === "active").length;
      return {
        label: `${active} active ${active === 1 ? "key" : "keys"}`,
        tone: "neutral",
        detail: `${webhooks.length} webhook ${webhooks.length === 1 ? "endpoint" : "endpoints"} configured.`,
      };
    }

    default:
      return null;
  }
}

function SectionCard({
  section,
}: {
  section: (typeof SETTINGS_SECTIONS)[number];
}) {
  const status = useSectionStatus(section.href);
  const Icon = section.icon;

  return (
    <Card interactive className="group relative p-5">
      <div className="flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary transition-colors group-hover:bg-primary-soft group-hover:text-primary-dark">
          <Icon className="size-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base">
              {/*
                The whole card is the target, via a stretched overlay on the
                link rather than a click handler on the card. It stays one
                anchor — one tab stop, a real href, middle-clickable — and the
                heading is still what a screen reader announces as the link.
              */}
              <Link href={section.href} className="focus-visible:outline-none">
                <span className="absolute inset-0 rounded-card" aria-hidden />
                {section.title}
              </Link>
            </h3>

            <ChevronRight
              className="mt-0.5 size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </div>

          <p className="mt-1 text-sm text-text-secondary">
            {status?.detail ?? section.summary}
          </p>

          {status ? (
            <Badge tone={status.tone} size="sm" className="mt-3">
              {status.label}
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
