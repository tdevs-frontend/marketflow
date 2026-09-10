import { ArrowRight, LayoutGrid } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

/**
 * The closing block: a light brand-tinted panel, the last thing before the
 * footer.
 *
 * It is a panel rather than a full-bleed section on purpose — it sits in the
 * page's own container with air above and below, so the eye reads it as the
 * final moment of the landing page rather than as a new one.
 *
 * Nothing here is invented. The ground is `cta-surface`, built from the same
 * tokens and the same brand pair as `hero-surface`; the dot texture is the one
 * the platform and pricing sections above it already use, at 22px and masked to
 * fade at the panel's edges; the heading highlight, the eyebrow and the button
 * pair are the treatments the hero established. That repetition is the point —
 * a closing CTA that introduces its own colour language is a banner, not a
 * conclusion.
 *
 * `isolate` matters: the texture sits at the panel's own z-index floor. Pushing
 * it to `-z-10` instead would put it behind the panel's background, where it is
 * invisible.
 */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="cta-surface custom-container relative isolate mb-20 overflow-hidden rounded-3xl border border-primary-border/60 px-6 py-14 shadow-[0_20px_60px_rgba(79,70,229,0.08)] sm:rounded-[28px] sm:px-10 sm:py-20 lg:px-16"
    >
      {/* The section dots, faded out toward the panel's edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-primary-border)_1px,transparent_1px)] bg-size-[22px_22px] opacity-40 mask-[radial-gradient(ellipse_75%_70%_at_50%_50%,black,transparent_78%)]"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-soft py-1.5 pr-4 pl-2.5 text-primary">
          <span
            aria-hidden
            className="size-1.5 rounded-full brand-gradient-accent"
          />
          Ready to grow?
        </p>

        <h2 id="final-cta-title" className="section-title mt-6 text-balance">
          Turn <span className="brand-gradient-text">every conversation</span>{" "}
          into an opportunity.
        </h2>

        <p className="mx-auto mt-6 max-w-[42rem] text-base leading-relaxed text-text-secondary text-pretty">
          Connect customer conversations, campaigns, automation, products, and
          sales in one powerful growth platform.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={APP_ROUTES.register} size="lg" className="group">
            Get Started Free
            <ArrowRight
              /* `translate`, not `transform` — Tailwind v4 writes the utility to
                 the former, so a `transition-transform` here animates nothing. */
              className="h-4 w-4 transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </ButtonLink>
          <ButtonLink href={APP_ROUTES.features} variant="secondary" size="lg">
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Explore the Platform
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
