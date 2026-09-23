import type { Metadata } from "next";
import { Tag } from "lucide-react";

import { CtaSection, PricingFaq, PricingSection } from "@/components/marketing";
import { PageHero } from "@/components/marketing/page-hero";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a plan that fits your business and scale your marketing, automation, customers, and sales from one powerful workspace.",
};

/**
 * The pricing route, as five blocks: the hero every inner page opens on, the
 * plans, the billing questions, the closing panel, and the footer the layout
 * supplies.
 *
 * `PricingSection` is shared with the home page and carries the intro, the
 * monthly/yearly toggle and the cards; here it sits under `PageHero`, which
 * owns the page's <h1> and breadcrumb, so it renders as the home page does.
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
      <PageHero
        id="pricing"
        eyebrow="MarketFlow Pricing"
        icon={Tag}
        title={
          <>
            Plans that scale{" "}
            <span className="brand-gradient-text">as your business grows</span>
          </>
        }
        breadcrumb={[
          { label: "Home", href: APP_ROUTES.home },
          { label: "Pricing" },
        ]}
      />

      <PricingSection />

      <PricingFaq />

      <CtaSection />
    </>
  );
}
