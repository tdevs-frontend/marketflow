"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CHART_COLORS } from "./charts/chart-theme";
import { GrowthOverviewChart } from "./charts/growth-overview-chart";
import {
  DashboardRangeChips,
  useDashboardRange,
  type RangeKey,
} from "./dashboard-range";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

type MetricKey = "leads" | "orders" | "revenue";

interface MetricSeries {
  current: number[];
  previous: number[];
}

interface RangeSeries {
  categories: string[];
  metrics: Record<MetricKey, MetricSeries>;
}

/**
 * Placeholder figures — swap for `useGetGrowthQuery(range, metric)` once the
 * API is live.
 *
 * Day ranges plot a daily rate and converge on the same end-of-May reading;
 * the 12-month view plots monthly totals and its last month is the KPI row.
 */
const SERIES: Record<RangeKey, RangeSeries> = {
  "7d": {
    categories: ["May 24", "May 25", "May 26", "May 27", "May 28", "May 29", "May 30"],
    metrics: {
      leads: {
        current: [408, 432, 419, 451, 444, 468, 470],
        previous: [346, 362, 355, 381, 374, 394, 400],
      },
      orders: {
        current: [42, 46, 44, 49, 47, 52, 54],
        previous: [34, 37, 36, 40, 39, 42, 44],
      },
      revenue: {
        current: [1620, 1740, 1680, 1860, 1810, 1940, 1980],
        previous: [1330, 1420, 1380, 1520, 1480, 1590, 1640],
      },
    },
  },
  "30d": {
    categories: ["May 1", "May 5", "May 10", "May 15", "May 20", "May 25", "May 30"],
    metrics: {
      leads: {
        current: [280, 320, 360, 390, 420, 450, 470],
        previous: [230, 260, 300, 330, 350, 370, 400],
      },
      orders: {
        current: [30, 34, 38, 42, 46, 50, 54],
        previous: [25, 28, 31, 35, 38, 41, 44],
      },
      revenue: {
        current: [1120, 1280, 1440, 1580, 1720, 1860, 1980],
        previous: [920, 1050, 1180, 1290, 1410, 1520, 1640],
      },
    },
  },
  "90d": {
    categories: ["Mar 1", "Mar 15", "Apr 1", "Apr 15", "May 1", "May 15", "May 30"],
    metrics: {
      leads: {
        current: [268, 302, 336, 372, 404, 438, 470],
        previous: [224, 248, 272, 300, 328, 362, 400],
      },
      orders: {
        current: [24, 29, 34, 39, 44, 49, 54],
        previous: [19, 23, 27, 31, 35, 39, 44],
      },
      revenue: {
        current: [880, 1060, 1240, 1420, 1600, 1790, 1980],
        previous: [700, 840, 980, 1130, 1290, 1460, 1640],
      },
    },
  },
  "12m": {
    categories: [
      "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
      "Dec", "Jan", "Feb", "Mar", "Apr", "May",
    ],
    metrics: {
      leads: {
        current: [6200, 6800, 7400, 7100, 8200, 8900, 9800, 9400, 10200, 11100, 11800, 12480],
        previous: [5100, 5400, 5900, 6000, 6600, 7100, 7800, 7600, 8100, 8800, 9300, 10540],
      },
      orders: {
        current: [640, 700, 760, 740, 860, 940, 1060, 1020, 1120, 1180, 1240, 1284],
        previous: [520, 560, 620, 610, 700, 760, 860, 830, 910, 960, 1010, 1099],
      },
      revenue: {
        current: [
          23800, 26200, 28600, 27900, 32400, 35200, 39800, 38200,
          41800, 44100, 46200, 48200,
        ],
        previous: [
          19200, 21000, 23100, 22600, 26100, 28400, 32100, 30800,
          33600, 35400, 37900, 39670,
        ],
      },
    },
  },
};

/**
 * The three metrics, each with the hue its bars are drawn in.
 *
 * One colour per metric rather than brand indigo for all three: the legend and
 * the columns are two confirmations of the same choice, and when they were
 * both indigo the only thing that changed on a tab press was the height of the
 * bars. Each hue is a theme token — the brand for leads, success green for
 * orders, the SMS violet for revenue — named twice because Apex needs the hex
 * and the legend needs the utility.
 *
 * `swatch` must stay in step with `color`; they are one decision spelled for
 * two different consumers.
 */
interface MetricDefinition {
  value: MetricKey;
  label: string;
  format: "number" | "currency";
  /** For Apex, which cannot read a CSS variable. */
  color: string;
  /** The legend's mark, in the DOM. */
  swatch: string;
}

const METRICS: MetricDefinition[] = [
  {
    value: "leads",
    label: "Leads",
    format: "number",
    color: CHART_COLORS.primary,
    swatch: "bg-primary",
  },
  {
    value: "orders",
    label: "Orders",
    format: "number",
    color: CHART_COLORS.success,
    swatch: "bg-success",
  },
  {
    value: "revenue",
    label: "Revenue",
    format: "currency",
    color: CHART_COLORS.sms,
    swatch: "bg-sms",
  },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One legend entry, drawn as the mark it stands for.
 *
 * A short rounded column rather than the 2px rule this used to be: the series
 * are bars now, and a legend whose key is a horizontal line is a legend the
 * reader has to translate before it helps.
 */
function LegendSwatch({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary">
      <span aria-hidden className={cn("h-3 w-1.5 shrink-0 rounded-xs", className)} />
      {children}
    </span>
  );
}

/**
 * The page's main visualisation.
 *
 * One metric at a time against its own previous period, rather than all three
 * at once: leads, orders and revenue differ by orders of magnitude, so plotting
 * them together flattens two of the three into the axis.
 *
 * The range chips drive the whole page rather than this card alone — they are
 * the header picker in a second form, which is why the reading below them and
 * the KPI row above never disagree about what window they describe.
 */
export function GrowthOverview({ className }: { className?: string }) {
  const { range, meta } = useDashboardRange();
  const [metric, setMetric] = useState<MetricKey>("leads");

  const active = METRICS.find((item) => item.value === metric) ?? METRICS[0];
  const data = SERIES[range].metrics[metric];

  /* The headline is the latest reading, so the card says where the business is
     now before the reader has to interpret the curve. */
  const latest = data.current[data.current.length - 1] ?? 0;
  const latestPrevious = data.previous[data.previous.length - 1] ?? 0;
  const change =
    latestPrevious === 0 ? 0 : ((latest - latestPrevious) / latestPrevious) * 100;
  const positive = change >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-base">Growth Overview</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Track leads, orders and revenue over time.
          </p>
        </div>

        <DashboardRangeChips className="max-xl:-mx-1 max-xl:overflow-x-auto" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Metric"
          size="sm"
          options={METRICS.map(({ value, label }) => ({ value, label }))}
          value={metric}
          onChange={setMetric}
        />

        {/* Own legend, so Apex's does not steal a strip of the plot area. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LegendSwatch className={active.swatch}>{active.label}</LegendSwatch>
          <LegendSwatch className="bg-chart-neutral">Previous period</LegendSwatch>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <p className="text-[1.75rem] leading-none font-bold text-text-primary tabular-nums">
          {active.format === "currency" ? formatCurrency(latest) : formatNumber(latest)}
        </p>
        <span className="text-sm text-text-secondary">{meta.unit}</span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-meta font-medium",
            positive
              ? "bg-primary-soft text-primary-dark"
              : "bg-error-soft text-error-text",
          )}
        >
          <TrendIcon className="size-3.5" aria-hidden />
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-sm text-text-muted">{meta.comparison}</span>
      </div>

      {/* The negative left margin pulls the y-axis labels back to the card's
          padding — Apex reserves more gutter than the axis text needs. */}
      <div className="mt-2 -ml-2.5 flex-1">
        <GrowthOverviewChart
          categories={SERIES[range].categories}
          current={data.current}
          previous={data.previous}
          seriesName={active.label}
          format={active.format}
          color={active.color}
        />
      </div>
    </Card>
  );
}
