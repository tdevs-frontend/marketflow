import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /**
   * Omitted on the last crumb - the current page is not a link to itself -
   * and on any level that groups without being a destination of its own.
   * Those render as muted text rather than as a link to a route that would
   * either 404 or land back on the page the reader is already looking at.
   */
  href?: string;
}

/**
 * The trail on every public inner page - Features, Solutions, Pricing, Blog,
 * an article, Contact, the legal documents. A page passes its crumbs and
 * nothing else; type, colours, separator, alignment and wrapping live here.
 *
 * `<nav>` wrapping an `<ol>` rather than a row of divs, because the order is
 * the meaning here: a screen reader announces "list, 2 items" and reads the
 * hierarchy. The current page carries `aria-current="page"` and is plain text.
 * The separator is `aria-hidden` - punctuation read out between every level
 * is noise.
 *
 * It renders inside the page's hero rather than as a band of its own, so it
 * takes no background or container: the hero's ground and column are its.
 *
 * One row wherever it fits. On a narrow screen the row wraps crumb by crumb,
 * and a long label - an article title - breaks within itself rather than
 * pushing the page sideways, which is what `min-w-0` and `wrap-anywhere` are
 * for.
 */
export function PageBreadcrumb({
  items,
  align = "center",
  className,
}: {
  items: Crumb[];
  /**
   * `center` for the centred hero every inner page opens on; `start` for a
   * left-aligned column, such as an article header.
   */
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-x-1 gap-y-1 text-sm font-semibold",
          align === "center" && "justify-center",
        )}
      >
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={item.label} className="flex min-w-0 items-center gap-x-2">
              {/* A step down from the label's own size and lighter than the
                  muted ink, so the trail reads as words with marks between
                  them rather than as a row of equal parts. */}
              {index > 0 ? (
                <ChevronRight
                  className="size-4.5 shrink-0 text-text-muted/60"
                  aria-hidden
                />
              ) : null}

              {last || !item.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    "min-w-0 wrap-anywhere",
                    last ? "text-text-primary" : "text-text-muted",
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="shrink-0 rounded-base text-text-muted transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
