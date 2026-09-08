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
      <div className="custom-container">
        <header className="mb-8  mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
            Simple, scalable pricing
          </p>

          <Heading
            id="pricing-title"
            className="mt-4 text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Everything you need to turn customer conversations growth
          </Heading>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-secondary text-pretty sm:text-lg">
            Choose a plan that fits your business and scale your marketing,
            automation, customers, and sales from one powerful workspace.
          </p>
        </header>

        <PricingPlans />
      </div>
    </section>
  );
}
