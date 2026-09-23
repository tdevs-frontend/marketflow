import { CircleHelp } from "lucide-react";

import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { PRICING_FAQS } from "@/constants/pricing";

import { FaqAccordion } from "./faq-accordion";

/**
 * The billing questions, under the plans.
 *
 * Laid out exactly like the FAQ on `/features` - heading on a left rail, list
 * on the right - so a visitor who has seen one recognises the other. The copy
 * is the only thing that differs, and it is billing rather than product: by
 * the time somebody is reading this they have already decided what the thing
 * does and are working out what it costs them.
 *
 * On the tinted ground, which separates it from the white plans section above
 * and from the closing CTA panel below - the same white/tint alternation the
 * rest of the marketing pages use to mark a seam.
 */
export function PricingFaq() {
  return (
    <section
      id="pricing-faq"
      aria-labelledby="pricing-faq-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        <div className="grid gap-10 md:grid-cols-[3fr_3fr] md:gap-10 lg:grid-cols-[6fr_13fr] lg:gap-16">
          <header className="md:pt-1">
            <SectionEyebrow text="FAQ" icon={CircleHelp} />

            <h2
              id="pricing-faq-title"
              className="section-title mt-5 text-balance"
            >
              Frequently Asked Question
            </h2>

            <p className="section-subtitle">
              What you pay, what changes when you grow, and what happens if you
              leave.
            </p>
          </header>

          <FaqAccordion items={PRICING_FAQS} />
        </div>
      </div>
    </section>
  );
}
