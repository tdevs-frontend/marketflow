export type MarketingChannel = "whatsapp" | "email" | "sms";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "completed"
  | "paused"
  | "failed";

export type AudienceSegment =
  | "all"
  | "customers"
  | "leads"
  | "new-customers"
  | "vip"
  | "custom";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  channel: MarketingChannel;
  status: CampaignStatus;
  segment: AudienceSegment;
  audienceLabel: string;
  audienceSize: number;
  sent: number;
  delivered: number;
  /** Opens for email, reads for WhatsApp, unused for SMS. */
  opened: number;
  clicked: number;
  replies: number;
  failed: number;
  revenue: number;
  createdAt: string;
  /** Set once the campaign has a send time. */
  scheduledAt?: string;
}

export interface CampaignListQuery {
  search?: string;
  channel?: MarketingChannel;
  status?: CampaignStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/* -------------------------------------------------------------------------- */
/* WhatsApp inbox                                                             */
/* -------------------------------------------------------------------------- */

export type ConversationStatus = "open" | "pending" | "resolved";

export type MessageDirection = "inbound" | "outbound";

export type MessageState = "sent" | "delivered" | "read" | "failed";

export interface InboxMessage {
  id: string;
  direction: MessageDirection;
  body: string;
  at: string;
  /** Outbound only — inbound messages have no delivery state of ours. */
  state?: MessageState;
}

export interface InboxContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  /** Where this person sits in the lifecycle, for the details panel. */
  lifecycle: "lead" | "customer" | "vip";
  assignedAgent?: string;
  lastActivityAt: string;
  notes: string[];
}

export interface Conversation {
  id: string;
  contact: InboxContact;
  status: ConversationStatus;
  unread: number;
  online: boolean;
  /** Newest last, the order they render in. */
  messages: InboxMessage[];
}

/* -------------------------------------------------------------------------- */
/* Wizard                                                                     */
/* -------------------------------------------------------------------------- */

export type WizardStep = "campaign" | "audience" | "content" | "schedule" | "review";

export interface CampaignDraft {
  name: string;
  description: string;
  channel: MarketingChannel;
  segment: AudienceSegment;

  /* Content — only the fields for the chosen channel are used. */
  templateId: string;
  message: string;
  subject: string;
  previewText: string;

  /* Schedule */
  sendMode: "now" | "later";
  date: string;
  time: string;
  timezone: string;
}
