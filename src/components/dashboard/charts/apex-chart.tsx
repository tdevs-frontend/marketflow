"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

import { cn } from "@/lib/utils";

/**
 * The single place ApexCharts enters the app.
 *
 * ApexCharts touches `window` while its module is still evaluating, so it can
 * never take part in the server pass — `ssr: false` keeps it out of the server
 * bundle entirely rather than failing at render time. `next/dynamic` with that
 * flag is only legal inside a Client Component, which is why this wrapper is
 * the boundary and every chart below it can stay a plain component.
 *
 * The outer div owns the height so the skeleton reserves the exact same box
 * the chart will occupy, and nothing on the page shifts when it swaps in.
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
  /** Any CSS length. Fixed, so the skeleton and the chart agree. */
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
