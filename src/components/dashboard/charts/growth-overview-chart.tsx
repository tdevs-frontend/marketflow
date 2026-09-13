"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { formatCurrency, formatNumber } from "@/lib/format";
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

export interface GrowthOverviewChartProps {
  categories: string[];
  current: number[];
  /** Same window, one period back. Drawn faint so it reads as a reference. */
  previous: number[];
  seriesName: string;
  format: "number" | "currency";
  height?: number;
}

/**
 * The tooltip's own markup.
 *
 * Apex's built-in shared tooltip can list both series but cannot state the one
 * thing the comparison exists to answer — how far ahead of the previous period
 * this point is — so the row is computed here and the two series are laid out
 * as a small table rather than as two bullets of running text.
 */
function tooltipMarkup({
  label,
  seriesName,
  currentValue,
  previousValue,
  formatValue,
}: {
  label: string;
  seriesName: string;
  currentValue: number;
  previousValue: number;
  formatValue: (value: number) => string;
}): string {
  const change =
    previousValue === 0 ? null : ((currentValue - previousValue) / previousValue) * 100;

  const changeMarkup =
    change === null
      ? `<span class="text-sm font-medium text-text-muted">—</span>`
      : `<span class="text-sm font-bold tabular-nums ${
          change >= 0 ? "text-primary" : "text-error"
        }">${change >= 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}%</span>`;

  const row = (swatch: string, name: string, value: number) => `
    <div class="flex items-center justify-between gap-6">
      <span class="inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <span class="size-2 shrink-0 rounded-full" style="background:${swatch}"></span>
        ${name}
      </span>
      <span class="text-sm font-bold text-text-primary tabular-nums">${formatValue(value)}</span>
    </div>`;

  return `
    <div class="min-w-48 p-3">
      <p class="text-sm font-medium text-text-muted">${label}</p>
      <div class="mt-2 flex flex-col gap-1.5">
        ${row(CHART_COLORS.primary, seriesName, currentValue)}
        ${row(CHART_COLORS.neutral, "Previous period", previousValue)}
      </div>
      <div class="mt-2 flex items-center justify-between gap-6 border-t border-border pt-2">
        <span class="text-sm text-text-muted">Change</span>
        ${changeMarkup}
      </div>
    </div>`;
}

export function GrowthOverviewChart({
  categories,
  current,
  previous,
  seriesName,
  format,
  height = 300,
}: GrowthOverviewChartProps) {
  const options = useMemo<ApexOptions>(() => {
    const isCurrency = format === "currency";
    const formatValue = (value: number) =>
      isCurrency ? formatCurrency(value) : formatNumber(value);

    return {
      chart: { ...BASE_CHART, type: "area" },
      /* Brand indigo leads; the comparison line stays neutral so the eye is
         never asked to weigh two colours of equal strength against each other. */
      colors: [CHART_COLORS.primary, CHART_COLORS.neutral],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: [2.5, 1.5], dashArray: [0, 5] },
      /* Only the current period is filled. Two stacked gradients would muddy
         the overlap and make neither series readable. */
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.24,
          opacityTo: 0.01,
          stops: [0, 100],
        },
        opacity: [1, 0],
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
        crosshairs: {
          stroke: { color: CHART_COLORS.grid, width: 1, dashArray: 4 },
        },
      },
      yaxis: {
        labels: {
          style: AXIS_LABEL_STYLE,
          formatter: isCurrency ? compactAxisCurrency : compactAxisNumber,
        },
        /* Four ticks is enough to read a trend and leaves the card uncluttered. */
        tickAmount: 4,
      },
      tooltip: {
        ...BASE_TOOLTIP,
        shared: true,
        intersect: false,
        custom: ({ series, dataPointIndex, w }) =>
          tooltipMarkup({
            label:
              w.globals.categoryLabels?.[dataPointIndex] ??
              w.globals.labels?.[dataPointIndex] ??
              "",
            seriesName,
            currentValue: series[0]?.[dataPointIndex] ?? 0,
            previousValue: series[1]?.[dataPointIndex] ?? 0,
            formatValue,
          }),
      },
    };
  }, [categories, format, seriesName]);

  return (
    <ApexChart
      type="area"
      height={height}
      options={options}
      series={[
        { name: seriesName, data: current },
        { name: "Previous period", data: previous },
      ]}
    />
  );
}
