import { CircleHelp } from "lucide-react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { FEATURES_FAQ_IDS, pickFaqs } from "@/constants/faq";

/**
 * The questions a prospect actually types before signing up.
 *
 * Product questions with product answers - every one of them is answerable from
 * a section above, and each answer names the real surface rather than
 * restating the pitch. A FAQ whose answers are marketing copy is a second CTA
 * with a chevron on it.
 *
 * The copy is not here: it is eight entries from `FAQ_ITEMS`, the same list
 * `/faq` renders in full, and the open-and-close is the shared `FaqAccordion`.
 *
 * Two columns from `md`: the heading holds the left rail and the list runs down
 * the right. Eight items centred under a centred heading is a very long, very
 * narrow ribbon; splitting it gives the list a shorter measure and puts the
 * section's title in the reader's eye for the whole scroll. Below `md` the
 * grid collapses to heading, description, list - which is the reading order
 * already written into the source.
 */
const FAQS = pickFaqs(FEATURES_FAQ_IDS);

export function FeaturesFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        {/*
         * Roughly 35/65 from `lg`, a gentler 40/60 at `md` with a tighter gap -
         * the heading needs more of a tablet's width than it does a desktop's
         * before it starts wrapping every second word.
         */}
        <div className="grid gap-10 md:grid-cols-[3fr_3fr] md:gap-10 lg:grid-cols-[6fr_13fr] lg:gap-16">
          <header className="md:pt-1">
            <SectionEyebrow text="FAQ" icon={CircleHelp} />

            <h2 id="faq-title" className="section-title mt-5 text-balance">
              Frequently
              {/* Held on two lines only where the rail is wide enough to want
                  the break; elsewhere it wraps to whatever it is given. */}
              <br className="max-lg:hidden" /> Asked Questions
            </h2>

            <p className="section-subtitle">
              Have questions about MarketFlow? Explore the answers to common
              questions about campaigns, customers, automation, integrations and
              more.
            </p>
          </header>

          <FaqAccordion items={FAQS} />
        </div>
      </div>
    </section>
  );
}
