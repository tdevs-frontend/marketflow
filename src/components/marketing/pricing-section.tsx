import { PricingPlans } from "./pricing-plans";

export function PricingSection({
  headingLevel = "h2",
}: {
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

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
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-3 pr-3.5 text-text-secondary shadow-card">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
            Simple, scalable pricing
          </p>
          <Heading
            id="pricing-title"
            className="section-title mt-5 text-balance"
          >
            Everything you need to turn customer conversations growth
          </Heading>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-[1.7] text-text-secondary text-pretty">
            Choose a plan that fits your business and scale your marketing,
            automation, customers, and sales from one powerful workspace.
          </p>
        </header>
        <PricingPlans />
      </div>
    </section>
  );
}
