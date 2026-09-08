import type { MarketingChannel } from "./marketing";

/**
 * Audience segmentation, shared by every channel.
 *
 * A segment is defined once and reused across WhatsApp, Email and SMS — which
 * is the point of a unified workspace, and why this type lives on its own
 * rather than inside a channel module.
 */

export type SegmentField =
  | "tag"
  | "custom_field"
  | "lead_status"
  | "source"
  | "activity"
  | "campaign_behavior"
  | "purchase_history";

export type SegmentOperator =
  | "is"
  | "is_not"
  | "contains"
  | "greater_than"
  | "less_than"
  | "in_last_days"
  | "not_in_last_days";

export interface SegmentRule {
  id: string;
  field: SegmentField;
  operator: SegmentOperator;
  value: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  /** Contacts currently matching the rules. */
  contacts: number;
  /** Signed percentage change in size over the last 30 days. */
  growth: number;
  /**
   * Rules are ANDed. An OR segment is expressed as two segments, which is
   * easier to reason about than a rule tree with mixed precedence.
   */
  rules: SegmentRule[];
  /** Channels this segment is usable on — a phone-less list cannot take SMS. */
  channels: MarketingChannel[];
  /** Built in and not editable, e.g. "All Contacts". */
  system?: boolean;
  updatedAt: string;
}
