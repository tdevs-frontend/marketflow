import type { SocialPlatform } from "./social";

/**
 * The channels a campaign can go out on.
 *
 * `social` was for a long time a reporting-only channel — `constants/channels`
 * has carried its theme since before it could send — and it now sends too. It
 * is deliberately part of the same union rather than a parallel type: a
 * campaign has exactly one channel, and splitting social out would mean every
 * list, filter and badge in the module learning about two kinds of campaign.
 */
export type MarketingChannel = "whatsapp" | "email" | "sms" | "social";

/**
 * The channels that deliver to a *contact*.
 *
 * Social publishes to accounts the workspace owns, so everything keyed to a
 * recipient — segments, eligibility, suppression, frequency caps, per-contact
 * merge tags — is typed against this narrower union rather than against
 * `MarketingChannel`. It is what stops "recipients" from silently meaning two
 * different things.
 */
export type MessagingChannel = Exclude<MarketingChannel, "social">;

export const isMessagingChannel = (
  channel: MarketingChannel,
): channel is MessagingChannel => channel !== "social";

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
  /**
   * Social campaigns only. Present instead of, not alongside, meaning for the
   * per-recipient counters above — a published post has no `delivered`.
   */
  social?: SocialCampaignMetrics;
}

/**
 * What a social campaign reports instead of sends, opens and replies.
 *
 * Optional and channel-specific rather than more columns on `Campaign`: a
 * WhatsApp campaign has no impressions, and giving every campaign a `reach` of
 * 0 is how a list ends up showing four channels a metric that means nothing for
 * three of them.
 */
export interface SocialCampaignMetrics {
  platforms: SocialPlatform[];
  /** Posts that actually went out, across every selected account. */
  publishedPosts: number;
  reach: number;
  impressions: number;
  /** Likes, comments and shares combined — one number the list can rank by. */
  engagements: number;
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

/**
 * The seven steps of the campaign wizard, in order.
 *
 * `personalization` and `send` are separate steps rather than parts of
 * `content` and `review`: merge tags are where a campaign most often goes
 * wrong (a missing fallback ships "Hi ," to a thousand people), and the final
 * send deserves a screen whose only job is confirming an irreversible action.
 */
export type WizardStep =
  | "campaign"
  | "audience"
  | "content"
  | "personalization"
  | "schedule"
  | "review"
  | "send";

/* -------------------------------------------------------------------------- */
/* Campaign intent                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Why the campaign is being sent, recorded at the top of the wizard.
 *
 * Internal only and never shown to a recipient. It exists so reporting can
 * group a quarter of sends by what they were *for* — a 4% click rate is a good
 * awareness campaign and a poor conversion one, and without this the two are
 * averaged into a number that describes neither.
 */
export type CampaignObjective =
  | "awareness"
  | "engagement"
  | "lead-generation"
  | "sales"
  | "re-engagement"
  | "announcement"
  | "retention";

/**
 * The single event that counts as success, for conversion reporting.
 *
 * Optional: plenty of campaigns are announcements with nothing to convert.
 * `none` is an explicit "not measuring that" rather than an empty string, so an
 * unanswered goal and a deliberately unmeasured one stay distinguishable.
 */
export type CampaignGoal =
  | "none"
  | "order-completed"
  | "form-submitted"
  | "product-purchased"
  | "lead-created"
  | "lead-qualified"
  | "appointment-booked"
  | "link-clicked";

/* -------------------------------------------------------------------------- */
/* Audience safety                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Standing reasons to drop a contact from a send.
 *
 * `unsubscribed` and `suppression-list` default to on and cannot be turned off
 * in the wizard — they are the legal floor, not a preference. The rest are
 * campaign-by-campaign judgement calls.
 */
export type ExclusionRule =
  | "unsubscribed"
  | "suppression-list"
  | "existing-customers"
  | "recently-contacted";

export interface AudienceExclusions {
  rules: ExclusionRule[];
  /** Saved segments whose members are removed from this send. */
  segmentIds: string[];
  /** Contact tags to drop, e.g. everyone tagged `Wholesale`. */
  tags: string[];
}

/**
 * What the audience actually resolves to, once the rules have run.
 *
 * `invalid` is separate from `excluded` on purpose. Excluded is a decision —
 * someone opted out, or this campaign is not for existing customers. Invalid is
 * data — no WhatsApp opt-in, a malformed address, a phone number that is not
 * really a phone number. They need different fixes, so the wizard shows them as
 * different numbers rather than one "will not receive" total.
 */
export interface AudienceEligibility {
  /** Everyone in the chosen audience, before any rule runs. */
  total: number;
  excluded: number;
  invalid: number;
  eligible: number;
}

/* -------------------------------------------------------------------------- */
/* Sender configuration                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Who the campaign comes from, per channel.
 *
 * One flat record rather than a union keyed by channel: the merchant who fills
 * in an email sender, switches to SMS to compare, and switches back should find
 * their answer still there. Only the selected channel's fields are read, and
 * only those are validated.
 */
export interface CampaignSender {
  /** WhatsApp Business connection, then the number that sends from it. */
  whatsappConnectionId: string;
  whatsappNumberId: string;
  /** Email sending identity, plus the address replies land in. */
  emailFrom: string;
  emailReplyTo: string;
  /** SMS gateway and the sender ID it presents. */
  smsProviderId: string;
  smsSenderId: string;
}

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  content: string;
}

export interface CampaignTracking {
  clicks: boolean;
  conversions: boolean;
  /** Credit this campaign for the conversions it is linked to. */
  attribution: boolean;
  /** Carry order value back onto the campaign. */
  revenue: boolean;
  utm: UtmParams;
  /**
   * Set once a human edits any UTM field.
   *
   * Until then the wizard keeps `source` and `medium` in step with the selected
   * channel. After it, it stops — silently rewriting a value someone typed is
   * worse than an out-of-date default.
   */
  utmTouched: boolean;
}

/* -------------------------------------------------------------------------- */
/* Delivery safety                                                            */
/* -------------------------------------------------------------------------- */

/** A window the campaign must not deliver inside, in 24h local time. */
export interface QuietHours {
  enabled: boolean;
  /** Start of the *blocked* window, e.g. `20:00`. */
  from: string;
  /** End of the blocked window, e.g. `08:00`. Wraps past midnight. */
  to: string;
}

/**
 * Over-messaging protection, as two independent windows.
 *
 * Any-channel is the blunt one, same-channel the tolerant one: a merchant will
 * happily send a second email in three days but not a second anything in an
 * hour.
 */
export interface FrequencyCap {
  enabled: boolean;
  anyChannelHours: number;
  sameChannelDays: number;
}

/**
 * How fast the send drains.
 *
 * Deliberately two words and a duration rather than a queue configuration.
 * "Spread over 30 minutes" is a decision a marketer can make; messages per
 * second is one they cannot.
 */
export type SendSpeed = "standard" | "throttled";

/* -------------------------------------------------------------------------- */
/* A/B testing                                                                */
/* -------------------------------------------------------------------------- */

/** What the two variants differ by. Channel decides which are offered. */
export type AbTestField =
  | "subject"
  | "content"
  | "template"
  | "message"
  | "caption";

export type AbWinnerMetric =
  | "open-rate"
  | "click-rate"
  | "conversion-rate"
  | "engagement";

export interface AbTest {
  enabled: boolean;
  field: AbTestField;
  variantA: string;
  variantB: string;
  /** Percentage of the eligible audience that receives variant A. */
  split: number;
  winnerMetric: AbWinnerMetric;
}

/* -------------------------------------------------------------------------- */
/* Personalisation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Where a merge tag's value comes from.
 *
 * Grouping the catalogue by source is not decoration: it is how the wizard
 * knows that `{{first_name}}` cannot be resolved for a social post, which has
 * no contact behind it, while `{{product_name}}` can.
 */
export type VariableSource =
  | "contact"
  | "lead"
  | "customer"
  | "product"
  | "order"
  | "campaign"
  | "workspace"
  | "custom";

export interface MergeVariable {
  /** Placeholder name, without braces. */
  name: string;
  label: string;
  source: VariableSource;
  /** Stand-in used by every preview in the wizard. */
  sample: string;
}

/* -------------------------------------------------------------------------- */
/* Draft                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Everything the wizard collects, for one single-channel campaign.
 *
 * Single-channel by design. A campaign is one message to one audience at one
 * time; a sequence that fans out across WhatsApp and email belongs in
 * Automation, which is built around triggers and waits. The shape is grouped so
 * a future multi-channel campaign can hold an array of the channel-shaped parts
 * without every field here being renamed.
 */
export interface CampaignDraft {
  name: string;
  description: string;
  channel: MarketingChannel;
  objective: CampaignObjective;
  /** Internal labels, from the workspace's campaign tag list. */
  tags: string[];

  /* Sender — only the selected channel's fields are read. */
  sender: CampaignSender;
  /** Social account ids, owned by Integrations → Social. Social channel only. */
  socialAccountIds: string[];

  /** One of the built-in audiences. Ignored when `savedSegmentId` is set. */
  segment: AudienceSegment;
  /**
   * A segment from the Audience Segments module, which is the richer model:
   * rule-based, and it knows which channels it can actually reach. Empty means
   * the built-in `segment` above is the choice.
   */
  savedSegmentId: string;
  exclusions: AudienceExclusions;

  /* Content — only the fields for the chosen channel are used. */
  templateId: string;
  message: string;
  subject: string;
  previewText: string;
  /** Email and social: the button or link the message carries. */
  ctaLabel: string;
  ctaUrl: string;
  /** Media Library asset ids. Never a second copy of the asset. */
  mediaIds: string[];
  /** Social: tags without the `#`, stored the way the Planner stores them. */
  hashtags: string[];
  /** SMS: shorten links at send time, and count them as one 23-char token. */
  shortenLinks: boolean;

  /* Personalisation — a fallback per placeholder, used where a contact has no
     value for it. Keyed by placeholder name, without braces. */
  fallbacks: Record<string, string>;

  tracking: CampaignTracking;
  goal: CampaignGoal;
  abTest: AbTest;

  /* Schedule */
  sendMode: "now" | "later";
  date: string;
  time: string;
  timezone: string;
  /** Deliver at the chosen wall-clock time in each recipient's own zone. */
  useRecipientTimezone: boolean;
  quietHours: QuietHours;
  /** Weekday indices the campaign may deliver on, 0 = Sunday. */
  allowedDays: number[];
  frequencyCap: FrequencyCap;
  sendSpeed: SendSpeed;
  /** Minutes to spread a throttled send across. */
  spreadMinutes: number;
  /** Social with more than one account: one slot for all, or one each. */
  perPlatformSchedule: boolean;
}

/* -------------------------------------------------------------------------- */
/* WhatsApp templates                                                         */
/* -------------------------------------------------------------------------- */

export type TemplateCategory = "marketing" | "utility" | "authentication";

/** Meta reviews every template; a rejected one cannot be sent. */
export type TemplateStatus = "approved" | "pending" | "rejected";

/**
 * What a template is *for*, alongside the Meta category above.
 *
 * Meta only recognises three categories, and a template's category determines
 * how it is priced and reviewed — so that field cannot be repurposed as a
 * library label. This is the merchant-facing shelf it sits on: a Welcome and a
 * Promotion template are both `marketing` to Meta and completely different
 * things to the person picking one.
 */
export type TemplateUseCase =
  | "welcome"
  | "promotion"
  | "order"
  | "reminder"
  | "follow-up"
  | "verification";

export type TemplateButtonType = "url" | "quick-reply" | "phone";

export interface TemplateButton {
  label: string;
  type: TemplateButtonType;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  /** The library shelf, independent of the Meta category. */
  useCase: TemplateUseCase;
  status: TemplateStatus;
  language: string;
  body: string;
  /** Placeholder names without braces, e.g. `name`, `order_id`. */
  variables: string[];
  buttons: TemplateButton[];
  footer?: string;
  /** Set when Meta rejects it, so the card can say why. */
  rejectionReason?: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* WhatsApp contacts                                                          */
/* -------------------------------------------------------------------------- */

export type WhatsAppContactStatus = "active" | "inactive" | "blocked";

export interface WhatsAppContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  tags: string[];
  status: WhatsAppContactStatus;
  assignedAgent?: string;
  lastActivityAt: string;
  createdAt: string;
  notes?: string;
  /** Links the row to a thread, so "Open Conversation" lands on the right one. */
  conversationId?: string;
}
