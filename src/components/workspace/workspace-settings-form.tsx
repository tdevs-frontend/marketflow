"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ImageUp, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import {
  COUNTRIES,
  DATE_FORMATS,
  DUPLICATE_HANDLING_OPTIONS,
  INDUSTRIES,
  LEAD_SOURCES,
  LOGO_RULES,
  WORKSPACE_CURRENCIES,
  WORKSPACE_LANGUAGES,
  WORKSPACE_TIMEZONES,
} from "@/constants/workspace";
import { formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW, WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { WORKSPACE_MEMBERS, WORKSPACE_SETTINGS } from "@/lib/workspace-fixtures";
import { slugify } from "@/lib/utils";
import type { SettingsSection, WorkspaceSettings } from "@/types/workspace";
import {
  permissionHint,
  useWorkspacePermissions,
} from "./use-workspace-permissions";

/**
 * Workspace Settings — how this workspace is configured.
 *
 * Five sections as tabs, following the pattern the product's own Settings page
 * already uses. They are tabs rather than sidebar entries because they are all
 * one screen's worth of configuration for one thing; four more rows in the
 * sidebar would be four more decisions before a merchant knows what is inside
 * any of them.
 *
 * Nothing personal lives here. Profile, notifications and password belong to
 * whoever is signed in and already have a home. Nothing platform-level lives
 * here either — this configures one merchant's workspace and nothing beyond it.
 *
 * Saving is per section with one shared bar. A merchant editing branding should
 * not be told they have unsaved changes in Defaults, and a single Save for
 * thirty fields across five tabs is how half of them get overwritten by stale
 * values.
 */

type TabValue = SettingsSection;

const TABS: TabItem<TabValue>[] = [
  { value: "general", label: "General" },
  { value: "business", label: "Business" },
  { value: "branding", label: "Branding" },
  { value: "defaults", label: "Defaults" },
  { value: "data", label: "Data & Preferences" },
];

const SECTION_LABEL: Record<TabValue, string> = {
  general: "General",
  business: "Business",
  branding: "Branding",
  defaults: "Defaults",
  data: "Data & Preferences",
};

type Errors = Partial<Record<string, string>>;

export function WorkspaceSettingsForm() {
  const idBase = useId();
  const toast = useToast();
  const permissions = useWorkspacePermissions();
  const editable = permissions.canEditSettings;

  const [tab, setTab] = useState<TabValue>("general");
  const [saved, setSaved] = useState<WorkspaceSettings>(WORKSPACE_SETTINGS);
  const [draft, setDraft] = useState<WorkspaceSettings>(WORKSPACE_SETTINGS);
  const [pendingTab, setPendingTab] = useState<TabValue | null>(null);
  /*
   * Per-section save receipts.
   *
   * "Saved" belongs to the section that was saved, not to the page: a merchant
   * who saved Branding an hour ago and is now editing Defaults should not be
   * told Defaults is saved. `savedAt` is the receipt, `saveError` the last
   * failure — both keyed by section for the same reason.
   */
  const [savedAt, setSavedAt] = useState<Partial<Record<TabValue, string>>>({});
  const [saveError, setSaveError] = useState<Partial<Record<TabValue, string>>>({});

  /** Section-level dirtiness, by comparing the draft against the saved copy. */
  const dirty = useMemo(
    () => JSON.stringify(draft[tab]) !== JSON.stringify(saved[tab]),
    [draft, saved, tab],
  );

  const errors = useMemo(() => validate(draft, tab), [draft, tab]);
  const hasErrors = Object.keys(errors).length > 0;

  /*
   * Warn before the browser discards edits.
   *
   * `beforeunload` covers reload and tab close; the in-app tab switch is
   * guarded separately below, because a router navigation never fires this.
   */
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function update<S extends TabValue>(section: S, patch: Partial<WorkspaceSettings[S]>) {
    setDraft((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
  }

  function save() {
    if (hasErrors) {
      toast("Fix the highlighted fields before saving.", "error");
      return;
    }

    /*
     * The failure path is real, not decorative.
     *
     * A settings form that can only succeed teaches a merchant to assume the
     * save worked. A slug collision is the most likely genuine rejection here —
     * it is the one field another workspace could already be using — so it is
     * the one modelled, and it reports against the field rather than as a
     * detached banner.
     */
    if (tab === "general" && draft.general.slug === "marketflow") {
      setSaveError((current) => ({
        ...current,
        general: "That slug is already taken by another workspace. Try another.",
      }));
      toast("Could not save General settings.", "error");
      return;
    }

    setSaved((current) => ({ ...current, [tab]: draft[tab] }));
    setSavedAt((current) => ({ ...current, [tab]: WORKSPACE_NOW }));
    setSaveError((current) => ({ ...current, [tab]: undefined }));
    toast(`${SECTION_LABEL[tab]} settings saved`, "success");
  }

  function discard() {
    setDraft((current) => ({ ...current, [tab]: saved[tab] }));
    toast(`${SECTION_LABEL[tab]} changes discarded`, "info");
  }

  /** Switching tabs with unsaved edits asks first rather than dropping them. */
  function requestTab(next: TabValue) {
    if (!dirty) {
      setTab(next);
      return;
    }
    setPendingTab(next);
  }

  return (
    <>
      <PageHeader
        title="Workspace Settings"
        description="Configure business defaults and workspace-wide preferences."
      />

      {!editable ? (
        <p className="flex items-start gap-2.5 rounded-card border border-border bg-surface-secondary px-4 py-3.5 text-sm text-text-secondary">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
          <span>
            <span className="font-semibold text-text-primary">View only.</span>{" "}
            {permissionHint("Edit workspace settings", permissions.roleName)}
          </span>
        </p>
      ) : null}

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={requestTab}
        label="Workspace settings sections"
        idBase={idBase}
        bleed={false}
      />

      {saveError[tab] ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-card border border-error-soft bg-error-soft px-4 py-3.5 text-sm text-error-text"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">
              Could not save {SECTION_LABEL[tab]}.
            </span>{" "}
            {saveError[tab]}
          </span>
        </p>
      ) : savedAt[tab] && !dirty ? (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Check className="size-4 shrink-0 text-success" aria-hidden />
          {SECTION_LABEL[tab]} saved{" "}
          {formatRelativeTime(savedAt[tab] as string, WORKSPACE_NOW_MS)}
        </p>
      ) : null}

      <TabPanel idBase={idBase} value={tab}>
        {tab === "general" ? (
          <GeneralSection
            value={draft.general}
            errors={errors}
            editable={editable}
            onChange={(patch) => update("general", patch)}
          />
        ) : null}

        {tab === "business" ? (
          <BusinessSection
            value={draft.business}
            errors={errors}
            editable={editable}
            onChange={(patch) => update("business", patch)}
          />
        ) : null}

        {tab === "branding" ? (
          <BrandingSection
            value={draft.branding}
            errors={errors}
            editable={editable}
            onChange={(patch) => update("branding", patch)}
          />
        ) : null}

        {tab === "defaults" ? (
          <DefaultsSection
            value={draft.defaults}
            editable={editable}
            onChange={(patch) => update("defaults", patch)}
          />
        ) : null}

        {tab === "data" ? (
          <DataSection
            value={draft.data}
            errors={errors}
            editable={editable}
            onChange={(patch) => update("data", patch)}
          />
        ) : null}
      </TabPanel>

      {/*
       * The save bar, sticky to the bottom of the viewport while dirty.
       *
       * It appears only when there is something to save — a permanently pinned
       * bar eats 64px of every settings screen to say "nothing has changed".
       */}
      {editable && dirty ? (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-7 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-text-secondary">
              <span className="inline-block size-2 rounded-full bg-warning" aria-hidden />
              <span className="ml-2">
                Unsaved changes in {SECTION_LABEL[tab]}
              </span>
            </p>

            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="compact" onClick={discard}>
                Discard Changes
              </Button>
              {hasErrors ? (
                <Tooltip content="Fix the highlighted fields first.">
                  <Button size="compact" disabled>
                    Save Changes
                  </Button>
                </Tooltip>
              ) : (
                <Button size="compact" onClick={save}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingTab)}
        onClose={() => setPendingTab(null)}
        onConfirm={() => {
          if (!pendingTab) return;
          setDraft((current) => ({ ...current, [tab]: saved[tab] }));
          setTab(pendingTab);
          setPendingTab(null);
        }}
        title="Discard unsaved changes?"
        description={`Your edits to ${SECTION_LABEL[tab]} have not been saved.`}
        confirmLabel="Discard and continue"
        cancelLabel="Keep editing"
      >
        <p className="text-sm text-text-secondary">
          Leaving this section now loses the changes you made. Save them first if
          you want to keep them.
        </p>
      </ConfirmDialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Section-scoped validation.
 *
 * Only the open tab is checked, so a half-finished Business address does not
 * block a Branding save. Each message says what is wrong with *this* field —
 * "Use lowercase letters, numbers and hyphens" rather than "Invalid".
 */
function validate(settings: WorkspaceSettings, section: SettingsSection): Errors {
  const errors: Errors = {};

  if (section === "general") {
    const { name, slug } = settings.general;
    if (!name.trim()) errors.name = "The workspace needs a name.";
    if (!slug.trim()) errors.slug = "The workspace needs a slug.";
    else if (slug !== slugify(slug)) {
      errors.slug = "Use lowercase letters, numbers and hyphens only.";
    } else if (slug.length < 3) {
      errors.slug = "Slugs are at least 3 characters.";
    }
  }

  if (section === "business") {
    const { website, phone, supportEmail, legalName } = settings.business;
    if (!legalName.trim()) errors.legalName = "Enter the business name.";
    if (supportEmail && !isValidEmail(supportEmail)) {
      errors.supportEmail = "Enter a valid email address.";
    }
    if (phone && !isValidPhone(phone)) {
      errors.phone = "Use international format, e.g. +8801712345678.";
    }
    if (website && !/^https?:\/\/.+\..+/.test(website)) {
      errors.website = "Include the protocol, e.g. https://company.com.";
    }
  }

  if (section === "branding") {
    const { brandName, brandColor, senderName } = settings.branding;
    if (!brandName.trim()) errors.brandName = "Enter the brand name.";
    if (!senderName.trim()) errors.senderName = "Enter the sender name.";
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
      errors.brandColor = "Use a 6-digit hex colour, e.g. #4F46E5.";
    }
  }

  if (section === "data") {
    const { autoArchiveDays, autoArchiveLeads, retentionMonths } = settings.data;
    if (autoArchiveLeads && (autoArchiveDays < 7 || autoArchiveDays > 730)) {
      errors.autoArchiveDays = "Choose between 7 and 730 days.";
    }
    if (retentionMonths < 1) errors.retentionMonths = "Keep at least one month.";
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

function GeneralSection({
  value,
  errors,
  editable,
  onChange,
}: {
  value: WorkspaceSettings["general"];
  errors: Errors;
  editable: boolean;
  onChange: (patch: Partial<WorkspaceSettings["general"]>) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="General"
        description="How this workspace identifies itself and formats what it shows."
      />
      <CardBody className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <Field label="Workspace name" htmlFor="ws-name" error={errors.name}>
          <Input
            id="ws-name"
            value={value.name}
            disabled={!editable}
            error={Boolean(errors.name)}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Field>

        <Field
          label="Workspace slug"
          htmlFor="ws-slug"
          hint="Used in URLs and invitation links."
          error={errors.slug}
        >
          <Input
            id="ws-slug"
            value={value.slug}
            disabled={!editable}
            error={Boolean(errors.slug)}
            onChange={(event) => onChange({ slug: event.target.value })}
            className="font-mono"
          />
        </Field>

        <Field
          label="Timezone"
          htmlFor="ws-timezone"
          hint="Campaign schedules and reports resolve against this."
        >
          <Select
            id="ws-timezone"
            label="Timezone"
            hideLabel={false}
            value={value.timezone}
            disabled={!editable}
            onChange={(next) => onChange({ timezone: next })}
            options={WORKSPACE_TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
          />
        </Field>

        <Field label="Language" htmlFor="ws-language">
          <Select
            id="ws-language"
            label="Language"
            hideLabel={false}
            value={value.language}
            disabled={!editable}
            onChange={(next) => onChange({ language: next })}
            options={WORKSPACE_LANGUAGES}
          />
        </Field>

        <Field label="Date format" htmlFor="ws-date-format">
          <Select
            id="ws-date-format"
            label="Date format"
            hideLabel={false}
            value={value.dateFormat}
            disabled={!editable}
            onChange={(next) => onChange({ dateFormat: next })}
            options={DATE_FORMATS}
          />
        </Field>

        <Field label="Time format" htmlFor="ws-time-format">
          <Select
            id="ws-time-format"
            label="Time format"
            hideLabel={false}
            value={value.timeFormat}
            disabled={!editable}
            onChange={(next) => onChange({ timeFormat: next as "12h" | "24h" })}
            options={[
              { value: "12h", label: "12-hour", hint: "2:30 PM" },
              { value: "24h", label: "24-hour", hint: "14:30" },
            ]}
          />
        </Field>

        <Field
          label="Currency"
          htmlFor="ws-currency"
          hint="Applied to order values and revenue reporting."
        >
          <Select
            id="ws-currency"
            label="Currency"
            hideLabel={false}
            value={value.currency}
            disabled={!editable}
            onChange={(next) => onChange({ currency: next })}
            options={WORKSPACE_CURRENCIES}
          />
        </Field>
      </CardBody>
    </Card>
  );
}

function BusinessSection({
  value,
  errors,
  editable,
  onChange,
}: {
  value: WorkspaceSettings["business"];
  errors: Errors;
  editable: boolean;
  onChange: (patch: Partial<WorkspaceSettings["business"]>) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Business"
        description="Used on outgoing messages and wherever MarketFlow needs to identify you to a customer."
      />
      <CardBody className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <Field label="Business name" htmlFor="ws-legal-name" error={errors.legalName}>
          <Input
            id="ws-legal-name"
            value={value.legalName}
            disabled={!editable}
            error={Boolean(errors.legalName)}
            onChange={(event) => onChange({ legalName: event.target.value })}
          />
        </Field>

        <Field label="Industry" htmlFor="ws-industry">
          <Select
            id="ws-industry"
            label="Industry"
            hideLabel={false}
            value={value.industry}
            disabled={!editable}
            onChange={(next) => onChange({ industry: next })}
            options={INDUSTRIES.map((item) => ({ value: item, label: item }))}
          />
        </Field>

        <Field label="Website" htmlFor="ws-website" error={errors.website}>
          <Input
            id="ws-website"
            type="url"
            value={value.website}
            disabled={!editable}
            error={Boolean(errors.website)}
            onChange={(event) => onChange({ website: event.target.value })}
          />
        </Field>

        <Field
          label="Business phone"
          htmlFor="ws-phone"
          hint="International format, including the country code."
          error={errors.phone}
        >
          <Input
            id="ws-phone"
            type="tel"
            value={value.phone}
            disabled={!editable}
            error={Boolean(errors.phone)}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </Field>

        <Field
          label="Support email"
          htmlFor="ws-support-email"
          hint="Where customer replies are directed."
          error={errors.supportEmail}
        >
          <Input
            id="ws-support-email"
            type="email"
            value={value.supportEmail}
            disabled={!editable}
            error={Boolean(errors.supportEmail)}
            onChange={(event) => onChange({ supportEmail: event.target.value })}
          />
        </Field>

        <Field label="Country" htmlFor="ws-country">
          <Select
            id="ws-country"
            label="Country"
            hideLabel={false}
            value={value.country}
            disabled={!editable}
            onChange={(next) => onChange({ country: next })}
            options={COUNTRIES.map((item) => ({ value: item, label: item }))}
          />
        </Field>

        <Field
          label="Business address"
          htmlFor="ws-address"
          hint="Included in the footer of marketing email, where required."
        >
          <Input
            id="ws-address"
            value={value.address}
            disabled={!editable}
            onChange={(event) => onChange({ address: event.target.value })}
          />
        </Field>
      </CardBody>
    </Card>
  );
}

function BrandingSection({
  value,
  errors,
  editable,
  onChange,
}: {
  value: WorkspaceSettings["branding"];
  errors: Errors;
  editable: boolean;
  onChange: (patch: Partial<WorkspaceSettings["branding"]>) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  /** Type and size are checked here so the error arrives before any upload. */
  function pick(file: File | undefined) {
    if (!file) return;
    if (!LOGO_RULES.types.includes(file.type)) {
      toast("Logos must be a PNG, JPG or SVG file.", "error");
      return;
    }
    if (file.size > LOGO_RULES.maxBytes) {
      toast("That logo is over 2 MB. Choose a smaller file.", "error");
      return;
    }
    onChange({ logoName: file.name });
    toast("Logo ready — save to apply it.", "success");
  }

  return (
    <Card>
      <CardHeader
        title="Branding"
        description="What your customers see on messages sent from this workspace."
      />
      <CardBody className="max-w-3xl space-y-5">
        <div>
          <p className="text-sm font-medium text-text-primary">Workspace logo</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span
              aria-hidden
              className="grid size-16 shrink-0 place-items-center rounded-panel border border-border bg-surface-secondary text-meta font-bold text-text-muted"
            >
              {value.logoName ? "LOGO" : "—"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-secondary">
                {value.logoName ?? "No logo uploaded"}
              </p>
              <p className="mt-0.5 text-meta text-text-muted">{LOGO_RULES.label}</p>

              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept={LOGO_RULES.types.join(",")}
                  className="sr-only"
                  onChange={(event) => pick(event.target.files?.[0])}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!editable}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageUp aria-hidden />
                  Upload New Logo
                </Button>
                {value.logoName ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!editable}
                    onClick={() => onChange({ logoName: null })}
                  >
                    <Trash2 aria-hidden />
                    Remove Logo
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <Field label="Brand name" htmlFor="ws-brand-name" error={errors.brandName}>
            <Input
              id="ws-brand-name"
              value={value.brandName}
              disabled={!editable}
              error={Boolean(errors.brandName)}
              onChange={(event) => onChange({ brandName: event.target.value })}
            />
          </Field>

          <Field
            label="Brand colour"
            htmlFor="ws-brand-color"
            hint="Used on customer-facing templates only, not on this dashboard."
            error={errors.brandColor}
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(value.brandColor) ? value.brandColor : undefined }}
                className="size-10 shrink-0 rounded-field border border-border"
              />
              <Input
                id="ws-brand-color"
                value={value.brandColor}
                disabled={!editable}
                error={Boolean(errors.brandColor)}
                onChange={(event) => onChange({ brandColor: event.target.value })}
                className="font-mono"
              />
            </div>
          </Field>

          <Field
            label="Email sender name"
            htmlFor="ws-sender-name"
            hint="The name recipients see in their inbox."
            error={errors.senderName}
          >
            <Input
              id="ws-sender-name"
              value={value.senderName}
              disabled={!editable}
              error={Boolean(errors.senderName)}
              onChange={(event) => onChange({ senderName: event.target.value })}
            />
          </Field>
        </div>

        {/* The preview is the point of the sender-name field — a merchant
            cannot picture "From: name" without seeing it assembled. */}
        <div className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
          <p className="text-meta font-medium text-text-muted">Inbox preview</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {value.senderName || "Sender name"}
          </p>
          <p className="text-sm text-text-muted">
            Your order is on its way — track it here
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * Defaults — the section that saves the most clicks downstream.
 *
 * Every option is populated from the modules that own it: the lead owner list
 * is the active members, the senders come from the connected integrations. A
 * hardcoded list here would drift from the workspace the first time someone
 * joined or a number changed.
 */
function DefaultsSection({
  value,
  editable,
  onChange,
}: {
  value: WorkspaceSettings["defaults"];
  editable: boolean;
  onChange: (patch: Partial<WorkspaceSettings["defaults"]>) => void;
}) {
  const memberOptions = WORKSPACE_MEMBERS.filter(
    (member) => member.status === "active",
  ).map((member) => ({ value: member.id, label: member.name }));

  return (
    <Card>
      <CardHeader
        title="Defaults"
        description="Pre-filled whenever someone creates something new. Each one can still be changed at the point of use."
      />
      <CardBody className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <Field
          label="Default lead owner"
          htmlFor="ws-lead-owner"
          hint="New leads with no assignee go to this member."
        >
          <Select
            id="ws-lead-owner"
            label="Default lead owner"
            hideLabel={false}
            value={value.leadOwnerId}
            disabled={!editable}
            onChange={(next) => onChange({ leadOwnerId: next })}
            options={memberOptions}
          />
        </Field>

        <Field label="Default pipeline" htmlFor="ws-pipeline">
          <Select
            id="ws-pipeline"
            label="Default pipeline"
            hideLabel={false}
            value={value.pipeline}
            disabled={!editable}
            onChange={(next) => onChange({ pipeline: next })}
            options={[
              { value: "Standard sales pipeline", label: "Standard sales pipeline" },
              { value: "Enterprise pipeline", label: "Enterprise pipeline" },
            ]}
          />
        </Field>

        <Field
          label="Default WhatsApp connection"
          htmlFor="ws-whatsapp"
          hint="From your connected WhatsApp integration."
        >
          <Select
            id="ws-whatsapp"
            label="Default WhatsApp connection"
            hideLabel={false}
            value={value.whatsappAccount}
            disabled={!editable}
            onChange={(next) => onChange({ whatsappAccount: next })}
            options={[
              { value: "+880 1712 345678", label: "+880 1712 345678", hint: "Meta Cloud API" },
            ]}
          />
        </Field>

        <Field label="Default email sender" htmlFor="ws-email-sender">
          <Select
            id="ws-email-sender"
            label="Default email sender"
            hideLabel={false}
            value={value.emailSender}
            disabled={!editable}
            onChange={(next) => onChange({ emailSender: next })}
            options={[
              { value: "hello@marketflow.app", label: "hello@marketflow.app", hint: "SMTP" },
            ]}
          />
        </Field>

        <Field label="Default SMS sender" htmlFor="ws-sms-sender">
          <Select
            id="ws-sms-sender"
            label="Default SMS sender"
            hideLabel={false}
            value={value.smsSender}
            disabled={!editable}
            onChange={(next) => onChange({ smsSender: next })}
            options={[{ value: "MRKTFLOW", label: "MRKTFLOW", hint: "Twilio" }]}
          />
        </Field>

        <Field
          label="Default campaign timezone"
          htmlFor="ws-campaign-tz"
          hint="Scheduling defaults to this rather than the viewer's own zone."
        >
          <Select
            id="ws-campaign-tz"
            label="Default campaign timezone"
            hideLabel={false}
            value={value.campaignTimezone}
            disabled={!editable}
            onChange={(next) => onChange({ campaignTimezone: next })}
            options={WORKSPACE_TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
          />
        </Field>

        <Field label="Default contact source" htmlFor="ws-contact-source">
          <Select
            id="ws-contact-source"
            label="Default contact source"
            hideLabel={false}
            value={value.contactSource}
            disabled={!editable}
            onChange={(next) => onChange({ contactSource: next })}
            options={LEAD_SOURCES.map((item) => ({ value: item, label: item }))}
          />
        </Field>

        <Field
          label="Default automation owner"
          htmlFor="ws-automation-owner"
          hint="Who new workflows are attributed to."
        >
          <Select
            id="ws-automation-owner"
            label="Default automation owner"
            hideLabel={false}
            value={value.automationOwnerId}
            disabled={!editable}
            onChange={(next) => onChange({ automationOwnerId: next })}
            options={memberOptions}
          />
        </Field>
      </CardBody>
    </Card>
  );
}

function DataSection({
  value,
  errors,
  editable,
  onChange,
}: {
  value: WorkspaceSettings["data"];
  errors: Errors;
  editable: boolean;
  onChange: (patch: Partial<WorkspaceSettings["data"]>) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Data & Preferences"
        description="How MarketFlow handles imported records and what it keeps."
      />
      <CardBody className="max-w-3xl space-y-5">
        <Field
          label="Duplicate contact handling"
          htmlFor="ws-duplicates"
          hint="Applied when an import contains an email that already exists."
        >
          <Select
            id="ws-duplicates"
            label="Duplicate contact handling"
            hideLabel={false}
            value={value.duplicateHandling}
            disabled={!editable}
            onChange={(next) =>
              onChange({ duplicateHandling: next as WorkspaceSettings["data"]["duplicateHandling"] })
            }
            options={DUPLICATE_HANDLING_OPTIONS}
          />
        </Field>

        <Field label="Default lead source" htmlFor="ws-lead-source">
          <Select
            id="ws-lead-source"
            label="Default lead source"
            hideLabel={false}
            value={value.defaultLeadSource}
            disabled={!editable}
            onChange={(next) => onChange({ defaultLeadSource: next })}
            options={LEAD_SOURCES.map((item) => ({ value: item, label: item }))}
          />
        </Field>

        <div className="space-y-3.5 border-t border-border pt-5">
          <CheckboxField
            id="ws-tracking"
            checked={value.campaignTracking}
            disabled={!editable}
            onCheckedChange={(next) => onChange({ campaignTracking: next })}
            label="Track campaign opens and clicks"
            hint="Adds tracking to outbound links. Turn off where local rules require it."
          />

          <CheckboxField
            id="ws-auto-archive"
            checked={value.autoArchiveLeads}
            disabled={!editable}
            onCheckedChange={(next) => onChange({ autoArchiveLeads: next })}
            label="Auto-archive inactive leads"
            hint="Archived leads stay searchable but leave the active pipeline."
          />

          {value.autoArchiveLeads ? (
            <Field
              label="Archive after"
              htmlFor="ws-archive-days"
              hint="Days without any activity on the lead."
              error={errors.autoArchiveDays}
            >
              <Input
                id="ws-archive-days"
                type="number"
                min={7}
                max={730}
                value={value.autoArchiveDays}
                disabled={!editable}
                error={Boolean(errors.autoArchiveDays)}
                onChange={(event) =>
                  onChange({ autoArchiveDays: Number(event.target.value) })
                }
                className="max-w-40"
              />
            </Field>
          ) : null}
        </div>

        <Field
          label="Data retention"
          htmlFor="ws-retention"
          hint="Months of activity history kept before it is purged."
          error={errors.retentionMonths}
        >
          <Input
            id="ws-retention"
            type="number"
            min={1}
            max={120}
            value={value.retentionMonths}
            disabled={!editable}
            error={Boolean(errors.retentionMonths)}
            onChange={(event) =>
              onChange({ retentionMonths: Number(event.target.value) })
            }
            className="max-w-40"
          />
        </Field>
      </CardBody>
    </Card>
  );
}
