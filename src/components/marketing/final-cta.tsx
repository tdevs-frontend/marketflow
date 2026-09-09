import { ArrowRight, LayoutGrid } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

/** The section's own hover curve: a fast start easing to a long settle. */
const EASE = "duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * The closing block: one brand-coloured panel floating on the page's neutral.
 *
 * It is the only full brand surface on the landing page, which is the whole
 * argument for it — after eight sections of white, the last thing a reader
 * scrolls to should not look like a ninth.
 *
 * The ground is `brand-gradient` itself, indigo to violet at 135deg, and
 * nothing else. An earlier pass layered blooms and a corner falloff over it;
 * that read as a dark, over-lit panel rather than as the brand. The colour is
 * the design here, so the only thing painted on top is the hero's grid at 7%,
 * masked clear of the middle so it reads at the corners and is simply not there
 * behind the heading. It is `pointer-events-none` and sits inside the panel's
 * `overflow-hidden`, so it cannot widen the page.
 *
 * `isolate` matters: the grid sits at the panel's own z-index floor. Pushing it
 * to `-z-10` instead would put it behind the panel's background, where it is
 * invisible.
 */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="brand-gradient custom-container relative isolate mb-20 overflow-hidden rounded-3xl border border-white/15 px-6 py-16 shadow-[0_28px_70px_-28px_rgba(79,70,229,0.45)] sm:rounded-[28px] sm:px-10 sm:py-20 lg:px-16"
    >
      {/* The hero's grid, held well back and cleared from behind the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-size-[88px_88px] opacity-[0.07] mask-[radial-gradient(ellipse_72%_64%_at_50%_50%,transparent_26%,black_92%)]"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pr-4 pl-2.5 text-white">
          <span aria-hidden className="size-1.5 rounded-full bg-white" />
          Ready to grow?
        </p>

        <h2
          id="final-cta-title"
          className="section-title mt-6 text-white text-balance"
        >
          Turn{" "}
          {/* The identity pair would be indigo on violet here — unreadable. Its
              light counterpart runs white to indigo-200 instead. */}
          <span className="brand-gradient-text-light">every conversation</span>{" "}
          into an opportunity.
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75 text-pretty sm:text-lg">
          Connect customer conversations, campaigns, automation, products,
          and sales in one powerful growth platform.
        </p>

        <div
          aria-hidden
          className="mx-auto mt-8 h-0.5 w-16 rounded-full bg-white/30"
        />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink
            href={APP_ROUTES.register}
            variant="light"
            size="lg"
            className={`group ${EASE}`}
          >
            Get Started Free
            <ArrowRight
              /* `translate`, not `transform` — Tailwind v4 writes the utility to
                 the former, so a `transition-transform` here animates nothing. */
              className={`h-4 w-4 transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 ${EASE}`}
              aria-hidden
            />
          </ButtonLink>
          <ButtonLink
            href={APP_ROUTES.features}
            variant="inverse"
            size="lg"
            className={EASE}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Explore the Platform
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
