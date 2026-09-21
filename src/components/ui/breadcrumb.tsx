import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /**
   * Omitted on the last crumb — the current page is not a link to itself —
   * and on any level that groups without being a destination of its own.
   * Those render as muted text rather than as a link to a route that would
   * either 404 or land back on the page the reader is already looking at.
   */
  href?: string;
}

/**
 * A trail, as a list.
 *
 * `<nav>` wrapping an `<ol>` rather than a row of divs, because the order is
 * the meaning here: a screen reader announces "list, 2 items" and reads the
 * hierarchy, which is the entire content of the component. The current page
 * carries `aria-current="page"` and is plain text — an anchor pointing at the
 * page you are already on is a link that does nothing.
 *
 * The separator is `aria-hidden`; it is punctuation, and having it read out
 * between every crumb is noise.
 *
 * Built here rather than inside the Blog hero because the shape is not
 * blog-specific — any page below the top level needs the same trail, and the
 * second copy is where the two start to disagree about the separator.
 */
export function Breadcrumb({
  items,
  align = "start",
  className,
}: {
  items: Crumb[];
  /**
   * Where the trail sits in the space it is given.
   *
   * `start` is the default and the usual answer — a trail is chrome, and
   * chrome lines up with the content it labels. `center` is for a trail that
   * closes a centred hero, where the left edge of the container would leave it
   * stranded away from everything it sits under.
   */
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm",
          align === "center" && "justify-center",
        )}
      >
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-x-2">
              {/* Punctuation, and `aria-hidden` for that reason — a separator
                  read out between every level is noise. A step down from the
                  label's own size and lighter than the muted ink, so the trail
                  reads as words with marks between them rather than as a row
                  of equal parts. */}
              {index > 0 ? (
                <ChevronRight
                  className="size-3 shrink-0 text-text-muted/60"
                  aria-hidden
                />
              ) : null}

              {last || !item.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    last ? "font-medium text-text-primary" : "text-text-muted",
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-sm text-text-muted transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
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
