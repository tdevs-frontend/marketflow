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

export interface CampaignPerformanceChartProps {
  campaigns: string[];
  values: number[];
  seriesName: string;
  format: "number" | "currency";
}

/**
 * Horizontal bars: campaign names are long enough that rotating them under a
 * vertical axis would cost more legibility than the extra height costs space.
 */
export function CampaignPerformanceChart({
  campaigns,
  values,
  seriesName,
  format,
}: CampaignPerformanceChartProps) {
  const options = useMemo<ApexOptions>(() => {
    const isCurrency = format === "currency";

    return {
      chart: { ...BASE_CHART, type: "bar" },
      colors: [CHART_COLORS.primary],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: "end",
          barHeight: "58%",
          distributed: false,
        },
      },
      dataLabels: { enabled: false },
      grid: {
        ...BASE_GRID,
        /* Flipped for a horizontal chart: the rules that help now run down. */
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      legend: { show: false },
      xaxis: {
        categories: campaigns,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: AXIS_LABEL_STYLE,
          formatter: (value: string) =>
            isCurrency
              ? compactAxisCurrency(Number(value))
              : compactAxisNumber(Number(value)),
        },
      },
      yaxis: {
        labels: {
          style: { ...AXIS_LABEL_STYLE, colors: CHART_COLORS.textSecondary },
        },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        y: {
          formatter: (value: number) =>
            isCurrency ? formatCurrency(value) : formatNumber(value),
        },
      },
    };
  }, [campaigns, format]);

  return (
    <ApexChart
      type="bar"
      height={300}
      options={options}
      series={[{ name: seriesName, data: values }]}
    />
  );
}
