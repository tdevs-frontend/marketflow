import type { Metadata } from "next";

import { FinalCta } from "@/components/marketing";
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
 * `FinalCta` closes it, on the white ground `BlogListing` ends on. This page
 * is read by people who are not buying today and the ask sat only in the
 * header for a long time — but a reader who has just worked through a filter
 * and a pager has spent real attention here, and the bottom of that scroll is
 * the one place on the route where asking costs nothing. It is the same panel
 * `/solutions`, `/pricing` and `/contact` end on, so the route closes the way
 * the rest of the site does.
 */
export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <BlogListing />
      <FinalCta />
    </>
  );
}
