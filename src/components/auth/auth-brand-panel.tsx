import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { APP_ROUTES } from "@/constants";
import { AutomationVisual } from "./automation-visual";

/**
 * The brand half of the auth split.
 *
 * Kept light rather than the dark panel this pattern usually reaches for: the
 * MarketFlow lockup carries a near-black wordmark, so a dark ground would mean
 * either a filtered logo or a second asset. A tinted surface with two very low
 * -opacity blooms gets the depth without touching the artwork.
 *
 * Hidden below `lg`. A 40%-wide column cannot hold the vignette at tablet
 * widths without squeezing the form, and the form is the point of the page.
 */
export function AuthBrandPanel() {
  return (
    <aside className="relative isolate hidden overflow-hidden border-r border-border bg-primary-subtle px-12 py-12 lg:flex lg:flex-col xl:px-16">
      {/* Brand blooms — the only gradients on the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(37,211,102,0.12),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 -bottom-40 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(18,140,126,0.13),transparent)]"
      />
      {/* Faint dot field, masked to fade before it reaches any edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(var(--color-primary-border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />

      <Link
        href={APP_ROUTES.home}
        className="inline-flex w-fit items-center rounded-btn transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:shadow-focus"
      >
        <Logo height={38} priority />
      </Link>

      <div className="my-auto max-w-lg pt-16">
        <h2 className="text-3xl leading-[1.15] text-balance xl:text-4xl">
          Turn conversations into measurable growth.
        </h2>

        <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-text-secondary">
          Manage leads, automate WhatsApp conversations, launch campaigns and
          grow your business from one powerful workspace.
        </p>

        <AutomationVisual className="mt-14" />
      </div>
    </aside>
  );
}
