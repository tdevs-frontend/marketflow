import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { StatValue } from "./stat-value";

export type TrustStat = {
  /** Rendered as-is; the leading number counts up, the unit takes the brand tint. */
  value: string;
  label: string;
  description: string;
};

export type TrustLogoMark = "orbit" | "prism" | "stack" | "arc" | "grid";

export type TrustLogo = {
  name: string;
  mark: TrustLogoMark;
};

const STATS: TrustStat[] = [
  {
    value: "10K+",
    label: "Active Businesses",
    description: "Growing with our platform",
  },
  {
    value: "250K+",
    label: "Leads Managed",
    description: "Across multiple campaigns",
  },
  {
    value: "1M+",
    label: "Customer Conversations",
    description: "Managed through automation",
  },
  {
    value: "98%",
    label: "Customer Satisfaction",
    description: "Trusted by growing teams",
  },
];

/** Placeholder wordmarks — swap for real customer logos when they're cleared. */
const LOGOS: TrustLogo[] = [
  { name: "Northwind", mark: "orbit" },
  { name: "Cartwheel", mark: "prism" },
  { name: "Meridian", mark: "stack" },
  { name: "Fieldnote", mark: "arc" },
  { name: "Lumen Retail", mark: "grid" },
];

const MARKS: Record<TrustLogoMark, ReactNode> = {
  orbit: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  prism: <path d="M12 4.5 20 19H4L12 4.5Z" strokeLinejoin="round" />,
  stack: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
      <path d="M9 12h6" />
    </>
  ),
  arc: <path d="M5 18a7 7 0 0 1 14 0" strokeLinecap="round" />,
  grid: (
    <>
      <rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
      <rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
      <rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
    </>
  ),
};

/**
 * Cell rules keep the grid reading as one connected table rather than four
 * floating cards: 2 columns below `lg`, 4 across it, with hairlines only
 * between cells and never on the outer edge.
 */
function cellBorders(index: number) {
  return cn(
    index % 2 === 1 && "border-l border-border",
    index >= 2 && "border-t border-border",
    "lg:border-t-0",
    index === 0 ? "lg:border-l-0" : "lg:border-l lg:border-border",
  );
}

export function TrustStats() {
  return (
    <section
      aria-labelledby="trust-stats-title"
      className="section-space-py border-y border-border bg-surface"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-3 pr-3.5 text-xs font-medium text-text-secondary shadow-card">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            Trusted by growing businesses
          </p>

          <h2
            id="trust-stats-title"
            className="mt-5 text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Built to help businesses grow with confidence
          </h2>

          <p className="mt-4 text-base leading-relaxed text-text-secondary text-pretty sm:text-lg">
            Teams run their customers, leads, campaigns and follow-ups from one workspace — and
            replace the guesswork with numbers they can act on.
          </p>
        </header>

        <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-border bg-background lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col p-6 text-center transition-colors duration-200 hover:bg-surface sm:p-8",
                cellBorders(index),
              )}
            >
              <dd className="order-1 font-heading text-4xl font-bold tracking-tight whitespace-nowrap text-text-primary sm:text-5xl">
                <StatValue value={stat.value} />
              </dd>
              <dt className="order-2 mt-3 text-sm font-semibold text-text-primary">{stat.label}</dt>
              <dd className="order-3 mt-1 text-xs text-text-muted">{stat.description}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col items-center gap-7">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
            Trusted by teams worldwide
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
            {LOGOS.map((logo) => (
              <li
                key={logo.name}
                className="flex items-center gap-2.5 text-text-muted transition-colors duration-200 hover:text-text-secondary"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  {MARKS[logo.mark]}
                </svg>
                <span className="font-heading text-sm font-bold tracking-tight whitespace-nowrap">
                  {logo.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
