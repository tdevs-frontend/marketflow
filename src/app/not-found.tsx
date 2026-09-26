import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * The app-wide 404, rendered for any URL no route matches and for every
 * `notFound()` call that no nearer `not-found.tsx` catches.
 *
 * It sits directly under the root layout, so it gets neither the marketing
 * header and footer nor the dashboard shell - a lost visitor gets one message
 * and one way home, and nothing else to click. The logo is the only chrome.
 *
 * The ground is the marketing white with the same two brand blooms and dot
 * grid the closing CTA uses, so the page reads as part of the site rather than
 * as a framework error. Every decorative layer is `aria-hidden` and
 * `pointer-events-none`; the big "404" is hidden too, because the eyebrow
 * already says it in words and a screen reader reading "four hundred four"
 * twice is noise.
 *
 * Motion is the shared `fadeIn` keyframes behind `motion-safe:`, so a
 * reduced-motion preference gets a still page.
 */
export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden bg-surface">
      <Backdrop />

      <header className="flex justify-center px-4 pt-8 sm:pt-10">
        <Link
          href={APP_ROUTES.home}
          className="inline-flex rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
        >
          <Logo height={32} priority />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center motion-safe:animate-[fadeIn_0.6s_ease-out]">

          <p
            aria-hidden
            className="brand-gradient-text mt-6 font-heading text-[7rem] leading-[0.9] font-bold tracking-tighter select-none sm:text-[10rem] lg:text-[13rem]"
          >
            404
          </p>

          <h1 className="mt-4 text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            Page not found
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary text-pretty">
            The page you&apos;re looking for doesn&apos;t exist, has moved, or
            is temporarily unavailable.
          </p>

          <ButtonLink href={APP_ROUTES.home} size="lg" className="group mt-8">
            Back to Home
            <ArrowRight
              aria-hidden
              /* `translate`, not `transform` - Tailwind v4 writes the utility to
                 the former, so a `transition-transform` here animates nothing. */
              className="transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            />
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}

/**
 * The decoration, in one layer behind the content: two blurred brand blooms in
 * opposite corners, a dot grid faded out toward the edges, and one hairline
 * ring low on the left for the abstract shape. All tokens; the blooms are the identity pair at low opacity.
 */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Lavender bloom, top left. */}
      <div className="absolute -top-40 -left-40 size-112 rounded-full bg-lavender opacity-60 blur-3xl sm:size-144" />
      {/* Indigo-violet glow, bottom right. */}
      <div className="brand-gradient-accent absolute -right-48 -bottom-48 size-120 rounded-full opacity-15 blur-3xl sm:size-160" />

      {/* The dot grid, strongest behind the content. */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-primary-border)_1px,transparent_1px)] bg-size-[22px_22px] opacity-50 mask-[radial-gradient(ellipse_60%_55%_at_50%_50%,black,transparent_80%)]" />

      {/* A smaller solid-edged ring low on the left, and a brand dot on it. */}
      <div className="absolute bottom-[10%] left-[8%] hidden size-28 rounded-full border border-lavender-violet/60 sm:block">
        <span className="brand-gradient-accent absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full" />
      </div>
      {/* A brand dot top right to balance it. */}
      <span className="brand-gradient-accent absolute top-[22%] right-[12%] hidden size-2.5 rounded-full opacity-70 sm:block" />
    </div>
  );
}
