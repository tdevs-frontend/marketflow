"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
}

/**
 * The desktop "On this page" rail, with the section being read highlighted.
 *
 * The highlight is the last section whose heading has crossed a line a little
 * below the sticky header - the one the reader is inside, not merely the one
 * whose top happens to be on screen. An `IntersectionObserver` only says when
 * that changes; the pick itself is made by position, so a short section
 * scrolled past quickly cannot leave a stale highlight behind.
 *
 * Links are plain anchors, so the rail works without JavaScript; the script
 * only adds the highlight.
 */
export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (sections.length === 0) return;

    /* The sticky header is 72px; 120px gives the heading a moment on screen
       before its section counts as the one being read. */
    const LINE = 120;

    const pick = () => {
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top - LINE <= 0) current = section.id;
      }
      setActive(current);
    };

    const observer = new IntersectionObserver(pick, {
      rootMargin: `-${LINE}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="text-sm font-semibold tracking-wide text-text-secondary capitalize">
        On this page
      </p>

      <ol className="mt-4 space-y-0.5 border-l border-border">
        {items.map((item, index) => {
          const current = item.id === active;

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "-ml-px flex gap-2 border-l-2 py-1.5 pr-2 pl-4 text-sm leading-snug font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none motion-reduce:transition-none",
                  current
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-text-secondary hover:border-border-strong hover:text-text-primary",
                )}
              >
                <span className="w-5 shrink-0 tabular-nums text-text-muted">
                  {index + 1}.
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
