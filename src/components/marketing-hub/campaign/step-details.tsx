"use client";

import type { ReactNode } from "react";
import { Mail, MessageCircle, Share2, Smartphone } from "lucide-react";

import { Field, Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_THEME, PLATFORM_THEME } from "@/constants/channels";
import { publishableAccounts } from "@/lib/social-fixtures";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TAGS,
  EMAIL_SENDERS,
  SMS_PROVIDERS,
  WHATSAPP_CONNECTIONS,
} from "@/lib/campaign-fixtures";
import type { CampaignObjective, MarketingChannel } from "@/types/marketing";
import { OptionCard, StepSection, TagPicker } from "./shared";
import type { StepProps } from "./types";

/**
 * Step 1 - what this campaign is, and which channel carries it.
 *
 * The channel choice is here rather than later because it decides the shape of
 * every step after it: which segments are reachable, which composer opens,
 * which variables resolve, which validation runs.
 *
 * The sender configuration that used to sit under it has its own step now. It
 * was four channel-shaped sections at the bottom of a screen whose question had
 * already been answered, and it read as small print rather than as the choice
 * it is. The count on each card below is what remains of it here: a card that
 * says "2 connections" is telling you whether this channel can send at all,
 * which is genuinely part of choosing it.
 */

/**
 * The four channels, wearing the landing page's module card.
 *
 * "All-in-one growth platform" describes a module with a tinted tile, a bold
 * title, a line of body and a status pill; this is that card with the one thing
 * a landing card never needs - a pressed state. The tile is the same 44px
 * square at 12px radius holding a 20px glyph at 1.9 stroke, and the glyphs are
 * the section's own: `MessageCircle`, `Mail` and `Smartphone` are exactly what
 * `platform/platform-features` gives those three modules, so the card a
 * merchant reads on the marketing site and the card they click to create a
 * campaign are one object.
 *
 * No colour is invented here. WhatsApp, Email and SMS take their soft ground,
 * ink and hairline from `CHANNEL_THEME` - the table every chip, stat card and
 * chart series in their modules already reads, and the same tokens the landing
 * section tints its tiles with, which is why the two match without sharing a
 * constant. Social is the exception, and says why at its own entry.
 *
 * Every tile carries that hairline. On the four soft grounds - mint, powder
 * blue, lilac, pink - the square's edge is otherwise doing all its work at
 * around 1.1:1 against a white card, which holds up in a mock-up and dissolves
 * on a real screen.
 */
const CHANNEL_CARDS: {
  value: MarketingChannel;
  label: string;
  hint: string;
  /** Already sized and weighted - the tile only centres it. */
  icon: ReactNode;
  /** Soft ground, ink and hairline for the tile, all in the channel's hue. */
  tile: string;
  /** The status pill's bullet, in the tile's hue. */
  dot: string;
}[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    hint: "Highest read rate. Template needed for the first message.",
    icon: <MessageCircle aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: cn(
      CHANNEL_THEME.whatsapp.soft,
      CHANNEL_THEME.whatsapp.text,
      "border",
      CHANNEL_THEME.whatsapp.border,
    ),
    dot: CHANNEL_THEME.whatsapp.accent,
  },
  {
    value: "email",
    label: "Email",
    hint: "Best for long-form and rich layouts.",
    icon: <Mail aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: cn(
      CHANNEL_THEME.email.soft,
      CHANNEL_THEME.email.text,
      "border",
      CHANNEL_THEME.email.border,
    ),
    dot: CHANNEL_THEME.email.accent,
  },
  {
    value: "sms",
    label: "SMS",
    hint: "Short, urgent, no images. Billed per segment.",
    icon: <Smartphone aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: cn(
      CHANNEL_THEME.sms.soft,
      CHANNEL_THEME.sms.text,
      "border",
      CHANNEL_THEME.sms.border,
    ),
    dot: CHANNEL_THEME.sms.accent,
  },
  {
    value: "social",
    label: "Social",
    hint: "Publish campaign content to connected social accounts and track engagement.",
    /* `Share2` rather than a platform's logo: this one card stands for four
       networks at once, and whichever logo it wore would name one of them and
       leave the other three out. The logos belong to the account rows below,
       where each is a particular account.

       The pink stays - it is what separates Social from the three channels
       either side of it, and `CHANNEL_THEME.social` is the Planner's slate,
       which reads as disabled next to them. It is the only tile mixing its own
       ground, since that hue has no `-soft` and `-border` pair on the ramp. */
    icon: <Share2 aria-hidden className="size-5" strokeWidth={1.9} />,
    tile: "bg-instagram/8 text-instagram border border-instagram/15",
    dot: PLATFORM_THEME.instagram.swatch,
  },
];

/** "2 connections" - the pill's reading, in the landing card's voice. */
function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * One channel card: `FeatureCard`'s anatomy, plus a pressed state.
 *
 * Selected swaps the white ground for the brand's subtle tint and the hairline
 * for the brand border - the dashboard's existing selected treatment, not a new
 * one - and drops the hover lift, so a chosen card sits still while the other
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
        {/* A step up from the landing card's 14px title. That card is one of
            eight in a marketing rail being skimmed; this one is a choice being
            made, and it names the channel every later step is shaped by. */}
        <span className="block text-base leading-snug font-bold tracking-tight text-text-primary">
          {card.label}
        </span>
        <span className="mt-0.5 block text-sm leading-normal font-medium text-text-secondary">
          {card.hint}
        </span>
        <Badge variant="default" size="sm" className="mt-2">
          <span aria-hidden className={cn("size-1.5 rounded-full", card.dot)} />
          {status}
        </Badge>
      </span>
    </button>
  );
}

export function DetailsStep({ draft, set, setChannel, errors }: StepProps) {

  /* What each channel can actually send from, counted off the same fixtures the
     sender section below reads - the pill is a reading, not a label. */
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
        hint="Internal only - helps your team find it later."
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
    </div>
  );
}
