"use client";

import { useState } from "react";
import {
  CheckCheck,
  Download,
  Eye,
  MessageSquare,
  Send,
  UserMinus,
  XCircle,
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
  channelPair,
} from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES, CAMPAIGNS } from "@/lib/marketing-fixtures";
import {
  WA_AUDIENCE_INSIGHTS,
  WA_CONVERSATION_VOLUME,
  WA_DAY_LABELS,
  WA_FUNNEL,
  WA_RESPONSE_TIME,
  WA_SERIES,
  WA_TEMPLATE_PERFORMANCE,
  rateSeries,
  whatsappTotals,
} from "@/lib/whatsapp-fixtures";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";
import { ConversionFunnel } from "../shared/conversion-funnel";
import { RankedList } from "../shared/ranked-list";

/**
 * WhatsApp analytics — the performance page.
 *
 * Six KPIs rather than the usual four, because the WhatsApp funnel has six
 * genuinely distinct outcomes and collapsing failed and opt-outs into "other"
 * hides the two that need acting on. Failures and opt-outs carry
 * `invertTrend`, so a rise in either shows red — the one place in the app
 * where growth is bad news.
 *
 * This page owns every trend in the module. Message performance, the delivery
 * breakdown, conversation volume and the campaign comparison used to be drawn
 * on the Overview as well, from these same fixtures; they are now here only,
 * and the Overview reports the state of the queue instead. The rule the split
 * follows: if the reading is a rate, a trend or a ranking over a period, it
 * belongs here; if it is something waiting to be done, it belongs there.
 */

const theme = CHANNEL_THEME.whatsapp;
const ACCENT = { soft: theme.soft, text: theme.text };

const WA_CAMPAIGNS = CAMPAIGNS.filter((campaign) => campaign.channel === "whatsapp");
const TOTALS = whatsappTotals(WA_CAMPAIGNS);
const OPT_OUTS = WA_SERIES.optOuts.reduce((sum, value) => sum + value, 0);

const STATS: StatItem[] = [
  {
    label: "Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 18.2,
    icon: Send,
    hint: "vs previous period",
  },
  {
    label: "Delivered",
    value: formatCount(TOTALS.delivered),
    changePercent: 17.6,
    icon: CheckCheck,
    hint: `${formatPercent(rate(TOTALS.delivered, TOTALS.sent))} of sent`,
  },
  {
    label: "Read",
    value: formatCount(TOTALS.read),
    changePercent: 21.4,
    icon: Eye,
    hint: `${formatPercent(rate(TOTALS.read, TOTALS.delivered))} of delivered`,
  },
  {
    label: "Replied",
    value: formatCount(TOTALS.replies),
    changePercent: 24.8,
    icon: MessageSquare,
    hint: `${formatPercent(rate(TOTALS.replies, TOTALS.delivered))} reply rate`,
  },
  {
    label: "Failed",
    value: formatCount(TOTALS.failed),
    changePercent: 3.2,
    icon: XCircle,
    hint: `${formatPercent(rate(TOTALS.failed, TOTALS.sent))} of sent`,
    invertTrend: true,
  },
  {
    label: "Opt-outs",
    value: formatCount(OPT_OUTS),
    changePercent: -8.4,
    icon: UserMinus,
    hint: "in the period",
    invertTrend: true,
  },
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

/** Campaigns with volume, best read rate first. */
const COMPARISON = [...WA_CAMPAIGNS]
  .filter((campaign) => campaign.delivered > 0)
  .sort((a, b) => rate(b.opened, b.delivered) - rate(a.opened, a.delivered))
  .slice(0, 6);

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
  "bg-primary",
  "bg-primary-light",
  "bg-accent",
  "bg-warning",
  "bg-warning",
  "bg-error",
];

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

  const meta = RATE_META[metric];

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

      <StatsGrid items={STATS} accent={ACCENT} columns={6} />

      <ChartCard
        title="Message Volume"
        description="Every outcome across the period, stacked to the total sent."
        legend={[
          { label: "Read", swatch: "bg-primary-light" },
          { label: "Delivered, unread", swatch: "bg-primary" },
          { label: "Failed", swatch: "bg-error" },
        ]}
      >
        <BarsChart
          categories={WA_DAY_LABELS}
          series={[
            { name: "Read", data: WA_SERIES.read },
            {
              name: "Delivered, unread",
              /* Delivered minus read, so the stack sums to delivered rather
                 than double-counting the read messages inside it. */
              data: WA_SERIES.delivered.map(
                (value, index) => value - WA_SERIES.read[index],
              ),
            },
            { name: "Failed", data: WA_SERIES.failed },
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
              <TH align="right">Delivered</TH>
              <TH align="right">Read rate</TH>
              <TH align="right">Reply rate</TH>
            </THead>
            <TBody>
              {TEMPLATE_ROWS.map((template) => (
                <TR key={template.id}>
                  <TD>
                    <div className="flex min-w-0 items-center gap-2.5">
                      {/* Monospace, because a template name is an identifier
                          the merchant types into the API, not prose. */}
                      <span className="truncate font-mono text-sm text-text-primary">
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
                    {formatNumber(template.delivered)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatPercent(rate(template.read, template.delivered))}
                  </TD>
                  {/* The column the table is sorted by, so it carries the
                      weight — everything else on the row is context for it. */}
                  <TD
                    align="right"
                    className="font-bold text-text-primary tabular-nums"
                  >
                    {formatPercent(rate(template.replies, template.delivered))}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </PanelCard>
      </div>

      <ChartCard
        title="Campaign Comparison"
        description="Read and reply rate side by side, best read rate first."
        legend={[
          { label: "Read rate", swatch: "bg-primary" },
          { label: "Reply rate", swatch: "bg-accent" },
        ]}
      >
        <BarsChart
          categories={COMPARISON.map((campaign) => campaign.name)}
          series={[
            {
              name: "Read rate",
              data: COMPARISON.map((c) => Number(rate(c.opened, c.delivered).toFixed(1))),
            },
            {
              name: "Reply rate",
              data: COMPARISON.map((c) => Number(rate(c.replies, c.delivered).toFixed(1))),
            },
          ]}
          colors={channelPair("whatsapp")}
          horizontal
          height={320}
          unit="%"
        />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Audience Insights"
          description="Reply rate by segment, and what it costs in opt-outs."
          className="xl:col-span-2"
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
                  <TD className="text-text-primary">{row.label}</TD>
                  <TD align="right" className="tabular-nums">
                    {formatNumber(row.contacts)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatNumber(row.delivered)}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatPercent(row.readRate)}
                  </TD>
                  <TD
                    align="right"
                    className="font-bold text-text-primary tabular-nums"
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

        <PanelCard
          title="Top Campaigns"
          description="By reply rate, among sends over 200."
        >
          <RankedList
            tone={theme.accent}
            items={WA_CAMPAIGNS.filter((campaign) => campaign.delivered > 200)
              .sort(
                (a, b) => rate(b.replies, b.delivered) - rate(a.replies, a.delivered),
              )
              .slice(0, 5)
              .map((campaign) => ({
                id: campaign.id,
                label: campaign.name,
                secondary: `${formatNumber(campaign.delivered)} delivered · ${formatNumber(campaign.replies)} replies`,
                display: formatPercent(rate(campaign.replies, campaign.delivered)),
                share: rate(campaign.replies, campaign.delivered),
              }))}
          />
        </PanelCard>
      </div>
    </>
  );
}
