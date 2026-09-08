import type { Channel } from "@/constants/channels";
import type { MarketingChannel } from "@/types/marketing";

/**
 * Marketing Overview data — the cross-channel command centre.
 *
 * Campaign and conversation rows are deliberately not duplicated here: the
 * overview reads them from `marketing-fixtures` so the summary and the detail
 * pages can never disagree. What lives here is the aggregate no single channel
 * owns — totals, the four-way comparison, the funnel and the activity feed.
 *
 * Dated to early September 2026, the same clock as the other module fixtures,
 * so every relative timestamp in the app reads from one "now".
 */

/* -------------------------------------------------------------------------- */
/* Headline metrics                                                           */
/* -------------------------------------------------------------------------- */

export const MARKETING_TOTALS = {
  leads: 24_580,
  leadsChange: 12.8,
  campaigns: 128,
  campaignsChange: 8.4,
  messagesSent: 482_450,
  messagesSentChange: 18.2,
  conversions: 8_420,
  conversionsChange: 14.6,
  revenue: 184_250,
  revenueChange: 21.4,
} as const;

/* -------------------------------------------------------------------------- */
/* Trends                                                                     */
/* -------------------------------------------------------------------------- */

/** Twelve weeks — long enough to show a trend, short enough to label. */
export const WEEK_LABELS = [
  "Jun 15",
  "Jun 22",
  "Jun 29",
  "Jul 6",
  "Jul 13",
  "Jul 20",
  "Jul 27",
  "Aug 3",
  "Aug 10",
  "Aug 17",
  "Aug 24",
  "Aug 31",
];

/** Messages sent per week, per channel. Social counts posts, not messages. */
export const CHANNEL_VOLUME: Record<Channel, number[]> = {
  whatsapp: [
    18_400, 19_600, 21_200, 22_800, 24_100, 25_600, 27_200, 28_400, 30_100,
    31_800, 33_400, 35_200,
  ],
  email: [
    9_800, 10_200, 10_900, 11_400, 11_100, 12_200, 12_800, 13_100, 13_900,
    14_400, 15_100, 15_800,
  ],
  sms: [
    3_200, 3_400, 3_100, 3_600, 3_900, 4_100, 3_800, 4_300, 4_600, 4_800,
    5_100, 5_400,
  ],
  social: [42, 48, 44, 52, 56, 61, 58, 64, 68, 72, 76, 81],
};

/** Revenue attributed to marketing, over the same twelve weeks. */
export const REVENUE_SERIES = [
  9_800, 10_600, 11_400, 12_100, 11_600, 13_200, 14_100, 14_800, 15_600,
  16_400, 17_200, 18_400,
];

/** New leads per week, split by how they arrived. */
export const LEAD_GROWTH = {
  inbound: [620, 680, 710, 740, 720, 810, 860, 890, 940, 980, 1_040, 1_120],
  outbound: [340, 360, 390, 410, 380, 440, 470, 490, 520, 540, 580, 620],
  referral: [120, 140, 130, 160, 170, 180, 190, 210, 220, 240, 260, 280],
};

/* -------------------------------------------------------------------------- */
/* Channel comparison                                                         */
/* -------------------------------------------------------------------------- */

export interface ChannelRow {
  channel: Channel;
  /** Messages for the three messaging channels, posts for Social. */
  sent: number;
  delivered: number;
  /** Reads for WhatsApp, opens for Email, impressions for Social. */
  engaged: number;
  clicked: number;
  conversions: number;
  revenue: number;
  /** Signed change in conversions over the period. */
  change: number;
}

export const CHANNEL_ROWS: ChannelRow[] = [
  {
    channel: "whatsapp",
    sent: 317_800,
    delivered: 311_444,
    engaged: 249_155,
    clicked: 62_288,
    conversions: 4_980,
    revenue: 96_420,
    change: 22.4,
  },
  {
    channel: "email",
    sent: 140_700,
    delivered: 137_886,
    engaged: 38_608,
    clicked: 9_652,
    conversions: 2_180,
    revenue: 54_180,
    change: 9.6,
  },
  {
    channel: "sms",
    sent: 49_300,
    delivered: 47_820,
    engaged: 0,
    clicked: 3_346,
    conversions: 840,
    revenue: 21_450,
    change: 6.2,
  },
  {
    channel: "social",
    sent: 742,
    delivered: 742,
    engaged: 1_284_600,
    clicked: 18_420,
    conversions: 420,
    revenue: 12_200,
    change: 14.8,
  },
];

/* -------------------------------------------------------------------------- */
/* Conversion funnel                                                          */
/* -------------------------------------------------------------------------- */

export interface FunnelStage {
  label: string;
  count: number;
  /** What the step actually counts, for the row's second line. */
  hint: string;
}

/**
 * One population thinning at each step, so every stage is a subset of the one
 * above it — a funnel where a later stage is larger is a data bug, not an
 * insight.
 */
export const CONVERSION_FUNNEL: FunnelStage[] = [
  { label: "Reached", count: 482_450, hint: "Messages and posts delivered" },
  { label: "Engaged", count: 288_050, hint: "Opened, read or viewed" },
  { label: "Clicked", count: 93_706, hint: "Followed a link or button" },
  { label: "Leads", count: 24_580, hint: "Left a contact detail" },
  { label: "Converted", count: 8_420, hint: "Placed an order" },
];

/* -------------------------------------------------------------------------- */
/* Top performers                                                             */
/* -------------------------------------------------------------------------- */

export interface TopCampaignRow {
  id: string;
  name: string;
  channel: MarketingChannel;
  sent: number;
  conversions: number;
  revenue: number;
  /** Conversions as a percentage of delivered. */
  conversionRate: number;
}

export const TOP_CAMPAIGNS: TopCampaignRow[] = [
  {
    id: "cmp-vip-preview",
    name: "VIP Early Access",
    channel: "whatsapp",
    sent: 218,
    conversions: 84,
    revenue: 14_400,
    conversionRate: 38.9,
  },
  {
    id: "cmp-cart-recovery",
    name: "Abandoned Checkout Recovery",
    channel: "whatsapp",
    sent: 964,
    conversions: 288,
    revenue: 11_820,
    conversionRate: 30.3,
  },
  {
    id: "cmp-wa-launch",
    name: "Product Launch Broadcast",
    channel: "whatsapp",
    sent: 2_418,
    conversions: 612,
    revenue: 22_680,
    conversionRate: 25.8,
  },
  {
    id: "cmp-product-launch",
    name: "New Product Launch",
    channel: "email",
    sent: 2_430,
    conversions: 386,
    revenue: 18_820,
    conversionRate: 16.2,
  },
  {
    id: "cmp-summer-2026",
    name: "Summer Sale 2026",
    channel: "whatsapp",
    sent: 11_840,
    conversions: 1_284,
    revenue: 38_240,
    conversionRate: 11.0,
  },
  {
    id: "cmp-reengagement",
    name: "Customer Re-engagement",
    channel: "email",
    sent: 5_240,
    conversions: 512,
    revenue: 9_640,
    conversionRate: 10.1,
  },
];

/* -------------------------------------------------------------------------- */
/* Activity feed                                                              */
/* -------------------------------------------------------------------------- */

export type ActivityKind =
  | "campaign"
  | "automation"
  | "contact"
  | "template"
  | "conversion"
  | "alert";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  /** Plain-language headline. The channel is carried by `channel`, not repeated. */
  title: string;
  detail: string;
  channel?: Channel;
  actor: string;
  at: string;
}

export const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1",
    kind: "campaign",
    title: "Autumn Collection Launch started sending",
    detail: "8,420 of 12,480 delivered",
    channel: "whatsapp",
    actor: "Nadia Karim",
    at: "2026-09-08T09:42:00Z",
  },
  {
    id: "act-2",
    kind: "conversion",
    title: "12 conversions from Back to Business",
    detail: "$3,180 attributed in the last hour",
    channel: "email",
    actor: "System",
    at: "2026-09-08T09:15:00Z",
  },
  {
    id: "act-3",
    kind: "automation",
    title: "Abandoned Cart Recovery processed 46 contacts",
    detail: "38 completed the flow, 8 still waiting",
    channel: "whatsapp",
    actor: "System",
    at: "2026-09-08T08:30:00Z",
  },
  {
    id: "act-4",
    kind: "alert",
    title: "Instagram Business token expires in 6 days",
    detail: "Reconnect the account to keep scheduling posts",
    channel: "social",
    actor: "System",
    at: "2026-09-08T07:50:00Z",
  },
  {
    id: "act-5",
    kind: "template",
    title: "autumn_promo_v2 approved",
    detail: "Marketing template, English (US)",
    channel: "whatsapp",
    actor: "Meta review",
    at: "2026-09-07T18:20:00Z",
  },
  {
    id: "act-6",
    kind: "contact",
    title: "1,240 contacts imported",
    detail: "From storefront-signups-sept.csv · 18 duplicates skipped",
    actor: "Imran Hossain",
    at: "2026-09-07T15:05:00Z",
  },
  {
    id: "act-7",
    kind: "campaign",
    title: "Appointment Reminders scheduled",
    detail: "684 recipients · 9 Sept, 09:00 Asia/Dhaka",
    channel: "sms",
    actor: "Tanvir Alam",
    at: "2026-09-07T12:40:00Z",
  },
  {
    id: "act-8",
    kind: "alert",
    title: "Spring Clearance failed",
    detail: "Sending domain not verified · 380 undelivered",
    channel: "email",
    actor: "System",
    at: "2026-09-06T16:10:00Z",
  },
];
