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
  comparisonIndex,
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
  /**
   * The index of the series holding the *previous* period.
   *
   * Set it and that series is drawn as a thin dotted line rather than a second
   * solid one, and the tooltip gains a change row comparing the two. A
   * period-over-period comparison is a different kind of series from a peer —
   * it is the same measure shifted in time — and drawing it identically
   * invites the reader to add the two lines together.
   */
  comparisonIndex?: number;
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
      stroke: {
        curve: "smooth",
        width: series.map((_, index) => (index === comparisonIndex ? 1.5 : 2.5)),
        dashArray: series.map((_, index) => (index === comparisonIndex ? 5 : 0)),
      },
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
      tooltip:
        comparisonIndex === undefined
          ? { ...BASE_TOOLTIP, shared: true, intersect: false, y: { formatter: formatValue } }
          : {
              ...BASE_TOOLTIP,
              shared: true,
              intersect: false,
              /*
               * Hand-built, because the reading people actually want here is
               * the one Apex cannot produce: the difference between the two
               * series. A default shared tooltip lists both numbers and leaves
               * the subtraction to the reader, on hover, in their head.
               */
              custom: ({ series: values, dataPointIndex }) => {
                const rows = values.map(
                  (points: number[]) => points?.[dataPointIndex] ?? 0,
                );
                const current = rows[comparisonIndex === 0 ? 1 : 0] ?? 0;
                const previous = rows[comparisonIndex] ?? 0;
                const change =
                  previous === 0 ? 0 : ((current - previous) / previous) * 100;
                const up = change >= 0;

                return `
                  <div class="mf-chart-tooltip rounded-btn border border-border bg-surface px-3 py-2 shadow-float">
                    <p class="text-meta font-medium text-text-muted">${
                      categories[dataPointIndex] ?? ""
                    }</p>
                    <p class="mt-1 text-sm font-bold text-text-primary tabular-nums">${formatValue(
                      current,
                    )}</p>
                    <p class="mt-0.5 text-meta text-text-muted tabular-nums">Previous ${formatValue(
                      previous,
                    )}</p>
                    <p class="mt-1 text-meta font-medium tabular-nums ${
                      up ? "text-success-text" : "text-error"
                    }">${up ? "+" : ""}${change.toFixed(1)}% vs previous period</p>
                  </div>
                `;
              },
            },
    };
  }, [categories, colors, comparisonIndex, format, series, unit, variant, yAxisMax]);

  return <ApexChart type={variant} height={height} options={options} series={series} />;
}
