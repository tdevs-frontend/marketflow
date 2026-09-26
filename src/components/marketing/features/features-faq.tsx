import { CircleHelp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
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
 * Two columns from `lg`: the heading holds the left rail and the list runs down
 * the right. Eight items centred under a centred heading is a very long, very
 * narrow ribbon; splitting it gives the list a shorter measure and puts the
 * section's title in the reader's eye for the whole scroll. Below `lg` the
 * grid collapses to heading, description, list at full width - the reading
 * order already written into the source. A tablet half is too narrow for
 * either: the title wraps a word a line and the answers run to a thin column.
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
         * Roughly 30/70 from `lg`; stacked at full width below it.
         * `minmax(0, …)` so a long unbroken string in an answer can never
         * widen its track past the container.
         */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,13fr)] lg:gap-16">
          <header className="lg:pt-1">
            <Badge
              as="p"
              variant="primary-outline"
              size="lg"
              casing="none"
              icon={<CircleHelp aria-hidden />}
            >
              FAQ
            </Badge>

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
