"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { APP_ROUTES } from "@/constants/app";
import {
  COUNTRIES,
  INDUSTRIES,
  WORKSPACE_CURRENCIES,
  WORKSPACE_TIMEZONES,
} from "@/constants/workspace";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import {
  saveWorkspaceSection,
  useWorkspaceSettings,
} from "@/lib/workspace-settings-store";
import type { WorkspaceSettings } from "@/types/workspace";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";

import { SaveBar, SettingsSection, useSaveState } from "./settings-section";

/**
 * General — how this workspace is configured.
 *
 * The line this page holds, and the reason Settings has six sections instead of
 * a pile of forms: **General is the workspace, Profile is the person.** Nothing
 * personal is on this page. A merchant who changes the timezone here changes it
 * for everybody; a merchant who changes their phone number does it in Profile
 * and changes it for nobody else. When those two live on one screen, the first
 * question anybody asks about any field is which kind it is.
 *
 * Three sections, each a thing a workspace *is*: what it is called and where it
 * lives, who the business is, and what it sends as by default. Branding, data
 * retention and the per-module defaults stay in Workspace Settings, which is
 * the full editor — this is the part people come to Settings looking for, and
 * the card at the bottom is the door to the rest.
 *
 * Both screens read and write `lib/workspace-settings-store`, so they are two
 * views of one record rather than two copies of it. That was the real defect in
 * having both: each held its own `useState(WORKSPACE_SETTINGS)`, so the same
 * field could give different answers depending on the route you arrived by, and
 * nothing on either screen told you which to believe.
 */

const TIMEZONE_OPTIONS = WORKSPACE_TIMEZONES.map((zone) => ({
  value: zone,
  label: zone.replace("_", " "),
}));

const INDUSTRY_OPTIONS = INDUSTRIES.map((value) => ({ value, label: value }));
const COUNTRY_OPTIONS = COUNTRIES.map((value) => ({ value, label: value }));

export function GeneralSettings() {
  const settings = useWorkspaceSettings();
  const permissions = useWorkspacePermissions();
  const editable = permissions.canEditSettings;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your workspace, account and preferences."
      />

      <div className="space-y-6">
        {!editable ? (
          <Card className="px-4 py-3.5">
            <p className="text-sm font-medium text-text-secondary">
              {permissionHint("editing workspace settings", permissions.roleName)}
            </p>
          </Card>
        ) : null}

        <WorkspaceIdentity settings={settings} editable={editable} />
        <BusinessInformation settings={settings} editable={editable} />
        <DefaultSenders settings={settings} editable={editable} />

        <SettingsSection
          title="More workspace configuration"
          description="Branding, module defaults, duplicate handling and data retention."
          action={
            <Link
              href={APP_ROUTES.workspaceSettings}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Workspace settings
              <ArrowUpRight aria-hidden />
            </Link>
          }
        >
          <p className="max-w-2xl text-sm text-text-secondary">
            The settings above are the ones people come to Settings looking for.
            The rest of this workspace&rsquo;s configuration — logo and brand
            colour, the owner a new lead is assigned to, how duplicate contacts
            are resolved, how long records are kept — lives in one editor beside
            Team and Roles, and writes to the same record as this page.
          </p>
        </SettingsSection>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace identity                                                         */
/* -------------------------------------------------------------------------- */

function WorkspaceIdentity({
  settings,
  editable,
}: {
  settings: WorkspaceSettings;
  editable: boolean;
}) {
  const id = useId();
  const { state, run, setError } = useSaveState();

  const saved = settings.general;
  const [draft, setDraft] = useState(saved);
  const [touched, setTouched] = useState(false);

  const patch = (next: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const nameError =
    touched && !draft.name.trim() ? "Give this workspace a name." : undefined;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function save() {
    setTouched(true);
    if (!draft.name.trim()) {
      setError("Give this workspace a name.");
      return;
    }

    void run(async () => {
      const next = {
        ...draft,
        name: draft.name.trim(),
        slug: slugify(draft.slug || draft.name),
      };
      saveWorkspaceSection("general", next);
      setDraft(next);
      setTouched(false);
      return { ok: true as const, data: next };
    });
  }

  return (
    <SettingsSection
      title="Workspace"
      description="What this workspace is called, and the locale everything is measured in."
      footer={
        editable ? (
          <SaveBar
            state={state}
            dirty={dirty}
            onSave={save}
            onCancel={() => {
              setDraft(saved);
              setTouched(false);
            }}
          />
        ) : undefined
      }
      bodyClassName="max-w-2xl space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Workspace name" htmlFor={`${id}-name`} error={nameError}>
          <Input
            id={`${id}-name`}
            value={draft.name}
            disabled={!editable}
            error={Boolean(nameError)}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </Field>

        <Field
          label="Workspace URL"
          htmlFor={`${id}-slug`}
          hint="Used in links and exports. Letters, numbers and hyphens."
        >
          <Input
            id={`${id}-slug`}
            value={draft.slug}
            disabled={!editable}
            onChange={(event) => patch({ slug: event.target.value })}
            onBlur={(event) => patch({ slug: slugify(event.target.value) })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Timezone"
          htmlFor={`${id}-timezone`}
          hint="Schedules, reports and every timestamp in the dashboard."
        >
          <Select
            id={`${id}-timezone`}
            label="Timezone"
            value={draft.timezone}
            disabled={!editable}
            onChange={(timezone) => patch({ timezone })}
            options={TIMEZONE_OPTIONS}
          />
        </Field>

        <Field
          label="Currency"
          htmlFor={`${id}-currency`}
          hint="Prices, order totals and revenue reporting."
        >
          <Select
            id={`${id}-currency`}
            label="Currency"
            value={draft.currency}
            disabled={!editable}
            onChange={(currency) => patch({ currency })}
            options={WORKSPACE_CURRENCIES}
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Business information                                                       */
/* -------------------------------------------------------------------------- */

function BusinessInformation({
  settings,
  editable,
}: {
  settings: WorkspaceSettings;
  editable: boolean;
}) {
  const id = useId();
  const { state, run, setError } = useSaveState();

  const saved = settings.business;
  const [draft, setDraft] = useState(saved);
  const [touched, setTouched] = useState(false);

  const patch = (next: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const emailError =
    draft.supportEmail.trim() && !isValidEmail(draft.supportEmail)
      ? "Enter a valid email address."
      : undefined;

  const phoneError =
    draft.phone.trim() && !isValidPhone(draft.phone)
      ? "Enter a valid phone number, or leave it empty."
      : undefined;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function save() {
    setTouched(true);
    if (emailError || phoneError) {
      setError(emailError ?? phoneError ?? "Check the highlighted fields.");
      return;
    }

    void run(async () => {
      const next = { ...draft, supportEmail: draft.supportEmail.trim() };
      saveWorkspaceSection("business", next);
      setDraft(next);
      setTouched(false);
      return { ok: true as const, data: next };
    });
  }

  return (
    <SettingsSection
      title="Business information"
      description="Who this workspace belongs to. Used on receipts, invoices and compliance footers."
      footer={
        editable ? (
          <SaveBar
            state={state}
            dirty={dirty}
            onSave={save}
            onCancel={() => {
              setDraft(saved);
              setTouched(false);
            }}
          />
        ) : undefined
      }
      bodyClassName="max-w-2xl space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Legal name" htmlFor={`${id}-legal`}>
          <Input
            id={`${id}-legal`}
            value={draft.legalName}
            disabled={!editable}
            onChange={(event) => patch({ legalName: event.target.value })}
          />
        </Field>

        <Field label="Industry" htmlFor={`${id}-industry`}>
          <Select
            id={`${id}-industry`}
            label="Industry"
            value={draft.industry}
            disabled={!editable}
            onChange={(industry) => patch({ industry })}
            options={INDUSTRY_OPTIONS}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Support email"
          htmlFor={`${id}-support`}
          error={touched ? emailError : undefined}
          hint="Where customers reply. Not your sign-in address."
        >
          <Input
            id={`${id}-support`}
            type="email"
            value={draft.supportEmail}
            disabled={!editable}
            error={Boolean(touched && emailError)}
            onChange={(event) => patch({ supportEmail: event.target.value })}
          />
        </Field>

        <Field
          label="Business phone"
          htmlFor={`${id}-phone`}
          error={touched ? phoneError : undefined}
        >
          <Input
            id={`${id}-phone`}
            type="tel"
            value={draft.phone}
            disabled={!editable}
            error={Boolean(touched && phoneError)}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website" htmlFor={`${id}-website`}>
          <Input
            id={`${id}-website`}
            type="url"
            inputMode="url"
            value={draft.website}
            disabled={!editable}
            onChange={(event) => patch({ website: event.target.value })}
          />
        </Field>

        <Field label="Country" htmlFor={`${id}-country`}>
          <Select
            id={`${id}-country`}
            label="Country"
            value={draft.country}
            disabled={!editable}
            onChange={(country) => patch({ country })}
            options={COUNTRY_OPTIONS}
          />
        </Field>
      </div>

      <Field
        label="Registered address"
        htmlFor={`${id}-address`}
        hint="Shown on invoices and in the footer of marketing email, where the law requires it."
      >
        <Textarea
          id={`${id}-address`}
          rows={2}
          value={draft.address}
          disabled={!editable}
          onChange={(event) => patch({ address: event.target.value })}
        />
      </Field>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Default senders                                                            */
/* -------------------------------------------------------------------------- */

/**
 * What a campaign sends as when nobody chose.
 *
 * Only the *defaults* are here. The sender identities themselves — which
 * addresses are verified, which sender IDs an operator has approved, which
 * WhatsApp numbers are connected — belong to the channel modules that can
 * actually verify them, and each field links across to its own. Editing the
 * default is a workspace preference; creating an identity is an integration.
 */
function DefaultSenders({
  settings,
  editable,
}: {
  settings: WorkspaceSettings;
  editable: boolean;
}) {
  const id = useId();
  const { state, run } = useSaveState();

  const saved = settings.defaults;
  const [draft, setDraft] = useState(saved);

  const patch = (next: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function save() {
    void run(async () => {
      saveWorkspaceSection("defaults", draft);
      return { ok: true as const, data: draft };
    });
  }

  return (
    <SettingsSection
      title="Default senders"
      description="What a new campaign sends as, before anyone picks something else."
      footer={
        editable ? (
          <SaveBar
            state={state}
            dirty={dirty}
            onSave={save}
            onCancel={() => setDraft(saved)}
          />
        ) : undefined
      }
      bodyClassName="max-w-2xl space-y-4"
    >
      <Field
        label="Email sender"
        htmlFor={`${id}-email`}
        hint={
          <>
            Must be a verified address.{" "}
            <Link
              href={APP_ROUTES.emailSenders}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Manage sender identities
            </Link>
          </>
        }
      >
        <Input
          id={`${id}-email`}
          type="email"
          value={draft.emailSender}
          disabled={!editable}
          onChange={(event) => patch({ emailSender: event.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="WhatsApp number"
          htmlFor={`${id}-whatsapp`}
          hint={
            <>
              <Link
                href={APP_ROUTES.integrations}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Connected numbers
              </Link>
            </>
          }
        >
          <Input
            id={`${id}-whatsapp`}
            value={draft.whatsappAccount}
            disabled={!editable}
            onChange={(event) => patch({ whatsappAccount: event.target.value })}
          />
        </Field>

        <Field
          label="SMS sender ID"
          htmlFor={`${id}-sms`}
          hint="Up to 11 characters. Operators must approve it."
        >
          <Input
            id={`${id}-sms`}
            maxLength={11}
            value={draft.smsSender}
            disabled={!editable}
            onChange={(event) => patch({ smsSender: event.target.value })}
          />
        </Field>
      </div>
    </SettingsSection>
  );
}
