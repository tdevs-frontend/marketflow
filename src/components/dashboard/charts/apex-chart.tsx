"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

import { cn } from "@/lib/utils";

/**
 * The single place ApexCharts enters the app. It touches `window` at module
 * scope, so `ssr: false` keeps it out of the server bundle — and that flag is
 * only legal in a Client Component, which is why this is the boundary.
 */
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="size-full animate-pulse rounded-panel bg-surface-secondary" />
  ),
});

export type ApexChartType = "line" | "area" | "bar" | "donut";

export interface ApexChartProps {
  type: ApexChartType;
  series: ApexOptions["series"];
  options: ApexOptions;
  /** Fixed, so the skeleton reserves the chart's exact box. */
  height: number | string;
  className?: string;
}

export function ApexChart({
  type,
  series,
  options,
  height,
  className,
}: ApexChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ReactApexChart
        type={type}
        series={series}
        options={options}
        height="100%"
        width="100%"
      />
    </div>
  );
}
