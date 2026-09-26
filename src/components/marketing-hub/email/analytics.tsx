"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { DEFAULT_RANGE, type DateRangeValue } from "@/components/ui/date-range";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  CHANNEL_SERIES,
  RATE_COLORS,
} from "@/components/dashboard/charts/chart-theme";
import { SparklineChart } from "@/components/dashboard/charts/sparkline-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import {
  EMAIL_CAMPAIGNS,
  EMAIL_SERIES,
  EMAIL_TEMPLATES,
  EMAIL_TREND_PERIODS,
  EMAIL_TRENDS,
  emailTotals,
} from "@/lib/email-fixtures";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EmailTrendPeriod } from "@/types/email";
import { EmailCampaignStatusBadge } from "./campaign-row";

/**
 * Email analytics.
 *
 * Four panels, and each answers a question someone can act on: are the four
 * rates healthy, is the sending programme growing or shrinking, which campaigns
 * beat the average, and which templates are worth reusing.
 *
 * The page opened on a Sent → Delivered → Opened → Clicked → Converted funnel
 * until this revision. It was the most generic thing on it - every channel's
 * analytics can draw that shape, so it said nothing about *email* - and the two
 * stages nobody could act on from here, delivered and converted, are exactly
 * the ones a campaign's own report exists to explain. The engagement card in
 * its place carries the same information where it is useful: as four rates with
 * their direction of travel, which is what tells you whether to rewrite a
 * subject line or go and look at a bounce log.
 *
 * Still no revenue, orders or list growth. Those are cross-channel questions
 * and the Marketing workspace is where four channels can be compared; here they
 * would only ever be email measured against itself.
 */

const TOTALS = emailTotals(EMAIL_CAMPAIGNS);

/**
 * The four rates, with the shape each has been making.
 *
 * `invert` marks the two where a fall is the good outcome. Without it a bounce
 * rate dropping a point and an open rate dropping a point are drawn the same
 * colour, which is the one mistake this card cannot afford - these are the
 * numbers people scan for red.
 */
const ENGAGEMENT: {
  label: string;
  value: number;
  hint: string;
  changePercent: number;
  data: number[];
  invert?: boolean;
}[] = [
  {
    label: "Open Rate",
    value: rate(TOTALS.opened, TOTALS.delivered),
    hint: `${formatNumber(TOTALS.opened)} opens of delivered`,
    changePercent: 3.8,
    data: EMAIL_SERIES.openRate,
  },
  {
    label: "Click Rate",
    value: rate(TOTALS.clicked, TOTALS.delivered),
    hint: `${formatPercent(rate(TOTALS.clicked, Math.max(TOTALS.opened, 1)))} of opens`,
    changePercent: 6.2,
    data: EMAIL_SERIES.clickRate,
  },
  {
    label: "Bounce Rate",
    value: rate(TOTALS.bounced, TOTALS.sent),
    hint: "Above 2% risks the sending domain",
    changePercent: -1.4,
    data: EMAIL_SERIES.bounceRate,
    invert: true,
  },
  {
    label: "Unsubscribe Rate",
    value: rate(TOTALS.unsubscribed, TOTALS.delivered),
    hint: `${formatNumber(TOTALS.unsubscribed)} opted out`,
    changePercent: -0.6,
    data: EMAIL_SERIES.unsubscribeRate,
    invert: true,
  },
];

const SORT_OPTIONS = [
  { value: "openRate", label: "Best open rate" },
  { value: "clickRate", label: "Best click rate" },
  { value: "sent", label: "Most sent" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

/** Sent campaigns only - a scheduled campaign has no rate to compare. */
const SENT = EMAIL_CAMPAIGNS.filter((campaign) => campaign.delivered > 0);

/** Templates with sends behind them. A 0% average is an absence, not a result. */
const USED_TEMPLATES = EMAIL_TEMPLATES.filter(
  (template) => template.usageCount > 0,
);

/**
 * The seam the dashboard's date filter plugs into.
 *
 * Nothing narrows on the range yet, and the function says so rather than
 * pretending: a campaign carries a `createdAt` but none of the per-day figures
 * the rates are computed from. Filtering here today would either do nothing or
 * empty the table, and a page that silently drops rows is worse than one that
 * reports the whole set.
 *
 * It exists so the range arrives as data on a real code path instead of as a
 * prop nobody reads: when the central filter and dated fixtures land, this is
 * the one function that changes and every panel narrows with it.
 */
function withinRange<T>(rows: T[], range: DateRangeValue): T[] {
  void range;
  return rows;
}

/** The trend's own window, seeded from the page range when the two can agree. */
function periodFor(range: DateRangeValue): EmailTrendPeriod {
  return range.preset === "7d" || range.preset === "90d" ? range.preset : "30d";
}

export interface EmailAnalyticsProps {
  /**
   * The period this page reports on.
   *
   * Supplied by the dashboard's filter rather than chosen here - the page used
   * to own a `DateRangePicker` of its own, which made it one of four analytics
   * pages each answering "which 30 days" separately. Optional while the central
   * control is being wired up, and the default is the same 30 days the picker
   * opened on, so the page reads identically until something passes a range.
   */
  range?: DateRangeValue;
}

export function EmailAnalytics({ range = DEFAULT_RANGE }: EmailAnalyticsProps) {
  /* The chart's window is its own control, initialised from the page range.
     Reading three months of sending is a thing you do *to* a chart, and making
     it reset the campaign table and every rate on the page would be a heavier
     answer than the question deserves. */
  const [period, setPeriod] = useState<EmailTrendPeriod>(() => periodFor(range));
  const [sort, setSort] = useState<SortField>("openRate");

  const trend = EMAIL_TRENDS[period];

  const campaigns = useMemo(() => {
    const rows = withinRange(SENT, range);

    return [...rows].sort((a, b) => {
      if (sort === "sent") return b.sent - a.sent;
      if (sort === "clickRate") {
        return rate(b.clicked, b.delivered) - rate(a.clicked, a.delivered);
      }
      return rate(b.opened, b.delivered) - rate(a.opened, a.delivered);
    });
  }, [range, sort]);

  const templates = [...USED_TEMPLATES].sort((a, b) => b.openRate - a.openRate);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Email Performance Trend"
          description="Sends, opens and clicks over the window you pick."
          className="xl:col-span-2"
          action={
            <SegmentedControl
              label="Trend period"
              value={period}
              onChange={setPeriod}
              options={EMAIL_TREND_PERIODS}
            />
          }
          legend={[
            {
              label: "Sent",
              swatch: "bg-email",
              value: formatNumber(trend.sent.at(-1) ?? 0),
            },
            {
              label: "Opened",
              swatch: "bg-accent",
              value: formatNumber(trend.opened.at(-1) ?? 0),
            },
            {
              label: "Clicked",
              swatch: "bg-border-strong",
              value: formatNumber(trend.clicked.at(-1) ?? 0),
            },
          ]}
        >
          <TrendChart
            categories={trend.labels}
            series={[
              { name: "Sent", data: trend.sent },
              { name: "Opened", data: trend.opened },
              { name: "Clicked", data: trend.clicked },
            ]}
            colors={CHANNEL_SERIES.email}
            unit="emails"
          />
        </ChartCard>

        <PanelCard
          title="Email Engagement Overview"
          description="The four rates that decide whether this channel keeps working."
        >
          <ul className="divide-y divide-border">
            {ENGAGEMENT.map((metric) => {
              const rising = metric.changePercent >= 0;
              const good = metric.invert ? !rising : rising;
              const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

              return (
                <li
                  key={metric.label}
                  className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-secondary">
                      {metric.label}
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-2xl leading-none font-bold text-text-primary tabular-nums">
                        {formatPercent(metric.value)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-sm font-medium",
                          good ? "text-email" : "text-error",
                        )}
                      >
                        <TrendIcon className="size-3.5" aria-hidden />
                        {Math.abs(metric.changePercent).toFixed(1)}%
                      </span>
                    </p>
                    <p className="mt-1 truncate text-sm text-text-muted">
                      {metric.hint}
                    </p>
                  </div>

                  {/* The shape, not a second reading of the number beside it -
                      no axes, because at 40px the direction is the signal. */}
                  <div className="w-24 shrink-0" aria-hidden>
                    <SparklineChart
                      data={metric.data}
                      color={good ? CHANNEL_THEME.email.hex : RATE_COLORS.bad}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </PanelCard>
      </div>

      <PanelCard
        title="Campaign Performance"
        description="Every campaign that has actually sent, ranked on the metric you pick."
        action={
          <Select
            label="Sort campaigns"
            size="sm"
            value={sort}
            onChange={(next) => setSort(next as SortField)}
            options={[...SORT_OPTIONS]}
            className="lg:w-44"
          />
        }
      >
        {campaigns.length === 0 ? (
          /* No local reset to offer: the period is set upstairs, so the empty
             state says where to change it rather than handing over a button
             that would only undo a filter this card does not own. */
          <EmptyState
            title="No sent campaigns in this period"
            description="Nothing was sent in the selected date range. Widen it in the dashboard filter."
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="max-lg:hidden">
              <Table minWidth="56rem">
                <THead>
                  <TH>Campaign</TH>
                  <TH align="right">Sent</TH>
                  <TH>Open rate</TH>
                  <TH>Click rate</TH>
                  <TH>Status</TH>
                </THead>

                <TBody>
                  {campaigns.map((campaign) => {
                    const openRate = rate(campaign.opened, campaign.delivered);
                    const clickRate = rate(campaign.clicked, campaign.delivered);

                    return (
                      <TR key={campaign.id}>
                        <TD>
                          <p className="max-w-64 truncate font-semibold text-text-primary">
                            {campaign.name}
                          </p>
                          <p className="max-w-64 truncate text-sm text-text-muted">
                            {campaign.subject}
                          </p>
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {formatNumber(campaign.sent)}
                        </TD>

                        <TD className="w-36">
                          <p className="text-sm font-semibold text-text-primary tabular-nums">
                            {formatPercent(openRate)}
                          </p>
                          <ProgressBar
                            value={openRate}
                            label={`${campaign.name} open rate`}
                            tone="bg-email"
                            size="sm"
                            className="mt-1.5"
                          />
                        </TD>

                        <TD className="w-36">
                          <p className="text-sm font-semibold text-text-primary tabular-nums">
                            {formatPercent(clickRate)}
                          </p>
                          <ProgressBar
                            value={clickRate}
                            label={`${campaign.name} click rate`}
                            tone="bg-accent"
                            size="sm"
                            className="mt-1.5"
                          />
                        </TD>

                        <TD>
                          <EmailCampaignStatusBadge status={campaign.status} />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile */}
            <ul className="space-y-2.5 lg:hidden">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.id}
                  className="rounded-panel border border-border p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {campaign.name}
                      </p>
                      <p className="truncate text-sm text-text-muted">
                        {campaign.subject}
                      </p>
                    </div>
                    <EmailCampaignStatusBadge status={campaign.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Sent", value: formatNumber(campaign.sent) },
                      {
                        label: "Open",
                        value: formatPercent(rate(campaign.opened, campaign.delivered)),
                      },
                      {
                        label: "Click",
                        value: formatPercent(rate(campaign.clicked, campaign.delivered)),
                      },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-panel bg-surface-secondary py-2"
                      >
                        <dt className="text-sm font-medium text-text-muted">
                          {cell.label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
                          {cell.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </PanelCard>

      <PanelCard
        title="Top Performing Templates"
        description="Averaged across every campaign that used them, best open rate first."
      >
        {templates.length === 0 ? (
          <EmptyState
            title="No template has been sent yet"
            description="Once a campaign goes out on a template, its averages appear here."
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="max-lg:hidden">
              <Table minWidth="48rem">
                <THead>
                  <TH>Template</TH>
                  <TH align="right">Usage</TH>
                  <TH>Open rate</TH>
                  <TH>Click rate</TH>
                </THead>

                <TBody>
                  {templates.map((template) => (
                    <TR key={template.id}>
                      <TD>
                        <p className="max-w-64 truncate font-semibold text-text-primary">
                          {template.name}
                        </p>
                        <p className="max-w-64 truncate text-sm text-text-muted">
                          {template.subject}
                        </p>
                      </TD>

                      <TD align="right" className="tabular-nums">
                        <span className="font-semibold text-text-primary">
                          {formatNumber(template.usageCount)}
                        </span>
                        <span className="block text-sm text-text-muted">
                          campaign{template.usageCount === 1 ? "" : "s"}
                        </span>
                      </TD>

                      <TD className="w-40">
                        <p className="text-sm font-semibold text-text-primary tabular-nums">
                          {formatPercent(template.openRate)}
                        </p>
                        <ProgressBar
                          value={template.openRate}
                          label={`${template.name} open rate`}
                          tone="bg-email"
                          size="sm"
                          className="mt-1.5"
                        />
                      </TD>

                      <TD className="w-40">
                        <p className="text-sm font-semibold text-text-primary tabular-nums">
                          {formatPercent(template.clickRate)}
                        </p>
                        <ProgressBar
                          value={template.clickRate}
                          label={`${template.name} click rate`}
                          tone="bg-accent"
                          size="sm"
                          className="mt-1.5"
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>

            {/* Mobile */}
            <ul className="space-y-2.5 lg:hidden">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="rounded-panel border border-border p-3.5"
                >
                  <p className="truncate text-sm font-medium text-text-primary">
                    {template.name}
                  </p>
                  <p className="truncate text-sm text-text-muted">
                    {template.subject}
                  </p>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Usage", value: formatNumber(template.usageCount) },
                      { label: "Open", value: formatPercent(template.openRate) },
                      { label: "Click", value: formatPercent(template.clickRate) },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-panel bg-surface-secondary py-2"
                      >
                        <dt className="text-sm font-medium text-text-muted">
                          {cell.label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
                          {cell.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </PanelCard>
    </>
  );
}
