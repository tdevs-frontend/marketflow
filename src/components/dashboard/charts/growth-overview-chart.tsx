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

/**
 * The overview chart's axis type, set from the product's own scale.
 *
 * Three departures from the shared `AXIS_LABEL_STYLE`, and the first is the
 * one that matters: in this project a weight *is* a family — `--font-medium`
 * points at a real medium cut, and neither typeface declares a `font-weight`
 * on its faces. Asking Apex for `fontWeight: 500` therefore does not reach that
 * cut at all; it hands the browser the Book face and a number, and the browser
 * synthesises a fake medium. Naming the family and pinning the weight back to
 * 400 is the same trick `globals.css` plays on `b, strong`.
 *
 * The colour moves from `textMuted` to `textSecondary` — the page's own body
 * ink — and the size from 11px to the 13px metadata step, the floor the rest
 * of the dashboard keeps to. Scoped to this file rather than pushed into the shared
 * constant because that one also dresses the charts in every marketing module.
 */
const AXIS_LABELS = {
  ...AXIS_LABEL_STYLE,
  /* The body face and a real 500. This used to name `--font-medium`, which was
     a *family* — the Medium cut — back when weight was spelled as a family
     name. That token is gone now that the typefaces carry their own weights,
     and a chart asking for a variable that no longer resolves would have
     dropped its axis labels to ApexCharts' built-in Helvetica. */
  fontFamily: "var(--font-primary)",
  fontWeight: 500,
  fontSize: "13px",
  colors: CHART_COLORS.textSecondary,
};

export interface GrowthOverviewChartProps {
  categories: string[];
  current: number[];
  /** Same window, one period back. Drawn faint so it reads as a reference. */
  previous: number[];
  seriesName: string;
  format: "number" | "currency";
  /**
   * The current series' hue, as hex.
   *
   * Passed in rather than fixed to the brand indigo because the card plots
   * three different things through one chart, and a reader who has just
   * pressed Orders should see the bars answer. Apex reads this back to compute
   * its hover shade, so it cannot be a `var(--color-…)`.
   */
  color: string;
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
  color,
}: {
  label: string;
  seriesName: string;
  currentValue: number;
  previousValue: number;
  formatValue: (value: number) => string;
  color: string;
}): string {
  const change =
    previousValue === 0 ? null : ((currentValue - previousValue) / previousValue) * 100;

  const changeMarkup =
    change === null
      ? `<span class="text-sm font-medium text-text-muted">—</span>`
      : `<span class="text-sm font-bold tabular-nums" style="color:${
          change >= 0 ? color : CHART_COLORS.error
        }">${change >= 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}%</span>`;

  /* The swatch is a rounded bar rather than a dot now that the series are
     bars — a tooltip key should look like the mark it is naming. */
  const row = (swatch: string, name: string, value: number) => `
    <div class="flex items-center justify-between gap-6">
      <span class="inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <span class="h-2.5 w-1.5 shrink-0 rounded-xs" style="background:${swatch}"></span>
        ${name}
      </span>
      <span class="text-sm font-bold text-text-primary tabular-nums">${formatValue(value)}</span>
    </div>`;

  return `
    <div class="min-w-48 p-3">
      <p class="text-sm font-medium text-text-muted">${label}</p>
      <div class="mt-2 flex flex-col gap-1.5">
        ${row(color, seriesName, currentValue)}
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
  color,
  height = 300,
}: GrowthOverviewChartProps) {
  const options = useMemo<ApexOptions>(() => {
    const isCurrency = format === "currency";
    const formatValue = (value: number) =>
      isCurrency ? formatCurrency(value) : formatNumber(value);

    return {
      chart: { ...BASE_CHART, type: "bar" },
      /*
       * The metric's own hue against a light neutral.
       *
       * The comparison used to be `neutralStrong` (#94a3b8), which is right for
       * a 1.5px dashed line and far too heavy as a filled column: at bar size
       * it carried as much weight as the series it exists to be measured
       * against. `neutral` (#cbd5e1) is the same family two steps lighter, so
       * the pair still reads as one measurement taken twice.
       */
      colors: [color, CHART_COLORS.neutral],
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          /* The house bar geometry, as `bars-chart` sets it. */
          borderRadius: 4,
          borderRadiusApplication: "end",
          /* The width of the *pair*, not of one bar. 62% leaves a gutter wider
             than the two bars are apart, so the eye groups each period
             together before it compares one period to the next. */
          columnWidth: "62%",
        },
      },
      /* Bars carry their own edge; a stroke on top of a 4px radius only
         softens the corner it is supposed to be crisping. */
      stroke: { show: false },
      fill: { opacity: 1 },
      /* A lighter rule than the shared grid. Columns sit on top of the scale
         rather than beside it, and at `--color-border` the rules read through
         the gaps as stripes across the plot. */
      grid: { ...BASE_GRID, borderColor: CHART_COLORS.gridSoft },
      legend: { show: false },
      /*
       * Deepen the hovered bar rather than lighten it.
       *
       * Apex's default hover is `lighten`, which washes a column towards white
       * and is the one direction that costs the bar its identity — on the
       * Orders tab a lightened green reads as a different green. Darkening
       * keeps the hue and still registers as a response. `active` is off
       * because a bar is not selectable and its click wash only looks broken.
       */
      states: {
        hover: { filter: { type: "darken", value: 0.9 } },
        active: { filter: { type: "none" } },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: AXIS_LABELS, rotate: 0, hideOverlappingLabels: true },
        tooltip: { enabled: false },
        /* A soft band behind the hovered category, in place of the line
           chart's dashed crosshair — a vertical rule through a column means
           nothing, whereas the band says which pair the tooltip belongs to. */
        crosshairs: {
          fill: { type: "solid", color: CHART_COLORS.gridSoft },
          stroke: { width: 0 },
        },
      },
      yaxis: {
        labels: {
          style: AXIS_LABELS,
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
            color,
          }),
      },
      /*
       * Phone width, where the 12-month range puts twenty-four columns in
       * about 300px. Widening the pair to 86% spends the gutter between
       * categories on the bars themselves, which is the trade worth making
       * when the alternative is twenty-four hairlines.
       */
      responsive: [
        {
          breakpoint: 640,
          options: {
            plotOptions: { bar: { columnWidth: "86%", borderRadius: 3 } },
          },
        },
      ],
    };
  }, [categories, color, format, seriesName]);

  return (
    <ApexChart
      type="bar"
      height={height}
      options={options}
      series={[
        { name: seriesName, data: current },
        { name: "Previous period", data: previous },
      ]}
    />
  );
}
