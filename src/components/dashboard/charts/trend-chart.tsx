"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { ApexChart } from "./apex-chart";
import {
  AXIS_LABEL_STYLE,
  BASE_CHART,
  BASE_GRID,
  BASE_TOOLTIP,
  CHART_COLORS,
  compactAxisCurrency,
  compactAxisNumber,
} from "./chart-theme";

export interface TrendSeries {
  name: string;
  data: number[];
}

export type TrendFormat = "number" | "currency" | "percent";

/**
 * The workhorse time-series chart.
 *
 * Generic over colour and value format because every channel module needs the
 * same chart in its own accent: one component with a `colors` prop beats four
 * near-identical files that drift apart the first time the grid or tooltip is
 * adjusted.
 *
 * `area` fills the first series and leaves the rest as lines — stacking two
 * gradients makes the overlap unreadable, and the first series is the one the
 * card is about. `line` fills nothing, for charts comparing peers.
 */
export function TrendChart({
  categories,
  series,
  colors,
  variant = "area",
  format = "number",
  /** Appended in the tooltip, e.g. "sent" → "4,320 sent". */
  unit,
  height = 300,
  yAxisMax,
}: {
  categories: string[];
  series: TrendSeries[];
  colors: readonly string[];
  variant?: "area" | "line";
  format?: TrendFormat;
  unit?: string;
  height?: number;
  /** Pins the scale — needed on rate charts so 96% and 98% are not a cliff. */
  yAxisMax?: number;
}) {
  const options = useMemo<ApexOptions>(() => {
    const formatValue = (value: number) => {
      const base =
        format === "currency"
          ? formatCurrency(value)
          : format === "percent"
            ? formatPercent(value)
            : formatNumber(value);
      return unit ? `${base} ${unit}` : base;
    };

    return {
      chart: { ...BASE_CHART, type: variant },
      colors: [...colors],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2.5 },
      fill:
        variant === "line"
          ? { type: "solid", opacity: 0 }
          : {
              /* Only the lead series is filled; `opacity` zeroes the rest. */
              type: series.map((_, index) => (index === 0 ? "gradient" : "solid")),
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.24,
                opacityTo: 0.02,
                stops: [0, 100],
              },
              opacity: series.map((_, index) => (index === 0 ? 1 : 0)),
            },
      grid: BASE_GRID,
      legend: { show: false },
      markers: {
        size: 0,
        strokeWidth: 2,
        strokeColors: CHART_COLORS.surface,
        hover: { size: 5 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: AXIS_LABEL_STYLE, rotate: 0, hideOverlappingLabels: true },
        tooltip: { enabled: false },
        crosshairs: { stroke: { color: CHART_COLORS.grid, width: 1, dashArray: 4 } },
      },
      yaxis: {
        tickAmount: 4,
        max: yAxisMax,
        labels: {
          style: AXIS_LABEL_STYLE,
          formatter:
            format === "currency"
              ? compactAxisCurrency
              : format === "percent"
                ? (value: number) => `${Math.round(value)}%`
                : compactAxisNumber,
        },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        shared: true,
        intersect: false,
        y: { formatter: formatValue },
      },
    };
  }, [categories, colors, format, series, unit, variant, yAxisMax]);

  return <ApexChart type={variant} height={height} options={options} series={series} />;
}
