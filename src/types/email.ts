import type { AudienceSegment, CampaignStatus } from "./marketing";

/**
 * Email module.
 *
 * `CampaignStatus` is shared with the other channels so a cross-channel list
 * can render one status badge; everything below it is email-specific, because
 * an open is not a read and a bounce has no WhatsApp equivalent.
 */

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  /** The line clients show after the subject. Empty is a wasted 90 characters. */
  previewText: string;
  status: CampaignStatus;
  segment: AudienceSegment;
  audienceLabel: string;
  audienceSize: number;
  fromName: string;
  fromEmail: string;
  /** Where replies land. Often a monitored inbox rather than the sender. */
  replyTo: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  /** Hard and soft bounces together — the campaign list does not split them. */
  bounced: number;
  unsubscribed: number;
  complained: number;
  templateId?: string;
  createdAt: string;
  scheduledAt?: string;
}

/**
 * The library's shelves.
 *
 * Five, and deliberately not one per use case. A shelf earns its place by being
 * something a merchant *browses for* — the seven it replaced split promotions
 * across "Promotion", "Product Launch" and "Abandoned Cart", so the shelf a
 * template sat on stopped predicting anything about it. Transactional is the
 * one genuinely different kind: receipts and resets go to people who did not
 * opt in, and they are never sent as a campaign.
 */
export type EmailTemplateCategory =
  | "newsletter"
  | "promotion"
  | "welcome"
  | "follow-up"
  | "transactional";

export type EmailTemplateStatus = "published" | "draft";

/** One row of the drag-and-drop builder's canvas. */
export type EmailBlockType =
  | "logo"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "products"
  | "social"
  | "footer";

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  /** Rendered inside the block — a heading's words, a button's label. */
  content: string;
  /** Second line where the block has one, e.g. a button's destination. */
  meta?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  subject: string;
  previewText: string;
  blocks: EmailBlock[];
  /** How many campaigns have used it — the only honest sort for a library. */
  usageCount: number;
  /** Average open rate across those campaigns, or 0 if never sent. */
  openRate: number;
  /**
   * Average click rate across the same campaigns, of delivered.
   *
   * Beside `openRate` rather than derived from it, and the pair is the point:
   * a template whose subject line wins the open and whose body loses the click
   * is a different problem from one nobody opens, and one number cannot say
   * which of the two you have.
   */
  clickRate: number;
  updatedAt: string;
}

export type EmailContactStatus =
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "pending";

/** How much of what we send this person actually opens. */
export type EngagementLevel = "high" | "medium" | "low" | "none";

export interface EmailContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  tags: string[];
  status: EmailContactStatus;
  engagement: EngagementLevel;
  /** Where the address came from, for the source filter. */
  source: string;
  opens: number;
  clicks: number;
  campaigns: number;
  lastActivityAt: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Trend                                                                      */
/* -------------------------------------------------------------------------- */

/** The windows the performance trend can be read over. */
export type EmailTrendPeriod = "7d" | "30d" | "90d";

/**
 * One period's worth of sending, at whatever grain suits it.
 *
 * The three periods carry their own labels rather than sharing an axis: seven
 * days is read daily, thirty in three-day steps and ninety in ten-day ones, and
 * forcing ninety daily points through a 320px chart draws a hairball rather
 * than a trend.
 */
export interface EmailTrendSeries {
  labels: string[];
  sent: number[];
  opened: number[];
  clicked: number[];
}

/* -------------------------------------------------------------------------- */
/* Senders                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Whether the sending domain has been proved to belong to this workspace.
 *
 * `pending` is a DNS record that has been published but not yet seen, and
 * `failed` is one that was seen and then stopped resolving. They read the same
 * on a dashboard and mean completely different things to whoever has to fix it.
 */
export type SenderStatus = "verified" | "pending" | "failed";

/**
 * One "from" line a campaign can go out on.
 *
 * Reply-to lives on the identity rather than on the campaign, because it is a
 * property of the mailbox someone is prepared to monitor. A campaign may
 * override it, and the wizard says so when it does.
 */
export interface EmailSenderIdentity {
  id: string;
  /** The display name in an inbox, e.g. "MarketFlow Sales". */
  name: string;
  email: string;
  replyTo: string;
  status: SenderStatus;
  /** Domain authentication, all three of which a mailbox provider checks. */
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  /** The identity a campaign starts on, and the only one that cannot be removed. */
  isDefault: boolean;
  sent30d: number;
  deliveryRate: number;
  createdAt: string;
}

/**
 * The transport underneath every identity.
 *
 * Owned by Integrations → Email — this module reads it and links there rather
 * than offering a second set of credentials to fill in.
 */
export interface EmailProviderStatus {
  name: string;
  /** SMTP carries a host and a port; an API provider carries a region. */
  mode: "smtp" | "api";
  host: string;
  port: number;
  encryption: string;
  connected: boolean;
  dailyLimit: number;
  sentToday: number;
  /** Messages per second the provider accepts before it starts queueing. */
  rateLimit: number;
  lastCheckedAt: string;
}
