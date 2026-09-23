"use client";

import { AtSign, CornerUpLeft, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SocialAccountSelector } from "@/components/integrations/social";
import { APP_ROUTES } from "@/constants";
import {
  EMAIL_REPLY_TO,
  EMAIL_SENDERS,
  SMS_PROVIDERS,
  WHATSAPP_CONNECTIONS,
  smsSenderOptions,
} from "@/lib/campaign-fixtures";
import { EMAIL_PROVIDER, EMAIL_SENDER_IDENTITIES } from "@/lib/email-fixtures";
import { formatNumber, formatPercent } from "@/lib/format";
import { StepSection } from "./shared";
import type { StepProps } from "./types";

/**
 * Step 4 - who the campaign comes from.
 *
 * It used to be a section at the bottom of the Details step, under the channel
 * picker, and it was the part of that screen people scrolled past: by the time
 * anyone reached it they had already decided what they were making and were
 * looking for the Continue button. On its own screen the sender is a decision
 * instead of a default, which is what it should be - the from line is the first
 * thing a recipient reads, reputation accrues to it, and replies land wherever
 * it says they do.
 *
 * Only ever one channel's configuration is on screen. The other channels'
 * fields are not rendered rather than disabled: a form that shows an SMS sender
 * ID while the campaign is an email is a form that gets one filled in by
 * mistake. The draft keeps all four sets, so switching channel to compare and
 * switching back finds the earlier answer still there.
 *
 * Nothing here is a second copy of a connection. Identities come from the Email
 * module's own sender settings, WhatsApp connections and SMS providers from
 * Integrations, social accounts from the Planner - this step chooses among
 * them and says where they are managed.
 */

export function SenderStep(props: StepProps) {
  const { draft } = props;

  if (draft.channel === "whatsapp") return <WhatsAppSender {...props} />;
  if (draft.channel === "email") return <EmailSender {...props} />;
  if (draft.channel === "sms") return <SmsSender {...props} />;
  return <SocialSender {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The inbox line, rendered as an inbox renders it.
 *
 * A name and an address in two form fields do not read as the thing they
 * produce. This is that thing: bold display name, muted address, and the
 * subject underneath so the whole first impression is on one surface.
 */
function FromPreview({
  name,
  email,
  subject,
  previewText,
}: {
  name: string;
  email: string;
  subject: string;
  previewText: string;
}) {
  return (
    <div className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
      <p className="text-sm font-medium tracking-[0.06em] text-text-muted uppercase">
        As it arrives
      </p>
      <p className="mt-2 text-sm font-bold text-text-primary">
        {name || "No sender name"}{" "}
        <span className="font-medium text-text-muted">&lt;{email || "not set"}&gt;</span>
      </p>
      <p className="mt-1 truncate text-sm font-bold text-text-primary">
        {subject || "No subject line yet"}
      </p>
      <p className="truncate text-sm text-text-muted">
        {previewText || "No preview text - the first line of the body shows here."}
      </p>
    </div>
  );
}

function EmailSender({ draft, set }: StepProps) {
  const sender = draft.sender;
  const patch = (next: Partial<typeof sender>) =>
    set("sender", { ...sender, ...next });

  const identity = EMAIL_SENDER_IDENTITIES.find(
    (item) => item.email === sender.emailFrom,
  );

  const quota = Math.round(
    (EMAIL_PROVIDER.sentToday / EMAIL_PROVIDER.dailyLimit) * 100,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <StepSection
          title="Sending identity"
          hint="Verified identities only. Manage them in Email → Senders."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="From address" htmlFor="cmp-email-from">
              <Select
                id="cmp-email-from"
                label="From address"
                hideLabel={false}
                value={sender.emailFrom}
                onChange={(next) => {
                  const picked = EMAIL_SENDER_IDENTITIES.find(
                    (item) => item.email === next,
                  );
                  /* Reply-to follows the identity, because it is a property of
                     the mailbox someone agreed to monitor - but only until it
                     is set by hand, which the field below is free to do. */
                  patch({
                    emailFrom: next,
                    emailReplyTo: picked?.replyTo ?? sender.emailReplyTo,
                  });
                }}
                options={EMAIL_SENDERS}
              />
            </Field>

            <Field
              label="Sender name"
              htmlFor="cmp-email-name"
              hint="Comes from the identity - change it in Email → Senders."
            >
              {/* Read-only rather than a text input: the display name is part of
                  the identity's reputation, and letting a campaign invent one
                  is how a workspace ends up with six spellings of its own
                  name in six inboxes. */}
              <p
                id="cmp-email-name"
                className="flex h-10 items-center rounded-btn border border-border bg-surface-secondary px-3 text-sm font-medium text-text-secondary"
              >
                {identity?.name ?? "Pick an identity first"}
              </p>
            </Field>
          </div>

          {identity ? (
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <Badge tone="success" size="sm">
                Verified
              </Badge>
              <span className="text-sm font-medium text-text-muted">
                {formatNumber(identity.sent30d)} sent in the last 30 days ·{" "}
                {formatPercent(identity.deliveryRate)} delivered
              </span>
            </div>
          ) : null}
        </StepSection>

        <StepSection
          title="Replies"
          hint="Where a reply to this campaign lands. Often a monitored inbox rather than the sender."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Reply-to" htmlFor="cmp-email-replyto">
              <Select
                id="cmp-email-replyto"
                label="Reply-to"
                hideLabel={false}
                value={sender.emailReplyTo}
                onChange={(next) => patch({ emailReplyTo: next })}
                options={EMAIL_REPLY_TO}
              />
            </Field>
          </div>

          {sender.emailReplyTo && identity && sender.emailReplyTo !== identity.replyTo ? (
            <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-text-muted">
              <CornerUpLeft className="size-3.5 shrink-0" aria-hidden />
              Overrides {identity.name}&rsquo;s usual reply-to ({identity.replyTo}) for
              this campaign only.
            </p>
          ) : null}
        </StepSection>

        <StepSection
          title="Provider"
          hint="The transport underneath every identity. Configured in Integrations → Email."
        >
          <div className="rounded-panel border border-border px-3.5 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Server className="size-4 text-text-muted" aria-hidden />
              <p className="text-sm font-bold text-text-primary">
                {EMAIL_PROVIDER.name}
              </p>
              <Badge tone={EMAIL_PROVIDER.connected ? "success" : "danger"} size="sm">
                {EMAIL_PROVIDER.connected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="font-mono text-sm text-text-muted">
                {EMAIL_PROVIDER.host}:{EMAIL_PROVIDER.port} ·{" "}
                {EMAIL_PROVIDER.encryption}
              </span>
            </div>

            <p className="mt-2 text-sm text-text-secondary">
              {formatNumber(EMAIL_PROVIDER.sentToday)} of{" "}
              {formatNumber(EMAIL_PROVIDER.dailyLimit)} sent today ({quota}% of the
              daily quota), at up to {EMAIL_PROVIDER.rateLimit} per second.
            </p>
          </div>

          <p className="mt-2.5 text-sm font-medium text-text-muted">
            <a
              href={APP_ROUTES.emailSenders}
              className="text-primary underline-offset-2 hover:underline"
            >
              Email → Senders
            </a>{" "}
            manages identities, reply-to defaults and domain authentication.
          </p>
        </StepSection>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="text-base font-semibold text-text-primary/80">Inbox line</p>
        <div className="mt-2.5">
          <FromPreview
            name={identity?.name ?? ""}
            email={sender.emailFrom}
            subject={draft.subject}
            previewText={draft.previewText}
          />
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Most clients show about 40 characters of the subject on a phone, and the
          preview text only if there is one.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

function WhatsAppSender({ draft, set }: StepProps) {
  const sender = draft.sender;
  const patch = (next: Partial<typeof sender>) =>
    set("sender", { ...sender, ...next });

  const connection = WHATSAPP_CONNECTIONS.find(
    (item) => item.id === sender.whatsappConnectionId,
  );

  return (
    <StepSection
      title="WhatsApp sender"
      hint="Connections come from Integrations → WhatsApp."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Connection" htmlFor="cmp-wa-connection">
          <Select
            id="cmp-wa-connection"
            label="Connection"
            hideLabel={false}
            value={sender.whatsappConnectionId}
            onChange={(next) => {
              const target = WHATSAPP_CONNECTIONS.find((item) => item.id === next);
              /* Numbers belong to a connection, so switching one has to move
                 the other - a number from the old connection would be a sender
                 the new one cannot use. */
              patch({
                whatsappConnectionId: next,
                whatsappNumberId: target?.numbers[0]?.id ?? "",
              });
            }}
            options={WHATSAPP_CONNECTIONS.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </Field>

        <Field label="Sender number" htmlFor="cmp-wa-number">
          <Select
            id="cmp-wa-number"
            label="Sender number"
            hideLabel={false}
            value={sender.whatsappNumberId}
            onChange={(next) => patch({ whatsappNumberId: next })}
            options={(connection?.numbers ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </Field>
      </div>

      {connection?.verified ? (
        <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-text-muted">
          <Badge tone="success" size="sm">
            Verified
          </Badge>
          Approved templates are required outside the 24-hour reply window.
        </p>
      ) : null}
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* SMS                                                                        */
/* -------------------------------------------------------------------------- */

function SmsSender({ draft, set }: StepProps) {
  const sender = draft.sender;
  const patch = (next: Partial<typeof sender>) =>
    set("sender", { ...sender, ...next });

  return (
    <StepSection title="SMS sender" hint="Providers come from Integrations → SMS.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Provider" htmlFor="cmp-sms-provider">
          <Select
            id="cmp-sms-provider"
            label="Provider"
            hideLabel={false}
            value={sender.smsProviderId}
            onChange={(next) => {
              /* Sender IDs are registered per gateway; carrying one across
                 providers is how a send gets rejected at the carrier. */
              const allowed = smsSenderOptions(next);
              patch({
                smsProviderId: next,
                smsSenderId: allowed.some((item) => item.value === sender.smsSenderId)
                  ? sender.smsSenderId
                  : (allowed[0]?.value ?? ""),
              });
            }}
            options={SMS_PROVIDERS.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </Field>

        <Field label="Sender ID" htmlFor="cmp-sms-sender">
          <Select
            id="cmp-sms-sender"
            label="Sender ID"
            hideLabel={false}
            value={sender.smsSenderId}
            onChange={(next) => patch({ smsSenderId: next })}
            options={smsSenderOptions(sender.smsProviderId)}
          />
        </Field>
      </div>

      <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-text-muted">
        <AtSign className="size-3.5 shrink-0" aria-hidden />
        An alphanumeric sender ID cannot receive replies. Pick a long number if
        this campaign asks for one.
      </p>
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

function SocialSender({ draft, set, errors }: StepProps) {
  return (
    <StepSection
      title="Publish to"
      hint="Connected accounts, owned by Integrations → Social."
    >
      <SocialAccountSelector
        selected={draft.socialAccountIds}
        onChange={(ids) => set("socialAccountIds", ids)}
      />
      {errors.socialAccountIds ? (
        <p className="mt-2 text-sm text-error">{errors.socialAccountIds}</p>
      ) : null}
    </StepSection>
  );
}
