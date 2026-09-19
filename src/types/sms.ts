import type { AudienceSegment, CampaignStatus } from "./marketing";

/**
 * SMS module.
 *
 * The distinguishing constraint is length: a message is billed in 160-character
 * segments, so `segments` and `cost` are first-class fields rather than
 * something the UI derives on the fly.
 */

/** A GSM-7 message is billed per 160 characters; concatenated parts lose 7. */
export const SMS_SINGLE_LIMIT = 160;
export const SMS_CONCAT_LIMIT = 153;

export interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  senderId: string;
  status: CampaignStatus;
  segment: AudienceSegment;
  audienceLabel: string;
  audienceSize: number;
  sent: number;
  delivered: number;
  failed: number;
  replies: number;
  optOuts: number;
  clicks: number;
  /** Billed parts per recipient, from the message length. */
  segments: number;
  /** Total spend in USD. */
  cost: number;
  createdAt: string;
  scheduledAt?: string;
}

export type SmsTemplateCategory =
  | "promotion"
  | "reminder"
  | "alert"
  | "otp"
  | "follow-up"
  | "order";

export interface SmsTemplate {
  id: string;
  name: string;
  category: SmsTemplateCategory;
  body: string;
  /** Placeholder names without braces, e.g. `first_name`. */
  variables: string[];
  usageCount: number;
  deliveryRate: number;
  /**
   * Replies as a share of delivered, averaged over every send.
   *
   * Sits beside `deliveryRate` because the two answer different questions and
   * the second is the one that ranks a template: delivery is the carrier's
   * verdict on the number, a reply is the recipient's verdict on the words. A
   * template can deliver at 99% and never earn an answer.
   */
  replyRate: number;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Sender IDs                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What the handset shows in the "from" line.
 *
 * Three kinds, and the difference is not cosmetic: an alphanumeric sender is
 * the only one that carries a brand name and the only one that cannot receive
 * a reply, which decides whether a campaign asking people to answer can use it
 * at all.
 */
export type SmsSenderType = "alphanumeric" | "long-code" | "short-code";

/** Registration state with the carriers. An unregistered sender is refused. */
export type SmsSenderStatus = "active" | "pending" | "blocked";

export interface SmsSenderId {
  id: string;
  /** Exactly as it appears on the handset. */
  value: string;
  type: SmsSenderType;
  status: SmsSenderStatus;
  /** Where this sender is registered and routable. */
  countries: string[];
  /** Messages sent through it in the last 30 days. */
  sent30d: number;
  /** The one a new campaign starts on. */
  isDefault: boolean;
  /** Why it is not usable, when it is not. */
  note?: string;
}

/** Alphanumeric senders are one-way — there is no number for a reply to reach. */
export const canReceiveReplies = (type: SmsSenderType) => type !== "alphanumeric";

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

export type SmsContactStatus = "subscribed" | "opted-out" | "invalid";

export interface SmsContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  tags: string[];
  status: SmsContactStatus;
  /** Where this person sits in the pipeline — shared vocabulary with the CRM. */
  leadStatus: string;
  messages: number;
  replies: number;
  lastActivityAt: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

/** The windows the message performance trend can be read over. */
export type SmsTrendPeriod = "7d" | "30d" | "90d";

/**
 * One window of the trend.
 *
 * Failures are a stored series rather than `sent - delivered`, because a
 * message can be accepted by the gateway and still be in flight when the day
 * closes — subtracting would draw that backlog as a failure it is not.
 */
export interface SmsTrendSeries {
  labels: string[];
  sent: number[];
  delivered: number[];
  failed: number[];
  replies: number[];
}

/**
 * Counts a draft the way the gateway will bill it.
 *
 * Placeholders are measured at their longest realistic substitution rather than
 * as `{{first_name}}`, because a counter that says 148/160 and then sends two
 * segments is worse than no counter.
 */
export function countSmsSegments(
  body: string,
  substitutions: Record<string, string> = {},
): { characters: number; segments: number; limit: number } {
  const resolved = body.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (match, name: string) => substitutions[name] ?? match,
  );

  const characters = resolved.length;
  if (characters <= SMS_SINGLE_LIMIT) {
    return { characters, segments: characters === 0 ? 0 : 1, limit: SMS_SINGLE_LIMIT };
  }

  return {
    characters,
    segments: Math.ceil(characters / SMS_CONCAT_LIMIT),
    limit: SMS_CONCAT_LIMIT,
  };
}
