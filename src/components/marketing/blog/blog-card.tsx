import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatArticleDate, type BlogArticle } from "@/constants/blog";

/**
 * One article, as a card.
 *
 * The same component on the landing section and on `/blog`, because they are
 * the same object and two components would drift — the first thing to go is
 * always the image ratio, and a row of cards whose thumbnails are not the same
 * shape reads as broken long before anyone works out why.
 *
 * Editorial rather than dashboard: image first and full-bleed, then the chip,
 * the title, the standfirst, and a footer of the two facts a reader uses to
 * decide whether to click. No KPI, no panel inset, no table.
 *
 * The whole card is one link. A card with a separate "Read article" anchor
 * inside it gives a screen reader two destinations that go to the same place
 * and gives a mouse a target that is mostly dead — so the arrow is decorative
 * and the `<article>` is the hit area.
 */
export function BlogCard({
  article,
  showDate = false,
  priority = false,
  className,
}: {
  article: BlogArticle;
  /** `/blog` prints the publication date; the landing row does not. */
  showDate?: boolean;
  /** Set on the first card of a grid that sits above the fold. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("group h-full", className)}>
      <Link
        href={`/blog/${article.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-[box-shadow,border-color,translate] duration-300 ease-out hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover focus-visible:shadow-focus focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {/*
         * 16:9 on every card, enforced by the wrapper rather than by the file,
         * so a replacement asset of a different size cannot change the grid.
         *
         * `unoptimized` because the artwork is SVG: the image optimiser
         * refuses SVG sources unless `dangerouslyAllowSVG` is set globally,
         * and there is nothing for it to do to a vector anyway.
         */}
        <div className="relative aspect-video overflow-hidden bg-background">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            unoptimized
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="inline-flex w-fit items-center rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            {article.category}
          </p>

          <h3 className="mt-4 text-lg sm:text-xl leading-7 font-bold text-text-primary transition-colors group-hover:text-primary text-pretty">
            {article.title}
          </h3>

          <p className="mt-2.5 text-sm leading-[1.7] text-text-secondary text-pretty">
            {article.description}
          </p>

          {/* `mt-auto` pins the footer to the bottom of the tallest card in the
              row, which is what keeps the three read-times on one line. */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <div className="flex min-w-0 items-center gap-2 text-sm text-text-muted">
              <Clock3 className="size-3.5 shrink-0" aria-hidden />
              <span>{article.readingMinutes} min read</span>
              {showDate ? (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={article.publishedAt} className="truncate">
                    {formatArticleDate(article.publishedAt)}
                  </time>
                </>
              ) : null}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
              Read article
              <ArrowRight
                className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
