"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_ROUTES } from "@/constants";
import { formatCount, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

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

/* Sums to the 30-day KPI row exactly - 1,284 orders, $48,200 - so the month
   adds up whichever card you read it from. */
const CAMPAIGNS: Campaign[] = [
  { name: "Summer Sale", reach: 24580, engagement: 8420, orders: 468, revenue: 18240 },
  { name: "Product Launch", reach: 18240, engagement: 6180, orders: 342, revenue: 14820 },
  { name: "Lead Nurture", reach: 14120, engagement: 4890, orders: 268, revenue: 9640 },
  { name: "Re-engagement", reach: 9480, engagement: 2940, orders: 206, revenue: 5500 },
];

type TabKey = "engagement" | "orders" | "revenue";

const TABS: { value: TabKey; label: string; format: "number" | "currency" }[] = [
  { value: "engagement", label: "Engagement", format: "number" },
  { value: "orders", label: "Conversions", format: "number" },
  { value: "revenue", label: "Revenue", format: "currency" },
];

const TOTALS = {
  reach: CAMPAIGNS.reduce((sum, c) => sum + c.reach, 0),
  orders: CAMPAIGNS.reduce((sum, c) => sum + c.orders, 0),
  revenue: CAMPAIGNS.reduce((sum, c) => sum + c.revenue, 0),
};

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Campaign standings.
 *
 * Bars drawn in CSS rather than a second plotted chart: a bar chart here could
 * only ever show the one measure the tab selects, where a row can carry the
 * name, the measure, its share of the leader, the reach it came from and the
 * rate it converted at - five readings in the height a chart spends on one.
 * It also lets this card end where the inbox beside it does, instead of being
 * pinned to a fixed plot height.
 */
export function CampaignPerformance({ className }: { className?: string }) {
  /* Opens on Revenue: "are my campaigns making money" should not cost a click. */
  const [tab, setTab] = useState<TabKey>("revenue");

  const active = TABS.find((item) => item.value === tab) ?? TABS[0];
  const format = (value: number) =>
    active.format === "currency" ? formatCurrency(value) : formatCount(value);

  /* Sorted so the list always reads top-to-bottom strongest-to-weakest,
     whichever measure is selected. */
  const ordered = [...CAMPAIGNS].sort((a, b) => b[tab] - a[tab]);
  const leader = ordered[0]?.[tab] ?? 0;

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg">Campaign Performance</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            See which campaigns are driving engagement and sales.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.marketingCampaigns}
          variant="ghost"
          size="sm"
          className="shrink-0 self-start"
        >
          View All
        </ButtonLink>
      </div>

      {CAMPAIGNS.length === 0 ? (
        <div className="mt-5 flex-1">
          <EmptyState
            compact
            title="No campaigns yet"
            description="Your first campaign will show its reach, conversions and revenue here."
            action={
              <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="sm">
                Create Campaign
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <>
          <SegmentedControl
            label="Campaign metric"
            options={TABS.map(({ value, label }) => ({ value, label }))}
            value={tab}
            onChange={setTab}
            className="mt-5 self-start"
          />

          {/* The list answers "which campaign"; these answer "all of them". */}
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Total reach", value: formatCount(TOTALS.reach) },
              { label: "Orders", value: formatCount(TOTALS.orders) },
              { label: "Revenue", value: formatCurrency(TOTALS.revenue) },
            ].map((total) => (
              <div
                key={total.label}
                className="rounded-panel bg-surface-secondary px-3.5 py-2.5"
              >
                <dt className="truncate text-sm font-medium text-text-secondary">
                  {total.label}
                </dt>
                <dd className="mt-1.5 text-xl leading-none font-bold text-text-primary tabular-nums">
                  {total.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 flex flex-1 flex-col gap-5">
            {ordered.map((campaign) => {
              const share = leader === 0 ? 0 : (campaign[tab] / leader) * 100;
              const conversion =
                campaign.reach === 0 ? 0 : (campaign.orders / campaign.reach) * 100;

              return (
                <li key={campaign.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-base font-medium text-text-primary">
                      {campaign.name}
                    </p>
                    <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                      {format(campaign[tab])}
                    </span>
                  </div>

                  <ProgressBar
                    value={share}
                    label={`${campaign.name} ${active.label.toLowerCase()}`}
                    className="mt-1.5"
                  />

                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-secondary font-medium">
                    <span className="tabular-nums">
                      Reach {formatCount(campaign.reach)}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {conversion.toFixed(1)}% conversion
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
