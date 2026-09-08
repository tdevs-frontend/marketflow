import { ArrowRight, LayoutGrid } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";


export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className=" relative overflow-hidden bg-[#0f172a] py-16 rounded-3xl mb-20 custom-container"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 -z-10 size-160 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-40 -z-10 size-176 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.18),transparent)]"
      />

      <div className="">
        <div className="mx-auto grid max-w-2xl items-center gap-14">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pr-4 pl-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase">
              <span
                aria-hidden
                className="size-1.5 rounded-full brand-gradient-accent"
              />
              Ready to grow?
            </p>

            <h2
              id="final-cta-title"
              className="mt-6 text-3xl leading-[1.15] font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl"
            >
              Turn{" "}
              <span className="brand-gradient-text">every conversation</span>{" "}
              into an opportunity.
            </h2>

            <p className="mt-6 mx-auto text-base leading-relaxed text-white/75 text-pretty sm:text-lg">
              Connect customer conversations, campaigns, automation, products,
              and sales in one powerful growth platform.
            </p>
            <div
              aria-hidden
              className="mt-8 mx-auto h-0.5 w-16 rounded-full brand-gradient-accent"
            />

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href={APP_ROUTES.register}
                variant="gradient"
                size="lg"
                className="group"
              >
                Get Started Free
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </ButtonLink>
              <ButtonLink
                href={APP_ROUTES.features}
                variant="inverse"
                size="lg"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Explore the Platform
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      {/* Divides this block from the footer, which shares its dark family. */}
      {/* <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px brand-gradient-accent opacity-60"
      /> */}
    </section>
  );
}
