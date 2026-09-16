"use client";

import { useState } from "react";
import {
  CheckCheck,
  MessageSquare,
  Send,
  Users,
  Workflow,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { MeterRow } from "@/components/ui/progress";
import { InfoHint } from "@/components/ui/tooltip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, MiniStat, type StatItem } from "@/components/ui/stats-card";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import {
  CHANNEL_SERIES,
  OUTCOME_COLORS,
} from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import { CAMPAIGNS, CONVERSATIONS } from "@/lib/marketing-fixtures";
import { AUTOMATION_FLOWS } from "@/lib/automation-fixtures";
import {
  WA_CONVERSATION_VOLUME,
  WA_DAY_LABELS,
  WA_FUNNEL,
  WA_OVERVIEW_TOTALS,
  WA_SERIES,
  rateSeries,
  whatsappTotals,
} from "@/lib/whatsapp-fixtures";
import { formatCount, formatNumber, formatPercent, formatRelativeTime, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FunnelStrip } from "../shared/conversion-funnel";
import { RecentConversations } from "../shared/recent-conversations";

/**
 * The WhatsApp module's landing page.
 *
 * Built around the one thing WhatsApp has that Email and SMS do not: a
 * two-way conversation. So the delivery funnel is a compact strip rather than
 * the hero, and the room goes to message performance, conversation volume and
 * the inbox — the numbers that tell you whether people are talking back.
 */

const theme = CHANNEL_THEME.whatsapp;
const ACCENT = { soft: theme.soft, text: theme.text };

/**
 * One tone per subsystem, for the KPI row's icon tiles.
 *
 * The row covers four different things — an audience, a send, a conversation
 * and a robot — and five identical green tiles made the icons decorative:
 * nothing could be found without reading its label. Every pair below is a
 * `-soft`/ink pair that already exists in the ramp, and each is the colour that
 * thing wears elsewhere in the product, so the row teaches the same vocabulary
 * the rest of the dashboard uses:
 *
 *   contacts     the channel's own green, because they are WhatsApp's audience
 *   messages     the information blue every "sent" figure uses
 *   delivery     success, the ramp that means it arrived
 *   replies      the brand's violet, the conversational half of the pair
 *   automations  indigo, matching the flow tiles further down this same page
 */
const TILES = {
  contacts: { soft: theme.soft, text: theme.text },
  messages: { soft: "bg-info-soft", text: "text-info-text" },
  delivery: { soft: "bg-success-soft", text: "text-success-text" },
  replies: { soft: "bg-primary-subtle", text: "text-secondary" },
  automation: { soft: "bg-primary-soft", text: "text-primary" },
};

const WA_CAMPAIGNS = CAMPAIGNS.filter((campaign) => campaign.channel === "whatsapp");
const TOTALS = whatsappTotals(WA_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Total Contacts",
    value: formatCount(WA_OVERVIEW_TOTALS.contacts),
    changePercent: WA_OVERVIEW_TOTALS.contactsChange,
    icon: Users,
    accent: TILES.contacts,
    hint: `${formatPercent(WA_OVERVIEW_TOTALS.optInRate)} opted in`,
  },
  {
    label: "Messages Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 18.2,
    icon: Send,
    accent: TILES.messages,
    hint: "vs last 30 days",
  },
  {
    label: "Delivery Rate",
    value: formatPercent(rate(TOTALS.delivered, TOTALS.sent)),
    changePercent: 0.6,
    icon: CheckCheck,
    accent: TILES.delivery,
    hint: `${formatNumber(TOTALS.failed)} failed`,
  },
  {
    label: "Reply Rate",
    value: formatPercent(rate(TOTALS.replies, TOTALS.delivered)),
    changePercent: 6.4,
    icon: MessageSquare,
    accent: TILES.replies,
    hint: `avg reply in ${WA_OVERVIEW_TOTALS.avgResponseMinutes}m`,
  },
  {
    label: "Active Automations",
    value: formatCount(WA_OVERVIEW_TOTALS.activeAutomations),
    changePercent: WA_OVERVIEW_TOTALS.automationsChange,
    icon: Workflow,
    accent: TILES.automation,
    hint: "running now",
  },
];

type MessageView = "volume" | "rates";

/** The five largest sends — a campaign comparison needs comparable volumes. */
const TOP_FIVE = [...WA_CAMPAIGNS]
  .filter((campaign) => campaign.sent > 0)
  .sort((a, b) => b.sent - a.sent)
  .slice(0, 5);

const WA_FLOWS = AUTOMATION_FLOWS.filter((flow) => flow.channel === "whatsapp");

export function WhatsAppOverview() {
  const [view, setView] = useState<MessageView>("volume");

  const conversations = [...CONVERSATIONS]
    .sort(
      (a, b) =>
        new Date(b.contact.lastActivityAt).getTime() -
        new Date(a.contact.lastActivityAt).getTime(),
    )
    .slice(0, 5);

  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={5} />

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Message Performance"
          description={
            view === "volume"
              ? "Sent, delivered and read over the last four weeks."
              : "Delivery, read and reply rates. Each is a share of the step before it."
          }
          className="xl:col-span-2"
          action={
            <SegmentedControl
              label="Message metric"
              value={view}
              onChange={setView}
              options={[
                { value: "volume", label: "Volume" },
                { value: "rates", label: "Rates" },
              ]}
            />
          }
          legend={
            view === "volume"
              ? [
                  { label: "Sent", swatch: "bg-primary", value: formatNumber(WA_SERIES.sent.at(-1) ?? 0) },
                  { label: "Delivered", swatch: "bg-primary-light", value: formatNumber(WA_SERIES.delivered.at(-1) ?? 0) },
                  { label: "Read", swatch: "bg-accent", value: formatNumber(WA_SERIES.read.at(-1) ?? 0) },
                ]
              : [
                  { label: "Delivery rate", swatch: "bg-primary" },
                  { label: "Read rate", swatch: "bg-primary-light" },
                  { label: "Reply rate", swatch: "bg-accent" },
                ]
          }
        >
          {view === "volume" ? (
            <TrendChart
              categories={WA_DAY_LABELS}
              series={[
                { name: "Sent", data: WA_SERIES.sent },
                { name: "Delivered", data: WA_SERIES.delivered },
                { name: "Read", data: WA_SERIES.read },
              ]}
              colors={CHANNEL_SERIES.whatsapp}
              unit="messages"
            />
          ) : (
            <TrendChart
              categories={WA_DAY_LABELS}
              series={[
                {
                  name: "Delivery rate",
                  data: rateSeries(WA_SERIES.delivered, WA_SERIES.sent),
                },
                {
                  name: "Read rate",
                  data: rateSeries(WA_SERIES.read, WA_SERIES.delivered),
                },
                {
                  name: "Reply rate",
                  data: rateSeries(WA_SERIES.replied, WA_SERIES.delivered),
                },
              ]}
              colors={CHANNEL_SERIES.whatsapp}
              variant="line"
              format="percent"
              yAxisMax={100}
            />
          )}
        </ChartCard>

        <PanelCard
          title="Delivery Breakdown"
          description="Where the last 30 days of messages ended up."
          action={
            <InfoHint content="Each rate is a share of the step above it, not of the total sent — a read rate is of delivered messages." />
          }
        >
          <div className="space-y-4">
            <MeterRow
              label="Delivered"
              value={rate(TOTALS.delivered, TOTALS.sent)}
              display={formatPercent(rate(TOTALS.delivered, TOTALS.sent))}
              tone="bg-primary"
              hint={`${formatNumber(TOTALS.delivered)} of ${formatNumber(TOTALS.sent)} sent`}
            />
            <MeterRow
              label="Read"
              value={rate(TOTALS.read, TOTALS.delivered)}
              display={formatPercent(rate(TOTALS.read, TOTALS.delivered))}
              tone="bg-primary-light"
              hint={`${formatNumber(TOTALS.read)} of delivered`}
            />
            <MeterRow
              label="Replied"
              value={rate(TOTALS.replies, TOTALS.delivered)}
              display={formatPercent(rate(TOTALS.replies, TOTALS.delivered))}
              tone="bg-accent"
              hint={`${formatNumber(TOTALS.replies)} conversations started`}
            />
            <MeterRow
              label="Failed"
              value={rate(TOTALS.failed, TOTALS.sent)}
              display={formatPercent(rate(TOTALS.failed, TOTALS.sent))}
              tone="bg-error"
              hint={`${formatNumber(TOTALS.failed)} undelivered`}
            />
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-semibold tracking-[0.08em] text-text-secondary uppercase">
              Campaign funnel
            </p>
            <FunnelStrip stages={WA_FUNNEL.slice(1)} className="mt-3" />
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Conversation Volume"
          description="Threads opened by a contact, and threads we opened."
          legend={[
            {
              label: "Inbound",
              swatch: "bg-primary",
              value: formatNumber(WA_CONVERSATION_VOLUME.inbound.at(-1) ?? 0),
            },
            {
              label: "Outbound",
              swatch: "bg-border-strong",
              value: formatNumber(WA_CONVERSATION_VOLUME.outbound.at(-1) ?? 0),
            },
          ]}
        >
          <TrendChart
            categories={WA_DAY_LABELS}
            series={[
              { name: "Inbound", data: WA_CONVERSATION_VOLUME.inbound },
              { name: "Outbound", data: WA_CONVERSATION_VOLUME.outbound },
            ]}
            colors={[CHANNEL_SERIES.whatsapp[0], OUTCOME_COLORS.neutral]}
            height={260}
            unit="threads"
          />
        </ChartCard>

        <ChartCard
          title="Campaign Performance"
          description="Delivered, read and replies for the five largest sends."
          legend={[
            { label: "Delivered", swatch: "bg-primary" },
            { label: "Read", swatch: "bg-primary-light" },
            { label: "Replies", swatch: "bg-accent" },
          ]}
        >
          <BarsChart
            categories={TOP_FIVE.map((campaign) => campaign.name)}
            series={[
              { name: "Delivered", data: TOP_FIVE.map((c) => c.delivered) },
              { name: "Read", data: TOP_FIVE.map((c) => c.opened) },
              { name: "Replies", data: TOP_FIVE.map((c) => c.replies) },
            ]}
            colors={CHANNEL_SERIES.whatsapp}
            horizontal
            height={260}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard
          title="Recent Conversations"
          description="The five most recently active threads."
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
          title="Automation Activity"
          description="What ran on its own in the last 30 days."
          action={
            <ButtonLink
              href={`${theme.base}/automations`}
              variant="ghost"
              size="sm"
            >
              View all
            </ButtonLink>
          }
        >
          {/* Same three-part row as the conversations panel beside it — tile,
              thread of text, right-aligned figures — so two lists sitting side
              by side read as one page rather than two components. */}
          <ul className="divide-y divide-border">
            {WA_FLOWS.map((flow) => (
              <li
                key={flow.id}
                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-btn",
                    TILES.automation.soft,
                    TILES.automation.text,
                  )}
                >
                  <Workflow className="size-4.5" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {flow.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {flow.triggerLabel} · active{" "}
                    {formatRelativeTime(flow.lastActivityAt)}
                  </p>
                </div>

                {/* The count is the figure; the rate annotates it. Giving both
                    the same size left the row with two numbers and no reading
                    order, so the count steps up and the rate drops to the
                    metadata step under it. */}
                <div className="shrink-0 text-right">
                  <p className="text-base leading-none font-bold text-text-primary tabular-nums">
                    {formatNumber(flow.contactsProcessed)}
                  </p>
                  <p className="mt-1 text-meta font-medium text-text-secondary tabular-nums">
                    {formatPercent(flow.successRate)} success
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
            <MiniStat
              label="In flow"
              value={formatNumber(
                Math.round(
                  WA_FLOWS.reduce((sum, flow) => sum + flow.contactsProcessed, 0) *
                    0.064,
                ),
              )}
              hint="waiting"
            />
            <MiniStat
              label="Opt-in rate"
              value={formatPercent(WA_OVERVIEW_TOTALS.optInRate)}
            />
            <MiniStat
              label="Avg reply"
              value={`${WA_OVERVIEW_TOTALS.avgResponseMinutes}m`}
              hint="first response"
            />
          </div>
        </PanelCard>
      </div>
    </>
  );
}
