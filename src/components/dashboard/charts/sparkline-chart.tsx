"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { ApexChart } from "./apex-chart";
import { BASE_CHART, CHART_COLORS } from "./chart-theme";

export interface SparklineChartProps {
  data: number[];
  /** Drives the stroke colour only — the shape already tells the story. */
  trend?: "up" | "down";
  height?: number;
}

/**
 * The KPI card trend line. No axes, no grid, no tooltip: at this size the only
 * readable signal is the shape, and a tooltip on a 40px chart is a hit target
 * nobody wants.
 */
export function SparklineChart({
  data,
  trend = "up",
  height = 40,
}: SparklineChartProps) {
  const color = trend === "up" ? CHART_COLORS.primary : CHART_COLORS.error;

  const options = useMemo<ApexOptions>(
    () => ({
      chart: { ...BASE_CHART, type: "area", sparkline: { enabled: true } },
      colors: [color],
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.26,
          opacityTo: 0,
          stops: [0, 100],
        },
      },
      tooltip: { enabled: false },
    }),
    [color],
  );

  return (
    <ApexChart
      type="area"
      height={height}
      options={options}
      series={[{ name: "Trend", data }]}
    />
  );
}
