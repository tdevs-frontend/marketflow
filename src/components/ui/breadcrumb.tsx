import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  /** Omitted on the last crumb — the current page is not a link to itself. */
  href?: string;
}

/**
 * The trail above a page title.
 *
 * Rendered as an ordered list inside a `nav`, which is what tells a screen
 * reader this is a hierarchy rather than four stray links; the current page
 * carries `aria-current` and no href.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded text-text-muted transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="font-medium text-text-secondary"
                >
                  {item.label}
                </span>
              )}

              {last ? null : (
                <ChevronRight className="size-3.5 shrink-0 text-border-strong" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
