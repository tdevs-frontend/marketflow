import type { Metadata } from "next";

import {
  PricingSection,
  PricingTrust,
  PricingValue,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a plan that fits your business and scale your marketing, automation, customers, and sales from one powerful workspace.",
};

/**
 * The full pricing experience. `PricingSection` — the title and the tiers — is
 * shared with the homepage; the capability comparison and the reassurance
 * strip are composed here, because the homepage deliberately stops at the
 * cards.
 */
export default function PricingPage() {
  return (
    <>
      <PricingSection headingLevel="h1" />

      <PricingValue />

      <PricingTrust />
    </>
  );
}
