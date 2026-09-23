import { MessageCircle } from "lucide-react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { APP_ROUTES } from "@/constants";

/**
 * The Contact hero.
 *
 * `BlogHero`'s band, unchanged: the same `hero-surface` ground, the same 64px
 * grid masked to an ellipse, the same indigo bloom off the top, the same
 * centred column and the same trail closing it - so a visitor arriving from
 * the blog, Features or Solutions lands somewhere that is obviously the same
 * site.
 *
 * No button pair under the heading. The thing to do next is on the cards
 * below - a phone number, two addresses and a location - and a CTA here would
 * compete with the very action the page exists for.
 *
 * Contact carries no `href` in the trail: it is the page the reader is
 * already on, and a crumb pointing at it is a link that does nothing.
 */
export function ContactHero() {
  return (
    <section
      aria-labelledby="contact-hero-title"
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
              <MessageCircle className="size-4 text-primary" aria-hidden />
              Contact MarketFlow
            </p>

            <h1
              id="contact-hero-title"
              className="mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.75rem]"
            >
              Talk to the people who{" "}
              <span className="brand-gradient-text">build it</span>
            </h1>
          </div>

          <Breadcrumb
            align="center"
            className="mt-6"
            items={[
              { label: "Home", href: APP_ROUTES.home },
              { label: "Contact" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
