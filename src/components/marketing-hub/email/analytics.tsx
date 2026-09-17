"use client";

import { useMemo, useState } from "react";

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
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import {
  EMAIL_CAMPAIGNS,
  EMAIL_DAY_LABELS,
  EMAIL_SERIES,
  emailTotals,
} from "@/lib/email-fixtures";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import type { FunnelStage } from "@/lib/overview-fixtures";
import { ConversionFunnel } from "../shared/conversion-funnel";
import { EmailCampaignStatusBadge } from "./campaign-row";

/**
 * Email analytics.
 *
 * Three things, and deliberately only three: where the sends went, how
 * engagement moved, and which campaigns did better than which. It replaced a
 * page carrying nine panels, of which a stat row, a device donut, a send-time
 * list and a template ranking were already on the Overview, and a stacked
 * volume chart said the same thing as the trend directly above it. Two of the
 * rest reported attributed revenue, which belongs to the cross-channel
 * workspace where email can be weighed against WhatsApp and SMS rather than
 * against itself.
 *
 * The comparison is a table rather than the paired bar chart it used to be.
 * Six campaigns on a horizontal bar chart compared two rates and no volume, so
 * a 71.8% open rate on 1,236 delivered sorted above a 39.0% on 18,064 with
 * nothing on screen to say why that is not the better campaign.
 */

const TOTALS = emailTotals(EMAIL_CAMPAIGNS);

/**
 * Sent → Delivered → Opened → Clicked → Converted.
 *
 * Every stage is a subset of the one above it, so the drop between two rows is
 * a real loss rather than two unrelated measures compared. Converted counts
 * clicks that reached the campaign's goal, which is why it hangs off Clicked
 * and not off Delivered.
 */
const FUNNEL: FunnelStage[] = [
  { label: "Sent", count: TOTALS.sent, hint: "Handed to the provider" },
  { label: "Delivered", count: TOTALS.delivered, hint: "Accepted by the inbox" },
  { label: "Opened", count: TOTALS.opened, hint: "Pixel or image loaded" },
  { label: "Clicked", count: TOTALS.clicked, hint: "Followed a link" },
  { label: "Converted", count: TOTALS.converted, hint: "Reached the campaign goal" },
];

type RateMetric = "open" | "click" | "bounce";

/**
 * One chart, three readings. Separate rather than three lines on one axis:
 * opens run near 40%, clicks near 14% and bounces near 2%, and plotted
 * together the two that matter most when something breaks are flat lines along
 * the bottom.
 */
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

const SORT_OPTIONS = [
  { value: "openRate", label: "Best open rate" },
  { value: "clickRate", label: "Best click rate" },
  { value: "conversionRate", label: "Best conversion rate" },
  { value: "sent", label: "Most sent" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

/** Sent campaigns only — a scheduled campaign has no rate to compare. */
const SENT = EMAIL_CAMPAIGNS.filter((campaign) => campaign.delivered > 0);

/**
 * The seam the dashboard's date filter plugs into.
 *
 * Nothing narrows on the range yet, and the function says so rather than
 * pretending: `EMAIL_SERIES` is ten fixed points with no dates attached, and a
 * campaign carries a `createdAt` but none of the per-day figures the rates are
 * computed from. Filtering here today would either do nothing or empty the
 * table, and a page that silently drops rows is worse than one that reports the
 * whole set.
 *
 * It exists so the range arrives as data on a real code path instead of as a
 * prop nobody reads: when the central filter and dated fixtures land, this is
 * the one function that changes and every panel narrows with it.
 */
function withinRange<T>(rows: T[], range: DateRangeValue): T[] {
  void range;
  return rows;
}

export interface EmailAnalyticsProps {
  /**
   * The period this page reports on.
   *
   * Supplied by the dashboard's filter rather than chosen here — the page used
   * to own a `DateRangePicker` of its own, which made it one of four analytics
   * pages each answering "which 30 days" separately. Optional while the central
   * control is being wired up, and the default is the same 30 days the picker
   * opened on, so the page reads identically until something passes a range.
   */
  range?: DateRangeValue;
}

export function EmailAnalytics({ range = DEFAULT_RANGE }: EmailAnalyticsProps) {
  const [metric, setMetric] = useState<RateMetric>("open");
  const [sort, setSort] = useState<SortField>("openRate");

  const meta = RATE_META[metric];

  const comparison = useMemo(() => {
    const rows = withinRange(SENT, range);

    return [...rows].sort((a, b) => {
      if (sort === "sent") return b.sent - a.sent;
      if (sort === "clickRate") {
        return rate(b.clicked, b.delivered) - rate(a.clicked, a.delivered);
      }
      if (sort === "conversionRate") {
        return rate(b.converted, b.clicked) - rate(a.converted, a.clicked);
      }
      return rate(b.opened, b.delivered) - rate(a.opened, a.delivered);
    });
  }, [range, sort]);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Engagement Trend"
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
          legend={[{ label: meta.label, swatch: "bg-email" }]}
        >
          <TrendChart
            categories={EMAIL_DAY_LABELS}
            series={[{ name: meta.label, data: meta.data }]}
            colors={[meta.hex]}
            variant="line"
            format="percent"
            yAxisMax={meta.max}
          />
        </ChartCard>

        <PanelCard
          title="Email Funnel"
          description="Sent through to a conversion, over the period."
        >
          <ConversionFunnel stages={FUNNEL} />
        </PanelCard>
      </div>

      <PanelCard
        title="Campaign Comparison"
        description="Every campaign that has actually sent, ranked on the metric you pick."
        action={
          <Select
            label="Sort campaigns"
            size="sm"
            value={sort}
            onChange={(next) => setSort(next as SortField)}
            options={[...SORT_OPTIONS]}
            className="lg:w-48"
          />
        }
      >
        {comparison.length === 0 ? (
          /* No local reset to offer any more: the period is set upstairs, so
             the empty state says where to change it rather than handing over a
             button that would only undo a filter this card no longer owns. */
          <EmptyState
            title="No sent campaigns in this period"
            description="Nothing was sent in the selected date range. Widen it in the dashboard filter."
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="max-lg:hidden">
              <Table minWidth="64rem">
                <THead>
                  <TH>Campaign</TH>
                  <TH align="right">Sent</TH>
                  <TH align="right">Delivered</TH>
                  <TH>Open rate</TH>
                  <TH>Click rate</TH>
                  <TH align="right">Converted</TH>
                  <TH align="right">Unsub.</TH>
                  <TH>Status</TH>
                </THead>

                <TBody>
                  {comparison.map((campaign) => {
                    const openRate = rate(campaign.opened, campaign.delivered);
                    const clickRate = rate(campaign.clicked, campaign.delivered);

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

                        <TD align="right" className="tabular-nums">
                          {formatNumber(campaign.sent)}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(campaign.delivered)}
                        </TD>

                        <TD className="w-28">
                          <p className="text-sm font-bold text-text-primary tabular-nums">
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

                        <TD className="w-28">
                          <p className="text-sm font-bold text-text-primary tabular-nums">
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

                        <TD align="right" className="tabular-nums">
                          {campaign.converted === 0 ? (
                            <span className="text-text-muted">—</span>
                          ) : (
                            <>
                              <span className="font-bold text-text-primary">
                                {formatNumber(campaign.converted)}
                              </span>
                              <span className="block text-sm text-text-muted">
                                {formatPercent(rate(campaign.converted, campaign.clicked))}{" "}
                                of clicks
                              </span>
                            </>
                          )}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="text-text-secondary">
                            {formatNumber(campaign.unsubscribed)}
                          </span>
                          <span className="block text-sm text-text-muted">
                            {formatPercent(
                              rate(campaign.unsubscribed, campaign.delivered),
                            )}
                          </span>
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
              {comparison.map((campaign) => (
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
                        {campaign.audienceLabel}
                      </p>
                    </div>
                    <EmailCampaignStatusBadge status={campaign.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
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
                      {
                        label: "Conv.",
                        value:
                          campaign.converted === 0
                            ? "—"
                            : formatNumber(campaign.converted),
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
    </>
  );
}
