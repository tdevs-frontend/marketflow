import type { Metadata } from "next";

import { PricingPlans } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a plan that fits your business and scale your marketing, automation, customers, and sales from one powerful workspace.",
};

/**
 * The pricing page. The header lives here; the plans, the capability blocks and
 * the trust strip live in `PricingPlans`, which is a client component because
 * of the billing toggle.
 */
export default function PricingPage() {
  return (
    <section className="section-space-py">
      <div className="custom-container">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
            Simple, scalable pricing
          </p>

          <h1 className="mt-4 text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Everything you need to turn customer conversations into measurable
            growth.
          </h1>

          <p className="mt-5 text-base leading-relaxed text-text-secondary text-pretty sm:text-lg">
            Choose a plan that fits your business and scale your marketing,
            automation, customers, and sales from one powerful workspace.
          </p>
        </header>

        <PricingPlans />
      </div>
    </section>
  );
}
