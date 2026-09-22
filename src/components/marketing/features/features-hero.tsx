import { ArrowRight, LayoutGrid, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { PlatformDashboard } from "../platform-dashboard";

/**
 * The Features hero.
 *
 * Deliberately not the landing hero. That one sells the idea — one line, a
 * promise, a screenshot — because a visitor arriving from an ad needs to be
 * convinced there is something here. This one is read by somebody already
 * convinced enough to click Features, so it starts with the product: the
 * heading names the outcome, the sub-line names the six things the workspace
 * actually does, and the visual underneath is the marketing overview screen
 * with real figures on it rather than a mood shot.
 *
 * The composition is `PlatformDashboard`, which already carries a KPI row of
 * leads, conversations, conversion and revenue, a growth chart, campaign
 * performance, a funnel, live conversations and a running automation count —
 * CRM, WhatsApp, campaigns, automation and analytics in one frame, which is
 * exactly what this hero has to establish. It is full-bleed under the copy
 * rather than beside it, because at half width its KPI row wraps to two lines
 * and the funnel bars become unreadable.
 *
 * The ground is `hero-surface` with the landing page's grid and bloom, so a
 * visitor crossing from the home page lands somewhere that is obviously the
 * same site.
 */
export function FeaturesHero() {
  return (
    <section
      aria-labelledby="features-hero-title"
      className="hero-surface relative isolate overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border-strong)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-strong)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 mask-[radial-gradient(ellipse_85%_45%_at_50%_20%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-192 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]"
      />

      <div className="custom-container">
        <div className="py-18 lg:py-22">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
              <Sparkles className="size-4 text-primary" aria-hidden />
              MarketFlow Platform
            </p>

            <h1
              id="features-hero-title"
              className="mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.75rem]"
            >
              Everything your team needs to turn customer conversations into{" "}
              <span className="brand-gradient-text">growth</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary text-pretty">
              Capture leads, manage customers, launch campaigns, automate
              conversations, manage commerce, and measure performance from one
              connected workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href={APP_ROUTES.register} size="lg" className="group">
                Start Free
                <ArrowRight
                  className="size-4 transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </ButtonLink>
              <ButtonLink href="#platform" variant="secondary" size="lg">
                <LayoutGrid className="size-4" aria-hidden />
                Explore the Platform
              </ButtonLink>
            </div>
          </div>

          {/* The product, at full container width. */}
          <div className="relative mx-auto mt-14 w-full max-w-280">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)] blur-2xl"
            />
            <PlatformDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
