import type { Metadata } from "next";
import { CtaSection, IntegrationsSection } from "@/components/marketing";
import {
  AllFeatures,
  FeaturesFaq,
  PlatformFlow,
} from "@/components/marketing/features";

export const metadata: Metadata = {
  /*
   * `absolute`, so the root layout stops appending "· MarketFlow".
   *
   * The template is right for every other page and wrong for this one: the
   * title already opens with the brand, and the suffix pushed it past the ~60
   * characters a search result shows, truncating the half that describes the
   * product.
   */
  title: {
    absolute:
      "MarketFlow Features - CRM, Marketing Automation & Customer Conversations",
  },
  description:
    "Explore MarketFlow features for CRM, WhatsApp automation, marketing campaigns, commerce, customer journeys, analytics and integrations.",
};

export default function FeaturesPage() {
  return (
    <>
      {/*
       * The map before the tour.
       *
       * A visitor who has just read the hero is still asking how much is in
       * here, and nine deep sections answer that slowly. `AllFeatures` lists
       * every module at once, so the sections below are read as detail on
       * something already understood rather than as an unbounded scroll.
       */}
      <AllFeatures />

      {/* The journey the detailed sections hang off: WhatsApp is Engage, the
          automation builder is Automate, commerce is Convert, analytics is
          Grow. Also the `#platform` target the hero's second button uses. */}
      <PlatformFlow />

      {/*
       * The integrations block, and the whole of it - the claim and the ten
       * marks that back it, each linking to the page in the workspace that
       * configures it. A wall a buyer can click through is the cheapest claim
       * on this page to verify.
       *
       * It carries `#integrations`, which is where the footer's Product column
       * points. On the tint, so it does not
       * merge into the white Analytics section above it.
       */}
      <IntegrationsSection />

      <FeaturesFaq />

      <CtaSection />
    </>
  );
}
