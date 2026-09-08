"use client";

import { useState } from "react";
import {
  Download,
  MailOpen,
  MousePointerClick,
  Send,
  UserMinus,
  Undo2,
  CheckCheck,
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
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import {
  CHANNEL_SERIES,
  RATE_COLORS,
  channelPair,
} from "@/components/dashboard/charts/chart-theme";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import { DonutChart } from "@/components/dashboard/charts/donut-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import {
  EMAIL_CAMPAIGNS,
  EMAIL_DAY_LABELS,
  EMAIL_DEVICE_SPLIT,
  EMAIL_SEND_TIMES,
  EMAIL_SERIES,
  EMAIL_TEMPLATES,
  emailTotals,
} from "@/lib/email-fixtures";
import { formatCount, formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import { ConversionFunnel } from "../shared/conversion-funnel";
import { RankedList } from "../shared/ranked-list";

/**
 * Email analytics.
 *
 * Organised around the two ways email fails, because they need different
 * fixes: engagement failures (nobody opens) are a content and timing problem,
 * and deliverability failures (nobody receives) are a list and domain problem.
 * The rate chart handles the first, the funnel and the bounce panel the
 * second.
 */

const theme = CHANNEL_THEME.email;
const ACCENT = { soft: theme.soft, text: theme.text };
const TOTALS = emailTotals(EMAIL_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Emails Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 14.2,
    icon: Send,
    hint: "vs previous period",
  },
  {
    label: "Delivered",
    value: formatCount(TOTALS.delivered),
    changePercent: 15.1,
    icon: CheckCheck,
    hint: `${formatPercent(rate(TOTALS.delivered, TOTALS.sent))} of sent`,
  },
  {
    label: "Open Rate",
    value: formatPercent(rate(TOTALS.opened, TOTALS.delivered)),
    changePercent: 3.8,
    icon: MailOpen,
    hint: `${formatNumber(TOTALS.opened)} opens`,
  },
  {
    label: "Click Rate",
    value: formatPercent(rate(TOTALS.clicked, TOTALS.delivered)),
    changePercent: 6.2,
    icon: MousePointerClick,
    hint: `${formatPercent(rate(TOTALS.clicked, Math.max(TOTALS.opened, 1)))} of opens`,
  },
  {
    label: "Bounce Rate",
    value: formatPercent(rate(TOTALS.bounced, TOTALS.sent)),
    changePercent: -1.4,
    icon: Undo2,
    hint: `${formatNumber(TOTALS.bounced)} bounced`,
    invertTrend: true,
  },
  {
    label: "Unsubscribe Rate",
    value: formatPercent(rate(TOTALS.unsubscribed, TOTALS.delivered)),
    changePercent: -0.6,
    icon: UserMinus,
    hint: `${formatNumber(TOTALS.unsubscribed)} opted out`,
    invertTrend: true,
  },
];

const FUNNEL = [
  { label: "Sent", count: TOTALS.sent, hint: "Emails handed to the gateway" },
  { label: "Delivered", count: TOTALS.delivered, hint: "Accepted by the inbox" },
  { label: "Opened", count: TOTALS.opened, hint: "Pixel or image loaded" },
  { label: "Clicked", count: TOTALS.clicked, hint: "Followed a link" },
];

type RateMetric = "open" | "click" | "bounce";

const RATE_META: Record<
  RateMetric,
  { label: string; description: string; data: number[]; hex: string; max: number }
> = {
  open: {
    label: "Open rate",
    description: "Opens as a share of delivered. Subject lines move this number.",
    data: EMAIL_SERIES.openRate,
    hex: CHANNEL_SERIES.email[0],
    max: 60,
  },
  click: {
    label: "Click rate",
    description: "Clicks as a share of delivered. The body and the button move this one.",
    data: EMAIL_SERIES.clickRate,
    hex: RATE_COLORS.warn,
    max: 30,
  },
  bounce: {
    label: "Bounce rate",
    description: "Above 2% sustained and the sending domain starts to suffer.",
    data: EMAIL_SERIES.bounceRate,
    hex: RATE_COLORS.bad,
    max: 8,
  },
};

/** Sent campaigns only — a scheduled campaign has no rate to compare. */
const SENT = EMAIL_CAMPAIGNS.filter((campaign) => campaign.delivered > 0);

const COMPARISON = [...SENT]
  .sort((a, b) => rate(b.opened, b.delivered) - rate(a.opened, a.delivered))
  .slice(0, 6);

export function EmailAnalytics() {
  const toast = useToast();
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
  const [audience, setAudience] = useState("all");
  const [metric, setMetric] = useState<RateMetric>("open");

  const meta = RATE_META[metric];
  const deviceTotal = EMAIL_DEVICE_SPLIT.reduce((sum, item) => sum + item.value, 0);

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
                { value: "open", label: "Open" },
                { value: "click", label: "Click" },
                { value: "bounce", label: "Bounce" },
              ]}
            />
          }
        >
          <TrendChart
            categories={EMAIL_DAY_LABELS}
            series={[{ name: meta.label, data: meta.data }]}
            colors={[meta.hex]}
            format="percent"
            yAxisMax={meta.max}
          />
        </ChartCard>

        <PanelCard
          title="Conversion Funnel"
          description="Sent through to a click, over the period."
        >
          <ConversionFunnel stages={FUNNEL} />
        </PanelCard>
      </div>

      <ChartCard
        title="Send Volume"
        description="Opened, delivered-but-unopened, and bounced, stacked to the total sent."
        legend={[
          { label: "Opened", swatch: "bg-email" },
          { label: "Delivered, unopened", swatch: "bg-accent" },
          { label: "Clicked", swatch: "bg-border-strong" },
        ]}
      >
        <BarsChart
          categories={EMAIL_DAY_LABELS}
          series={[
            { name: "Opened", data: EMAIL_SERIES.opened },
            {
              name: "Delivered, unopened",
              /* Sent minus opened, so the two segments sum to sent rather than
                 double-counting the opens inside the total. */
              data: EMAIL_SERIES.sent.map(
                (value, index) => value - EMAIL_SERIES.opened[index],
              ),
            },
            { name: "Clicked", data: EMAIL_SERIES.clicked },
          ]}
          colors={CHANNEL_SERIES.email}
          stacked
          unit="emails"
        />
      </ChartCard>

      <ChartCard
        title="Campaign Comparison"
        description="Open and click rate side by side, best open rate first."
        legend={[
          { label: "Open rate", swatch: "bg-email" },
          { label: "Click rate", swatch: "bg-accent" },
        ]}
      >
        <BarsChart
          categories={COMPARISON.map((campaign) => campaign.name)}
          series={[
            {
              name: "Open rate",
              data: COMPARISON.map((c) => Number(rate(c.opened, c.delivered).toFixed(1))),
            },
            {
              name: "Click rate",
              data: COMPARISON.map((c) => Number(rate(c.clicked, c.delivered).toFixed(1))),
            },
          ]}
          colors={channelPair("email")}
          horizontal
          height={320}
          unit="%"
        />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Top Campaigns"
          description="By revenue attributed, among campaigns already sent."
        >
          <RankedList
            tone={theme.accent}
            items={[...SENT]
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((campaign) => ({
                id: campaign.id,
                label: campaign.name,
                secondary: `${formatNumber(campaign.delivered)} delivered · ${formatPercent(rate(campaign.opened, campaign.delivered))} open`,
                display: formatCurrency(campaign.revenue),
                share: campaign.revenue,
              }))}
          />
        </PanelCard>

        <PanelCard
          title="Top Audiences"
          description="Open rate by segment, across the period."
        >
          <RankedList
            tone="bg-accent"
            items={[...SENT]
              /* One row per audience — the same segment mailed twice would
                 otherwise appear twice and read as two different lists. */
              .reduce<typeof SENT>((unique, campaign) => {
                if (unique.some((item) => item.audienceLabel === campaign.audienceLabel)) {
                  return unique;
                }
                return [...unique, campaign];
              }, [])
              .sort((a, b) => rate(b.opened, b.delivered) - rate(a.opened, a.delivered))
              .slice(0, 5)
              .map((campaign) => ({
                id: campaign.id,
                label: campaign.audienceLabel,
                secondary: `${formatNumber(campaign.audienceSize)} contacts`,
                display: formatPercent(rate(campaign.opened, campaign.delivered)),
                share: rate(campaign.opened, campaign.delivered),
              }))}
          />
        </PanelCard>

        <ChartCard
          title="Device Split"
          description="Where this list reads its email."
          bodyClassName="mt-0 ml-0"
          footer={
            <ul className="space-y-1.5">
              {EMAIL_SEND_TIMES.slice(0, 3).map((slot) => (
                <li
                  key={slot.label}
                  className="flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <span className="text-text-muted">{slot.label}</span>
                  <span className="font-medium text-text-secondary tabular-nums">
                    {formatPercent(slot.rate)} open
                  </span>
                </li>
              ))}
            </ul>
          }
        >
          <DonutChart
            labels={EMAIL_DEVICE_SPLIT.map((item) => item.label)}
            values={EMAIL_DEVICE_SPLIT.map((item) => item.value)}
            colors={CHANNEL_SERIES.email}
            centerLabel="Total opens"
            centerValue={formatNumber(deviceTotal)}
            height={200}
          />
        </ChartCard>
      </div>

      <PanelCard
        title="Best Performing Templates"
        description="Average open rate across every campaign that used them."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <RankedList
            tone={theme.accent}
            items={EMAIL_TEMPLATES.filter((template) => template.usageCount > 0)
              .sort((a, b) => b.openRate - a.openRate)
              .slice(0, 4)
              .map((template) => ({
                id: template.id,
                label: template.name,
                secondary: `${template.category.replace("-", " ")} · ${template.usageCount} campaigns`,
                display: formatPercent(template.openRate),
                share: template.openRate,
              }))}
          />
          <RankedList
            tone="bg-accent"
            numbered={false}
            items={EMAIL_TEMPLATES.filter((template) => template.usageCount > 0)
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 4)
              .map((template) => ({
                id: `usage-${template.id}`,
                label: template.name,
                secondary: `${formatPercent(template.openRate)} average open rate`,
                display: `${template.usageCount} uses`,
                share: template.usageCount,
              }))}
          />
        </div>
      </PanelCard>
    </>
  );
}
