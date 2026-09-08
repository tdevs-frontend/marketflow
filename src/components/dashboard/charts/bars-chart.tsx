"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { formatNumber } from "@/lib/format";
import { ApexChart } from "./apex-chart";
import {
  AXIS_LABEL_STYLE,
  BASE_CHART,
  BASE_GRID,
  BASE_TOOLTIP,
  compactAxisNumber,
} from "./chart-theme";
import type { TrendSeries } from "./trend-chart";

/**
 * Grouped or stacked bars, for comparing named things rather than time —
 * campaign against campaign, platform against platform.
 *
 * Horizontal is the default for long labels: "Abandoned Checkout Recovery"
 * rotated 45° at the foot of a chart is unreadable, and a category axis running
 * down the side has room for the whole name.
 */
export function BarsChart({
  categories,
  series,
  colors,
  horizontal = false,
  stacked = false,
  height = 300,
  unit,
}: {
  categories: string[];
  series: TrendSeries[];
  colors: readonly string[];
  horizontal?: boolean;
  stacked?: boolean;
  height?: number;
  unit?: string;
}) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { ...BASE_CHART, type: "bar", stacked },
      colors: [...colors],
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          horizontal,
          borderRadius: 4,
          borderRadiusApplication: "end",
          columnWidth: series.length > 2 ? "70%" : "42%",
          barHeight: "62%",
        },
      },
      stroke: { show: false },
      grid: {
        ...BASE_GRID,
        /* Rules run perpendicular to the bars, so they always read as a scale. */
        xaxis: { lines: { show: horizontal } },
        yaxis: { lines: { show: !horizontal } },
      },
      legend: { show: false },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: AXIS_LABEL_STYLE,
          hideOverlappingLabels: true,
          formatter: horizontal ? compactAxisNumber : undefined,
          /* Long campaign names get room to truncate rather than collide. */
          trim: !horizontal,
          maxHeight: 46,
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: AXIS_LABEL_STYLE,
          maxWidth: horizontal ? 160 : undefined,
          formatter: horizontal ? undefined : compactAxisNumber,
        },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        shared: true,
        intersect: false,
        y: {
          formatter: (value: number) =>
            unit ? `${formatNumber(value)} ${unit}` : formatNumber(value),
        },
      },
    }),
    [categories, colors, horizontal, series.length, stacked, unit],
  );

  return <ApexChart type="bar" height={height} options={options} series={series} />;
}
