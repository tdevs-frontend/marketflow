import {
  BarChart3,
} from "lucide-react";

import { AnalyticsDashboard } from "./analytics-dashboard";

export function AnalyticsSection() {
  return (
    <section
      aria-labelledby="analytics-title"
      className="section-space-py relative isolate overflow-hidden bg-background"
    >
      {/* Dot texture, faded at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] bg-[size:22px_22px] opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      {/* Mint bloom behind the dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-224 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.08),transparent)]"
      />

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-text-secondary uppercase shadow-card">
            <BarChart3 className="size-3.5 text-primary" aria-hidden />
            Marketing Analytics
          </p>

          <h2
            id="analytics-title"
            className="mt-6 text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Know what&rsquo;s working. Grow what matters.
          </h2>

          <p className="mt-5 text-lg leading-[1.7] text-text-secondary text-pretty">
            Track campaigns, conversations, leads and conversions in real time.
            See where your growth comes from and turn marketing data into{" "}
            <span className="font-semibold text-primary">
              measurable growth
            </span>
            .
          </p>
        </header>

        <AnalyticsDashboard />
      </div>
    </section>
  );
}
