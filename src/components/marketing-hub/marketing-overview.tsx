"use client";

import { useState } from "react";
import { DollarSign, Megaphone, MousePointerClick, Send, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { BRAND_SERIES } from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_HEXES, CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import { CAMPAIGNS, CONVERSATIONS } from "@/lib/marketing-fixtures";
import {
  CHANNEL_ROWS,
  CHANNEL_VOLUME,
  CONVERSION_FUNNEL,
  LEAD_GROWTH,
  MARKETING_TOTALS,
  RECENT_ACTIVITY,
  REVENUE_SERIES,
  TOP_CAMPAIGNS,
  WEEK_LABELS,
} from "@/lib/overview-fixtures";
import { formatCount, formatCurrency, formatNumber } from "@/lib/format";
import { CampaignTable } from "./campaign-table";
import { ActivityFeed } from "./shared/activity-feed";
import { ChannelPerformanceTable } from "./shared/channel-performance";
import { ConversionFunnel } from "./shared/conversion-funnel";
import { RecentConversations } from "./shared/recent-conversations";
import { TopCampaigns } from "./shared/top-campaigns";

/**
 * The cross-channel command centre.
 *
 * Structured as: what happened (KPIs), how it is trending (two charts), where
 * it came from (channel comparison), where it leaks (funnel), and what needs
 * attention (campaigns, conversations, activity). Deliberately the densest
 * page in the app — it is the one people leave open all day, and every other
 * marketing page is a drill-down from one of these panels.
 */

const STATS: StatItem[] = [
  {
    label: "Total Leads",
    value: formatCount(MARKETING_TOTALS.leads),
    changePercent: MARKETING_TOTALS.leadsChange,
    icon: Users,
    hint: "vs last 90 days",
  },
  {
    label: "Campaigns",
    value: formatCount(MARKETING_TOTALS.campaigns),
    changePercent: MARKETING_TOTALS.campaignsChange,
    icon: Megaphone,
    hint: "across all channels",
  },
  {
    label: "Messages Sent",
    value: formatCount(MARKETING_TOTALS.messagesSent),
    changePercent: MARKETING_TOTALS.messagesSentChange,
    icon: Send,
    hint: "vs last 90 days",
  },
  {
    label: "Conversions",
    value: formatCount(MARKETING_TOTALS.conversions),
    changePercent: MARKETING_TOTALS.conversionsChange,
    icon: MousePointerClick,
    hint: "1.7% of reached",
  },
  {
    label: "Revenue Generated",
    value: formatCurrency(MARKETING_TOTALS.revenue),
    changePercent: MARKETING_TOTALS.revenueChange,
    icon: DollarSign,
    hint: "attributed to marketing",
  },
];

type PerformanceView = "volume" | "revenue";

const LEAD_SOURCES = [
  { key: "inbound", label: "Inbound", data: LEAD_GROWTH.inbound, swatch: "bg-primary" },
  { key: "outbound", label: "Outbound", data: LEAD_GROWTH.outbound, swatch: "bg-accent" },
  { key: "referral", label: "Referral", data: LEAD_GROWTH.referral, swatch: "bg-border-strong" },
];

export function MarketingOverview() {
  const [view, setView] = useState<PerformanceView>("volume");

  /* Newest five, which is what "recent" means on an overview. */
  const recentCampaigns = [...CAMPAIGNS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  /* Threads with an unanswered inbound message first — those are the ones the
     panel exists to surface. */
  const conversations = [...CONVERSATIONS]
    .sort((a, b) => {
      const waiting = (item: typeof a) =>
        item.messages.at(-1)?.direction === "inbound" ? 0 : 1;
      const byWaiting = waiting(a) - waiting(b);
      if (byWaiting !== 0) return byWaiting;
      return (
        new Date(b.contact.lastActivityAt).getTime() -
        new Date(a.contact.lastActivityAt).getTime()
      );
    })
    .slice(0, 4);

  const volumeSeries = CHANNEL_ORDER.map((channel) => ({
    name: CHANNEL_THEME[channel].label,
    data: CHANNEL_VOLUME[channel],
  }));

  return (
    <>
      <StatsGrid items={STATS} columns={5} />

      <ChartCard
        title="Marketing Performance"
        description={
          view === "volume"
            ? "Messages sent per week, per channel. Social counts posts."
            : "Revenue attributed to marketing, per week."
        }
        action={
          <SegmentedControl
            label="Performance metric"
            value={view}
            onChange={setView}
            options={[
              { value: "volume", label: "Volume" },
              { value: "revenue", label: "Revenue" },
            ]}
          />
        }
        legend={
          view === "volume"
            ? CHANNEL_ORDER.map((channel) => ({
                label: CHANNEL_THEME[channel].label,
                swatch: CHANNEL_THEME[channel].accent,
                value: formatNumber(CHANNEL_VOLUME[channel].at(-1) ?? 0),
              }))
            : [
                {
                  label: "Attributed revenue",
                  swatch: "bg-primary",
                  value: formatCurrency(REVENUE_SERIES.at(-1) ?? 0),
                },
              ]
        }
      >
        {view === "volume" ? (
          <TrendChart
            categories={WEEK_LABELS}
            series={volumeSeries}
            colors={CHANNEL_HEXES}
            variant="line"
            unit="sent"
          />
        ) : (
          <TrendChart
            categories={WEEK_LABELS}
            series={[{ name: "Revenue", data: REVENUE_SERIES }]}
            colors={[CHANNEL_THEME.whatsapp.hex]}
            format="currency"
          />
        )}
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Lead Growth"
          description="New leads per week, by how they arrived."
          className="xl:col-span-2"
          legend={LEAD_SOURCES.map((source) => ({
            label: source.label,
            swatch: source.swatch,
            value: formatNumber(source.data.at(-1) ?? 0),
          }))}
        >
          <TrendChart
            categories={WEEK_LABELS}
            series={LEAD_SOURCES.map((source) => ({
              name: source.label,
              data: source.data,
            }))}
            colors={BRAND_SERIES}
            unit="leads"
          />
        </ChartCard>

        <PanelCard
          title="Conversion Funnel"
          description="Where the last 90 days leaked."
        >
          <ConversionFunnel stages={CONVERSION_FUNNEL} />
        </PanelCard>
      </div>

      <PanelCard
        title="Channel Performance"
        description="How the four channels compare over the last 90 days."
        action={
          <ButtonLink href={APP_ROUTES.analytics} variant="ghost" size="sm">
            Full report
          </ButtonLink>
        }
      >
        {/* `Table` already owns the negative gutter and the horizontal scroll,
            so the panel must not add its own — two -mx-5 would push the rows
            20px outside the card. */}
        <ChannelPerformanceTable rows={CHANNEL_ROWS} />
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Recent Campaigns"
          description="The last five campaigns you created."
          className="xl:col-span-2"
          action={
            <ButtonLink
              href={APP_ROUTES.marketingCampaigns}
              variant="ghost"
              size="sm"
            >
              View all
            </ButtonLink>
          }
        >
          <CampaignTable campaigns={recentCampaigns} compact />
        </PanelCard>

        <PanelCard
          title="Top Performing"
          description="Ranked by conversion rate, not volume."
        >
          <TopCampaigns rows={TOP_CAMPAIGNS.slice(0, 6)} />
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard
          title="Recent Conversations"
          description="Threads waiting on a reply come first."
          action={
            <ButtonLink href={APP_ROUTES.whatsappInbox} variant="ghost" size="sm">
              Open inbox
            </ButtonLink>
          }
        >
          <RecentConversations
            conversations={conversations}
            hrefBase={APP_ROUTES.whatsappInbox}
          />
        </PanelCard>

        <PanelCard
          title="Recent Activity"
          description="Everything the workspace did in the last two days."
        >
          <ActivityFeed entries={RECENT_ACTIVITY} />
        </PanelCard>
      </div>
    </>
  );
}
