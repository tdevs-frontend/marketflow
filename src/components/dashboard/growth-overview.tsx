"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { GrowthOverviewChart } from "./charts/growth-overview-chart";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

type RangeKey = "7d" | "30d" | "90d" | "12m";
type MetricKey = "leads" | "conversions" | "revenue";

interface MetricSeries {
  current: number[];
  previous: number[];
}

interface RangeData {
  label: string;
  categories: string[];
  metrics: Record<MetricKey, MetricSeries>;
}

/**
 * Placeholder figures — swap for `useGetGrowthQuery(range)` once the API is
 * live. Every range carries its own `previous` window so the comparison line
 * is a real series rather than the current one shifted.
 */
const RANGES: Record<RangeKey, RangeData> = {
  "7d": {
    label: "7 Days",
    categories: ["May 24", "May 25", "May 26", "May 27", "May 28", "May 29", "May 30"],
    metrics: {
      leads: {
        current: [196, 214, 208, 242, 268, 284, 312],
        previous: [172, 180, 194, 188, 216, 228, 244],
      },
      conversions: {
        current: [38, 44, 41, 52, 58, 61, 68],
        previous: [31, 34, 36, 39, 44, 47, 52],
      },
      revenue: {
        current: [4820, 5140, 4960, 5880, 6420, 6840, 7460],
        previous: [3980, 4210, 4480, 4360, 5020, 5310, 5720],
      },
    },
  },
  "30d": {
    label: "30 Days",
    categories: ["May 1", "May 5", "May 10", "May 15", "May 20", "May 25", "May 30"],
    metrics: {
      leads: {
        current: [420, 580, 760, 920, 1180, 1360, 1580],
        previous: [380, 470, 590, 720, 880, 1010, 1180],
      },
      conversions: {
        current: [82, 104, 142, 186, 220, 268, 312],
        previous: [68, 84, 108, 138, 168, 198, 232],
      },
      revenue: {
        current: [6200, 8400, 11200, 14600, 17800, 20400, 22400],
        previous: [5100, 6600, 8700, 11200, 13600, 15800, 17400],
      },
    },
  },
  "90d": {
    label: "90 Days",
    categories: ["Mar 1", "Mar 15", "Apr 1", "Apr 15", "May 1", "May 15", "May 30"],
    metrics: {
      leads: {
        current: [2140, 2480, 2960, 3320, 3840, 4260, 4820],
        previous: [1880, 2020, 2340, 2610, 2980, 3240, 3560],
      },
      conversions: {
        current: [412, 486, 588, 664, 782, 884, 1012],
        previous: [352, 392, 458, 512, 594, 656, 738],
      },
      revenue: {
        current: [28400, 33200, 40100, 45600, 53800, 60400, 68200],
        previous: [24100, 26800, 31400, 35200, 40900, 45100, 50600],
      },
    },
  },
  "12m": {
    label: "12 Months",
    categories: [
      "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
      "Dec", "Jan", "Feb", "Mar", "Apr", "May",
    ],
    metrics: {
      leads: {
        current: [4200, 4680, 5140, 5020, 5860, 6420, 7180, 6940, 7620, 8480, 9240, 10380],
        previous: [3600, 3840, 4120, 4260, 4580, 4940, 5420, 5310, 5780, 6240, 6820, 7460],
      },
      conversions: {
        current: [820, 940, 1060, 1020, 1240, 1380, 1560, 1490, 1680, 1880, 2080, 2360],
        previous: [680, 740, 820, 860, 960, 1040, 1180, 1140, 1260, 1380, 1520, 1720],
      },
      revenue: {
        current: [
          58200, 64800, 71400, 69800, 82600, 91200, 104800, 99400,
          112600, 126800, 141200, 162400,
        ],
        previous: [
          48600, 51400, 56200, 58100, 64800, 70200, 79400, 76800,
          84600, 93200, 102400, 116800,
        ],
      },
    },
  },
};

const RANGE_OPTIONS = (Object.keys(RANGES) as RangeKey[]).map((key) => ({
  value: key,
  label: RANGES[key].label,
}));

const METRICS: { value: MetricKey; label: string; format: "number" | "currency" }[] = [
  { value: "leads", label: "Leads", format: "number" },
  { value: "conversions", label: "Conversions", format: "number" },
  { value: "revenue", label: "Revenue", format: "currency" },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

function LegendSwatch({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <span aria-hidden className={cn("h-0.5 w-4 rounded-full", className)} />
      {children}
    </span>
  );
}

export function GrowthOverview({ className }: { className?: string }) {
  const [range, setRange] = useState<RangeKey>("30d");
  const [metric, setMetric] = useState<MetricKey>("leads");

  const active = METRICS.find((item) => item.value === metric) ?? METRICS[0];
  const data = RANGES[range].metrics[metric];

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-base">Growth Overview</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track leads, conversions and revenue over time.
          </p>
        </div>

        <SegmentedControl
          label="Date range"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          className="max-xl:-mx-1 max-xl:overflow-x-auto"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Metric"
          size="sm"
          options={METRICS.map(({ value, label }) => ({ value, label }))}
          value={metric}
          onChange={setMetric}
        />

        {/* A two-item legend beats Apex's own — it sits with the controls
            instead of stealing a strip of the plot area. */}
        <div className="flex items-center gap-4">
          <LegendSwatch className="bg-primary">{active.label}</LegendSwatch>
          <LegendSwatch className="bg-border-strong">Previous period</LegendSwatch>
        </div>
      </div>

      <div className="mt-2 -ml-2.5">
        <GrowthOverviewChart
          categories={RANGES[range].categories}
          current={data.current}
          previous={data.previous}
          seriesName={active.label}
          format={active.format}
        />
      </div>
    </Card>
  );
}
