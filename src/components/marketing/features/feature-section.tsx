import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The frame every section on this page is built in.
 *
 * The Features page makes the same argument eleven times — here is a part of
 * MarketFlow, here is what it does for you, here is what it looks like — and
 * the only way that reads as one page rather than eleven is for the argument to
 * have one shape. So the shell owns the shape (eyebrow, heading, promise,
 * capability list, visual) and each section supplies only its content and its
 * own product mock-up.
 *
 * `reverse` is what stops that shape becoming a drumbeat. Sections alternate
 * text-left / visual-right and back, which gives the page a rhythm to scroll
 * through; without it, eleven identical two-column blocks read as a spreadsheet.
 *
 * `ground` alternates with it. Two neutrals, white and the tinted canvas, so
 * consecutive sections separate from each other without a rule between every
 * one — the page never needs a divider it has to style.
 *
 * `scroll-mt-32` is the sticky chrome: the site header is 72px and the feature
 * nav below it is another 52, so an anchored section that did not reserve that
 * space would land with its heading underneath both.
 */
export function FeatureSection({
  id,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  capabilities,
  capabilityLabel,
  footer,
  visual,
  reverse = false,
  ground = "surface",
  anchors,
}: {
  id: string;
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  title: ReactNode;
  description: string;
  /** The short list under the promise. Names features, not benefits. */
  capabilities?: string[];
  /** Heads the list where "what you get" needs saying. */
  capabilityLabel?: string;
  /** A CTA, a caption, anything that closes the column. */
  footer?: ReactNode;
  visual: ReactNode;
  reverse?: boolean;
  ground?: "surface" | "tint";
  /**
   * Extra ids this section answers to.
   *
   * The site footer has linked to `/features#sms` since before this page
   * existed, and SMS shares a section with Email rather than getting one of its
   * own. An empty anchor span is how that link keeps landing somewhere real without
   * splitting the section in two to satisfy a URL.
   */
  anchors?: string[];
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "section-space-py scroll-mt-32",
        ground === "tint" && "bg-background",
      )}
    >
      {anchors?.map((anchor) => (
        <span key={anchor} id={anchor} aria-hidden className="block scroll-mt-32" />
      ))}

      <div className="custom-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className={cn("min-w-0", reverse && "lg:order-2")}>
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
              <EyebrowIcon className="size-4 text-primary" aria-hidden />
              {eyebrow}
            </p>

            <h2 id={`${id}-title`} className="section-title mt-5 text-balance">
              {title}
            </h2>

            <p className="mt-5 text-base leading-[1.7] text-text-secondary text-pretty">
              {description}
            </p>

            {capabilities ? (
              <>
                {capabilityLabel ? (
                  <p className="mt-8 text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
                    {capabilityLabel}
                  </p>
                ) : null}
                <ul
                  className={cn(
                    "grid gap-x-6 gap-y-2.5 sm:grid-cols-2",
                    capabilityLabel ? "mt-3.5" : "mt-8",
                  )}
                >
                  {capabilities.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>

          <div className={cn("min-w-0", reverse && "lg:order-1")}>{visual}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * The window every product mock-up on this page sits in.
 *
 * One frame for all eleven, carrying the route the screen actually lives at.
 * That route is the point: a visitor who reads `/dashboard/automation` under a
 * workflow canvas and later signs in and finds that exact path has been told
 * the truth about what they were looking at. It is also the cheapest possible
 * guard against the mock-ups drifting into generic SaaS — every one of them has
 * to name a page that exists.
 *
 * Taken from `HeroDashboard`'s treatment rather than invented: bezel, inner
 * card, chrome bar, soft brand bloom behind. The landing page established it
 * and this page is the same product.
 */
export function ProductFrame({
  path,
  status,
  children,
  className,
}: {
  /** The dashboard route this screen is from. */
  path: string;
  /** The pill at the right of the chrome bar. */
  status?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Brand bloom, and a contact shadow so the frame sits on the page
          rather than floating over it. Both decorative, both behind. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(99,102,241,0.14),transparent)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 -bottom-3 -z-10 h-6 rounded-[50%] bg-text-primary/10 blur-2xl"
      />

      <div className="rounded-[calc(var(--radius-card)+6px)] border border-border/70 bg-surface/60 p-1 shadow-float backdrop-blur-sm sm:p-1.5">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex items-center gap-2.5 border-b border-border bg-surface px-3 py-2 sm:gap-3 sm:px-4">
            <div className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>

            <p className="flex min-w-0 flex-1 items-center justify-center rounded-field border border-border bg-background px-2.5 py-1">
              <span className="truncate text-xs text-text-muted">
                marketflow.app{path}
              </span>
            </p>

            {status ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-dark sm:inline-flex">
                <span
                  aria-hidden
                  className="animate-soft-pulse size-1.5 rounded-full bg-primary"
                />
                {status}
              </span>
            ) : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

/** The small caps label inside a mock-up panel. Matches the dashboard's own. */
export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
      {children}
    </p>
  );
}
