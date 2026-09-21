import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omitted on the last crumb — the current page is not a link to itself. */
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
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-x-1.5">
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-text-muted/70"
                  aria-hidden
                />
              ) : null}

              {last || !item.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(last && "font-medium text-text-primary")}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-text-muted transition-colors hover:text-primary"
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
