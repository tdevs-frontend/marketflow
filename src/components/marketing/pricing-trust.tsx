import { Check, ShieldCheck } from "lucide-react";

import { PRICING_ASSURANCES } from "@/constants/pricing";

/**
 * The reassurance strip that closes `/pricing`.
 *
 * Its own section for the same reason as `PricingValue`: the homepage shows
 * the plans and moves straight to the closing CTA, so this belongs to the
 * pricing route rather than to the plans component.
 *
 * `section-space-pb` rather than `-py`, so it reads as the foot of the
 * capability block above it instead of a third full-height section.
 *
 * Every claim here is one the product can actually stand behind — no logos,
 * ratings or user counts we would have to invent.
 */
export function PricingTrust() {
  return (
    <section aria-labelledby="pricing-trust-title" className="section-space-pb">
      <div className="custom-container">
        <div className="rounded-card border border-border bg-surface-secondary px-6 py-7">
          <p
            id="pricing-trust-title"
            className="text-center text-sm font-semibold text-text-primary"
          >
            Everything you need to run your customer growth engine
          </p>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {PRICING_ASSURANCES.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 text-xs text-text-secondary"
              >
                <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
            Self-hosted on your own infrastructure — your customer data stays
            yours.
          </p>
        </div>
      </div>
    </section>
  );
}
