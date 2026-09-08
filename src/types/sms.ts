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
  updatedAt: string;
}

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
