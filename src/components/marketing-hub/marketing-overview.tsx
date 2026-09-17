"use client";

import { Eye, Megaphone, Send, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_HEXES, CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { SEGMENTS } from "@/lib/segment-fixtures";
import { LIVE_WORKFLOWS, conversionRate } from "@/lib/workflow-fixtures";
import {
  AUDIENCE_INSIGHTS,
  CHANNEL_ROWS,
  CHANNEL_VOLUME,
  MARKETING_RATES,
  MARKETING_TOTALS,
  RECENT_ACTIVITY,
  TOP_CAMPAIGNS,
  WEEK_LABELS,
} from "@/lib/overview-fixtures";
import { formatCount, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/marketing";
import { CampaignTable } from "./campaign-table";
import { ActivityFeed } from "./shared/activity-feed";
import { ChannelPerformanceTable } from "./shared/channel-performance";
import { RankedList, type RankedItem } from "./shared/ranked-list";
import { TopCampaigns } from "./shared/top-campaigns";

/**
 * The Marketing workspace: an operations desk, not a second report.
 *
 * The split from the merchant overview is by question. `/dashboard` answers
 * "how is the business doing" — leads, conversations, orders, revenue, and the
 * trends under them. This answers "what is the marketing *doing*" — what is
 * running, what failed, who it reached, which channel carried it, and what
 * changed in the last two days.
 *
 * That distinction is why three widgets are gone rather than restyled. An
 * Audience Growth line chart plotted new contacts per week beside a dashboard
 * already plotting Total Leads. A five-stage Conversion Funnel sat opposite
 * the dashboard's five-stage Sales Funnel, near enough in shape that the two
 * pages read as one even though the stages differed. A Revenue view on the
 * volume chart made this the third place a revenue trend appeared. Each was a
 * good widget answering a question another page had already answered.
 *
 * What replaced them is state rather than trend: Campaign Health counts the
 * campaign list by status, Audience Insights counts the audience by what a
 * marketer would do about it. Neither has a counterpart on the overview,
 * because the overview has no reason to care which campaigns are scheduled.
 *
 * The order is the working day: the four headline numbers, then what needs
 * attention, then how the channels are carrying it, then what to repeat, then
 * the log.
 */

/**
 * Marketing's own four. Every one of these is a property of the *sends* — no
 * figure here is also on the merchant overview, which is the whole point.
 *
 * Four rather than the five this used to carry. Click Rate and Conversions
 * both went: Click Rate is a second reading of the same funnel Engagement Rate
 * already reports, and Conversions is the tail the merchant overview owns as
 * Orders. Audience Reach takes their place because nothing on the page said
 * how many *people* the sending actually touched — the row could tell you
 * 482,450 messages went out and not that they landed on 186,400 contacts.
 */
const STATS: StatItem[] = [
  {
    label: "Active Campaigns",
    value: formatCount(MARKETING_TOTALS.campaigns),
    changePercent: MARKETING_TOTALS.campaignsChange,
    icon: Megaphone,
    tone: "brand",
    hint: "across all channels",
  },
  {
    label: "Messages Sent",
    value: formatCount(MARKETING_TOTALS.messagesSent),
    changePercent: MARKETING_TOTALS.messagesSentChange,
    icon: Send,
    tone: "whatsapp",
    hint: "vs last 90 days",
  },
  {
    label: "Audience Reach",
    value: formatCount(MARKETING_TOTALS.audienceReach),
    changePercent: MARKETING_TOTALS.audienceReachChange,
    icon: Users,
    tone: "info",
    hint: "contacts reached at least once",
  },
  {
    label: "Engagement Rate",
    value: formatPercent(MARKETING_RATES.engagement),
    changePercent: MARKETING_RATES.engagementChange,
    icon: Eye,
    tone: "sms",
    hint: "opened, read or viewed",
  },
];

/* -------------------------------------------------------------------------- */
/* Command-centre panels                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A count with a coloured marker, as used by the two state panels below.
 *
 * The same tile the dashboard's WhatsApp inbox counts its queue with — tinted
 * ground, a dot carrying the state, the figure under the label. Local to this
 * file because two panels on one page is not yet a pattern; if a third wants
 * it, it moves to `ui/`.
 */
function StateTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  /** Background utility for the dot. */
  tone: string;
  hint?: string;
}) {
  return (
    <div className="rounded-panel bg-surface-secondary px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", tone)} />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 text-xl leading-none font-bold text-text-primary tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 truncate text-sm text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Campaign health, counted off the campaign list itself.
 *
 * Derived rather than stated, so this panel and the Recent Campaigns table
 * below it can never disagree about how many campaigns are running. The four
 * states are the ones a marketer does something about; `draft` and `paused`
 * are deliberately absent — a draft is not yet marketing and a paused campaign
 * is already someone's decision, whereas a failed one is a job for today.
 */
const HEALTH: { label: string; status: CampaignStatus; tone: string }[] = [
  { label: "Running", status: "running", tone: "bg-whatsapp" },
  { label: "Scheduled", status: "scheduled", tone: "bg-info" },
  { label: "Completed", status: "completed", tone: "bg-border-strong" },
  { label: "Failed", status: "failed", tone: "bg-error" },
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
      <StatsGrid items={STATS} columns={4} />

      {/*
        The two state panels, which are what makes this a command centre
        rather than a second analytics page.

        They replace an Audience Growth line chart and a Conversion Funnel.
        Both were good widgets and both restated the merchant overview: the
        growth chart plotted new contacts per week beside a dashboard that
        already plots Total Leads, and a five-stage funnel sat opposite the
        dashboard's five-stage Sales Funnel, close enough in shape that the two
        pages read as one. What a marketer cannot get from the overview is the
        *operational* state — what is running right now, what failed, how the
        audience is changing — so that is what sits here instead.
      */}
      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard
          title="Campaign Health"
          description="What the campaign list is doing right now."
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HEALTH.map((state) => (
              <StateTile
                key={state.status}
                label={state.label}
                tone={state.tone}
                value={formatNumber(
                  CAMPAIGNS.filter((item) => item.status === state.status)
                    .length,
                )}
              />
            ))}
          </div>
        </PanelCard>

        <PanelCard
          title="Audience Insights"
          description="Who the campaigns are reaching, and who is leaving."
          action={
            <ButtonLink href={APP_ROUTES.segments} variant="ghost" size="sm">
              View segments
            </ButtonLink>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StateTile
              label="New Contacts"
              tone="bg-primary"
              value={formatCount(AUDIENCE_INSIGHTS.newContacts)}
              hint="last 90 days"
            />
            <StateTile
              label="Active Segments"
              tone="bg-info"
              value={formatNumber(SEGMENTS.length)}
              hint="targetable now"
            />
            <StateTile
              label="High Intent"
              tone="bg-warning"
              value={formatCount(AUDIENCE_INSIGHTS.highIntentLeads)}
              hint="clicked, not converted"
            />
            {/* The one count on the page where up is bad, which is why it is
                the only tile drawn in the error tone. */}
            <StateTile
              label="Unsubscribed"
              tone="bg-error"
              value={formatCount(AUDIENCE_INSIGHTS.unsubscribed)}
              hint="last 90 days"
            />
          </div>
        </PanelCard>
      </div>

      {/*
        Titled by what it plots, not by what it is about.

        This was "Campaign Performance", which is also the name of a card on
        the merchant overview — and that card is a per-campaign ranking, so two
        different widgets shared one name across two pages. This one has only
        ever been send volume per channel per week, so it says so.

        The Revenue view is gone with the name. Attributed revenue per week is
        a revenue trend, and the merchant overview owns revenue trends; keeping
        it here was the third place this page answered a question the dashboard
        had already answered. Revenue per channel is still on the Channel
        Performance table below, where it is a comparison rather than a trend.
      */}
      <ChartCard
        title="Channel Send Volume"
        description="What the campaigns sent each week, per channel. Social counts posts."
        action={
          <ButtonLink href={APP_ROUTES.analytics} variant="ghost" size="sm">
            Full report
          </ButtonLink>
        }
        legend={CHANNEL_ORDER.map((channel) => ({
          label: CHANNEL_THEME[channel].label,
          swatch: CHANNEL_THEME[channel].accent,
          value: formatNumber(CHANNEL_VOLUME[channel].at(-1) ?? 0),
        }))}
      >
        <TrendChart
          categories={WEEK_LABELS}
          series={volumeSeries}
          colors={CHANNEL_HEXES}
          variant="line"
          unit="sent"
        />
      </ChartCard>

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
          <RankedList items={AUTOMATION_RANKING} labelSize="base" />
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
