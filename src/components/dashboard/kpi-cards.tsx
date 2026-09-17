"use client";

import {
  MessageCircle,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { KpiTone } from "@/components/ui/kpi-tones";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { useDashboardRange, type RangeKey } from "./dashboard-range";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface KpiDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Tints the icon tile — one identity per metric, never two the same. */
  tone: KpiTone;
  /** Totals for the window, pre-formatted, one per selectable period. */
  values: Record<RangeKey, string>;
  /** Change against the same window one period back. */
  change: Record<RangeKey, number>;
}

/**
 * Placeholder figures — swap for `useGetOverviewKpisQuery(range)` once the API
 * is live.
 *
 * Every metric is a *total for the window*, not a running count, which is why
 * each one grows with the range. The 30-day column is the page's baseline: the
 * campaign card's totals add up to its orders and revenue exactly.
 *
 * One tone per metric, because the four tiles used to be four identical grey
 * squares and the colour told a reader nothing — they had to read all four
 * labels to find the one they came for. Brand indigo opens the funnel, the
 * channel green names WhatsApp because the label does, info blue carries
 * Orders (blue, but not the *Email* blue — these are not the Email channel),
 * and Revenue takes success green.
 *
 * Revenue is the one deliberate spend of a state colour on an identity. The
 * rule in `ui/kpi-tones` exists to stop green meaning "this card is the
 * digital one"; here green means money, which is what success already means
 * everywhere else on this page. Switch it to `sms` violet if the two greens
 * ever read as one.
 */
const KPIS: KpiDefinition[] = [
  {
    key: "leads",
    label: "Total Leads",
    icon: Users,
    tone: "brand",
    values: { "7d": "3,092", "30d": "12,480", "90d": "34,860", "12m": "118,420" },
    change: { "7d": 12.4, "30d": 18.4, "90d": 22.1, "12m": 31.6 },
  },
  {
    key: "conversations",
    label: "WhatsApp Conversations",
    icon: MessageCircle,
    tone: "whatsapp",
    values: { "7d": "2,140", "30d": "8,420", "90d": "23,940", "12m": "79,260" },
    change: { "7d": 15.2, "30d": 24.6, "90d": 27.3, "12m": 38.2 },
  },
  {
    key: "orders",
    label: "Orders",
    icon: ShoppingCart,
    tone: "info",
    values: { "7d": "334", "30d": "1,284", "90d": "3,610", "12m": "12,146" },
    change: { "7d": 11.6, "30d": 16.8, "90d": 19.4, "12m": 26.9 },
  },
  {
    key: "revenue",
    label: "Revenue Generated",
    icon: Wallet,
    tone: "success",
    values: { "7d": "$12.7K", "30d": "$48.2K", "90d": "$136.8K", "12m": "$432.4K" },
    change: { "7d": 14.1, "30d": 21.5, "90d": 24.7, "12m": 29.8 },
  },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The overview's four headline numbers.
 *
 * Built on the shared `StatsGrid` rather than a private copy of it: this row
 * and the KPI row on every channel module are the same object, and keeping two
 * implementations is how they end up a pixel apart. The comparison line reads
 * from the page's reporting period, so it always names the window the figure
 * above it was measured over.
 */
export function KpiCards() {
  const { range, meta } = useDashboardRange();

  const items: StatItem[] = KPIS.map((kpi) => ({
    label: kpi.label,
    value: kpi.values[range],
    changePercent: kpi.change[range],
    icon: kpi.icon,
    tone: kpi.tone,
    hint: meta.comparison,
  }));

  return <StatsGrid items={items} columns={4} />;
}
