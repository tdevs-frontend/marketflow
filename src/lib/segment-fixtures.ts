import type { Option } from "@/constants/commerce";
import type { Segment, SegmentField, SegmentOperator } from "@/types/segment";

/**
 * Audience segments, shared by WhatsApp, Email and SMS.
 *
 * `channels` is not cosmetic: a segment built from email engagement has no
 * phone numbers behind half of it, so the campaign wizard uses this to grey
 * out the channels a segment cannot actually reach.
 */

export const SEGMENT_FIELDS: Option<SegmentField>[] = [
  { value: "tag", label: "Tag" },
  { value: "custom_field", label: "Custom field" },
  { value: "lead_status", label: "Lead status" },
  { value: "source", label: "Source" },
  { value: "activity", label: "Activity" },
  { value: "campaign_behavior", label: "Campaign behaviour" },
  { value: "purchase_history", label: "Purchase history" },
];

export const SEGMENT_OPERATORS: Option<SegmentOperator>[] = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "in_last_days", label: "in the last (days)" },
  { value: "not_in_last_days", label: "not in the last (days)" },
];

export const SEGMENTS: Segment[] = [
  {
    id: "seg-all",
    name: "All Contacts",
    description: "Everyone with a valid opt-in on at least one channel.",
    contacts: 24_580,
    growth: 12.8,
    rules: [{ id: "r1", field: "activity", operator: "is", value: "Opted in" }],
    channels: ["whatsapp", "email", "sms"],
    system: true,
    updatedAt: "2026-09-08T09:00:00Z",
  },
  {
    id: "seg-vip",
    name: "VIP Customers",
    description: "Top 10% by lifetime value, with at least three orders.",
    contacts: 318,
    growth: 8.4,
    rules: [
      { id: "r1", field: "purchase_history", operator: "greater_than", value: "$5,000 lifetime" },
      { id: "r2", field: "purchase_history", operator: "greater_than", value: "3 orders" },
    ],
    channels: ["whatsapp", "email", "sms"],
    updatedAt: "2026-09-06T11:20:00Z",
  },
  {
    id: "seg-new-leads",
    name: "New Leads",
    description: "Captured in the last 14 days and not yet contacted.",
    contacts: 2_148,
    growth: 24.6,
    rules: [
      { id: "r1", field: "lead_status", operator: "is", value: "New" },
      { id: "r2", field: "activity", operator: "in_last_days", value: "14" },
    ],
    channels: ["whatsapp", "email"],
    updatedAt: "2026-09-08T08:52:00Z",
  },
  {
    id: "seg-inactive",
    name: "Inactive Customers",
    description: "Bought before, but nothing in 90 days.",
    contacts: 3_460,
    growth: -6.2,
    rules: [
      { id: "r1", field: "purchase_history", operator: "greater_than", value: "1 order" },
      { id: "r2", field: "activity", operator: "not_in_last_days", value: "90" },
    ],
    channels: ["whatsapp", "email", "sms"],
    updatedAt: "2026-09-02T14:40:00Z",
  },
  {
    id: "seg-high-engagement",
    name: "High Engagement",
    description: "Opened or replied to at least half of the last ten sends.",
    contacts: 6_842,
    growth: 18.2,
    rules: [
      { id: "r1", field: "campaign_behavior", operator: "greater_than", value: "50% open rate" },
      { id: "r2", field: "activity", operator: "in_last_days", value: "30" },
    ],
    channels: ["whatsapp", "email"],
    updatedAt: "2026-09-07T10:15:00Z",
  },
  {
    id: "seg-recent-purchasers",
    name: "Recent Purchasers",
    description: "Ordered in the last 30 days. The audience for cross-sells.",
    contacts: 1_248,
    growth: 14.8,
    rules: [{ id: "r1", field: "purchase_history", operator: "in_last_days", value: "30" }],
    channels: ["whatsapp", "email", "sms"],
    updatedAt: "2026-09-08T07:30:00Z",
  },
  {
    id: "seg-abandoned",
    name: "Abandoned Checkouts",
    description: "Started a checkout in the last 7 days and did not finish.",
    contacts: 2_140,
    growth: 4.2,
    rules: [
      { id: "r1", field: "activity", operator: "is", value: "Checkout started" },
      { id: "r2", field: "purchase_history", operator: "not_in_last_days", value: "7" },
    ],
    channels: ["whatsapp", "email"],
    updatedAt: "2026-09-08T09:44:00Z",
  },
  {
    id: "seg-wholesale",
    name: "Wholesale Accounts",
    description: "Tagged Wholesale, with a verified business number.",
    contacts: 486,
    growth: 6.8,
    rules: [
      { id: "r1", field: "tag", operator: "is", value: "Wholesale" },
      { id: "r2", field: "custom_field", operator: "is", value: "business_verified = true" },
    ],
    channels: ["whatsapp", "sms"],
    updatedAt: "2026-08-29T16:00:00Z",
  },
  {
    id: "seg-appointments",
    name: "Upcoming Appointments",
    description: "Booked within the next 48 hours. Drives the reminder flow.",
    contacts: 684,
    growth: 9.4,
    rules: [{ id: "r1", field: "custom_field", operator: "is", value: "appointment within 48h" }],
    channels: ["sms", "whatsapp"],
    updatedAt: "2026-09-08T06:00:00Z",
  },
  {
    id: "seg-dhaka",
    name: "Dhaka Contacts",
    description: "City is Dhaka. Used for store and event announcements.",
    contacts: 3_180,
    growth: 11.2,
    rules: [{ id: "r1", field: "custom_field", operator: "is", value: "city = Dhaka" }],
    channels: ["whatsapp", "sms", "email"],
    updatedAt: "2026-09-06T13:10:00Z",
  },
  {
    id: "seg-webinar",
    name: "Webinar Registrants",
    description: "Registered for any webinar in the last 90 days.",
    contacts: 1_642,
    growth: 22.4,
    rules: [
      { id: "r1", field: "source", operator: "is", value: "Webinar" },
      { id: "r2", field: "activity", operator: "in_last_days", value: "90" },
    ],
    channels: ["email"],
    updatedAt: "2026-09-06T13:00:00Z",
  },
  {
    id: "seg-sunset",
    name: "Sunset Candidates",
    description: "Never opened anything. Queued for list cleaning.",
    contacts: 2_186,
    growth: -14.6,
    rules: [
      { id: "r1", field: "campaign_behavior", operator: "is", value: "Never opened" },
      { id: "r2", field: "activity", operator: "not_in_last_days", value: "180" },
    ],
    channels: ["email"],
    updatedAt: "2026-09-07T21:10:00Z",
  },
];

/** Segment options for a channel's audience picker. */
export const segmentsForChannel = (channel: "whatsapp" | "email" | "sms") =>
  SEGMENTS.filter((segment) => segment.channels.includes(channel));
