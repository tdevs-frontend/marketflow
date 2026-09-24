"use client";

import { useState } from "react";
import { CheckCheck, MessageSquare, Send } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_SERIES } from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_THEME } from "@/constants/channels";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import {
  WA_DAY_LABELS,
  WA_INBOX_SNAPSHOT,
  WA_SERIES,
  WA_TEMPLATE_PERFORMANCE,
  whatsappTotals,
} from "@/lib/whatsapp-fixtures";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";

/**
 * WhatsApp analytics - the channel's own operational performance, and nothing
 * else's.
 *
 * Four things in order: what was sent and how much landed (the KPI row), how
 * that moved (one trend), which templates earn their slot, and who worked the
 * inbox.
 *
 * It was nine panels and a toolbar. What came out and why:
 *
 * - Campaign Comparison ranked WhatsApp campaigns on read and reply rate. That
 *   is a *campaign* reading, and the Campaigns page owns the list while the
 *   Marketing overview owns the cross-channel view.
 * - Conversation Volume plotted inbound against outbound threads, which is the
 *   same trend the one chart above it now carries.
 * - Response Time and Response Time Distribution both answered "how fast is
 *   the inbox" for the channel as a whole. Agent Performance answers it per
 *   person, which is the reading a team lead can act on, and it is the only
 *   one left.
 * - The Conversation Funnel drew the message pipeline from Sent to Converted.
 *   Its first two stages are the KPI row's Delivered and Delivery Rate, and
 *   the Marketing overview carries a cross-channel funnel of its own.
 * - A delivery/read/reply rate switcher drew a third view of the KPI row's own
 *   two rates.
 * - Customer Engagement Insights and Top Segments were audience analysis; the
 *   Customers module owns that.
 * - The page-level toolbar - a date-range picker, an audience select and an
 *   export button - sat above a chart that already carried its own window
 *   control, and was wired to none of the other panels.
 *
 * Nothing here reports revenue, sales or audience growth: Commerce, Sales and
 * Customers own those, and a WhatsApp page restating them is how a merchant
 * ends up unsure which figure is real.
 *
 * The split with the module's Overview is by *what kind of fact*, not by
 * subject: a rate, a trend or a ranking over a period belongs here; something
 * waiting to be done belongs there. The agent roster appears on both and is
 * the same seven people from one fixture - Overview shows `open`, the queue
 * right now, and this shows `handled`, the period's total.
 */

const theme = CHANNEL_THEME.whatsapp;
const ACCENT = { soft: theme.soft, text: theme.text };

const WA_CAMPAIGNS = CAMPAIGNS.filter((campaign) => campaign.channel === "whatsapp");
const TOTALS = whatsappTotals(WA_CAMPAIGNS);

/**
 * Four headline figures: two counts and the two rates they make.
 *
 * Down from six. Read went with the read-rate view below it - a blue tick is a
 * delivery fact, not an engagement one, and it sat between Delivered and
 * Replies hiding the funnel's one real drop. Failed and Opt-outs went because
 * neither is a performance reading: a failure is a number problem and an
 * opt-out is a consent event, and both are already visible where they can be
 * acted on - the connection strip on Overview and the contact list.
 *
 * The two rates are derived from the two counts beside them rather than
 * stated, so a card can never disagree with the card next to it.
 */
const STATS: StatItem[] = [
  {
    label: "Messages Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 18.2,
    icon: Send,
    hint: "vs previous period",
  },
  {
    label: "Delivered Messages",
    value: formatCount(TOTALS.delivered),
    changePercent: 17.6,
    icon: CheckCheck,
    hint: `${formatCount(TOTALS.failed)} failed`,
  },
  {
    label: "Delivery Rate",
    value: formatPercent(rate(TOTALS.delivered, TOTALS.sent)),
    changePercent: 0.6,
    icon: CheckCheck,
    hint: "of everything sent",
  },
  {
    label: "Reply Rate",
    value: formatPercent(rate(TOTALS.replies, TOTALS.delivered)),
    changePercent: 24.8,
    icon: MessageSquare,
    hint: `${formatCount(TOTALS.replies)} replies`,
  },
];

/**
 * The windows the engagement trend can be read over.
 *
 * `WA_SERIES` is ten points at three-day spacing, which is the 30-day view.
 * Seven days is its tail and ninety days is the whole run stretched - a real
 * API would return a different series per window; slicing one is what a
 * fixture can honestly do, and the point counts differ so the three views
 * never look like the same chart relabelled.
 */
type TrendWindow = "7d" | "30d" | "90d";

const TREND_WINDOWS: { value: TrendWindow; label: string; points: number }[] = [
  { value: "7d", label: "7 days", points: 3 },
  { value: "30d", label: "30 days", points: 10 },
  { value: "90d", label: "90 days", points: 10 },
];

/* -------------------------------------------------------------------------- */
/* Agents and engagement                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The roster, best resolution rate first.
 *
 * Ranked on resolution rather than on volume: the agent who handled the most
 * threads is usually the one who was rostered the most hours, which says
 * nothing about how well the queue was served. Volume is still the second
 * column, because a 96% rate over 1,284 threads and a 96% rate over 352 are
 * different kinds of good.
 */
const AGENT_ROWS = [...WA_INBOX_SNAPSHOT.agents].sort(
  (a, b) => b.resolutionRate - a.resolutionRate,
);

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORY_TONE: Record<string, BadgeVariant> = {
  marketing: "primary",
  utility: "info",
  authentication: "default",
};

/** Best reply rate first - the column the table exists to rank by. */
const TEMPLATE_ROWS = [...WA_TEMPLATE_PERFORMANCE].sort(
  (a, b) => rate(b.replies, b.delivered) - rate(a.replies, a.delivered),
);

export function WhatsAppAnalytics({ range }: { range?: TrendWindow } = {}) {
  /*
   * The window the trend opens on, seeded by the caller.
   *
   * This page carried its own toolbar - a date-range picker, an audience
   * select and an export button - sitting above a page that already had a
   * window control on the chart the window actually applies to. Two date
   * controls on one screen is one too many, and the page-level one was the
   * wrong place: the KPI row, the funnel and the two tables all read whole
   * period totals that no picker was wired to.
   *
   * `range` is the seam for the centralised filter. When a dashboard-level or
   * card-level control exists it passes the selection in here and the trend
   * opens on it; until then the chart's own control is the only thing driving
   * it, and the default holds. Nothing passes `range` yet - it is deliberately
   * optional so wiring it later is one prop rather than a refactor.
   */
  const [trendWindow, setTrendWindow] = useState<TrendWindow>(range ?? "30d");


  /*
   * The trend's series, sliced to the chosen window.
   *
   * Taken from the *tail* of each series rather than the head - a seven-day
   * view should be the last seven days, not the first three points of a
   * thirty-day run.
   */
  const trend = (() => {
    const points =
      TREND_WINDOWS.find((item) => item.value === trendWindow)?.points ?? 10;
    const tail = <T,>(values: T[]) => values.slice(-points);

    return {
      labels: tail(WA_DAY_LABELS),
      sent: tail(WA_SERIES.sent),
      replied: tail(WA_SERIES.replied),
      conversions: tail(WA_SERIES.conversions),
    };
  })();

  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={4} />

      <ChartCard
        title="Engagement Trend"
        description="Messages out, replies back and orders placed, across the window."
        action={
          <SegmentedControl
            label="Trend window"
            size="sm"
            options={TREND_WINDOWS.map(({ value, label }) => ({ value, label }))}
            value={trendWindow}
            onChange={setTrendWindow}
          />
        }
        /*
         * Swatches come from the channel ramp, not the brand ramp.
         *
         * Every legend on this page named an indigo that no chart on it draws:
         * `bg-primary` is #4f46e5, and these lines are #059669 and #34d399. A
         * legend whose colour does not match its series is worse than no
         * legend - it is a key that mislabels the thing it is keying.
         */
        legend={[
          { label: "Messages", swatch: "bg-whatsapp" },
          { label: "Replies", swatch: "bg-whatsapp-bright" },
          { label: "Conversions", swatch: "bg-chart-neutral-strong" },
        ]}
      >
        {/*
         * Three lines, not a stacked delivery breakdown.
         *
         * This card used to stack read, delivered-unread and failed to the
         * total sent - which is the delivery story, and the delivery story was
         * already the KPI row's Delivery Rate and the funnel's first two
         * stages. Three separate panels answering it left the page with no
         * chart of what the channel actually produced.
         *
         * Lines rather than bars because the three series are orders of
         * magnitude apart - 35,200 messages against 597 conversions - and
         * stacked bars would bury the bottom two inside the axis. A line keeps
         * the shape of a small series readable next to a large one.
         */}
        <TrendChart
          categories={trend.labels}
          series={[
            { name: "Messages", data: trend.sent },
            { name: "Replies", data: trend.replied },
            { name: "Conversions", data: trend.conversions },
          ]}
          colors={CHANNEL_SERIES.whatsapp}
          variant="line"
          unit="messages"
        />
      </ChartCard>
      <PanelCard
        title="Template Performance"
        description="Every template that sent in the period, best reply rate first."
      >
          <Table minWidth="34rem">
            <THead>
              <TH>Template</TH>
              <TH align="right">Sent</TH>
              <TH align="right">Delivery rate</TH>
              <TH align="right">Replies</TH>
              <TH align="right">Reply rate</TH>
              <TH align="right">Conversions</TH>
            </THead>
            <TBody>
              {TEMPLATE_ROWS.map((template) => (
                <TR key={template.id}>
                  <TD>
                    <div className="flex min-w-0 items-center gap-2.5">
                      {/* Monospace, because a template name is an identifier
                          the merchant types into the API, not prose. Semibold
                          because it is the row's subject and every figure to
                          its right is an attribute of it. */}
                      <span className="truncate font-mono text-sm font-semibold text-text-primary">
                        {template.name}
                      </span>
                      <Badge
                        variant={CATEGORY_TONE[template.category] ?? "neutral"}
                        size="sm"
                        className="shrink-0"
                      >
                        {template.category}
                      </Badge>
                    </div>
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatNumber(template.sent)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatPercent(rate(template.delivered, template.sent))}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatNumber(template.replies)}
                  </TD>
                  {/*
                   * The column the table is sorted by, so it carries the weight
                   * - and the channel's green, because a reply is the outcome
                   * this whole module exists to produce. The one coloured
                   * column in the table; the rest stay on the neutral ramp so
                   * the green means something.
                   */}
                  <TD
                    align="right"
                    className="text-whatsapp-dark tabular-nums"
                  >
                    {formatPercent(rate(template.replies, template.delivered))}
                  </TD>
                  {/* A count, not a rate. An authentication template converts
                      nothing by design, and 0.0% reads as a failure where "-"
                      reads as "not what this template is for". */}
                  <TD align="right" className="tabular-nums">
                    {template.conversions === 0 ? (
                      <span className="text-text-muted">-</span>
                    ) : (
                      formatNumber(template.conversions)
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
      </PanelCard>

      {/*
        Inbox performance: who handled the queue, and how well.

        This is now the only place response time is reported. A Response Time
        trend and a Response Time Distribution used to sit above it, which made
        three panels answering "how fast is the inbox" on one page - and the
        two charts answered it for the channel as a whole, where only the per
        agent reading tells a team lead who needs help.

        The roster is `WA_INBOX_SNAPSHOT.agents` - the same seven the Overview's
        Agent Load panel draws - so the two pages can never name a different
        team. What differs is the window: `open` is the queue right now and
        `handled` is the period, which is why Overview shows one and this shows
        the other.
      */}
      <PanelCard
        title="Agent Performance"
        description="Conversations handled over the period, best resolution rate first."
      >
        <Table minWidth="34rem">
          <THead>
            <TH>Agent</TH>
            <TH align="right">Handled</TH>
            <TH align="right">Open now</TH>
            <TH align="right">Avg response</TH>
            <TH align="right">Resolution rate</TH>
          </THead>
          <TBody>
            {AGENT_ROWS.map((agent) => (
              <TR key={agent.name}>
                <TD className="text-text-primary">{agent.name}</TD>
                <TD align="right" className="tabular-nums">
                  {formatNumber(agent.handled)}
                </TD>
                <TD align="right" className="tabular-nums">
                  {formatNumber(agent.open)}
                </TD>
                {/* Minutes, where down is the good direction - the one column
                    here a reader should want to see fall. */}
                <TD align="right" className="tabular-nums">
                  {agent.avgResponseMinutes}m
                </TD>
                <TD
                  align="right"
                  className="text-whatsapp-dark tabular-nums"
                >
                  {formatPercent(agent.resolutionRate)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </PanelCard>
    </>
  );
}
