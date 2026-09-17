"use client";

import { useState } from "react";
import {
  CheckCheck,
  Download,
  MessageSquare,
  Send,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { DateRangePicker, DEFAULT_RANGE, type DateRangeValue } from "@/components/ui/date-range";
import { MeterRow } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, MiniStat, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import {
  CHANNEL_SERIES,
  OUTCOME_COLORS,
  RATE_COLORS,
} from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES, CAMPAIGNS } from "@/lib/marketing-fixtures";
import {
  WA_ACTIVE_HOURS,
  WA_AUDIENCE_INSIGHTS,
  WA_CONVERSATION_VOLUME,
  WA_DAY_LABELS,
  WA_ENGAGEMENT_BEHAVIOUR,
  WA_FUNNEL,
  WA_INBOX_SNAPSHOT,
  WA_RESPONSE_TIME,
  WA_SERIES,
  WA_TEMPLATE_PERFORMANCE,
  rateSeries,
  whatsappTotals,
} from "@/lib/whatsapp-fixtures";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";
import { ConversionFunnel } from "../shared/conversion-funnel";

/**
 * WhatsApp analytics — the channel's own performance page, and nothing else's.
 *
 * Six things in order: what was sent and how much of it landed, the trend
 * behind that, the funnel from a message to an order, how fast the inbox
 * answered and who answered it, which templates earn their slot, and how
 * customers behave once a thread is open.
 *
 * Campaign Comparison is gone. It ranked WhatsApp campaigns on read and reply
 * rate, which is a *campaign* reading rather than a *channel* one — the
 * Campaigns page owns the list and the Marketing overview owns the
 * cross-channel comparison, so this page was the third place to rank the same
 * six campaigns. Nothing on it now reports revenue, sales or audience growth
 * either; Commerce, Sales and the Customers module own those, and a WhatsApp
 * page restating them is how a merchant ends up unsure which figure is real.
 *
 * The split with the module's Overview is by *what kind of fact*, not by
 * subject: a rate, a trend or a ranking over a period belongs here; something
 * waiting to be done belongs there. The agent roster appears on both and is
 * the same seven people from one fixture — Overview shows `open`, the queue
 * right now, and this shows `handled`, the period's total.
 */

const theme = CHANNEL_THEME.whatsapp;
const ACCENT = { soft: theme.soft, text: theme.text };

const WA_CAMPAIGNS = CAMPAIGNS.filter((campaign) => campaign.channel === "whatsapp");
const TOTALS = whatsappTotals(WA_CAMPAIGNS);

/**
 * Four headline figures: two counts and the two rates they make.
 *
 * Down from six. Read went with the read-rate view below it — a blue tick is a
 * delivery fact, not an engagement one, and it sat between Delivered and
 * Replies hiding the funnel's one real drop. Failed and Opt-outs went because
 * neither is a performance reading: a failure is a number problem and an
 * opt-out is a consent event, and both are already visible where they can be
 * acted on — the connection strip on Overview and the contact list.
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
 * Seven days is its tail and ninety days is the whole run stretched — a real
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

type RateMetric = "delivery" | "read" | "reply";

const RATE_META: Record<
  RateMetric,
  { label: string; description: string; part: number[]; total: number[]; hex: string }
> = {
  delivery: {
    label: "Delivery rate",
    description: "Delivered as a share of sent. A dip here is a number problem.",
    part: WA_SERIES.delivered,
    total: WA_SERIES.sent,
    hex: CHANNEL_SERIES.whatsapp[0],
  },
  read: {
    label: "Read rate",
    description: "Read as a share of delivered. A dip here is a content problem.",
    part: WA_SERIES.read,
    total: WA_SERIES.delivered,
    hex: CHANNEL_SERIES.whatsapp[1],
  },
  reply: {
    label: "Reply rate",
    description: "Replies as a share of delivered. This is the one that predicts revenue.",
    part: WA_SERIES.replied,
    total: WA_SERIES.delivered,
    hex: CHANNEL_SERIES.whatsapp[2],
  },
};

/* -------------------------------------------------------------------------- */
/* Response time                                                              */
/* -------------------------------------------------------------------------- */

const RESPONSE_TOTAL = WA_RESPONSE_TIME.buckets.reduce(
  (sum, bucket) => sum + bucket.count,
  0,
);

/**
 * The first three buckets are the ones inside the 15-minute target.
 *
 * Derived from the bucket list rather than stored beside it: a stored
 * "within target" figure and a bucket breakdown are two statements of one
 * fact, and the stored one is the one that goes stale when a bucket moves.
 */
const WITHIN_TARGET = WA_RESPONSE_TIME.buckets
  .slice(0, 3)
  .reduce((sum, bucket) => sum + bucket.count, 0);

/**
 * A ramp, not a palette. The buckets are one population sorted by how long it
 * waited, so the colour walks from the channel's own green through amber to
 * red at the tail — the only rows a team acts on.
 */
const BUCKET_TONES = [
  "bg-whatsapp-dark",
  "bg-whatsapp",
  "bg-whatsapp-bright",
  "bg-warning",
  "bg-warning",
  "bg-error",
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

/** The busiest two-hour bucket, named in the panel's description. */
const PEAK_HOUR = (() => {
  const peak = WA_ACTIVE_HOURS.messages.reduce(
    (best, value, index) =>
      value > WA_ACTIVE_HOURS.messages[best] ? index : best,
    0,
  );
  return { label: WA_ACTIVE_HOURS.labels[peak] };
})();

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORY_TONE: Record<string, BadgeTone> = {
  marketing: "brand",
  utility: "info",
  authentication: "neutral",
};

/** Best reply rate first — the column the table exists to rank by. */
const TEMPLATE_ROWS = [...WA_TEMPLATE_PERFORMANCE].sort(
  (a, b) => rate(b.replies, b.delivered) - rate(a.replies, a.delivered),
);

export function WhatsAppAnalytics() {
  const toast = useToast();
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
  const [audience, setAudience] = useState("all");
  const [metric, setMetric] = useState<RateMetric>("read");
  const [trendWindow, setTrendWindow] = useState<TrendWindow>("30d");

  const meta = RATE_META[metric];

  /*
   * The trend's series, sliced to the chosen window.
   *
   * Taken from the *tail* of each series rather than the head — a seven-day
   * view should be the last seven days, not the first three points of a
   * thirty-day run.
   */
  const trend = (() => {
    const points =
      TREND_WINDOWS.find((item) => item.value === trendWindow)?.points ?? 10;
    const tail = <T,>(values: T[]) => values.slice(-points);

    return {
      labels: tail(WA_DAY_LABELS),
      read: tail(WA_SERIES.read),
      delivered: tail(WA_SERIES.delivered),
      failed: tail(WA_SERIES.failed),
    };
  })();

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker value={range} onChange={setRange} />

          <Select
            label="Filter by audience"
            size="sm"
            value={audience}
            onChange={setAudience}
            options={[
              { value: "all", label: "All audiences" },
              ...AUDIENCES.map((item) => ({ value: item.value, label: item.label })),
            ]}
            className="w-full lg:w-44"
          />

          <Button
            variant="outline"
            size="compact"
            onClick={() => toast("Report queued — we will email the CSV when it is ready")}
            className="lg:ml-auto"
          >
            <Download aria-hidden />
            Export
          </Button>
        </div>
      </Card>

      <StatsGrid items={STATS} accent={ACCENT} columns={4} />

      <ChartCard
        title="Message Engagement Trend"
        description="Every outcome across the window, stacked to the total sent."
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
         * `bg-primary` is #4f46e5, and these bars are #34d399 and #059669. A
         * legend whose colour does not match its series is worse than no
         * legend — it is a key that mislabels the thing it is keying.
         */
        legend={[
          { label: "Read", swatch: "bg-whatsapp-bright" },
          { label: "Delivered, unread", swatch: "bg-whatsapp" },
          { label: "Failed", swatch: "bg-error" },
        ]}
      >
        <BarsChart
          categories={trend.labels}
          series={[
            { name: "Read", data: trend.read },
            {
              name: "Delivered, unread",
              /* Delivered minus read, so the stack sums to delivered rather
                 than double-counting the read messages inside it. */
              data: trend.delivered.map(
                (value, index) => value - trend.read[index],
              ),
            },
            { name: "Failed", data: trend.failed },
          ]}
          colors={[
            OUTCOME_COLORS.succeeded,
            OUTCOME_COLORS.partial,
            OUTCOME_COLORS.failed,
          ]}
          stacked
          unit="messages"
        />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title={meta.label}
          description={meta.description}
          className="xl:col-span-2"
          action={
            <SegmentedControl
              label="Rate metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "delivery", label: "Delivery" },
                { value: "read", label: "Read" },
                { value: "reply", label: "Reply" },
              ]}
            />
          }
        >
          <TrendChart
            categories={WA_DAY_LABELS}
            series={[{ name: meta.label, data: rateSeries(meta.part, meta.total) }]}
            colors={[meta.hex]}
            format="percent"
            yAxisMax={100}
          />
        </ChartCard>

        <PanelCard
          title="Conversation Funnel"
          description="Sent through to an order, over the period."
        >
          <ConversionFunnel stages={WA_FUNNEL} />
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/*
         * Conversation volume moved here from the Overview.
         *
         * It is a four-week trend, which made it the odd panel out on a page
         * about what is waiting in the queue — and it belongs beside response
         * time, because the two together are the whole story of the inbox:
         * how much came in, and how fast it was answered.
         */}
        <ChartCard
          title="Conversation Volume"
          description="Threads opened by a contact, and threads we opened."
          legend={[
            {
              label: "Inbound",
              swatch: "bg-whatsapp",
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
          title="Response Time"
          description="How long a contact waits for the first human reply."
          legend={[
            {
              label: "Median",
              swatch: theme.accent,
              value: `${WA_RESPONSE_TIME.medianMinutes}m`,
            },
            {
              label: "90th percentile",
              swatch: "bg-warning",
              value: `${WA_RESPONSE_TIME.p90Minutes}m`,
            },
          ]}
        >
          {/*
           * Median and p90, not a mean. One thread left overnight drags an
           * average past every number a team would recognise, and the gap
           * between these two lines is the finding: the middle of the queue is
           * fast, the tail is where a customer gives up.
           */}
          <TrendChart
            categories={WA_DAY_LABELS}
            series={[
              { name: "Median", data: [...WA_RESPONSE_TIME.median] },
              { name: "90th percentile", data: [...WA_RESPONSE_TIME.p90] },
            ]}
            colors={[CHANNEL_SERIES.whatsapp[0], RATE_COLORS.warn]}
            variant="line"
            height={260}
            unit="min"
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Response Time Distribution"
          description={`Every first reply in the period, against the ${WA_RESPONSE_TIME.targetMinutes}-minute target.`}
        >
          <div className="space-y-4">
            {WA_RESPONSE_TIME.buckets.map((bucket, index) => (
              <MeterRow
                key={bucket.label}
                label={bucket.label}
                value={rate(bucket.count, RESPONSE_TOTAL)}
                display={formatPercent(rate(bucket.count, RESPONSE_TOTAL))}
                tone={BUCKET_TONES[index]}
                hint={`${formatNumber(bucket.count)} replies`}
              />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
            <MiniStat
              label="Median"
              value={`${WA_RESPONSE_TIME.medianMinutes}m`}
            />
            <MiniStat label="90th pct" value={`${WA_RESPONSE_TIME.p90Minutes}m`} />
            <MiniStat
              label="On target"
              value={formatPercent(rate(WITHIN_TARGET, RESPONSE_TOTAL))}
              hint={`under ${WA_RESPONSE_TIME.targetMinutes}m`}
            />
          </div>
        </PanelCard>

        <PanelCard
          title="Template Performance"
          description="Every template that sent in the period, best reply rate first."
          className="xl:col-span-2"
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
                        tone={CATEGORY_TONE[template.category] ?? "neutral"}
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
                   * — and the channel's green, because a reply is the outcome
                   * this whole module exists to produce. The one coloured
                   * column in the table; the rest stay on the neutral ramp so
                   * the green means something.
                   */}
                  <TD
                    align="right"
                    className="font-bold text-whatsapp-dark tabular-nums"
                  >
                    {formatPercent(rate(template.replies, template.delivered))}
                  </TD>
                  {/* A count, not a rate. An authentication template converts
                      nothing by design, and 0.0% reads as a failure where "—"
                      reads as "not what this template is for". */}
                  <TD align="right" className="tabular-nums">
                    {template.conversions === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      formatNumber(template.conversions)
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </PanelCard>
      </div>
      {/*
        Inbox performance: who handled the queue, and how well.

        The response-time panels above report the channel's speed as one
        number; this reports it per agent, which is the reading a team lead
        acts on. The roster is `WA_INBOX_SNAPSHOT.agents` — the same seven the
        Overview's Agent Load panel draws — so the two pages can never name a
        different team. What differs is the window: `open` is the queue right
        now and `handled` is the period, which is why Overview shows one and
        this shows the other.
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
                <TD className="font-semibold text-text-primary">{agent.name}</TD>
                <TD align="right" className="tabular-nums">
                  {formatNumber(agent.handled)}
                </TD>
                <TD align="right" className="tabular-nums">
                  {formatNumber(agent.open)}
                </TD>
                {/* Minutes, where down is the good direction — the one column
                    here a reader should want to see fall. */}
                <TD align="right" className="tabular-nums">
                  {agent.avgResponseMinutes}m
                </TD>
                <TD
                  align="right"
                  className="font-bold text-whatsapp-dark tabular-nums"
                >
                  {formatPercent(agent.resolutionRate)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </PanelCard>

      <PanelCard
        title="Customer Engagement Insights"
        description="When customers message, which segments answer, and how they behave."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Active hours
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">
              Inbound messages by time of day. Peak is {PEAK_HOUR.label}.
            </p>
            <div className="-ml-2.5 mt-3">
              <BarsChart
                categories={[...WA_ACTIVE_HOURS.labels]}
                series={[
                  { name: "Messages", data: [...WA_ACTIVE_HOURS.messages] },
                ]}
                colors={[CHANNEL_SERIES.whatsapp[0]]}
                height={180}
                unit="messages"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary">
              Engagement behaviour
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">
              What a conversation looks like once it starts.
            </p>
            <dl className="mt-3 divide-y divide-border">
              {WA_ENGAGEMENT_BEHAVIOUR.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <dt className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {item.label}
                    </span>
                    <span className="block truncate text-sm text-text-muted">
                      {item.hint}
                    </span>
                  </dt>
                  <dd className="shrink-0 text-base font-bold text-text-primary tabular-nums">
                    {item.kind === "rate"
                      ? formatPercent(item.value)
                      : item.value.toFixed(1)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Top Segments"
        description="Reply rate by segment, and what it costs in opt-outs."
      >
        <Table minWidth="34rem">
          <THead>
            <TH>Segment</TH>
            <TH align="right">Contacts</TH>
            <TH align="right">Delivered</TH>
            <TH align="right">Read rate</TH>
            <TH align="right">Reply rate</TH>
            <TH align="right">Opt-out</TH>
          </THead>
          <TBody>
            {WA_AUDIENCE_INSIGHTS.map((row) => (
              <TR key={row.label}>
                {/* The row's subject, matching the template table beside it. */}
                <TD className="font-semibold text-text-primary">{row.label}</TD>
                <TD align="right" className="tabular-nums">
                  {formatNumber(row.contacts)}
                </TD>
                <TD align="right" className="tabular-nums">
                  {formatNumber(row.delivered)}
                </TD>
                <TD align="right" className="tabular-nums">
                  {formatPercent(row.readRate)}
                </TD>
                {/* Same metric as the template table, so the same green. It
                    reads against the opt-out column two cells over: what a
                    segment gives back, and what it costs to ask. */}
                <TD
                  align="right"
                  className="font-bold text-whatsapp-dark tabular-nums"
                >
                  {formatPercent(row.replyRate)}
                </TD>
                {/*
                 * The one column where a bigger number is worse, so it is the
                 * only one that changes colour: past 2% a segment is being
                 * messaged more than it wants.
                 */}
                <TD
                  align="right"
                  className={
                    row.optOutRate >= 2
                      ? "font-semibold text-error tabular-nums"
                      : "tabular-nums"
                  }
                >
                  {formatPercent(row.optOutRate)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </PanelCard>
    </>
  );
}
