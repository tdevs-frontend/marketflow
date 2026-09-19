import Link from "next/link";
import { ArrowUpRight, Building2, Mail, Terminal, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants/app";
import { WORKSPACE_CURRENCIES } from "@/constants/workspace";
import { WORKSPACE_SETTINGS } from "@/lib/workspace-fixtures";

/**
 * General — what this workspace is, read-only, and where to change it.
 *
 * This panel used to be a second editor. It offered Workspace name, Timezone,
 * From name and Reply-to address, and every one of those four already had an
 * owner somewhere else in the product:
 *
 *   Workspace name  → Workspace Settings → General
 *   Timezone        → Workspace Settings → General
 *   From name       → Workspace Settings → Branding (Email sender name)
 *   Reply-to        → Marketing → Email → Senders, which models it per sender
 *
 * So all four were duplicates, and the copies here were the thinner ones: no
 * validation, no slug, no currency, no unsaved-changes guard, and a Save
 * button that wrote to nothing. Two editors for one value is not a
 * convenience — it is a question about which screen is telling the truth, and
 * the merchant has no way to answer it.
 *
 * Deleting the tab outright was the other option and would have been worse.
 * "Workspace name" is a thing people look for under Settings, and a section
 * that quietly stops existing sends them hunting. So it stays, as a reading
 * rather than a form: the live values, and one link to the screen that owns
 * them.
 */

const { general, branding } = WORKSPACE_SETTINGS;

const currencyLabel =
  WORKSPACE_CURRENCIES.find((option) => option.value === general.currency)
    ?.label ?? general.currency;

/** The values worth surfacing here — the ones people come to Settings for. */
const SUMMARY: { label: string; value: string }[] = [
  { label: "Workspace name", value: general.name },
  { label: "Workspace URL", value: `marketflow.app/${general.slug}` },
  { label: "Timezone", value: general.timezone },
  { label: "Currency", value: currencyLabel },
  { label: "Email sender name", value: branding.senderName },
];

/** The other three screens that own a slice of workspace configuration. */
const ELSEWHERE: {
  icon: typeof Building2;
  title: string;
  description: string;
  href: string;
}[] = [
  {
    icon: Users,
    title: "Team and roles",
    description: "Who works here, what they can reach, and what they changed.",
    href: APP_ROUTES.workspaceTeam,
  },
  {
    icon: Mail,
    title: "Sender identities",
    description:
      "From names and reply-to addresses, per sender, with verification state.",
    href: APP_ROUTES.emailSenders,
  },
  {
    icon: Building2,
    title: "Integrations",
    description: "The WhatsApp, email and SMS connections campaigns send on.",
    href: APP_ROUTES.integrations,
  },
  {
    icon: Terminal,
    title: "API and developer keys",
    description:
      "Keys, scopes, request logs and webhook endpoints, under Integrations.",
    href: APP_ROUTES.integrationsApi,
  },
];

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Workspace"
          description="Configured in Workspace Settings, and shown here so you can check it without leaving."
          action={
            <Link
              href={APP_ROUTES.workspaceSettings}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open Workspace Settings
              <ArrowUpRight aria-hidden />
            </Link>
          }
        />
        <CardBody>
          {/* A definition list, not a table: five pairs do not need column
              headers, and `dl` is what a read-only pair actually is. */}
          <dl className="divide-y divide-border">
            {SUMMARY.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-text-secondary">
                  {row.label}
                </dt>
                <dd className="text-sm font-semibold text-text-primary">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Configured elsewhere"
          description="The rest of this workspace's setup, in the modules that own it."
        />
        <CardBody>
          <ul className="divide-y divide-border">
            {ELSEWHERE.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted transition-colors group-hover:bg-primary-soft group-hover:text-primary-dark">
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-text-primary group-hover:text-primary-dark">
                        {item.title}
                      </span>
                      <span className="block text-sm text-text-muted">
                        {item.description}
                      </span>
                    </span>

                    <ArrowUpRight
                      className="size-4 shrink-0 text-text-muted transition-colors group-hover:text-primary-dark"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
