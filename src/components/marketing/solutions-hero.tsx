import { Briefcase } from "lucide-react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { APP_ROUTES } from "@/constants";

/**
 * The Solutions hero.
 *
 * `BlogHero`'s band, unchanged: the same `hero-surface` ground, the same 64px
 * grid masked to an ellipse, the same indigo bloom off the top, the same
 * centred column — so a visitor crossing from the home page, Features or the
 * blog lands somewhere that is obviously the same site.
 *
 * The copy names the page the header's Solutions item points at — the
 * industries MarketFlow is sold into — rather than the integration wall it
 * used to head. That wall was the first block on this route and the hero was
 * written for it; the route now opens on the industry grid, and a hero
 * promising integrations above a grid of business types is the page
 * introducing something it does not go on to say.
 *
 * `Briefcase` on the eyebrow rather than `Plug`, matching the icon
 * `marketingNav` already carries for this route.
 *
 * The trail closes the hero rather than opening it, centred on the same axis
 * as the eyebrow and the heading — the arrangement `BlogHero` uses and the
 * reason its `mt-6` is carried across with it. Solutions carries no `href`:
 * it is the page the reader is already on, and a crumb pointing at it is a
 * link that does nothing.
 */
export function SolutionsHero() {
  return (
    <section
      aria-labelledby="solutions-hero-title"
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
        <div className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
              <Briefcase className="size-4 text-primary" aria-hidden />
              MarketFlow Solutions
            </p>

            <h1
              id="solutions-hero-title"
              className="mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.75rem]"
            >
              One platform, shaped around{" "}
              <span className="brand-gradient-text">
                how your business sells
              </span>
            </h1>
          </div>

          <Breadcrumb
            align="center"
            className="mt-6"
            items={[
              { label: "Home", href: APP_ROUTES.home },
              { label: "Solutions" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
