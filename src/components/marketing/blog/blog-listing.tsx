"use client";

import { useEffect, useRef, useState } from "react";

import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { BLOG_ARTICLES, BLOG_FILTERS, BLOG_PAGE_SIZE } from "@/constants/blog";

import { BlogCard } from "./blog-card";

/**
 * The full library: category filter, grid, pagination.
 *
 * Filtering and paging both happen on the client over an array that ships with
 * the page. Twenty-four articles is not a dataset - routing each click through
 * `?topic=&page=` would cost a navigation to re-render cards that are already
 * in memory, and the URL would only be worth having if a filtered page two
 * were something people share. It is not.
 *
 * `Pagination` is the dashboard's control, unchanged. It already carries the
 * range line, the primary active page, the bordered inactive ones and the
 * disabled arrows at the ends, and a second pagination built to look like it
 * would be a copy waiting to drift.
 *
 * `aria-pressed` rather than tabs: these are toggles over one list, not
 * separate panels, and calling them tabs would promise a screen reader an
 * arrow-key relationship that does not exist here.
 */
export function BlogListing() {
  const [topic, setTopic] = useState<string>("all");
  const [page, setPage] = useState(1);

  const gridRef = useRef<HTMLDivElement>(null);
  /* Page one on mount is the initial render, not a navigation - scrolling
     there would yank a reader who has just arrived down past the hero. */
  const paged = useRef(false);

  const articles =
    topic === "all"
      ? BLOG_ARTICLES
      : BLOG_ARTICLES.filter((article) => article.topic === topic);

  const totalPages = Math.max(1, Math.ceil(articles.length / BLOG_PAGE_SIZE));
  /* Clamped rather than trusted: a filter change can leave `page` past the end
     of the new, shorter list for one render. */
  const current = Math.min(page, totalPages);
  const visible = articles.slice(
    (current - 1) * BLOG_PAGE_SIZE,
    current * BLOG_PAGE_SIZE,
  );

  useEffect(() => {
    if (!paged.current) return;
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current]);

  const changeTopic = (value: string) => {
    setTopic(value);
    /* Back to the first page, and without a scroll: the filter row is already
       at the top of what changed. */
    paged.current = false;
    setPage(1);
  };

  const changePage = (value: number) => {
    paged.current = true;
    setPage(value);
  };

  return (
    <section
      aria-labelledby="blog-listing-title"
      className="section-space-pb bg-surface pt-12 lg:pt-14"
    >
      <div ref={gridRef} className="custom-container scroll-mt-28">
        <h2 id="blog-listing-title" className="sr-only">
          All articles
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {BLOG_FILTERS.map((filter) => {
            const active = filter.value === topic;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => changeTopic(filter.value)}
                aria-pressed={active}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/*
         * The count is printed by `Pagination` under the grid, which is where
         * it belongs visually. This says the same thing to a screen reader at
         * the moment the filter changes, rather than several thousand pixels
         * later - and says it once, since the visible copy is not live.
         */}
        <p aria-live="polite" className="sr-only">
          {articles.length} {articles.length === 1 ? "article" : "articles"},
          page {current} of {totalPages}
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visible.map((article, index) => (
            <BlogCard
              key={article.slug}
              article={article}
              showDate
              priority={current === 1 && index < 3}
            />
          ))}
        </div>

        <div className="mt-10">
          <Pagination
            page={current}
            totalPages={totalPages}
            total={articles.length}
            perPage={BLOG_PAGE_SIZE}
            onChange={changePage}
            noun="articles"
            /* The only control on the page, and as likely to be tapped as
               clicked - the dashboard's 32px footer scale is too small to be
               the last thing a marketing page asks somebody to hit. */
            size="lg"
            showRange={false}
          />
        </div>
      </div>
    </section>
  );
}
