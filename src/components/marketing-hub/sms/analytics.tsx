"use client";

import { useMemo, useState } from "react";
import {
  CheckCheck,
  Gauge,
  MessageSquare,
  Send,
  UserMinus,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { DEFAULT_RANGE, type DateRangeValue } from "@/components/ui/date-range";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MiniStat, StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  CHANNEL_SERIES,
  CHART_COLORS,
  RATE_COLORS,
} from "@/components/dashboard/charts/chart-theme";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import {
  SMS_CAMPAIGNS,
  SMS_COST_BY_COUNTRY,
  SMS_TEMPLATES,
  SMS_TRENDS,
  SMS_TREND_PERIODS,
  smsTotals,
} from "@/lib/sms-fixtures";
import {
  formatCount,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatUnitCost,
  rate,
} from "@/lib/format";
import { countSmsSegments } from "@/types/sms";
import type { SmsTrendPeriod } from "@/types/sms";

/**
 * SMS analytics.
 *
 * Four questions, four panels, and each is one only this channel has to
 * answer: did the carriers take the messages, did anyone write back, what did
 * each of those replies cost, and how many people used the send as their
 * reason to leave.
 *
 * This page used to be nine panels. Four of them — a message volume chart, a
 * delivery-rate chart, a Top Campaigns list and a Campaign Comparison chart —
 * were the same handful of numbers drawn four ways, and two more repeated what
 * the Overview already shows above the fold. The rule applied here is that a
 * figure appears once, in the panel where someone could act on it: campaign
 * rates live in the campaign table rather than in a ranked list beside it, and
 * the trend is one chart with four series rather than four charts with one
 * each.
 *
 * The Sent → Delivered → Clicked → Replied funnel went with them. A funnel
 * implies each stage is a filter on the last, and on SMS that is only true of
 * the first two: a reply is not a deeper form of a click, it is a different
 * thing that a different kind of message earns. Clicks survive as a column in
 * the campaign table, which is where comparing them is useful.
 *
 * Every efficiency figure is per *delivered* rather than per sent. You pay for
 * the send either way, but only a delivery could ever have worked, so a
 * campaign burning a tenth of its budget on unreachable numbers should read as
 * expensive rather than merely large.
 */

const theme = CHANNEL_THEME.sms;
const ACCENT = { soft: theme.soft, text: theme.text };
const TOTALS = smsTotals(SMS_CAMPAIGNS);

/* -------------------------------------------------------------------------- */
/* A. Performance KPIs                                                        */
/* -------------------------------------------------------------------------- */

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
    hint: `${formatNumber(TOTALS.sent - TOTALS.delivered)} never arrived`,
  },
  {
    label: "Delivery Rate",
    value: formatPercent(rate(TOTALS.delivered, TOTALS.sent)),
    changePercent: 0.4,
    icon: Gauge,
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
    hint: `${formatPercent(rate(TOTALS.failed, TOTALS.sent))} of sent, billed anyway`,
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

/* -------------------------------------------------------------------------- */
/* Shared row set                                                             */
/* -------------------------------------------------------------------------- */

/** Campaigns with a delivery receipt — a draft has no rate to compare. */
const SENT = SMS_CAMPAIGNS.filter((campaign) => campaign.sent > 0);

/* -------------------------------------------------------------------------- */
/* C. Cost efficiency                                                         */
/* -------------------------------------------------------------------------- */

/** What the failures cost, since the gateway bills a send it could not land. */
const WASTED = TOTALS.cost * (1 - TOTALS.delivered / Math.max(TOTALS.sent, 1));

/**
 * Spend on sends that earned nothing back.
 *
 * Almost all of it is the verification code, which is transactional and was
 * never going to be answered — and it is 40% of the channel's bill, which is
 * why the headline cost-per-reply lands near $2.40 while the best campaign in
 * the table below is under fifty cents. The denominator is not wrong; the tile
 * just has to say what is in the numerator, or the two panels look like they
 * disagree.
 */
const ONE_WAY_SPEND = SENT.filter((campaign) => campaign.replies === 0).reduce(
  (total, campaign) => total + campaign.cost,
  0,
);

/**
 * The four cost readings, in the order they narrow.
 *
 * Per message is what the gateway charges, per delivered is what it charges
 * for something that could have worked, and per reply is what the channel
 * actually costs when an answer was the point of the send. Metric tiles rather
 * than bars: these are four different units, and a bar implies they can be
 * compared by length.
 */
const COST = [
  {
    label: "Cost / message",
    value: formatUnitCost(TOTALS.cost / Math.max(TOTALS.sent, 1)),
    hint: "blended across destinations",
  },
  {
    label: "Cost / delivered",
    value: formatUnitCost(TOTALS.cost / Math.max(TOTALS.delivered, 1)),
    hint: `${formatCurrency(WASTED)} spent on failures`,
  },
  {
    label: "Cost / reply",
    value: formatCurrency(TOTALS.cost / Math.max(TOTALS.replies, 1)),
    hint: `${formatNumber(TOTALS.replies)} replies · ${formatCurrency(
      ONE_WAY_SPEND,
    )} of spend earned none`,
  },
  {
    label: "Total spend",
    value: formatCurrency(TOTALS.cost),
    hint: "this period",
  },
];

/* -------------------------------------------------------------------------- */
/* D–F. Table sources                                                         */
/* -------------------------------------------------------------------------- */

const CAMPAIGN_SORTS = [
  { value: "replyRate", label: "Best reply rate" },
  { value: "costPerReply", label: "Cheapest per reply" },
  { value: "sent", label: "Most sent" },
  { value: "cost", label: "Highest spend" },
] as const;

type CampaignSort = (typeof CAMPAIGN_SORTS)[number]["value"];

/** Cost per reply, with the campaigns that earned none sorted to the bottom. */
const costPerReply = (campaign: (typeof SENT)[number]) =>
  campaign.replies === 0
    ? Number.POSITIVE_INFINITY
    : campaign.cost / campaign.replies;

/**
 * One row per audience, folded from the campaigns that targeted it.
 *
 * Summed rather than sampled: an audience messaged four times has four
 * delivery receipts, and taking the first campaign's rate as the audience's —
 * which the ranked list this replaces did — reports one send as if it were the
 * whole relationship.
 */
const AUDIENCE_RESPONSE = Object.values(
  SENT.reduce<
    Record<
      string,
      { label: string; recipients: number; delivered: number; replies: number }
    >
  >((groups, campaign) => {
    const row = groups[campaign.audienceLabel] ?? {
      label: campaign.audienceLabel,
      recipients: 0,
      delivered: 0,
      replies: 0,
    };

    return {
      ...groups,
      [campaign.audienceLabel]: {
        ...row,
        recipients: row.recipients + campaign.sent,
        delivered: row.delivered + campaign.delivered,
        replies: row.replies + campaign.replies,
      },
    };
  }, {}),
)
  .filter((row) => row.delivered > 0)
  .sort((a, b) => rate(b.replies, b.delivered) - rate(a.replies, a.delivered));

/** Templates with sends behind them. A 0% average is an absence, not a result. */
const TEMPLATES = [...SMS_TEMPLATES]
  .filter((template) => template.usageCount > 0)
  .sort((a, b) => b.replyRate - a.replyRate);

/* -------------------------------------------------------------------------- */

/**
 * The seam the dashboard's date filter plugs into.
 *
 * Nothing narrows on the range yet, and this says so rather than pretending: a
 * campaign carries a `createdAt` but none of the per-day figures its rates are
 * computed from. Filtering here today would either do nothing or empty the
 * table, and a page that silently drops rows is worse than one that reports
 * the whole set. The same seam the Email module uses, for the same reason.
 */
function withinRange<T>(rows: T[], range: DateRangeValue): T[] {
  void range;
  return rows;
}

/** The trend's own window, seeded from the page range where the two agree. */
function periodFor(range: DateRangeValue): SmsTrendPeriod {
  return range.preset === "7d" || range.preset === "90d" ? range.preset : "30d";
}

export interface SmsAnalyticsProps {
  /**
   * The period this page reports on.
   *
   * Supplied by the dashboard's filter rather than chosen here. The page used
   * to open on a toolbar of its own — a range picker, an audience select and
   * Export — which made it the fourth analytics page in the product answering
   * "which 30 days" separately, and the only one whose answer could disagree
   * with the others. Export moved to the page header, where it is a page
   * action rather than a filter; the range now arrives as a prop. Optional
   * while the central control is wired up, and defaulting to the same 30 days
   * the picker opened on, so nothing moves until something passes one.
   */
  range?: DateRangeValue;
}

export function SmsAnalytics({ range = DEFAULT_RANGE }: SmsAnalyticsProps) {
  /* The chart's window is its own control, initialised from the page range.
     Reading ninety days of sending is a thing you do *to* a chart, and making
     it reset every table on the page would be heavier than the question. */
  const [period, setPeriod] = useState<SmsTrendPeriod>(() => periodFor(range));
  const [sort, setSort] = useState<CampaignSort>("replyRate");

  const trend = SMS_TRENDS[period];

  const campaigns = useMemo(() => {
    const rows = withinRange(SENT, range);

    return [...rows].sort((a, b) => {
      if (sort === "sent") return b.sent - a.sent;
      if (sort === "cost") return b.cost - a.cost;
      if (sort === "costPerReply") return costPerReply(a) - costPerReply(b);
      return rate(b.replies, b.delivered) - rate(a.replies, a.delivered);
    });
  }, [range, sort]);

  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={6} />

      {/* -------------------------------------------- B. Performance trend */}
      <ChartCard
        title="Message Performance"
        description="Every send over the window, and what the carriers and the recipients did with it."
        action={
          <SegmentedControl
            label="Trend period"
            value={period}
            onChange={setPeriod}
            options={SMS_TREND_PERIODS}
          />
        }
        legend={[
          {
            label: "Sent",
            swatch: "bg-sms",
            value: formatNumber(trend.sent.at(-1) ?? 0),
          },
          {
            label: "Delivered",
            swatch: "bg-success",
            value: formatNumber(trend.delivered.at(-1) ?? 0),
          },
          {
            label: "Failed",
            swatch: "bg-error",
            value: formatNumber(trend.failed.at(-1) ?? 0),
          },
          {
            label: "Replies",
            swatch: "bg-accent",
            value: formatNumber(trend.replies.at(-1) ?? 0),
          },
        ]}
      >
        {/* Semantic rather than decorative: delivery is the green outcome and
            failure the red one in every module, and nobody should have to
            check a legend to tell which of the two lower lines is bad news. */}
        <TrendChart
          categories={trend.labels}
          series={[
            { name: "Sent", data: trend.sent },
            { name: "Delivered", data: trend.delivered },
            { name: "Failed", data: trend.failed },
            { name: "Replies", data: trend.replies },
          ]}
          colors={[
            CHANNEL_SERIES.sms[0],
            CHART_COLORS.success,
            RATE_COLORS.bad,
            CHART_COLORS.accent,
          ]}
          unit="messages"
        />
      </ChartCard>

      {/* ----------------------------------------------- C. Cost efficiency */}
      <PanelCard
        title="Cost Efficiency"
        description="What the channel charges per message, per message that arrived, and per answer it earned."
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {COST.map((item) => (
            <MiniStat
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
            />
          ))}
        </div>

        {/* Destination rates differ by a factor of three, so a blended
            cost-per-message averages things that are not alike. This is the
            breakdown behind the first tile — rows, not bars: the comparison is
            between two money columns, and a length would only redraw one. */}
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-medium text-text-muted capitalize">
            By destination
          </p>

          <ul className="mt-2 divide-y divide-border">
            {[...SMS_COST_BY_COUNTRY]
              .sort((a, b) => b.spend - a.spend)
              .map((row) => (
                <li
                  key={row.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-secondary">
                    {row.label}
                  </p>
                  <p className="shrink-0 text-sm text-text-muted tabular-nums">
                    {formatNumber(row.messages)} messages
                  </p>
                  <p className="w-20 shrink-0 text-right text-sm text-text-muted tabular-nums">
                    {formatUnitCost(row.spend / Math.max(row.messages, 1))}
                  </p>
                  <p className="w-20 shrink-0 text-right text-sm font-bold text-text-primary tabular-nums">
                    {formatCurrency(row.spend)}
                  </p>
                </li>
              ))}
          </ul>
        </div>
      </PanelCard>

      {/* ------------------------------------------ D. Campaign performance */}
      <PanelCard
        title="Campaign Performance"
        description="Every campaign that has sent, with what each reply cost to earn."
        action={
          <Select
            label="Sort campaigns"
            size="sm"
            value={sort}
            onChange={(next) => setSort(next as CampaignSort)}
            options={[...CAMPAIGN_SORTS]}
            className="lg:w-48"
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
              <Table minWidth="66rem">
                <THead>
                  <TH>Campaign</TH>
                  <TH align="right">Sent</TH>
                  <TH align="right">Delivery</TH>
                  <TH align="right">Replies</TH>
                  <TH align="right">Reply rate</TH>
                  <TH align="right">Clicks</TH>
                  <TH align="right">Cost</TH>
                  <TH align="right">Cost / reply</TH>
                </THead>

                <TBody>
                  {campaigns.map((campaign) => {
                    const deliveryRate = rate(campaign.delivered, campaign.sent);
                    const replyRate = rate(campaign.replies, campaign.delivered);
                    const perReply = costPerReply(campaign);

                    return (
                      <TR key={campaign.id}>
                        <TD>
                          <p className="max-w-56 truncate font-bold text-text-primary">
                            {campaign.name}
                          </p>
                          <p className="max-w-56 truncate text-sm text-text-muted">
                            {campaign.audienceLabel}
                          </p>
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(campaign.sent)}
                        </TD>

                        {/* The rate leads and the count explains it. A delivery
                            below 95% is the one figure on this row worth
                            interrupting a scan for, so it is the only one that
                            ever changes colour. */}
                        <TD align="right" className="tabular-nums">
                          <span
                            className={
                              deliveryRate < 95
                                ? "font-bold text-error-text"
                                : "font-bold text-text-primary"
                            }
                          >
                            {formatPercent(deliveryRate)}
                          </span>
                          <span className="block text-sm text-text-muted">
                            {formatNumber(campaign.delivered)}
                          </span>
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="font-bold text-text-primary">
                            {formatNumber(campaign.replies)}
                          </span>
                          {campaign.optOuts > 0 ? (
                            <span className="block text-sm text-warning-text">
                              {formatNumber(campaign.optOuts)} opted out
                            </span>
                          ) : null}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatPercent(replyRate)}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {campaign.clicks === 0 ? (
                            <span className="text-text-muted">—</span>
                          ) : (
                            formatNumber(campaign.clicks)
                          )}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatCurrency(campaign.cost)}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {Number.isFinite(perReply) ? (
                            <span className="font-bold text-text-primary">
                              {formatCurrency(perReply)}
                            </span>
                          ) : (
                            /* Not zero and not infinity — a transactional send
                               nobody was ever going to answer. */
                            <span className="text-text-muted">No replies</span>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile */}
            <ul className="space-y-2.5 lg:hidden">
              {campaigns.map((campaign) => {
                const perReply = costPerReply(campaign);

                return (
                  <li
                    key={campaign.id}
                    className="rounded-panel border border-border p-3.5"
                  >
                    <p className="truncate text-sm font-medium text-text-primary">
                      {campaign.name}
                    </p>
                    <p className="truncate text-sm text-text-muted">
                      {campaign.audienceLabel}
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "Sent", value: formatNumber(campaign.sent) },
                        {
                          label: "Delivery",
                          value: formatPercent(
                            rate(campaign.delivered, campaign.sent),
                          ),
                        },
                        {
                          label: "Reply rate",
                          value: formatPercent(
                            rate(campaign.replies, campaign.delivered),
                          ),
                        },
                        {
                          label: "Cost / reply",
                          value: Number.isFinite(perReply)
                            ? formatCurrency(perReply)
                            : "—",
                        },
                      ].map((cell) => (
                        <div
                          key={cell.label}
                          className="rounded-panel bg-surface-secondary px-2 py-2 text-center"
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
                );
              })}
            </ul>
          </>
        )}
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ------------------------------------------ E. Audience response */}
        <PanelCard
          title="Audience Response"
          description="Who writes back, summed across every campaign sent to them."
        >
          {/* Desktop */}
          <div className="max-sm:hidden">
            <Table minWidth="30rem">
              <THead>
                <TH>Audience</TH>
                <TH align="right">Recipients</TH>
                <TH align="right">Delivered</TH>
                <TH align="right">Replies</TH>
                <TH align="right">Reply rate</TH>
              </THead>

              <TBody>
                {AUDIENCE_RESPONSE.map((row) => (
                  <TR key={row.label}>
                    <TD>
                      <p className="max-w-44 truncate font-bold text-text-primary">
                        {row.label}
                      </p>
                    </TD>
                    <TD align="right" className="text-text-secondary tabular-nums">
                      {formatNumber(row.recipients)}
                    </TD>
                    <TD align="right" className="text-text-secondary tabular-nums">
                      {formatNumber(row.delivered)}
                    </TD>
                    <TD align="right" className="text-text-secondary tabular-nums">
                      {formatNumber(row.replies)}
                    </TD>
                    <TD
                      align="right"
                      className="font-bold text-text-primary tabular-nums"
                    >
                      {formatPercent(rate(row.replies, row.delivered))}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Phone. Five numeric columns will not fit a handset, and a table
              that scrolls sideways inside a card hides its own right-hand
              edge — which here is the column the panel is ranked by. */}
          <ul className="divide-y divide-border sm:hidden">
            {AUDIENCE_RESPONSE.map((row) => (
              <li key={row.label} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-text-primary">
                    {row.label}
                  </p>
                  <p className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                    {formatPercent(rate(row.replies, row.delivered))}
                  </p>
                </div>
                <p className="mt-1 text-sm text-text-muted tabular-nums">
                  {formatNumber(row.recipients)} sent ·{" "}
                  {formatNumber(row.delivered)} delivered ·{" "}
                  {formatNumber(row.replies)} replies
                </p>
              </li>
            ))}
          </ul>
        </PanelCard>

        {/* ------------------------------------------ F. Template performance */}
        <PanelCard
          title="Template Performance"
          description="Best reply rate first. Segments sit on the row because they set the price of every send."
        >
          {/* Desktop */}
          <div className="max-sm:hidden">
            <Table minWidth="30rem">
              <THead>
                <TH>Template</TH>
                <TH align="right">Usage</TH>
                <TH align="right">Delivery</TH>
                <TH align="right">Reply rate</TH>
                <TH align="center">Segments</TH>
              </THead>

              <TBody>
                {TEMPLATES.map((template) => {
                  const { segments } = countSmsSegments(template.body);

                  return (
                    <TR key={template.id}>
                      <TD>
                        <p className="max-w-44 truncate font-bold text-text-primary">
                          {template.name}
                        </p>
                      </TD>
                      <TD align="right" className="text-text-secondary tabular-nums">
                        {formatNumber(template.usageCount)}
                      </TD>
                      <TD align="right" className="text-text-secondary tabular-nums">
                        {formatPercent(template.deliveryRate)}
                      </TD>
                      <TD
                        align="right"
                        className="font-bold text-text-primary tabular-nums"
                      >
                        {formatPercent(template.replyRate)}
                      </TD>
                      <TD align="center">
                        <Badge tone={segments > 1 ? "warning" : "neutral"} size="sm">
                          {segments}
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>

          {/* Phone */}
          <ul className="divide-y divide-border sm:hidden">
            {TEMPLATES.map((template) => {
              const { segments } = countSmsSegments(template.body);

              return (
                <li key={template.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-text-primary">
                      {template.name}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                      {formatPercent(template.replyRate)}
                    </p>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-text-muted tabular-nums">
                    {formatNumber(template.usageCount)} sends ·{" "}
                    {formatPercent(template.deliveryRate)} delivered
                    <Badge tone={segments > 1 ? "warning" : "neutral"} size="sm">
                      {segments} segment{segments === 1 ? "" : "s"}
                    </Badge>
                  </p>
                </li>
              );
            })}
          </ul>
        </PanelCard>
      </div>
    </>
  );
}
