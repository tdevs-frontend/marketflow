"use client";

import { Eye, Megaphone, Send, Users } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/chart-card";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { APP_ROUTES } from "@/constants";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { SEGMENTS } from "@/lib/segment-fixtures";
import {
  AUDIENCE_INSIGHTS,
  CHANNEL_ACTIVITY,
  CHANNEL_ROWS,
  LEAD_GROWTH,
  MARKETING_RATES,
  MARKETING_TOTALS,
  RECENT_ACTIVITY,
  TOP_CAMPAIGNS,
} from "@/lib/overview-fixtures";
import { formatCount, formatPercent } from "@/lib/format";
import { CampaignTable } from "./campaign-table";
import { ActivityStream } from "./shared/activity-stream";
import { AudienceInsights } from "./shared/audience-insights";
import {
  CampaignHealthPanel,
  campaignHealth,
} from "./shared/campaign-health";
import { ChannelActivity } from "./shared/channel-activity";
import { TopCampaigns } from "./shared/top-campaigns";

/**
 * The Marketing workspace: an operations desk, not a second report.
 *
 * The split from the merchant overview is by question. `/dashboard` answers
 * "how is the business doing" - leads, conversations, orders, revenue, and the
 * trends under them. This answers "what is the marketing *doing*" - what is
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
 * Marketing's own four. Every one of these is a property of the *sends* - no
 * figure here is also on the merchant overview, which is the whole point.
 *
 * Four rather than the five this used to carry. Click Rate and Conversions
 * both went: Click Rate is a second reading of the same funnel Engagement Rate
 * already reports, and Conversions is the tail the merchant overview owns as
 * Orders. Audience Reach takes their place because nothing on the page said
 * how many *people* the sending actually touched - the row could tell you
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
 * The health score and the counts behind it, read off the campaign list and
 * the channel table.
 *
 * Derived rather than stated, so this panel and the Recent Campaigns table
 * below it can never disagree about how many campaigns are running, and the
 * delivery rate is the same arithmetic the Channel Performance table shows one
 * row at a time.
 */
const CAMPAIGN_HEALTH = campaignHealth(
  CAMPAIGNS,
  CHANNEL_ROWS,
  MARKETING_RATES.engagement,
);

/** Movement against the previous 90 days, which a snapshot cannot derive. */
const CAMPAIGN_HEALTH_CHANGES = {
  active: 8.4,
  delivery: 0.6,
  engagement: MARKETING_RATES.engagementChange,
};

/**
 * The audience total, taken from the `All Contacts` system segment.
 *
 * That segment is defined as everyone with a valid opt-in on at least one
 * channel, which is exactly what "total audience" means on a page about
 * sending - and reading it from the segment rather than restating it keeps
 * this card and the Segments screen on one number.
 */
const TOTAL_AUDIENCE = SEGMENTS.find((item) => item.system) ?? SEGMENTS[0];

/**
 * The audiences worth sending to, largest first.
 *
 * `system` segments are dropped: "All Contacts" is the total stated directly
 * above the chips, and leaving it in would make the largest chip a restatement
 * of the headline rather than a fifth thing to send to.
 */
const TARGETABLE_SEGMENTS = [...SEGMENTS]
  .filter((item) => !item.system)
  .sort((a, b) => b.contacts - a.contacts);

/**
 * New contacts per week, for the sparkline.
 *
 * The three arrival routes summed: the card asks how fast the audience is
 * growing, not which door it came through, and three faint lines in a 28px box
 * is a shape nobody can read anyway.
 */
const NEW_CONTACTS_TREND = LEAD_GROWTH.inbound.map(
  (value, index) =>
    value + LEAD_GROWTH.outbound[index] + LEAD_GROWTH.referral[index],
);

export function MarketingOverview() {
  /* Newest five, which is what "recent" means on an overview. */
  const recentCampaigns = [...CAMPAIGNS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
        *operational* state - what is running right now, what failed, how the
        audience is changing - so that is what sits here instead.
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
          <CampaignHealthPanel
            health={CAMPAIGN_HEALTH}
            changes={CAMPAIGN_HEALTH_CHANGES}
            icons={{
              active: Megaphone,
              delivery: Send,
              engagement: Eye,
            }}
          />
        </PanelCard>

        <PanelCard
          title="Audience Insights"
          description="Who the campaigns can reach, and which way it is moving."
          action={
            <ButtonLink href={APP_ROUTES.segments} variant="ghost" size="sm">
              View segments
            </ButtonLink>
          }
        >
          <AudienceInsights
            total={TOTAL_AUDIENCE.contacts}
            totalChange={TOTAL_AUDIENCE.growth}
            newContacts={AUDIENCE_INSIGHTS.newContacts}
            newContactsChange={AUDIENCE_INSIGHTS.newContactsChange}
            topSource={AUDIENCE_INSIGHTS.topSource}
            trend={NEW_CONTACTS_TREND}
            segments={TARGETABLE_SEGMENTS}
            segmentsHref={APP_ROUTES.segments}
          />
        </PanelCard>
      </div>

      {/*
        Titled by what it plots, not by what it is about.

        This was "Campaign Performance", which is also the name of a card on
        the merchant overview - and that card is a per-campaign ranking, so two
        different widgets shared one name across two pages. This one has only
        ever been send volume per channel per week, so it says so.

        The Revenue view is gone with the name. Attributed revenue per week is
        a revenue trend, and the merchant overview owns revenue trends; keeping
        it here was the third place this page answered a question the dashboard
        had already answered. Revenue per channel is still on the Channel
        Performance table below, where it is a comparison rather than a trend.
      */}
      {/*
        One card, two questions.

        Channel Send Volume used to sit above this as a card of its own - a
        twelve-week line of what each channel sent - and the table below it
        answered how well each channel did. That split asked a reader to hold
        "WhatsApp sent the most" and "WhatsApp converts best" in their head and
        join the two up. They are one question about one channel, so the volume
        has moved inside and the separate card is gone.

        The body is per-channel tiles rather than the table this card used to
        hold, because the four channels are no longer being measured on the
        same three things: SMS has no read receipt, Email has no meaningful
        reply rate, Social has no delivery at all. Shared columns would need a
        column of em dashes per row to say that.
      */}
      <PanelCard
        title="Channel Performance"
        description="Track channel activity, reach, and marketing effectiveness."
        action={
          <ButtonLink href={APP_ROUTES.analytics} variant="ghost" size="sm">
            Full report
          </ButtonLink>
        }
      >
        <ChannelActivity rows={CHANNEL_ACTIVITY} />
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

      {/*
        Full width, because it is now the only card on its row.

        Automation Performance used to sit beside it and has been removed: the
        Automation module owns that analysis in full, and a summary of it here
        made this page the second place to read how the journeys are doing. The
        stream keeps its automation *events*, which is the part that belongs to
        a marketing log rather than to an automation report.
      */}
      <PanelCard
        title="Marketing Activity"
        description="Latest campaign and channel events."
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
        <ActivityStream entries={RECENT_ACTIVITY} />
      </PanelCard>
    </>
  );
}
