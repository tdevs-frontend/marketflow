"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { formatCurrency } from "@/lib/format";
import { ApexChart } from "./apex-chart";
import {
  AXIS_LABEL_STYLE,
  BASE_CHART,
  BASE_GRID,
  BASE_TOOLTIP,
  CHART_COLORS,
  compactAxisCurrency,
} from "./chart-theme";

export interface ProductRevenueChartProps {
  products: string[];
  revenue: number[];
  height?: number;
}

/** The list ranks and gives figures; this shows how far ahead the leader is. */
export function ProductRevenueChart({
  products,
  revenue,
  height = 200,
}: ProductRevenueChartProps) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { ...BASE_CHART, type: "bar" },
      colors: [CHART_COLORS.primary],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          borderRadiusApplication: "end",
          barHeight: "56%",
        },
      },
      dataLabels: { enabled: false },
      grid: {
        ...BASE_GRID,
        /* Flipped for a horizontal chart: the rules that help now run down. */
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { top: -12, right: 8, bottom: -8, left: 8 },
      },
      legend: { show: false },
      xaxis: {
        categories: products,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: AXIS_LABEL_STYLE,
          formatter: (value: string) => compactAxisCurrency(Number(value)),
        },
      },
      yaxis: {
        labels: {
          style: { ...AXIS_LABEL_STYLE, colors: CHART_COLORS.textSecondary },
        },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        y: { formatter: (value: number) => formatCurrency(value) },
      },
    }),
    [products],
  );

  return (
    <ApexChart
      type="bar"
      height={height}
      options={options}
      series={[{ name: "Revenue", data: revenue }]}
    />
  );
}
