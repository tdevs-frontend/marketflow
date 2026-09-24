import type { Metadata } from "next";
import { CircleHelp } from "lucide-react";

import { CtaSection, FaqSection } from "@/components/marketing";
import { PageHero } from "@/components/marketing/page-hero";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about MarketFlow - customer management, marketing automation, campaigns, WhatsApp, workflows, commerce and analytics.",
};

/**
 * The FAQ route: the hero every inner page opens on, the full product FAQ,
 * and the closing panel.
 *
 * The hero owns the "Frequently Asked Questions" `<h1>`, so `FaqSection` is
 * told not to repeat it and opens on its subtitle instead. The questions are
 * `FAQ_ITEMS`, the same list `/features` draws its eight from.
 *
 * On the tint, like the FAQ on `/features` and `/pricing`, which is what
 * separates it from the white closing panel below.
 */
export default function FaqPage() {
  return (
    <>
      <PageHero
        id="faq"
        eyebrow="FAQ"
        icon={CircleHelp}
        title={
          <>
            Frequently Asked{" "}
            <span className="brand-gradient-text">Questions</span>
          </>
        }
        breadcrumb={[
          { label: "Home", href: APP_ROUTES.home },
          { label: "FAQ" },
        ]}
      />

      <FaqSection id="questions" title={null} className="bg-background" />

      <CtaSection />
    </>
  );
}
