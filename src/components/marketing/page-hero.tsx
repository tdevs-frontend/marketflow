import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { PageBreadcrumb, type Crumb } from "@/components/marketing/page-breadcrumb";

/**
 * The hero band every inner marketing page opens on - Features, Solutions,
 * Pricing, Blog, Contact.
 *
 * One `hero-surface` ground, the 64px grid masked to an ellipse, the indigo
 * bloom off the top and a centred column, so a visitor crossing between pages
 * lands somewhere that is obviously the same site. A page supplies only its
 * eyebrow, its `<h1>` and its trail.
 *
 * The trail closes the hero rather than opening it, centred on the same axis
 * as the eyebrow and the heading, with `mt-6` so it carries the same air above
 * as the block's own padding gives it below. The last crumb carries no `href`:
 * it is the page the reader is already on, and a crumb pointing at it is a
 * link that does nothing.
 */
export function PageHero({
  id,
  eyebrow,
  icon: Icon,
  title,
  breadcrumb,
}: {
  /** Prefix for the heading's id, which labels the section. */
  id: string;
  eyebrow: string;
  icon: LucideIcon;
  /** A node, so a page can wrap its own phrase in `brand-gradient-text`. */
  title: ReactNode;
  breadcrumb: Crumb[];
}) {
  const titleId = `${id}-hero-title`;

  return (
    <section
      aria-labelledby={titleId}
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
              <Icon className="size-4 text-primary" aria-hidden />
              {eyebrow}
            </p>

            <h1
              id={titleId}
              className="mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.75rem]"
            >
              {title}
            </h1>
          </div>

          <PageBreadcrumb items={breadcrumb} className="mt-6" />
        </div>
      </div>
    </section>
  );
}
