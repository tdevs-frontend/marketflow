import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { APP_ROUTES } from "@/constants";
import { EcosystemVisual } from "./ecosystem-visual";

/** The product promise, one verb a step, in the order the platform runs them. */
const PROMISE = ["Capture", "Engage", "Automate", "Sell", "Grow"];

export function AuthBrandPanel() {
  return (
    <aside className="relative isolate hidden flex-col overflow-hidden border-r border-border bg-primary-subtle px-12 py-12 lg:flex xl:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 -z-10 size-120 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.13),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 -bottom-40 -z-10 size-144 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.12),transparent)]"
      />

      {/* Dot field, masked so it fades before it reaches any edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(var(--color-primary-border)_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />

      {/* Two long, very thin sweeps — customer journeys crossing the panel. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 size-full"
        viewBox="0 0 600 900"
        preserveAspectRatio="none"
        role="presentation"
      >
        {/* <path
          d="M-40,240 C160,150 320,330 620,220"
          fill="none"
          stroke="var(--color-primary)"
          strokeOpacity="0.1"
          strokeWidth="1.5"
        /> */}
        <path
          d="M-40,700 C180,610 340,790 620,660"
          fill="none"
          stroke="var(--color-primary)"
          strokeOpacity="0.08"
          strokeWidth="1.5"
        />
      </svg>

      <Link
        href={APP_ROUTES.home}
        className="inline-flex w-fit items-center rounded-btn transition-opacity hover:opacity-80 focus-visible:shadow-focus focus-visible:outline-none"
      >
        <Logo height={36} priority />
      </Link>

      <div className="my-auto py-12">
        <h2 className="text-3xl leading-[1.08] text-balance xl:text-[2.75rem] 2xl:text-[3.25rem]">
          From first <span className="text-primary">conversation</span> to final
          sale
        </h2>

        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-pretty text-text-secondary">
          MarketFlow brings your leads, WhatsApp conversations, campaigns,
          products and customer journeys together in one powerful workspace.
        </p>
        <EcosystemVisual className="mt-10 hidden xl:block" />
      </div>

      <div>
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-text-secondary uppercase">
          {PROMISE.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-2.5">
              {index > 0 ? (
                <span
                  aria-hidden
                  className="size-1 rounded-full bg-primary/40"
                />
              ) : null}
              {step}
            </span>
          ))}
        </p>

        {/* <div aria-hidden className="mt-5 h-px w-10 bg-primary/40" />

        <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-text-muted">
          Everything your business needs to turn customer conversations into
          measurable growth.
        </p> */}
      </div>
    </aside>
  );
}
