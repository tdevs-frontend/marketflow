import type { ApexOptions } from "apexcharts";

/**
 * Mirrors the tokens in `styles/variables.css`, as literal hex: ApexCharts
 * reads these back to compute gradient stops and hover shades, which
 * `var(--color-…)` cannot satisfy. Keep both in step.
 */
export const CHART_COLORS = {
  primary: "#128c7e",
  primaryDark: "#075e54",
  primaryLight: "#25d366",
  accent: "#34b7f1",
  neutral: "#cbd5e1",
  grid: "#e2e8f0",
  surface: "#ffffff",
  textMuted: "#7b8794",
  textSecondary: "#52606d",
  error: "#dc2626",
} as const;

/* Green leads, blue supports, then neutral. Runs out on purpose — no rainbows. */
export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.neutral,
] as const;

/** Shared `chart` block. Toolbar and zoom off — this is a read-only dashboard. */
export const BASE_CHART: ApexOptions["chart"] = {
  fontFamily: "inherit",
  toolbar: { show: false },
  zoom: { enabled: false },
  parentHeightOffset: 0,
  animations: { enabled: true, speed: 350 },
};

/** Horizontal rules only. Vertical gridlines add noise and carry no reading. */
export const BASE_GRID: ApexOptions["grid"] = {
  borderColor: CHART_COLORS.grid,
  strokeDashArray: 4,
  xaxis: { lines: { show: false } },
  yaxis: { lines: { show: true } },
  padding: { top: 0, right: 8, bottom: 0, left: 8 },
};

export const AXIS_LABEL_STYLE = {
  colors: CHART_COLORS.textMuted,
  fontSize: "11px",
  fontWeight: 500,
};

export const BASE_TOOLTIP: ApexOptions["tooltip"] = {
  theme: "light",
  style: { fontSize: "12px" },
  marker: { show: true },
};

/** Axis ticks: compact above 10k so the scale never wraps or truncates. */
export function compactAxisNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return `${Math.round(value)}`;
}

export function compactAxisCurrency(value: number): string {
  return `$${compactAxisNumber(value)}`;
}

/**
 * One colour per channel, matching `--color-chart-*` in `variables.css` and
 * `CHANNEL_THEME[…].hex` in `constants/channels`. Four hues far enough apart
 * to be told apart in a legend at 8px: green, blue, violet, slate.
 */
export const CHANNEL_CHART_COLORS = {
  whatsapp: "#128c7e",
  email: "#2563eb",
  sms: "#7c3aed",
  social: "#64748b",
} as const;

/** The four platform marks, for the Social Planner's comparison charts. */
export const PLATFORM_CHART_COLORS = {
  instagram: "#d62976",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
  x: "#17212b",
} as const;

/**
 * The funnel ramp: one hue, darkest at the top of the funnel and lightening as
 * the population thins. A funnel drawn in four different hues implies four
 * unrelated things; it is one population losing people at each step.
 */
export const FUNNEL_RAMP = [
  "#075e54",
  "#128c7e",
  "#25d366",
  "#7dd6b0",
  "#b7ded8",
] as const;

/** Delivery outcomes, in the order they are always stacked. */
export const OUTCOME_COLORS = {
  delivered: "#128c7e",
  read: "#25d366",
  clicked: "#34b7f1",
  replied: "#075e54",
  failed: "#dc2626",
  neutral: "#cbd5e1",
} as const;
