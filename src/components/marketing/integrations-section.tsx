import Link from "next/link";
import { Code, Mail, Plug, Webhook, type LucideIcon } from "lucide-react";

import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { BrandIcon } from "@/components/ui/brand-icon";
import { INTEGRATION_ROUTES } from "@/constants/integrations";
import { cn } from "@/lib/utils";

/**
 * The integration wall, under the Solutions hero.
 *
 * The heading is this section's own, not a second telling of the hero's. The
 * hero names what the page is about; this one names what the grid under it is
 * - the tools a merchant already runs their business on - and carries the
 * sentence the hero no longer does. No eyebrow, because the hero's says
 * "Integrations" a screen above it and a second pill saying the same word is
 * furniture.
 *
 * Ten marks, and every one of them is something a merchant can actually
 * connect on `/dashboard/integrations`: the three messaging channels and their
 * recommended providers, the four social platforms the Planner publishes to,
 * the commerce sync, and the two developer surfaces. Nothing here is a logo
 * borrowed to fill a row - a wall that claims a tool the product cannot
 * connect is the first claim a buyer checks, and the hub is one click away to
 * check it with.
 *
 * Each tile links to the page that configures it rather than being decoration
 * with a pointer cursor on it. Shopify is the one that goes to the hub instead
 * of a page of its own, because that is where its card lives.
 *
 * The marks wear their own brands, not MarketFlow's: a wall tinted a single
 * indigo is a wall where nothing is recognised before its label is read. The
 * three that have no brand - Email, Webhooks, API - take the identity tints
 * the dashboard's own tiles use for them, so the blue Email mark here is the
 * blue Email tile there.
 *
 * The separators are the cells' own right and bottom borders, with the grid
 * pulled a pixel past its clipping frame so the outer two never show. That
 * keeps one rule between every pair of tiles at any column count - and the two
 * spacer cells exist for the same reason: ten tiles divide evenly into five
 * columns and into two, but not into the three the tablet gets, which would
 * otherwise leave a bordered stub hanging under the last row.
 */

interface IntegrationMark {
  name: string;
  /** The hub's own category vocabulary - see `INTEGRATION_CATEGORIES`. */
  category: string;
  href: string;
  /** A key in `BrandIcon`'s table, for the marks that have a logo. */
  brand?: string;
  /** The Lucide stand-in, for the ones that do not. */
  icon?: LucideIcon;
  /** The mark's colour. Ignored by Instagram, which is painted by `gradient`. */
  className?: string;
  /** Instagram alone: its brand is a ramp, which no `text-*` can carry. */
  gradient?: boolean;
}

const INSTAGRAM_GRADIENT_ID = "mf-instagram-mark";

const MARKS: IntegrationMark[] = [
  {
    name: "WhatsApp Business",
    category: "Messaging",
    href: INTEGRATION_ROUTES.whatsapp,
    brand: "whatsapp",
    className: "text-whatsapp-brand",
  },
  {
    name: "Email / SMTP",
    category: "Messaging",
    href: INTEGRATION_ROUTES.email,
    icon: Mail,
    className: "text-tint-blue-ink",
  },
  {
    name: "Twilio",
    category: "Messaging",
    href: INTEGRATION_ROUTES.sms,
    brand: "twilio",
    className: "text-[#f22f46]",
  },
  {
    name: "Instagram",
    category: "Social",
    href: INTEGRATION_ROUTES.social,
    brand: "instagram",
    gradient: true,
  },
  {
    name: "Facebook",
    category: "Social",
    href: INTEGRATION_ROUTES.social,
    brand: "facebook",
    className: "text-[#1877f2]",
  },
  {
    name: "LinkedIn",
    category: "Social",
    href: INTEGRATION_ROUTES.social,
    brand: "linkedin",
    className: "text-[#0a66c2]",
  },
  {
    name: "X",
    category: "Social",
    href: INTEGRATION_ROUTES.social,
    brand: "x",
    className: "text-text-primary",
  },
  {
    name: "Shopify",
    category: "Commerce",
    href: INTEGRATION_ROUTES.hub,
    brand: "shopify",
    className: "text-[#5e8e3e]",
  },
  {
    name: "Webhooks",
    category: "Developer",
    href: INTEGRATION_ROUTES.webhooks,
    icon: Webhook,
    className: "text-tint-indigo-ink",
  },
  {
    name: "API",
    category: "Developer",
    href: INTEGRATION_ROUTES.api,
    icon: Code,
    className: "text-tint-slate-ink",
  },
];

export function IntegrationsSection() {
  return (
    <section
      id="integrations"
      aria-labelledby="integrations-title"
      className="section-space-py relative scroll-mt-32 bg-surface"
    >
      {/* The Instagram ramp, defined once. Sized to nothing and referenced by
          id from the mark itself - `currentColor` cannot carry a gradient. */}
      <svg
        aria-hidden
        focusable="false"
        className="pointer-events-none absolute size-0 overflow-hidden"
      >
        <defs>
          <linearGradient id={INSTAGRAM_GRADIENT_ID} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#feda75" />
            <stop offset="25%" stopColor="#fa7e1e" />
            <stop offset="55%" stopColor="#d62976" />
            <stop offset="80%" stopColor="#962fbf" />
            <stop offset="100%" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
      </svg>

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <SectionEyebrow text="Integrations" icon={Plug} />

          <h2 id="integrations-title" className="section-title mt-5 text-balance">
            Everything you already use,{" "}
            <span className="brand-gradient-text">connected</span>
          </h2>

          <p className="section-subtitle">
            Connect the channels, commerce tools and developer services that
            power your MarketFlow workspace - all from one place.
          </p>
        </header>

        <div className="mx-auto max-w-6xl overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <ul className="-mr-px -mb-px grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {MARKS.map((mark) => (
              <li key={mark.name} className="border-r border-b border-border">
                <Link
                  href={mark.href}
                  className="group flex h-full flex-col items-center justify-center gap-3 px-3 py-7 text-center transition-colors duration-200 hover:bg-primary-subtle focus-visible:bg-primary-subtle focus-visible:shadow-focus focus-visible:outline-none sm:px-4 sm:py-8"
                >
                  <span className="grid size-8 place-items-center transition-[translate] duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                    {mark.brand ? (
                      <BrandIcon
                        name={mark.brand}
                        className={cn("size-7", mark.className)}
                        fill={
                          mark.gradient
                            ? `url(#${INSTAGRAM_GRADIENT_ID})`
                            : undefined
                        }
                      />
                    ) : mark.icon ? (
                      <mark.icon
                        className={cn("size-7", mark.className)}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    ) : null}
                  </span>

                  <span className="block">
                    <span className="block text-base font-semibold text-text-primary">
                      {mark.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-text-muted">
                      {mark.category}
                    </span>
                  </span>
                </Link>
              </li>
            ))}

            {/* Tablet only: the two cells that make ten tiles fill three
                columns evenly. Never rendered at the other two widths. */}
            <li
              aria-hidden
              className="hidden border-r border-b border-border md:block lg:hidden"
            />
            <li
              aria-hidden
              className="hidden border-r border-b border-border md:block lg:hidden"
            />
          </ul>
        </div>
      </div>
    </section>
  );
}
