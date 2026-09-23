import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { APP_ROUTES } from "@/constants";
import { FEATURED_ARTICLES } from "@/constants/blog";

import { BlogCard } from "./blog-card";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";

/**
 * The Resources row on the landing page, immediately before the closing CTA.
 *
 * Its job at that point in the scroll is specific: a visitor who has read the
 * product sections and the pricing and is not ready to sign up has exactly two
 * options, and without this one they are "leave". Three articles give them a
 * reason to stay on the site that does not require a decision.
 *
 * On the tinted ground, so it separates from the white pricing section above
 * it and from the CTA panel below - the same white/tint alternation the rest
 * of the page uses to mark a seam.
 */
export function BlogSection() {
  return (
    <section
      id="blog"
      aria-labelledby="blog-section-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <SectionEyebrow icon={BookOpen}>From the blog</SectionEyebrow>

          <h2 id="blog-section-title" className="section-title mt-5 text-balance">
            Ideas to help you <span className="brand-gradient-text">grow</span>{" "}
            smarter
          </h2>

          <p className="section-subtitle">
            Practical insights on marketing, customer engagement, automation,
            commerce and growing with MarketFlow.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {FEATURED_ARTICLES.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
