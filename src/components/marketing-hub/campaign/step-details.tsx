"use client";

import type { ReactNode } from "react";
import { Mail, MessageCircle, Smartphone } from "lucide-react";

import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import { SocialAccountSelector } from "@/components/integrations/social";
import { CHANNEL_THEME, PLATFORM_THEME } from "@/constants/channels";
import { publishableAccounts } from "@/lib/social-fixtures";
import { cn } from "@/lib/utils";
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

/**
 * The four channels, wearing the landing page's module card.
 *
 * "All-in-one growth platform" describes a module with a tinted tile, a bold
 * title, a line of body and a status pill; this is that card with the one thing
 * a landing card never needs — a pressed state. The tile is the same 44px
 * square at 12px radius holding a 20px glyph at 1.9 stroke, and the glyphs are
 * the section's own: `MessageCircle`, `Mail` and `Smartphone` are exactly what
 * `platform/platform-features` gives those three modules, so the card a
 * merchant reads on the marketing site and the card they click to create a
 * campaign are one object.
 *
 * No colour is invented here. WhatsApp, Email and SMS take their soft ground
 * and ink from `CHANNEL_THEME` — the table every chip, stat card and chart
 * series in their modules already reads, and the same tokens the landing
 * section tints its tiles with, which is why the two match without sharing a
 * constant. Social has no channel hue worth wearing (`CHANNEL_THEME.social` is
 * the Planner's slate), so it takes Instagram's from `PLATFORM_THEME`, the
 * table behind every account mark that appears under the card once it is
 * chosen.
 */
const CHANNEL_CARDS: {
  value: MarketingChannel;
  label: string;
  hint: string;
  /** Already sized and weighted — the tile only centres it. */
  icon: ReactNode;
  /** Soft ground plus ink, for the tile. */
  tile: string;
  /** The status pill's bullet, in the tile's hue. */
  dot: string;
}[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    hint: "Highest read rate. Template needed for the first message.",
    icon: <MessageCircle aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: cn(CHANNEL_THEME.whatsapp.soft, CHANNEL_THEME.whatsapp.text),
    dot: CHANNEL_THEME.whatsapp.accent,
  },
  {
    value: "email",
    label: "Email",
    hint: "Best for long-form and rich layouts.",
    icon: <Mail aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: cn(CHANNEL_THEME.email.soft, CHANNEL_THEME.email.text),
    dot: CHANNEL_THEME.email.accent,
  },
  {
    value: "sms",
    label: "SMS",
    hint: "Short, urgent, no images. Billed per segment.",
    icon: <Smartphone aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: cn(CHANNEL_THEME.sms.soft, CHANNEL_THEME.sms.text),
    dot: CHANNEL_THEME.sms.accent,
  },
  {
    value: "social",
    label: "Social",
    hint: "Publish campaign content to connected social accounts and track engagement.",
    /* The mark `PlatformMark` renders on every account row under this card, so
       the glyph does not change between choosing the channel and choosing the
       accounts it publishes to. */
    icon: <BrandIcon name={PLATFORM_THEME.instagram.icon} className="size-5" />,
    tile: cn(PLATFORM_THEME.instagram.soft, PLATFORM_THEME.instagram.text),
    dot: PLATFORM_THEME.instagram.swatch,
  },
];

/** "2 connections" — the pill's reading, in the landing card's voice. */
function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * One channel card: `FeatureCard`'s anatomy, plus a pressed state.
 *
 * Selected swaps the white ground for the brand's subtle tint and the hairline
 * for the brand border — the dashboard's existing selected treatment, not a new
 * one — and drops the hover lift, so a chosen card sits still while the other
 * three still rise to the cursor. The tile keeps its own tone either way: the
 * channel's colour is what identifies it, and recolouring it on selection would
 * hide the thing being selected.
 */
function ChannelCard({
  card,
  status,
  selected,
  onSelect,
}: {
  card: (typeof CHANNEL_CARDS)[number];
  status: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-card border p-4 text-left shadow-card",
        "transition-[translate,box-shadow,border-color,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "focus-visible:shadow-focus focus-visible:outline-none",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        selected
          ? "border-primary bg-primary-subtle"
          : "border-border bg-surface hover:-translate-y-[3px] hover:border-primary-border hover:shadow-card-hover",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-[12px]",
          card.tile,
        )}
      >
        {card.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug font-bold tracking-tight text-text-primary">
          {card.label}
        </span>
        <span className="mt-0.5 block text-sm leading-normal font-medium text-text-secondary">
          {card.hint}
        </span>
        <Badge tone="neutral" size="sm" className="mt-2">
          <span aria-hidden className={cn("size-1.5 rounded-full", card.dot)} />
          {status}
        </Badge>
      </span>
    </button>
  );
}

export function DetailsStep(props: StepProps) {
  const { draft, set, setChannel, errors } = props;

  /* What each channel can actually send from, counted off the same fixtures the
     sender section below reads — the pill is a reading, not a label. */
  const status: Record<MarketingChannel, string> = {
    whatsapp: plural(WHATSAPP_CONNECTIONS.length, "connection"),
    email: plural(EMAIL_SENDERS.length, "sender"),
    sms: plural(SMS_PROVIDERS.length, "provider"),
    social: plural(publishableAccounts().length, "account"),
  };

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
          {CHANNEL_CARDS.map((card) => (
            <ChannelCard
              key={card.value}
              card={card}
              status={status[card.value]}
              selected={draft.channel === card.value}
              onSelect={() => setChannel(card.value)}
            />
          ))}
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
