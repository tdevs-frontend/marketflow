import type { Metadata } from "next";

import { BlogHero, BlogListing } from "@/components/marketing/blog";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description:
    "Practical insights on WhatsApp automation, CRM, campaigns, customer segmentation, commerce and analytics from the MarketFlow team.",
};

/**
 * The Resources library.
 *
 * Hero, then the filtered grid — the topic row, the cards and the pager are
 * all `BlogListing`, which owns the filter and page state together because
 * changing a topic has to reset the page. Nothing between the two: a page
 * whose job is to get somebody into an article should not ask them to read a
 * second introduction first.
 *
 * Nothing after the grid either. The page ends on the pager, so the last thing
 * a reader meets is another article rather than a sales panel; the related
 * articles under each post (`/blog/[slug]`) are what keep them reading.
 */
export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <BlogListing />
    </>
  );
}
