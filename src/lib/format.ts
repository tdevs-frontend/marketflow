export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: value >= 10_000 ? "compact" : "standard" }).format(
    value,
  );
}

/**
 * A count with thousands separators and no compacting.
 *
 * `formatNumber` switches to compact notation above 10,000, which is right in a
 * chart axis or a dense table cell where horizontal room is the constraint.
 * It is wrong on a headline KPI: "24,580" is only two characters longer than
 * "24.6K" at 28px type and does not throw away the precision the number was
 * measured to. Use this wherever a figure is the point of the element.
 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function formatRelativeTime(value: string | Date): string {
  const diff = new Date(value).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) return formatter.format(Math.round(diff / ms), unit);
  }
  return formatter.format(Math.round(diff / 1000), "second");
}

/** Renders a rate as a percentage of a total, guarding against divide-by-zero. */
export function rate(part: number, total: number): number {
  return total === 0 ? 0 : (part / total) * 100;
}
