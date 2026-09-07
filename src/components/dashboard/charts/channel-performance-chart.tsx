"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { ApexChart } from "./apex-chart";
import {
  BASE_CHART,
  BASE_TOOLTIP,
  CHART_COLORS,
  SERIES_COLORS,
} from "./chart-theme";

export interface ChannelPerformanceChartProps {
  labels: string[];
  /** Share of marketing contribution, in percent. Should total 100. */
  values: number[];
  /** Rendered in the middle of the ring. */
  totalLabel: string;
  totalValue: string;
}

/** Three parts of one whole, and the question is which dominates. */
export function ChannelPerformanceChart({
  labels,
  values,
  totalLabel,
  totalValue,
}: ChannelPerformanceChartProps) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { ...BASE_CHART, type: "donut" },
      labels,
      colors: [...SERIES_COLORS],
      stroke: { width: 2, colors: [CHART_COLORS.surface] },
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: 18,
                color: CHART_COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
              },
              value: {
                show: true,
                offsetY: -16,
                color: "#17212b",
                fontSize: "22px",
                fontWeight: 700,
              },
              total: {
                show: true,
                showAlways: true,
                label: totalLabel,
                color: CHART_COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                formatter: () => totalValue,
              },
            },
          },
        },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        y: { formatter: (value: number) => `${value}% of contribution` },
      },
      states: { hover: { filter: { type: "lighten" } } },
    }),
    [labels, totalLabel, totalValue],
  );

  return <ApexChart type="donut" height={220} options={options} series={values} />;
}
