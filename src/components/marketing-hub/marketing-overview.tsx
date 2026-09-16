"use client";

import { useState } from "react";
import { Eye, Megaphone, MousePointerClick, Send, Target } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { BRAND_SERIES } from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_HEXES, CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { LIVE_WORKFLOWS, conversionRate } from "@/lib/workflow-fixtures";
import {
  CHANNEL_ROWS,
  CHANNEL_VOLUME,
  CONVERSION_FUNNEL,
  LEAD_GROWTH,
  MARKETING_RATES,
  MARKETING_TOTALS,
  RECENT_ACTIVITY,
  REVENUE_SERIES,
  TOP_CAMPAIGNS,
  WEEK_LABELS,
} from "@/lib/overview-fixtures";
import {
  formatCount,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { CampaignTable } from "./campaign-table";
import { ActivityFeed } from "./shared/activity-feed";
import { ChannelPerformanceTable } from "./shared/channel-performance";
import { ConversionFunnel } from "./shared/conversion-funnel";
import { RankedList, type RankedItem } from "./shared/ranked-list";
import { TopCampaigns } from "./shared/top-campaigns";

/**
 * The Marketing workspace.
 *
 * Reads as the marketing funnel and nothing else: what the campaigns sent
 * (KPIs), how they trended (campaign performance), who they grew (audience),
 * where they leaked (conversion funnel), which channel carried them, which
 * campaigns and workflows are worth repeating, and what the module has been
 * doing.
 *
 * Deliberately does *not* open with the business headline. Leads,
 * conversations, orders and revenue are the merchant overview's four KPIs, and
 * this page used to repeat two of them verbatim — which is what made the two
 * pages feel like one page rendered twice. The split is by question: the
 * overview answers "how is the business doing", this answers "how is the
 * marketing doing". Orders and revenue live there; reach, engagement,
 * click-through and conversions live here.
 *
 * Conversations are the overview's too, via its WhatsApp inbox card. A thread
 * waiting on a reply is an inbox task, not a marketing metric, so the panel
 * that used to sit at the bottom of this page is gone rather than duplicated.
 */

/**
 * Marketing's own five. Every one of these is a property of the *sends* — no
 * figure here is also on the merchant overview, which is the whole point.
 */
const STATS: StatItem[] = [
  {
    label: "Active Campaigns",
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
    label: "Engagement Rate",
    value: formatPercent(MARKETING_RATES.engagement),
    changePercent: MARKETING_RATES.engagementChange,
    icon: Eye,
    hint: "opened, read or viewed",
  },
  {
    label: "Click Rate",
    value: formatPercent(MARKETING_RATES.click),
    changePercent: MARKETING_RATES.clickChange,
    icon: MousePointerClick,
    hint: "of everyone reached",
  },
  {
    label: "Conversions",
    value: formatCount(MARKETING_TOTALS.conversions),
    changePercent: MARKETING_TOTALS.conversionsChange,
    icon: Target,
    hint: "1.7% of reached",
  },
];

type PerformanceView = "volume" | "revenue";

const LEAD_SOURCES = [
  { key: "inbound", label: "Inbound", data: LEAD_GROWTH.inbound, swatch: "bg-primary" },
  { key: "outbound", label: "Outbound", data: LEAD_GROWTH.outbound, swatch: "bg-accent" },
  { key: "referral", label: "Referral", data: LEAD_GROWTH.referral, swatch: "bg-border-strong" },
];

/**
 * Live workflows ranked by the share of entrants that converted.
 *
 * Rate rather than volume, for the same reason Top Performing ranks campaigns
 * that way: the workflow with the most conversions is usually just the one the
 * most contacts entered, and that tells you nothing about which flow to build
 * next. The volume is still on the second line, because a 22% rate over 1,840
 * contacts and a 9% rate over 18,420 are different kinds of good.
 *
 * Distinct from the overview's Automation Activity, which is a run log — what
 * happened, in order. This is what the workflows are *worth*.
 */
const AUTOMATION_RANKING: RankedItem[] = [...LIVE_WORKFLOWS]
  /* `LIVE_WORKFLOWS` is everything unarchived, which includes paused, drafts
     and the one in error. A ranking of what marketing is running should only
     hold what is actually running. */
  .filter((workflow) => workflow.status === "active" && workflow.stats.entered > 0)
  .sort((a, b) => conversionRate(b) - conversionRate(a))
  .slice(0, 5)
  .map((workflow) => ({
    id: workflow.id,
    label: workflow.name,
    secondary: `${formatNumber(workflow.stats.entered)} entered · ${formatNumber(
      workflow.stats.converted,
    )} converted`,
    display: formatPercent(conversionRate(workflow)),
    share: conversionRate(workflow),
  }));

export function MarketingOverview() {
  const [view, setView] = useState<PerformanceView>("volume");

  /* Newest five, which is what "recent" means on an overview. */
  const recentCampaigns = [...CAMPAIGNS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const volumeSeries = CHANNEL_ORDER.map((channel) => ({
    name: CHANNEL_THEME[channel].label,
    data: CHANNEL_VOLUME[channel],
  }));

  return (
    <>
      <StatsGrid items={STATS} columns={5} />

      <ChartCard
        title="Campaign Performance"
        description={
          view === "volume"
            ? "What the campaigns sent each week, per channel. Social counts posts."
            : "Revenue attributed to campaigns, per week."
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
          title="Audience Growth"
          description="New contacts per week, by how they arrived."
          className="xl:col-span-2"
          action={
            <ButtonLink href={APP_ROUTES.segments} variant="ghost" size="sm">
              View segments
            </ButtonLink>
          }
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
          title="Automation Performance"
          description="Live workflows, ranked by the share of entrants that converted."
          action={
            <ButtonLink
              href={AUTOMATION_ROUTES.workflows}
              variant="ghost"
              size="sm"
            >
              View workflows
            </ButtonLink>
          }
        >
          <RankedList items={AUTOMATION_RANKING} />
        </PanelCard>

        <PanelCard
          title="Marketing Activity"
          description="Everything the marketing module did in the last two days."
        >
          <ActivityFeed entries={RECENT_ACTIVITY} />
        </PanelCard>
      </div>
    </>
  );
}
