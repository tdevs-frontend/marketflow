import type { ApexOptions } from "apexcharts";

/**
 * Mirrors the tokens in `styles/variables.css`, as literal hex: ApexCharts
 * reads these back to compute gradient stops and hover shades, which
 * `var(--color-…)` cannot satisfy. Keep both in step.
 */
export const CHART_COLORS = {
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  primaryLight: "#818cf8",
  accent: "#06b6d4",
  neutral: "#cbd5e1",
  grid: "#e2e8f0",
  surface: "#ffffff",
  textMuted: "#64748b",
  textSecondary: "#475569",
  error: "#dc2626",
} as const;

/* Indigo leads, cyan supports, then neutral. Runs out on purpose — no rainbows. */
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
 * The funnel ramp: one hue, darkest at the top of the funnel and lightening as
 * the population thins. A funnel drawn in four different hues implies four
 * unrelated things; it is one population losing people at each step.
 */
export const FUNNEL_RAMP = [
  "#3730a3",
  "#4f46e5",
  "#6366f1",
  "#a5b4fc",
  "#c7d2fe",
] as const;

/**
 * The series ramp for a channel's multi-series charts.
 *
 * Every chart in a channel module reads its colours from here rather than
 * passing hex literals, so a brand change is one edit and two charts in the
 * same module can never drift apart. The channel's own accent leads; the
 * supporting colours are chosen to stay distinguishable from it at a 2px
 * stroke, which is why WhatsApp takes a second green from its own ramp while
 * the others fall back to the shared blue and neutral.
 *
 * Literal hex, not `var(--color-…)`: ApexCharts reads these back to compute
 * gradient stops and hover shades. Keep them in step with `CHANNEL_THEME`.
 */
export const CHANNEL_SERIES = {
  whatsapp: ["#059669", "#34d399", "#cbd5e1"],
  email: ["#2563eb", "#60a5fa", "#cbd5e1"],
  sms: ["#9333ea", "#c084fc", "#cbd5e1"],
  social: ["#64748b", "#94a3b8", "#cbd5e1"],
} as const satisfies Record<string, readonly [string, string, string]>;

/**
 * A rate chart's colours, keyed by what a fall in the rate means.
 *
 * `good` is the channel's own accent, `warn` the shared blue, and `bad` the
 * error red — so a bounce, opt-out or failure line is red in every module
 * without each one deciding for itself.
 */
export const RATE_COLORS = {
  warn: "#f59e0b",
  bad: "#dc2626",
} as const;

/**
 * The two-series pair for a channel: its own hue and a lighter step of it.
 *
 * Used wherever a chart compares exactly two measures of the same thing — a
 * read rate against a reply rate, an open against a click. Same hue because
 * they *are* the same population measured twice; two unrelated colours would
 * imply two unrelated things. Taken from `CHANNEL_SERIES` rather than
 * restated, so the pair can never disagree with the trio above it.
 */
export const channelPair = (channel: keyof typeof CHANNEL_SERIES) =>
  [CHANNEL_SERIES[channel][0], CHANNEL_SERIES[channel][1]] as const;

/**
 * The default trio for a chart that is not about a single channel — lead
 * sources, for instance. Brand green, the shared blue, then neutral: three
 * hues far enough apart to read at a 2px stroke without implying that any of
 * them is a channel.
 */
export const BRAND_SERIES = ["#4f46e5", "#06b6d4", "#cbd5e1"] as const;

/**
 * Delivery outcomes, in the order they are always stacked: the good outcome
 * first so it sits at the base of the bar, then the partial one, then failure.
 */
export const OUTCOME_COLORS = {
  succeeded: "#34d399",
  partial: "#059669",
  failed: "#dc2626",
  neutral: "#cbd5e1",
} as const;

/**
 * Five steps of one violet hue, for the SMS spend donut. A cost breakdown is
 * one quantity split by destination, so it takes a ramp rather than five hues.
 */
export const SPEND_RAMP = [
  "#9333ea",
  "#c084fc",
  "#e9d5ff",
  "#cbd5e1",
  "#e2e8f0",
] as const;
