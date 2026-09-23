import type { Metadata } from "next";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FinalCta, PricingFaq, PricingSection } from "@/components/marketing";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a plan that fits your business and scale your marketing, automation, customers, and sales from one powerful workspace.",
};

/**
 * The pricing route, as four blocks: the plans, the billing questions, the
 * closing panel, and the footer the layout supplies.
 *
 * `PricingSection` is shared with the home page and carries the intro, the
 * monthly/yearly toggle and the cards - so the header stays part of the
 * pricing block rather than becoming a hero section of its own. The breadcrumb
 * is passed into it for the same reason.
 *
 * What used to sit between the cards and the bottom of the page - a
 * four-card capability grid and a reassurance strip - is gone. Both said true
 * things and both said them after the decision had already been made: a
 * visitor who has read four tiers and a feature list per tier is not still
 * asking what the product does, and two more content blocks between the prices
 * and the way to act on them is distance, not reassurance. `PricingValue` and
 * `PricingTrust` are still exported and still build; nothing else imports them.
 */
export default function PricingPage() {
  return (
    <>
      <PricingSection
        headingLevel="h1"
        breadcrumb={
          <Breadcrumb
            align="center"
            items={[
              { label: "Home", href: APP_ROUTES.home },
              { label: "Pricing" },
            ]}
          />
        }
      />

      <PricingFaq />

      <FinalCta />
    </>
  );
}
