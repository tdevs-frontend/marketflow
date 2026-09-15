"use client";

import { Mail, MessageCircle, Share2, Smartphone } from "lucide-react";

import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SocialAccountSelector } from "@/components/integrations/social";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TAGS,
  EMAIL_REPLY_TO,
  EMAIL_SENDERS,
  SMS_PROVIDERS,
  WHATSAPP_CONNECTIONS,
  smsSenderOptions,
} from "@/lib/campaign-fixtures";
import type { CampaignObjective, MarketingChannel } from "@/types/marketing";
import { OptionCard, StepSection, TagPicker } from "./shared";
import type { StepProps } from "./types";

/**
 * Step 1 — what this campaign is, and where it goes out from.
 *
 * The channel choice is here rather than later because it decides the shape of
 * every step after it: which segments are reachable, which composer opens,
 * which variables resolve, which validation runs. Sender configuration sits
 * directly under it for the same reason — "from where" is part of "what
 * channel", and splitting them across two steps is how a campaign reaches
 * Review with no verified sender.
 */

const CHANNEL_CARDS: {
  value: MarketingChannel;
  label: string;
  hint: string;
  icon: typeof Mail;
}[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    hint: "Highest read rate. Template needed for the first message.",
    icon: MessageCircle,
  },
  {
    value: "email",
    label: "Email",
    hint: "Best for long-form and rich layouts.",
    icon: Mail,
  },
  {
    value: "sms",
    label: "SMS",
    hint: "Short, urgent, no images. Billed per segment.",
    icon: Smartphone,
  },
  {
    value: "social",
    label: "Social",
    hint: "Publish campaign content to connected social accounts and track engagement.",
    icon: Share2,
  },
];

export function DetailsStep(props: StepProps) {
  const { draft, set, setChannel, errors } = props;

  return (
    <div className="space-y-5">
      <Field label="Campaign Name" htmlFor="cmp-name" error={errors.name}>
        <Input
          id="cmp-name"
          value={draft.name}
          error={Boolean(errors.name)}
          onChange={(event) => set("name", event.target.value)}
        />
      </Field>

      <Field
        label="Campaign Description"
        htmlFor="cmp-description"
        hint="Internal only — helps your team find it later."
      >
        <Textarea
          id="cmp-description"
          value={draft.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>

      <StepSection
        title="Objective"
        hint="Internal intent. Reporting groups campaigns by this, so a 4% click rate is judged against the right benchmark."
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_OBJECTIVES.map((item) => (
            <OptionCard
              key={item.value}
              selected={draft.objective === item.value}
              onClick={() => set("objective", item.value as CampaignObjective)}
              title={item.label}
              hint={item.hint}
            />
          ))}
        </div>
      </StepSection>

      <StepSection
        title="Campaign Tags"
        hint="Optional internal labels, shared with the rest of the workspace."
      >
        <TagPicker
          options={CAMPAIGN_TAGS}
          selected={draft.tags}
          onChange={(next) => set("tags", next)}
        />
      </StepSection>

      <StepSection title="Channel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNEL_CARDS.map((card) => {
            const Icon = card.icon;

            return (
              <OptionCard
                key={card.value}
                selected={draft.channel === card.value}
                onClick={() => setChannel(card.value)}
                icon={<Icon aria-hidden />}
                title={card.label}
                hint={card.hint}
                className="flex-col items-stretch"
              />
            );
          })}
        </div>
      </StepSection>

      <SenderSection {...props} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sender                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The channel's own configuration. Only ever one of these is on screen.
 *
 * Fields for the other channels are not rendered rather than disabled: a form
 * that shows an SMS sender ID while the campaign is an email is a form that
 * gets one filled in by mistake.
 */
function SenderSection({ draft, set, errors }: StepProps) {
  const sender = draft.sender;
  const patch = (next: Partial<typeof sender>) =>
    set("sender", { ...sender, ...next });

  if (draft.channel === "whatsapp") {
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
                   the other — a number from the old connection would be a
                   sender the new one cannot use. */
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

  if (draft.channel === "email") {
    return (
      <StepSection
        title="Email sender"
        hint="Identities come from Integrations → Email."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sender identity" htmlFor="cmp-email-from">
            <Select
              id="cmp-email-from"
              label="Sender identity"
              hideLabel={false}
              value={sender.emailFrom}
              onChange={(next) => patch({ emailFrom: next })}
              options={EMAIL_SENDERS}
            />
          </Field>

          <Field
            label="Reply-to"
            htmlFor="cmp-email-replyto"
            hint="Where replies land. Often a monitored inbox rather than the sender."
          >
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
      </StepSection>
    );
  }

  if (draft.channel === "sms") {
    return (
      <StepSection
        title="SMS sender"
        hint="Providers come from Integrations → SMS."
      >
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
      </StepSection>
    );
  }

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
