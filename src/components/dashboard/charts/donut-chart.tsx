"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import { formatNumber } from "@/lib/format";
import { ApexChart } from "./apex-chart";
import { BASE_CHART, BASE_TOOLTIP, CHART_COLORS } from "./chart-theme";

/**
 * Share of a total — messages by channel, posts by platform.
 *
 * A donut rather than a pie so the centre can carry the total, which is the
 * number people look for first; and only where the parts genuinely sum to a
 * whole. For anything else a bar chart compares lengths more accurately than
 * the eye compares angles.
 */
export function DonutChart({
  labels,
  values,
  colors,
  /** Shown large in the hole. Pass the pre-formatted total. */
  centerLabel,
  centerValue,
  height = 260,
}: {
  labels: string[];
  values: number[];
  colors: readonly string[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
}) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { ...BASE_CHART, type: "donut" },
      labels,
      colors: [...colors],
      dataLabels: { enabled: false },
      legend: { show: false },
      /* A white ring between slices does the work a stroke colour would, and
         keeps the shape clean where two slices are nearly the same size. */
      stroke: { width: 2, colors: [CHART_COLORS.surface] },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: Boolean(centerValue),
              name: {
                show: Boolean(centerLabel),
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
                formatter: () => centerValue ?? "",
              },
              total: {
                show: true,
                showAlways: true,
                label: centerLabel ?? "",
                color: CHART_COLORS.textMuted,
                fontSize: "11px",
                fontWeight: 500,
                formatter: () => centerValue ?? "",
              },
            },
          },
        },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        y: { formatter: (value: number) => formatNumber(value) },
      },
      states: { hover: { filter: { type: "darken" } } },
    }),
    [centerLabel, centerValue, colors, labels],
  );

  return <ApexChart type="donut" height={height} options={options} series={values} />;
}
