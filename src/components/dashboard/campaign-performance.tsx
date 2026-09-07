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
  conversions: number;
  revenue: number;
}

const CAMPAIGNS: Campaign[] = [
  { name: "Summer Sale", reach: 24580, engagement: 8420, conversions: 2064, revenue: 18240 },
  { name: "Product Launch", reach: 18240, engagement: 6180, conversions: 1258, revenue: 14820 },
  { name: "Lead Nurture", reach: 14120, engagement: 4890, conversions: 790, revenue: 9640 },
  { name: "Re-engagement", reach: 9480, engagement: 2940, conversions: 389, revenue: 5120 },
  { name: "Welcome Campaign", reach: 6240, engagement: 2180, conversions: 212, revenue: 3480 },
];

type TabKey = "engagement" | "conversions" | "revenue";

const TABS: {
  value: TabKey;
  label: string;
  format: "number" | "currency";
  seriesName: string;
}[] = [
  { value: "engagement", label: "Engagement", format: "number", seriesName: "Engaged" },
  { value: "conversions", label: "Conversion", format: "number", seriesName: "Conversions" },
  { value: "revenue", label: "Revenue", format: "currency", seriesName: "Revenue" },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function CampaignPerformance({ className }: { className?: string }) {
  const [tab, setTab] = useState<TabKey>("engagement");

  const active = TABS.find((item) => item.value === tab) ?? TABS[0];

  /* Sorted so the chart always reads top-to-bottom strongest-to-weakest,
     whichever measure is selected. */
  const ordered = [...CAMPAIGNS].sort((a, b) => b[tab] - a[tab]);

  /*
   * Exact, not `formatNumber`: that compacts above 10k, which would print
   * "73K" beside "4,713" and "$51,300" in the same row of three.
   */
  const totalReach = CAMPAIGNS.reduce((sum, c) => sum + c.reach, 0).toLocaleString("en-US");
  const totalConversions = CAMPAIGNS.reduce((sum, c) => sum + c.conversions, 0).toLocaleString("en-US");
  const totalRevenue = formatCurrency(CAMPAIGNS.reduce((sum, c) => sum + c.revenue, 0));

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base">Campaign Performance</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Compare campaign engagement and conversion performance.
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

      {/* Totals the bars cannot show: the chart answers "which campaign", these
          answer "how are all of them doing". */}
      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div>
          <dt className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Total reach
          </dt>
          <dd className="mt-1 text-sm font-bold text-text-primary">
            {totalReach}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Conversions
          </dt>
          <dd className="mt-1 text-sm font-bold text-text-primary">
            {totalConversions}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Revenue
          </dt>
          <dd className="mt-1 text-sm font-bold text-text-primary">
            {totalRevenue}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
