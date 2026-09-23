import { BookOpen } from "lucide-react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { APP_ROUTES } from "@/constants";

/**
 * The Resources hero.
 *
 * Same ground, grid and bloom as the Features hero, because a visitor crossing
 * from anywhere else on the site should land somewhere that is obviously the
 * same product. What differs is the promise: this page is not selling, so
 * there is no button pair under the heading - the thing to do next is scroll
 * into the library, and a CTA here would compete with it.
 *
 * The breadcrumb is left-aligned against the container while the heading block
 * stays centred. Centring it too would read as part of the heading - a trail
 * is chrome for the page, not the opening line of it - and left is also where
 * a reader's eye already is when the page loads.
 */
export function BlogHero() {
  return (
    <section
      aria-labelledby="blog-hero-title"
      className="hero-surface relative isolate overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border-strong)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-strong)_1px,transparent_1px)] bg-size-[64px_64px] opacity-40 mask-[radial-gradient(ellipse_85%_45%_at_50%_20%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-192 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]"
      />

      <div className="custom-container">
        <div className="py-16 lg:py-18">
          <div className="mx-auto max-w-4xl text-center">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
              <BookOpen className="size-4 text-primary" aria-hidden />
              MarketFlow Resources
            </p>

            <h1
              id="blog-hero-title"
              className="mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.75rem]"
            >
              Insights for better marketing and{" "}
              <span className="brand-gradient-text">customer growth</span>
            </h1>
          </div>

          {/*
           * The trail closes the hero rather than opening it, and it is
           * centred on the same axis as the eyebrow, heading and description
           * above it - so the hero reads as one centred column rather than as
           * a centred block with a stray line under it.
           *
           * The margin matches the block's own bottom padding, so the
           * breadcrumb carries equal air above and below within the hero.
           *
           * Resources carries no `href`. It is the section this page belongs
           * to rather than a page of its own - there is no `/resources` route,
           * and pointing it at `/blog` would give the trail two names for the
           * screen the reader is already on.
           */}
          <Breadcrumb
            align="center"
            className="mt-6"
            items={[
              { label: "Home", href: APP_ROUTES.home },
              { label: "Resources" },
              { label: "Blog" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
