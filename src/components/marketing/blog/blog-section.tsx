import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { APP_ROUTES } from "@/constants";
import { FEATURED_ARTICLES } from "@/constants/blog";

import { BlogCard } from "./blog-card";

/**
 * The Resources row on the landing page, immediately before the closing CTA.
 *
 * Its job at that point in the scroll is specific: a visitor who has read the
 * product sections and the pricing and is not ready to sign up has exactly two
 * options, and without this one they are "leave". Three articles give them a
 * reason to stay on the site that does not require a decision.
 *
 * On the tinted ground, so it separates from the white pricing section above
 * it and from the CTA panel below — the same white/tint alternation the rest
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
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <BookOpen className="size-4 text-primary" aria-hidden />
            From the blog
          </p>

          <h2 id="blog-section-title" className="section-title mt-5 text-balance">
            Ideas to help you <span className="brand-gradient-text">grow</span>{" "}
            smarter
          </h2>

          <p className="mt-3.5 text-base leading-[1.7] text-text-secondary text-pretty">
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
