"use client";

import { useState } from "react";
import { MousePointerClick, Send, Target, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_ROUTES } from "@/constants";
import {
  CAMPAIGNS,
  CHANNEL_SERIES,
  PERFORMANCE_DAYS,
} from "@/lib/marketing-fixtures";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketingChannel } from "@/types/marketing";
import { CampaignTable } from "./campaign-table";
import { ChannelPerformanceChart } from "./channel-performance-chart";
import { MarketingStats, type MarketingStat } from "./marketing-stats";

const STATS: MarketingStat[] = [
  {
    label: "Total Contacts",
    value: "12,480",
    changePercent: 18.4,
    icon: Users,
    hint: "vs last period",
  },
  {
    label: "Active Campaigns",
    value: "3",
    changePercent: 50,
    icon: Target,
    hint: "2 more than last month",
  },
  {
    label: "Messages Sent",
    value: "22,926",
    changePercent: 24.6,
    icon: Send,
    hint: "across all channels",
  },
  {
    label: "Conversion Rate",
    value: "24.8%",
    changePercent: 8.2,
    icon: MousePointerClick,
    hint: "vs last period",
  },
];

const CHANNEL_LEGEND: { channel: MarketingChannel; label: string; swatch: string }[] = [
  { channel: "whatsapp", label: "WhatsApp", swatch: "bg-primary" },
  { channel: "email", label: "Email", swatch: "bg-accent" },
  { channel: "sms", label: "SMS", swatch: "bg-border-strong" },
];

type Filter = MarketingChannel | "all";

export function MarketingOverview() {
  const [filter, setFilter] = useState<Filter>("all");

  const series =
    filter === "all"
      ? CHANNEL_LEGEND.map((item) => ({
          name: item.label,
          data: CHANNEL_SERIES[item.channel],
        }))
      : [
          {
            name: CHANNEL_LEGEND.find((item) => item.channel === filter)!.label,
            data: CHANNEL_SERIES[filter],
          },
        ];

  /* Newest five, which is what "recent" means on an overview. */
  const recent = [...CAMPAIGNS]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <>
      <MarketingStats items={STATS} />

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base">Campaign Performance</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Messages sent per channel over the last 30 days.
            </p>
          </div>

          <SegmentedControl
            label="Filter chart by channel"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Email" },
              { value: "sms", label: "SMS" },
            ]}
            className="max-lg:-mx-1 max-lg:overflow-x-auto"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {CHANNEL_LEGEND.filter(
            (item) => filter === "all" || item.channel === filter,
          ).map((item) => (
            <span
              key={item.channel}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted"
            >
              <span aria-hidden className={cn("h-0.5 w-4 rounded-full", item.swatch)} />
              {item.label}
              <span className="font-medium text-text-secondary tabular-nums">
                {formatNumber(
                  CHANNEL_SERIES[item.channel][CHANNEL_SERIES[item.channel].length - 1],
                )}
              </span>
            </span>
          ))}
        </div>

        <div className="mt-2 -ml-2.5">
          <ChannelPerformanceChart categories={PERFORMANCE_DAYS} series={series} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base">Recent Campaigns</h2>
            <p className="mt-1 text-sm text-text-secondary">
              The last five campaigns you created.
            </p>
          </div>
          <ButtonLink
            href={APP_ROUTES.marketingCampaigns}
            variant="ghost"
            size="sm"
          >
            View all
          </ButtonLink>
        </div>

        <div className="mt-4">
          <CampaignTable campaigns={recent} compact />
        </div>
      </Card>
    </>
  );
}
