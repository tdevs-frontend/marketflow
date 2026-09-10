import {
  ArrowRightLeft,
  ClipboardList,
  FileText,
  Globe,
  Mail,
  Megaphone,
  MessageCircle,
  Smartphone,
  Share2,
  ShoppingBag,
  StickyNote,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { TAG_COLORS, tagByName } from "@/lib/customer-fixtures";
import type {
  ActivityKind,
  ContactSource,
  Lifecycle,
} from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";
import type { ContactChannel, ContactStatus } from "@/types/contact";
import type { LeadSource, LeadStage } from "@/types/lead";

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Where a contact sits in the lifecycle.
 *
 * Green is spent only on the two stages that are actually good news — a
 * customer and a repeat customer. Everything before that is neutral or brand,
 * because a "Lead" badge in green tells the reader something has been achieved
 * when nothing has yet.
 */
const LIFECYCLE_TONE: Record<Lifecycle, BadgeTone> = {
  subscriber: "neutral",
  lead: "info",
  qualified: "brand",
  customer: "success",
  repeat: "success",
  churned: "danger",
};

const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  subscriber: "Subscriber",
  lead: "Lead",
  qualified: "Qualified",
  customer: "Customer",
  repeat: "Repeat",
  churned: "Churned",
};

export function LifecycleBadge({ lifecycle }: { lifecycle: Lifecycle }) {
  return (
    <Badge tone={LIFECYCLE_TONE[lifecycle]}>{LIFECYCLE_LABEL[lifecycle]}</Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Deliverability                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The other axis: whether we can still reach them.
 *
 * Only rendered when it is not `active`, so a healthy table is not a wall of
 * green "Active" pills competing with the lifecycle column beside it.
 */
const STATUS_TONE: Record<ContactStatus, BadgeTone> = {
  active: "success",
  unsubscribed: "warning",
  bounced: "warning",
  blocked: "danger",
};

export function ContactStatusBadge({
  status,
  always = false,
}: {
  status: ContactStatus;
  /** Show it even when the contact is reachable. */
  always?: boolean;
}) {
  if (status === "active" && !always) return null;

  return (
    <Badge tone={STATUS_TONE[status]} className="capitalize">
      {status}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A tag pill in its own colour.
 *
 * The colour comes from the tag record, not from the call site, so the same
 * tag is the same colour in a table cell, a drawer and a lead card. An unknown
 * name falls back to slate rather than throwing — tags arrive from imports.
 */
export function TagBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const color = tagByName(name)?.color ?? "slate";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] leading-tight font-medium",
        TAG_COLORS[color].pill,
        className,
      )}
    >
      <span className="truncate">{name}</span>
    </span>
  );
}

/** A row of tag pills, capped so one over-tagged contact cannot widen a column. */
export function TagBadges({
  tags,
  max = 2,
  className,
}: {
  tags: string[];
  max?: number;
  className?: string;
}) {
  if (tags.length === 0) {
    return <span className="text-xs text-text-muted">—</span>;
  }

  const shown = tags.slice(0, max);
  const rest = tags.length - shown.length;

  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((tag) => (
        <TagBadge key={tag} name={tag} />
      ))}
      {rest > 0 ? (
        <span className="text-[11px] font-medium text-text-muted">+{rest}</span>
      ) : null}
    </span>
  );
}

/** The colour swatch itself, for the tags table and the colour picker. */
export function TagDot({
  color,
  className,
}: {
  color: keyof typeof TAG_COLORS;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        TAG_COLORS[color].dot,
        className,
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Channel consent                                                            */
/* -------------------------------------------------------------------------- */

const CHANNEL_META: Record<
  ContactChannel,
  { label: string; icon: LucideIcon; tone: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    tone: "bg-whatsapp-soft text-whatsapp",
  },
  email: { label: "Email", icon: Mail, tone: "bg-email-soft text-email" },
  sms: { label: "SMS", icon: Smartphone, tone: "bg-sms-soft text-sms" },
};

const CHANNEL_ORDER: ContactChannel[] = ["whatsapp", "email", "sms"];

/**
 * Which channels this contact may be reached on.
 *
 * All three are always drawn, granted ones tinted and the rest greyed, so the
 * column reads as a fixed three-slot state rather than a variable-length list
 * — that is what lets a reader scan down it and spot the WhatsApp-only rows.
 * Each carries its own channel colour, never the brand indigo.
 *
 * Colour is not the only signal: every icon has a title, so consent survives
 * both a screen reader and a monochrome print.
 */
export function ChannelConsentBadges({
  channels,
  className,
}: {
  channels: ContactChannel[];
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      {CHANNEL_ORDER.map((channel) => {
        const meta = CHANNEL_META[channel];
        const Icon = meta.icon;
        const granted = channels.includes(channel);

        return (
          <span
            key={channel}
            title={`${meta.label}: ${granted ? "opted in" : "no consent"}`}
            className={cn(
              "grid size-5 place-items-center rounded-[5px]",
              granted ? meta.tone : "bg-surface-secondary text-text-muted/50",
            )}
          >
            <Icon className="size-3" aria-hidden />
            <span className="sr-only">
              {meta.label}: {granted ? "opted in" : "no consent"}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Source                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Where the contact came from.
 *
 * The three channel sources keep their channel identity — WhatsApp green,
 * email blue, SMS purple — because a source column is the one place a reader
 * scans for "which channel is working". The rest stay neutral: "Import" is not
 * a channel and colouring it competes with the ones that are.
 */
const SOURCE_META: Record<
  ContactSource | LeadSource,
  { label: string; icon: LucideIcon; className: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    className: "text-whatsapp",
  },
  email: { label: "Email", icon: Mail, className: "text-email" },
  sms: { label: "SMS", icon: Smartphone, className: "text-sms" },
  website: { label: "Website", icon: Globe, className: "text-text-muted" },
  campaign: {
    label: "Campaign",
    icon: Megaphone,
    className: "text-text-muted",
  },
  import: { label: "Import", icon: Upload, className: "text-text-muted" },
  manual: { label: "Manual", icon: UserPlus, className: "text-text-muted" },
  referral: { label: "Referral", icon: Users, className: "text-text-muted" },
};

/**
 * Takes either union, because a contact's source and a lead's source are the
 * same question asked of two records — `LeadSource` simply also allows the two
 * channels a lead can arrive on directly. One component so a WhatsApp lead and
 * a WhatsApp contact are never drawn differently.
 */
export function SourceBadge({
  source,
  className,
}: {
  source: ContactSource | LeadSource;
  className?: string;
}) {
  const meta = SOURCE_META[source];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-text-secondary",
        className,
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", meta.className)} aria-hidden />
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Pipeline stage                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A lead's stage, for the places a board column header cannot say it — a
 * drawer, a list row, a contact's related-leads panel.
 */
const STAGE_TONE: Record<LeadStage, BadgeTone> = {
  new: "neutral",
  contacted: "neutral",
  negotiation: "info",
  qualified: "brand",
  proposal: "brand",
  won: "success",
  lost: "danger",
};

export function StageBadge({
  stage,
  label,
}: {
  stage: LeadStage;
  label: string;
}) {
  return <Badge tone={STAGE_TONE[stage]}>{label}</Badge>;
}

/* -------------------------------------------------------------------------- */
/* Activity                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The icon and tint for one timeline entry.
 *
 * Exported because three surfaces render the same vocabulary — a contact
 * drawer, a lead drawer and the journey drawer — and they have to agree on
 * what a WhatsApp reply looks like. Channel kinds carry channel identity;
 * everything internal to the product is neutral or brand.
 */
export const ACTIVITY_META: Record<
  ActivityKind,
  { icon: LucideIcon; tone: string; label: string }
> = {
  whatsapp: {
    icon: MessageCircle,
    tone: "bg-whatsapp-soft text-whatsapp",
    label: "WhatsApp",
  },
  email: { icon: Mail, tone: "bg-email-soft text-email", label: "Email" },
  sms: { icon: Smartphone, tone: "bg-sms-soft text-sms", label: "SMS" },
  social: {
    icon: Share2,
    tone: "bg-social-soft text-social-dark",
    label: "Social",
  },
  note: {
    icon: StickyNote,
    tone: "bg-surface-secondary text-text-secondary",
    label: "Note",
  },
  stage: {
    icon: ArrowRightLeft,
    tone: "bg-primary-soft text-primary",
    label: "Stage change",
  },
  automation: {
    icon: Workflow,
    tone: "bg-primary-soft text-primary",
    label: "Automation",
  },
  campaign: {
    icon: Megaphone,
    tone: "bg-primary-soft text-primary",
    label: "Campaign",
  },
  order: {
    icon: ShoppingBag,
    tone: "bg-success-soft text-success-text",
    label: "Order",
  },
  web: {
    icon: Globe,
    tone: "bg-surface-secondary text-text-secondary",
    label: "Website",
  },
  form: {
    icon: ClipboardList,
    tone: "bg-surface-secondary text-text-secondary",
    label: "Form",
  },
  score: {
    icon: TrendingUp,
    tone: "bg-primary-soft text-primary",
    label: "Score",
  },
};

/** The small tinted square a timeline row leads with. */
export function ActivityIcon({
  kind,
  className,
}: {
  kind: ActivityKind;
  className?: string;
}) {
  const meta = ACTIVITY_META[kind];
  const Icon = meta.icon;

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-btn",
        meta.tone,
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

/** Kept beside the icons it labels, so a legend cannot drift from them. */
export const ACTIVITY_DOC_ICON = FileText;
