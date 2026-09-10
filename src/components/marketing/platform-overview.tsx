import {
  ConnectionLines,
  FeatureRail,
  INBOUND_FEATURES,
  OUTBOUND_FEATURES,
  PlatformHub,
  WorkflowBar,
} from "./platform";

/**
 * The all-in-one section: MarketFlow at the centre, every module connected to
 * it, and the journey it covers along the bottom.
 *
 * The layout is one three-column grid — rail, hub, rail. Columns stretch to a
 * common height, which is the whole basis for the connectors: the hub column
 * ends up exactly as tall as the rails, so `ConnectionLines` can anchor to the
 * same `RAIL_ROWS` the rails lay their cards on and stay aligned at any width
 * without measuring anything. See `platform/connection-lines.tsx`.
 *
 * Below `lg` the connectors are dropped and the order flips: the hub comes
 * first so the phone reader meets the platform before its eight modules, which
 * then stack as a plain card grid.
 *
 * The ground is two decorative layers, both `pointer-events-none` and both
 * behind the content: a dot texture masked to a soft ellipse, and one indigo
 * bloom centred on the hub. The bloom is the section's only large colour, and
 * it is what makes the hub the brightest point on the page — see the layer
 * notes in `platform/platform-hub.tsx`.
 *
 * Pieces live in `./platform`; this file is only the composition.
 */
export function PlatformOverview() {
  return (
    <section
      aria-labelledby="platform-overview-title"
      className="section-space-py relative isolate overflow-hidden bg-background"
    >
      {/* Dot texture, faded out at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_center,black,transparent_72%)] bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] bg-size-[22px_22px] opacity-45"
      />
      {/* Brand bloom behind the hub — two stops, so it reads as the brand pair
          rather than a flat wash of indigo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-224 max-w-[130vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.11),rgba(139,92,246,0.05)_55%,transparent)]"
      />

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
            All-in-one growth platform
          </p>

          <h2
            id="platform-overview-title"
            className="section-title mt-5 text-balance"
          >
            Everything you need to turn leads into loyal customers
          </h2>

          <p className="mt-5 text-base leading-[1.7] text-text-secondary text-pretty">
            Capture leads, manage conversations, launch campaigns, automate
            follow-ups and measure growth all from{" "}
            <span className="font-semibold text-primary">
              one powerful workspace
            </span>
          </p>
        </header>

        {/* Ecosystem */}
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-10">
          <FeatureRail
            features={INBOUND_FEATURES}
            side="left"
            className="order-2 lg:order-1"
          />

          {/* `ConnectionLines` before the hub, so the hub's vignette paints over
              the curve ends. It overhangs this column by the grid gap on each
              side. */}
          <div className="relative order-1 flex items-center justify-center lg:order-2">
            <ConnectionLines />
            <PlatformHub />
          </div>

          <FeatureRail
            features={OUTBOUND_FEATURES}
            side="right"
            className="order-3"
          />
        </div>

        <div className="mt-12">
          <WorkflowBar />
        </div>
      </div>
    </section>
  );
}
