import { Tag } from "lucide-react";

import { SectionEyebrow } from "@/components/marketing/section-eyebrow";

import { PricingPlans } from "./pricing-plans";

export function PricingSection() {

  return (
    <section
      aria-labelledby="pricing-title"
      className="section-space-py relative isolate overflow-hidden bg-surface"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] bg-[size:22px_22px] opacity-30 mask-[radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-208 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.1),transparent)]"
      />

      <div className="custom-container">
        <header className="mx-auto max-w-3xl text-center">
          <SectionEyebrow text="Simple, scalable pricing" icon={Tag} />
          <h2
            id="pricing-title"
            className="section-title mt-5 text-balance"
          >
            Everything you need to turn customer conversations growth
          </h2>
          <p className="section-subtitle mx-auto max-w-2xl">
            Choose a plan that fits your business and scale your marketing,
            automation, customers, and sales from one powerful workspace.
          </p>
        </header>
        <PricingPlans />
      </div>
    </section>
  );
}
