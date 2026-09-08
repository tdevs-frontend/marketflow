import { Icon } from "@/components/ui/icon";
import { CAPABILITIES } from "@/constants/pricing";

/**
 * The capability comparison that sits under the plans on `/pricing`.
 *
 * Its own section rather than part of `PricingPlans`, because the homepage
 * wants the plans without it: a landing page's job is to get someone to a
 * price, and four more cards between the tiers and the closing CTA is one more
 * thing to read past. The pricing route composes it explicitly.
 *
 * The four areas are the same four the dashboard sidebar is organised around,
 * so this section and the product agree on what MarketFlow is.
 */
export function PricingValue() {
  return (
    <section
      aria-labelledby="pricing-value-title"
      className="section-space-py"
    >
      <div className="custom-container">
        <h2
          id="pricing-value-title"
          className="text-center text-2xl font-bold tracking-tight text-text-primary text-balance sm:text-3xl"
        >
          Built for every stage of your growth
        </h2>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CAPABILITIES.map((capability) => (
            <li
              key={capability.title}
              className="rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-btn bg-primary-soft text-primary"
              >
                <Icon name={capability.icon} className="size-4" />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-text-primary">
                {capability.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                {capability.description}
              </p>
              {/* One short accent rule per block, tying the four together. */}
              <span
                aria-hidden
                className="mt-4 block h-0.5 w-8 rounded-full brand-gradient-accent"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
