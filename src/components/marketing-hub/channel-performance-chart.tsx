"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { ApexChart } from "@/components/dashboard/charts/apex-chart";
import {
  AXIS_LABEL_STYLE,
  BASE_CHART,
  BASE_GRID,
  BASE_TOOLTIP,
  CHART_COLORS,
  compactAxisNumber,
} from "@/components/dashboard/charts/chart-theme";
import { formatNumber } from "@/lib/format";

export interface ChannelSeries {
  name: string;
  data: number[];
}

/**
 * Messages sent per channel over the period.
 *
 * Three series is the point of the card, so this is the one chart in the app
 * that uses all three palette colours — brand green leads because WhatsApp is
 * the channel that carries the volume.
 */
export function ChannelPerformanceChart({
  categories,
  series,
  height = 300,
}: {
  categories: string[];
  series: ChannelSeries[];
  height?: number;
}) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { ...BASE_CHART, type: "area", stacked: false },
      colors: [CHART_COLORS.primary, CHART_COLORS.accent, CHART_COLORS.neutral],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2.5 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.22,
          opacityTo: 0.02,
          stops: [0, 100],
        },
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
        labels: { style: AXIS_LABEL_STYLE, hideOverlappingLabels: true },
        tooltip: { enabled: false },
        crosshairs: {
          stroke: { color: CHART_COLORS.grid, width: 1, dashArray: 4 },
        },
      },
      yaxis: {
        tickAmount: 4,
        labels: { style: AXIS_LABEL_STYLE, formatter: compactAxisNumber },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        shared: true,
        intersect: false,
        y: { formatter: (value: number) => `${formatNumber(value)} sent` },
      },
    }),
    [categories],
  );

  return <ApexChart type="area" height={height} options={options} series={series} />;
}
