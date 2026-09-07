"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CampaignPerformanceChart } from "./charts/campaign-performance-chart";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Campaign {
  name: string;
  reach: number;
  engagement: number;
  orders: number;
  revenue: number;
}

/**
 * Placeholder figures, but they close the loop with the KPI row: the four
 * campaigns account for exactly 1,284 orders and $48,200 of revenue, so
 * "which campaign drove the month" has an answer that adds up.
 */
const CAMPAIGNS: Campaign[] = [
  { name: "Summer Sale", reach: 24580, engagement: 8420, orders: 468, revenue: 18240 },
  { name: "Product Launch", reach: 18240, engagement: 6180, orders: 342, revenue: 14820 },
  { name: "Lead Nurture", reach: 14120, engagement: 4890, orders: 268, revenue: 9640 },
  { name: "Re-engagement", reach: 9480, engagement: 2940, orders: 206, revenue: 5500 },
];

type TabKey = "engagement" | "orders" | "revenue";

const TABS: {
  value: TabKey;
  label: string;
  format: "number" | "currency";
  seriesName: string;
}[] = [
  { value: "engagement", label: "Engagement", format: "number", seriesName: "Engaged" },
  { value: "orders", label: "Conversions", format: "number", seriesName: "Orders" },
  { value: "revenue", label: "Revenue", format: "currency", seriesName: "Revenue" },
];

const TOTALS = {
  reach: CAMPAIGNS.reduce((sum, c) => sum + c.reach, 0),
  orders: CAMPAIGNS.reduce((sum, c) => sum + c.orders, 0),
  revenue: CAMPAIGNS.reduce((sum, c) => sum + c.revenue, 0),
};

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function CampaignPerformance({ className }: { className?: string }) {
  /*
   * Opens on Revenue, not the first tab. Now that MarketFlow sells products,
   * "are my campaigns making money" is the question this card exists to
   * answer, and it should not take a click to see it.
   */
  const [tab, setTab] = useState<TabKey>("revenue");

  const active = TABS.find((item) => item.value === tab) ?? TABS[0];

  /* Sorted so the chart always reads top-to-bottom strongest-to-weakest,
     whichever measure is selected. */
  const ordered = [...CAMPAIGNS].sort((a, b) => b[tab] - a[tab]);

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base">Campaign Performance</h2>
          <p className="mt-1 text-sm text-text-secondary">
            See which campaigns are driving engagement and sales.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.campaigns}
          variant="ghost"
          size="sm"
          className="shrink-0 self-start"
        >
          View All
        </ButtonLink>
      </div>

      <SegmentedControl
        label="Campaign metric"
        options={TABS.map(({ value, label }) => ({ value, label }))}
        value={tab}
        onChange={setTab}
        className="mt-5 self-start"
      />

      <div className="mt-2 -ml-1">
        <CampaignPerformanceChart
          campaigns={ordered.map((campaign) => campaign.name)}
          values={ordered.map((campaign) => campaign[tab])}
          seriesName={active.seriesName}
          format={active.format}
        />
      </div>

      {/* Totals the bars cannot show: the chart answers "which campaign",
          these answer "how are all of them doing". Exact, not compacted, so
          the three read as one row. */}
      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
        {[
          { label: "Total reach", value: TOTALS.reach.toLocaleString("en-US") },
          { label: "Orders", value: TOTALS.orders.toLocaleString("en-US") },
          { label: "Revenue", value: formatCurrency(TOTALS.revenue) },
        ].map((total) => (
          <div key={total.label}>
            <dt className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              {total.label}
            </dt>
            <dd className="mt-1 text-sm font-bold text-text-primary tabular-nums">
              {total.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
