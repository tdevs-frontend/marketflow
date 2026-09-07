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
}

export function GrowthOverviewChart({
  categories,
  current,
  previous,
  seriesName,
  format,
}: GrowthOverviewChartProps) {
  const options = useMemo<ApexOptions>(() => {
    const isCurrency = format === "currency";

    return {
      chart: { ...BASE_CHART, type: "area" },
      /* Brand green leads; the comparison line stays neutral so the eye is
         never asked to weigh two colours of equal strength against each other. */
      colors: [CHART_COLORS.primary, CHART_COLORS.neutral],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: [2.5, 2], dashArray: [0, 5] },
      /* Only the current period is filled. Two stacked gradients would muddy
         the overlap and make neither series readable. */
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.28,
          opacityTo: 0.02,
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
        y: {
          formatter: (value: number) =>
            isCurrency ? formatCurrency(value) : formatNumber(value),
        },
      },
    };
  }, [categories, format]);

  return (
    <ApexChart
      type="area"
      height={300}
      options={options}
      series={[
        { name: seriesName, data: current },
        { name: "Previous period", data: previous },
      ]}
    />
  );
}
