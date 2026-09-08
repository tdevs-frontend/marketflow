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
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  /** Hard and soft bounces together — the campaign list does not split them. */
  bounced: number;
  unsubscribed: number;
  complained: number;
  revenue: number;
  templateId?: string;
  createdAt: string;
  scheduledAt?: string;
}

export type EmailTemplateCategory =
  | "welcome"
  | "newsletter"
  | "promotion"
  | "product-launch"
  | "abandoned-cart"
  | "follow-up"
  | "re-engagement";

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
