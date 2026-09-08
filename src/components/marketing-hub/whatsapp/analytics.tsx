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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { DateRangePicker, DEFAULT_RANGE, type DateRangeValue } from "@/components/ui/date-range";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import {
  CHANNEL_SERIES,
  OUTCOME_COLORS,
  channelPair,
} from "@/components/dashboard/charts/chart-theme";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES, CAMPAIGNS } from "@/lib/marketing-fixtures";
import {
  WA_AUDIENCE_ENGAGEMENT,
  WA_DAY_LABELS,
  WA_FUNNEL,
  WA_SERIES,
  WA_TOP_TEMPLATES,
  rateSeries,
  whatsappTotals,
} from "@/lib/whatsapp-fixtures";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";
import { ConversionFunnel } from "../shared/conversion-funnel";
import { RankedList } from "../shared/ranked-list";

/**
 * WhatsApp analytics.
 *
 * Six KPIs rather than the usual four, because the WhatsApp funnel has six
 * genuinely distinct outcomes and collapsing failed and opt-outs into "other"
 * hides the two that need acting on. Failures and opt-outs carry
 * `invertTrend`, so a rise in either shows red — the one place in the app
 * where growth is bad news.
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
          title="Conversion Funnel"
          description="Sent through to an order, over the period."
        >
          <ConversionFunnel stages={WA_FUNNEL} />
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

      <div className="grid gap-4 lg:grid-cols-3">
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

        <PanelCard
          title="Top Audiences"
          description="Reply rate by segment. Smaller lists reply more."
        >
          <RankedList
            tone="bg-accent"
            items={WA_AUDIENCE_ENGAGEMENT.map((item) => ({
              id: item.label,
              label: item.label,
              secondary: `${formatNumber(item.contacts)} contacts`,
              display: formatPercent(item.replyRate),
              share: item.replyRate,
            }))}
          />
        </PanelCard>

        <PanelCard
          title="Best Templates"
          description="By reply rate. Utility templates beat marketing ones."
        >
          <RankedList
            tone="bg-primary-light"
            items={WA_TOP_TEMPLATES.map((template) => ({
              id: template.id,
              label: template.name,
              secondary: `${formatNumber(template.sent)} sent`,
              display: formatPercent(template.replyRate),
              share: template.replyRate,
            }))}
          />
        </PanelCard>
      </div>
    </>
  );
}
