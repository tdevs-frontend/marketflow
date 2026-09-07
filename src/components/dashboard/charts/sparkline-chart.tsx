"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { ApexChart } from "./apex-chart";
import { BASE_CHART, CHART_COLORS } from "./chart-theme";

export interface SparklineChartProps {
  data: number[];
  /** Stroke colour only. */
  trend?: "up" | "down";
  height?: number;
}

/** KPI trend line. No axes or tooltip — at 40px the shape is the only signal. */
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
