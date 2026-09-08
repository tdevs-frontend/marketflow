import { ArrowRight, CalendarCheck, ShieldCheck, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/constants";
import { HeroDashboard } from "./hero-dashboard";

const TRUST_AVATARS = [
  { initials: "SK", className: "bg-surface-secondary text-text-secondary" },
  { initials: "AR", className: "bg-surface-secondary text-text-secondary" },
  { initials: "JM", className: "bg-accent-soft text-info-text" },
  { initials: "TC", className: "bg-primary-soft text-primary-dark" },
];

export function HeroSection() {
  return (
    <section className="hero-surface relative isolate overflow-hidden">
      {/*
       * Background decoration, in paint order. Both layers sit at `-z-10`
       * inside the section's own stacking context — that is what `isolate` on
       * the section is for — so they render above its ground and below every
       * bit of content, without a positive z-index anywhere to maintain.
       *
       * Same construction as the dot grids in `analytics-section` and
       * `platform-overview`: an inset layer, a repeating background, and a
       * radial `mask-` that fades it out. Two crossed linear-gradients make a
       * square net rather than dots.
       *
       * The mask is weighted to 20% down the section and 85% of its width: the
       * section got much taller when the dashboard moved below the copy, so a
       * centred ellipse would have faded out before reaching the headline. It
       * now peaks behind the badge and headline and is gone by the left and
       * right edges and well before the bottom.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border-strong)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-strong)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 mask-[radial-gradient(ellipse_85%_45%_at_50%_20%,black,transparent_75%)]"
      />

      {/* Painted after the net so it softens the lines behind the headline,
          which is the one place they would otherwise cross live text. Centred
          on the column now that the composition is, rather than anchored to the
          old left-hand text block. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-192 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]"
      />

      <div className="custom-container">
        <div className="px-6 py-20 lg:py-24">
          {/*
           * Centred copy on its own measure. The headline and description each
           * take a narrower one on top of this: the headline so it breaks to
           * two balanced lines instead of one very long one, the description so
           * it stays inside a comfortable reading width.
           */}
          <div className="mx-auto max-w-240 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-text-secondary shadow-card">
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
                New
              </span>
              WhatsApp Business API · built for merchants
            </p>

            <h1 className="mx-auto mt-7 max-w-4xl text-[2.75rem] font-bold leading-[1.06] tracking-tight text-balance sm:text-6xl xl:text-[4.25rem]">
              Turn Every Conversation Into{" "}
              <span className="brand-gradient-text">Growth</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary text-pretty">
              Manage leads, automate WhatsApp conversations, launch campaigns,
              and turn customer interactions into measurable business growth.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href={APP_ROUTES.register}
                variant="gradient"
                size="lg"
                className="group"
              >
                Get Started
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </ButtonLink>
              <ButtonLink
                href={APP_ROUTES.features}
                variant="secondary"
                size="lg"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden />
                Book a Demo
              </ButtonLink>
            </div>

            {/* Trust indicator */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              {/* `text-left` inside the centred column: the stars are a flex
                  row and would not centre with the line beneath them, so the
                  block aligns internally and the row centres as a whole. */}
              <div className="flex items-center gap-3 text-left">
                <div className="flex -space-x-2.5">
                  {TRUST_AVATARS.map((avatar) => (
                    <span
                      key={avatar.initials}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold ring-2 ring-surface",
                        avatar.className,
                      )}
                    >
                      {avatar.initials}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star
                        key={star}
                        className="h-3.5 w-3.5 fill-warning text-warning"
                        aria-hidden
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-text-primary">
                      4.9/5
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-muted">
                    Trusted by{" "}
                    <span className="font-semibold text-text-secondary">
                      2,400+ merchants
                    </span>{" "}
                    across 18 countries
                  </p>
                </div>
              </div>

              <span className="hidden h-9 w-px bg-border sm:block" />

              <p className="inline-flex items-center gap-2 text-sm text-text-muted">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                Official Business API · no credit card required
              </p>
            </div>
          </div>

          {/*
           * The product preview, below the copy and on a much wider measure —
           * it was sharing the row before, so roughly half this width.
           *
           * `HeroDashboard` sets no width of its own, so this wrapper is what
           * sizes it; `custom-container` caps it below `2xl`. Its floating
           * cards sit at 16px outward offsets inside its own `relative` root,
           * which the container's `px-6` absorbs — and the section's
           * `overflow-hidden` is the backstop, so neither can widen the page.
           */}
          <div className="mx-auto mt-16 w-full max-w-300">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
