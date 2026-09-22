import type { Metadata } from "next";

import {
  FinalCta,
  IntegrationsSection,
  SolutionsHero,
  SolutionsSection,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Connect the channels, commerce tools and developer services that power your MarketFlow workspace — all from one place.",
};

/**
 * The Solutions route.
 *
 * The header's Solutions item has pointed here since before the page existed;
 * this is the first block behind it. Three bands, in the order every other
 * marketing route uses them: the hero, the content, the closing panel.
 *
 * `SolutionsHero` carries the page's `h1`, its copy and its trail — built
 * from `BlogHero`, so the ground, the grid, the bloom and the breadcrumb are
 * the same ones `/blog` opens with. `IntegrationsSection` is the wall on its
 * own, on white, which keeps the tint/white alternation the rest of the site
 * marks its seams with.
 */
export default function SolutionsPage() {
  return (
    <>
      <SolutionsHero />

      <IntegrationsSection />

      <SolutionsSection />

      <FinalCta />
    </>
  );
}
