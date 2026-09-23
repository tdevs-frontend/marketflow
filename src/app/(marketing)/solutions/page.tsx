import type { Metadata } from "next";

import {
  FinalCta,
  SolutionsHero,
  SolutionsSection,
  TestimonialSection,
  WhyChooseUs,
} from "@/components/marketing";
import { ConnectedJourney } from "@/components/marketing/features";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "See how MarketFlow works for e-commerce, small business, agencies, real estate, education, clinics and restaurants — one workspace for customers, conversations, campaigns and automation.",
};

/**
 * The Solutions route.
 *
 * Six bands, and the argument runs in one direction: who this is for, what
 * they get, how it fits together, who already bought it, and the way to start.
 *
 * `SolutionsHero` carries the page's `h1`, its copy and its trail — built from
 * `BlogHero`, so the ground, the grid, the bloom and the breadcrumb are the
 * same ones `/blog` opens with.
 *
 * `SolutionsSection` leads, because the question this page answers first is
 * "is this for a business like mine". Its heading is passed in rather than
 * left at the default: the default reads "Built for businesses of every size
 * and industry", and `WhyChooseUs` directly below opens "Built for businesses
 * that think bigger" — two headings that start with the same three words, one
 * screen apart.
 *
 * `WhyChooseUs` and `ConnectedJourney` are the two reused blocks. The first is
 * the home page's capability grid, and it earns its place here because every
 * card links into the matching `/features` anchor — a reader who has just
 * found their industry gets the capabilities behind it with a way through to
 * the detail. The second is the eight-step walk of one customer through the
 * modules, which used to sit unused on the Features page under a `PlatformFlow`
 * making the same argument; this is the page where nothing else tells that
 * story.
 *
 * The integration wall is no longer here — it moved to
 * `/features#integrations`, where it sits directly under the section that
 * makes the integrations argument and supplies the evidence for it. It had
 * nothing to answer on this page: a reader who has just found their industry
 * and read the capabilities behind it is asking what MarketFlow does for a
 * business like theirs, and a grid of ten vendor logos is an answer to a
 * different question.
 *
 * Grounds alternate and never repeat: hero, the grid's light grey,
 * `WhyChooseUs` on white (which is what its `ground` prop exists for),
 * the journey's tint, the testimonial band's navy, and the closing panel back
 * on white.
 */
export default function SolutionsPage() {
  return (
    <>
      <SolutionsHero />

      <SolutionsSection
        eyebrow="Business solutions"
        headingLead="Solutions built for the realities"
        headingRest="your industry"
        subheading="Whatever you sell and whoever you sell it to, MarketFlow gives you one workspace to attract, engage and retain customers — arranged around the way your business already works."
      />

      <ConnectedJourney />

      <WhyChooseUs ground="surface" />

      <TestimonialSection />

      <FinalCta />
    </>
  );
}
