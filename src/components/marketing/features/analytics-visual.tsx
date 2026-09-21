import { TrendingUp } from "lucide-react";

import { PanelLabel, ProductFrame } from "./feature-section";

/**
 * Two charts and a funnel. Not ten.
 *
 * An analytics section that shows everything proves nothing — a wall of small
 * multiples reads as a stock photo of a dashboard. So this picks the three
 * questions the module exists to answer and shows only those: is revenue
 * growing, which channel produced it, and where do people fall out.
 *
 * The revenue chart is one series in one hue, which is the design system's rule
 * for a single-series chart. The channel split is three bars in the three
 * channel colours the rest of the product already uses for WhatsApp, Email and
 * SMS, so a reader who has scrolled this far recognises them without a legend.
 *
 * Drawn in SVG at a fixed viewBox and stretched with `preserveAspectRatio`, so
 * there is no chart library on a marketing page and nothing to hydrate.
 */

const REVENUE = [28, 34, 31, 42, 48, 46, 58, 64, 61, 72, 78, 86];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const PEAK = Math.max(...REVENUE);

/** The polyline, in a 0–100 box. */
const points = REVENUE.map((value, index) => {
  const x = (index / (REVENUE.length - 1)) * 100;
  const y = 100 - (value / PEAK) * 88;
  return `${x},${y}`;
}).join(" ");

const CHANNELS = [
  { name: "WhatsApp", value: "$28.4K", share: 100, bar: "bg-whatsapp" },
  { name: "Email", value: "$14.1K", share: 50, bar: "bg-email" },
  { name: "SMS", value: "$5.7K", share: 20, bar: "bg-sms" },
];

const FUNNEL = [
  { label: "Reached", value: "47,460", width: "100%" },
  { label: "Engaged", value: "13,600", width: "58%" },
  { label: "Converted", value: "1,712", width: "22%" },
];

export function AnalyticsVisual() {
  return (
    <ProductFrame path="/dashboard/analytics" status="Live">
      <div className="space-y-3 bg-background p-3 sm:p-4">
        {/* Revenue over twelve months */}
        <div className="rounded-panel border border-border bg-surface p-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <PanelLabel>Revenue attributed</PanelLabel>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-text">
              <TrendingUp className="size-3" aria-hidden />
              +32.8%
            </span>
          </div>

          <p className="mt-1.5 font-heading text-2xl leading-none font-bold text-text-primary tabular-nums">
            $48,240
          </p>

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="mt-3 h-24 w-full"
            role="img"
            aria-label="Attributed revenue rising over twelve months, from twenty-eight thousand to eighty-six thousand."
          >
            <defs>
              <linearGradient id="mf-features-rev" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity="0.26"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <polygon points={`0,100 ${points} 100,100`} fill="url(#mf-features-rev)" />
            <polyline
              points={points}
              fill="none"
              stroke="var(--color-chart-1)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div
            aria-hidden
            className="mt-1.5 flex justify-between text-[9px] text-text-muted"
          >
            {MONTHS.map((month, index) => (
              <span key={index}>{month}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Where it came from */}
          <div className="rounded-panel border border-border bg-surface p-3">
            <PanelLabel>By channel</PanelLabel>
            <ul className="mt-2.5 space-y-2.5">
              {CHANNELS.map((channel) => (
                <li key={channel.name}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] text-text-secondary">
                      {channel.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold text-text-primary tabular-nums">
                      {channel.value}
                    </span>
                  </div>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <span
                      className={`block h-full rounded-full ${channel.bar}`}
                      style={{ width: `${channel.share}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Where they drop out */}
          <div className="rounded-panel border border-border bg-surface p-3">
            <PanelLabel>Conversion funnel</PanelLabel>
            <ul className="mt-2.5 space-y-2">
              {FUNNEL.map((step) => (
                <li key={step.label} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 truncate text-[11px] text-text-secondary">
                    {step.label}
                  </span>
                  <span className="h-4 flex-1 overflow-hidden rounded-btn bg-surface-secondary">
                    <span
                      className="block h-full rounded-btn bg-primary/85"
                      style={{ width: step.width }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right text-[11px] font-bold text-text-primary tabular-nums">
                    {step.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ProductFrame>
  );
}
