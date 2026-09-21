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
 * Hero, then the filtered grid. Nothing between them: a page whose job is to
 * get somebody into an article should not ask them to read a second
 * introduction first.
 *
 * No closing CTA either. This page is read by people who are not buying today,
 * and the site already asks them to sign up in the header, on the home page
 * and at the end of Features.
 */
export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <BlogListing />
    </>
  );
}
