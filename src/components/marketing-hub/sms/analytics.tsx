"use client";

import { useState } from "react";
import {
  CheckCheck,
  Download,
  MessageSquare,
  MousePointerClick,
  Send,
  UserMinus,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import {
  DateRangePicker,
  DEFAULT_RANGE,
  type DateRangeValue,
} from "@/components/ui/date-range";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MiniStat, StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import {
  CHANNEL_SERIES,
  RATE_COLORS,
  channelPair,
} from "@/components/dashboard/charts/chart-theme";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import {
  SMS_CAMPAIGNS,
  SMS_COST_BY_COUNTRY,
  SMS_DAY_LABELS,
  SMS_SERIES,
  SMS_TEMPLATES,
  smsTotals,
} from "@/lib/sms-fixtures";
import { formatCount, formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import { countSmsSegments } from "@/types/sms";
import { ConversionFunnel } from "../shared/conversion-funnel";
import { RankedList } from "../shared/ranked-list";

/**
 * SMS analytics.
 *
 * The report the other channels do not need is cost, and it is the one that
 * changes decisions here: a campaign with a 98% delivery rate and a $0.40
 * cost-per-reply is a worse campaign than one at 96% and $0.08. So spend gets
 * a KPI, a chart and a ranked list, and every efficiency figure is per
 * *delivered* rather than per sent — you pay for the send either way, but only
 * a delivery could have worked.
 */

const theme = CHANNEL_THEME.sms;
const ACCENT = { soft: theme.soft, text: theme.text };
const TOTALS = smsTotals(SMS_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Messages Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 11.4,
    icon: Send,
    hint: "vs previous period",
  },
  {
    label: "Delivered",
    value: formatCount(TOTALS.delivered),
    changePercent: 11.8,
    icon: CheckCheck,
    hint: `${formatPercent(rate(TOTALS.delivered, TOTALS.sent))} of sent`,
  },
  {
    label: "Delivery Rate",
    value: formatPercent(rate(TOTALS.delivered, TOTALS.sent)),
    changePercent: 0.4,
    icon: MousePointerClick,
    hint: "carrier-accepted",
  },
  {
    label: "Replies",
    value: formatCount(TOTALS.replies),
    changePercent: 18.6,
    icon: MessageSquare,
    hint: `${formatPercent(rate(TOTALS.replies, TOTALS.delivered))} of delivered`,
  },
  {
    label: "Failed",
    value: formatCount(TOTALS.failed),
    changePercent: -4.2,
    icon: XCircle,
    hint: `${formatCurrency(TOTALS.failed * 0.045)} wasted`,
    invertTrend: true,
  },
  {
    label: "Opt-outs",
    value: formatCount(TOTALS.optOuts),
    changePercent: -6.8,
    icon: UserMinus,
    hint: `${formatPercent(rate(TOTALS.optOuts, TOTALS.delivered))} of delivered`,
    invertTrend: true,
  },
];

const FUNNEL = [
  { label: "Sent", count: TOTALS.sent, hint: "Handed to the gateway" },
  { label: "Delivered", count: TOTALS.delivered, hint: "Carrier confirmed" },
  { label: "Clicked", count: TOTALS.clicks, hint: "Followed a short link" },
  { label: "Replied", count: TOTALS.replies, hint: "Sent something back" },
];

type RateMetric = "delivery" | "optOut";

const RATE_META: Record<
  RateMetric,
  { label: string; description: string; data: number[]; hex: string; max: number }
> = {
  delivery: {
    label: "Delivery rate",
    description: "Carrier-accepted as a share of sent. Dips are usually a bad number batch.",
    data: SMS_SERIES.deliveryRate,
    hex: CHANNEL_SERIES.sms[0],
    max: 100,
  },
  optOut: {
    label: "Opt-out rate",
    description: "STOP replies as a share of delivered. Above 1% and the list is being over-messaged.",
    data: SMS_SERIES.optOutRate,
    hex: RATE_COLORS.bad,
    max: 3,
  },
};

/** Campaigns with a delivery receipt — a draft has no rate to rank. */
const SENT = SMS_CAMPAIGNS.filter((campaign) => campaign.sent > 0);

const COMPARISON = [...SENT]
  .sort((a, b) => rate(b.replies, b.delivered) - rate(a.replies, a.delivered))
  .slice(0, 6);

/** Cost per reply — the efficiency measure this channel is judged on. */
const EFFICIENCY = SENT.filter((campaign) => campaign.replies > 0)
  .map((campaign) => ({
    campaign,
    costPerReply: campaign.cost / campaign.replies,
  }))
  .sort((a, b) => a.costPerReply - b.costPerReply);

export function SmsAnalytics() {
  const toast = useToast();
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
  const [audience, setAudience] = useState("all");
  const [metric, setMetric] = useState<RateMetric>("delivery");

  const meta = RATE_META[metric];
  const multipart = SMS_CAMPAIGNS.filter(
    (campaign) => countSmsSegments(campaign.message).segments > 1,
  );

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
        description="Delivered and failed, stacked to the total sent, with replies overlaid."
        legend={[
          { label: "Delivered", swatch: "bg-sms" },
          { label: "Failed", swatch: "bg-error" },
          { label: "Replies", swatch: "bg-accent" },
        ]}
      >
        <BarsChart
          categories={SMS_DAY_LABELS}
          series={[
            { name: "Delivered", data: SMS_SERIES.delivered },
            {
              name: "Failed",
              /* Sent minus delivered, so the stack sums to sent. */
              data: SMS_SERIES.sent.map(
                (value, index) => value - SMS_SERIES.delivered[index],
              ),
            },
            { name: "Replies", data: SMS_SERIES.replies },
          ]}
          colors={[
            CHANNEL_SERIES.sms[0],
            RATE_COLORS.bad,
            RATE_COLORS.warn,
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
                { value: "optOut", label: "Opt-out" },
              ]}
            />
          }
        >
          <TrendChart
            categories={SMS_DAY_LABELS}
            series={[{ name: meta.label, data: meta.data }]}
            colors={[meta.hex]}
            format="percent"
            yAxisMax={meta.max}
          />
        </ChartCard>

        <PanelCard
          title="Conversion Funnel"
          description="Sent through to a reply, over the period."
        >
          <ConversionFunnel stages={FUNNEL} />
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Spend by Destination"
          description="Per-segment rates differ by country, so volume and cost diverge."
          className="xl:col-span-2"
          legend={[{ label: "Spend", swatch: "bg-sms" }]}
        >
          <BarsChart
            categories={SMS_COST_BY_COUNTRY.map((item) => item.label)}
            series={[
              { name: "Spend", data: SMS_COST_BY_COUNTRY.map((item) => item.value) },
            ]}
            colors={[CHANNEL_SERIES.sms[0]]}
            horizontal
            height={240}
          />
        </ChartCard>

        <PanelCard
          title="Cost Efficiency"
          description="What a reply actually costs, campaign by campaign."
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              label="Per message"
              value={formatCurrency(TOTALS.cost / Math.max(TOTALS.sent, 1))}
              hint="blended rate"
            />
            <MiniStat
              label="Per reply"
              value={formatCurrency(TOTALS.cost / Math.max(TOTALS.replies, 1))}
              hint="all campaigns"
            />
          </div>

          <div className="mt-4">
            <RankedList
              tone={theme.accent}
              items={EFFICIENCY.slice(0, 4).map((row) => ({
                id: row.campaign.id,
                label: row.campaign.name,
                secondary: `${formatNumber(row.campaign.replies)} replies · ${formatCurrency(row.campaign.cost)} spent`,
                display: formatCurrency(row.costPerReply),
                /* Inverted: cheaper is better, so the bar shows efficiency
                   rather than raw cost. */
                share: 1 / Math.max(row.costPerReply, 0.001),
              }))}
            />
          </div>

          {multipart.length > 0 ? (
            <p className="mt-4 rounded-panel bg-warning-soft px-3 py-2.5 text-[11px] text-warning-text">
              {multipart.length} campaign{multipart.length === 1 ? "" : "s"} send as
              multiple segments and are billed per part. Trimming{" "}
              {multipart[0].name} to 160 characters would halve its cost.
            </p>
          ) : null}
        </PanelCard>
      </div>

      <ChartCard
        title="Campaign Comparison"
        description="Delivery and reply rate side by side, best reply rate first."
        legend={[
          { label: "Delivery rate", swatch: "bg-sms" },
          { label: "Reply rate", swatch: "bg-accent" },
        ]}
      >
        <BarsChart
          categories={COMPARISON.map((campaign) => campaign.name)}
          series={[
            {
              name: "Delivery rate",
              data: COMPARISON.map((c) => Number(rate(c.delivered, c.sent).toFixed(1))),
            },
            {
              name: "Reply rate",
              data: COMPARISON.map((c) => Number(rate(c.replies, c.delivered).toFixed(1))),
            },
          ]}
          colors={channelPair("sms")}
          horizontal
          height={320}
          unit="%"
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <PanelCard
          title="Top Campaigns"
          description="By reply rate, among campaigns already sent."
        >
          <RankedList
            tone={theme.accent}
            items={COMPARISON.slice(0, 5).map((campaign) => ({
              id: campaign.id,
              label: campaign.name,
              secondary: `${formatNumber(campaign.delivered)} delivered · ${formatNumber(campaign.replies)} replies`,
              display: formatPercent(rate(campaign.replies, campaign.delivered)),
              share: rate(campaign.replies, campaign.delivered),
            }))}
          />
        </PanelCard>

        <PanelCard
          title="Top Audiences"
          description="Reply rate by segment, across the period."
        >
          <RankedList
            tone="bg-accent"
            items={[...SENT]
              .reduce<typeof SENT>((unique, campaign) => {
                if (
                  unique.some((item) => item.audienceLabel === campaign.audienceLabel)
                ) {
                  return unique;
                }
                return [...unique, campaign];
              }, [])
              .filter((campaign) => campaign.delivered > 0)
              .sort((a, b) => rate(b.replies, b.delivered) - rate(a.replies, a.delivered))
              .slice(0, 5)
              .map((campaign) => ({
                id: campaign.id,
                label: campaign.audienceLabel,
                secondary:
                  campaign.audienceSize === 0
                    ? "Transactional"
                    : `${formatNumber(campaign.audienceSize)} contacts`,
                display: formatPercent(rate(campaign.replies, campaign.delivered)),
                share: rate(campaign.replies, campaign.delivered),
              }))}
          />
        </PanelCard>

        <PanelCard
          title="Best Templates"
          description="By delivery rate. Single-segment templates deliver better."
        >
          <RankedList
            tone="bg-sms"
            items={[...SMS_TEMPLATES]
              .sort((a, b) => b.deliveryRate - a.deliveryRate)
              .slice(0, 5)
              .map((template) => {
                const { segments } = countSmsSegments(template.body);

                return {
                  id: template.id,
                  label: template.name,
                  secondary: `${formatNumber(template.usageCount)} sends · ${segments} segment${segments === 1 ? "" : "s"}`,
                  display: formatPercent(template.deliveryRate),
                  share: template.deliveryRate,
                };
              })}
          />
        </PanelCard>
      </div>
    </>
  );
}
