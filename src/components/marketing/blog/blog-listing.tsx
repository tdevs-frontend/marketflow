"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { BLOG_ARTICLES, BLOG_FILTERS } from "@/constants/blog";

import { BlogCard } from "./blog-card";

/**
 * The full library, with its category filter.
 *
 * Client-side filtering over an array that ships with the page. Nine articles
 * is not a dataset — routing each filter through `?topic=` would cost a
 * navigation per click to re-render the same nine cards, and the URL would
 * only be worth having if the filtered view were something to share.
 *
 * `aria-pressed` rather than tabs: these are toggles over one list, not
 * separate panels, and calling them tabs would promise a screen reader an
 * arrow-key relationship that does not exist here.
 *
 * The count is stated because the grid is filtered visually — without it, a
 * reader using a screen reader gets no feedback that the button did anything.
 */
export function BlogListing() {
  const [active, setActive] = useState<string>("all");

  const articles =
    active === "all"
      ? BLOG_ARTICLES
      : BLOG_ARTICLES.filter((article) => article.topic === active);

  return (
    <section
      aria-labelledby="blog-listing-title"
      className="section-space-py bg-surface"
    >
      <div className="custom-container">
        <h2 id="blog-listing-title" className="sr-only">
          All articles
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {BLOG_FILTERS.map((filter) => {
            const current = filter.value === active;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActive(filter.value)}
                aria-pressed={current}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                  current
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="mt-5 text-sm text-text-muted">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {articles.map((article, index) => (
            <BlogCard
              key={article.slug}
              article={article}
              showDate
              priority={index < 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
