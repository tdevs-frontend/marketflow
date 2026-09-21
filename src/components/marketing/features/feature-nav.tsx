"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The page's own table of contents.
 *
 * Eleven sections is more than anyone scrolls through looking for one answer,
 * and a visitor who came to find out whether MarketFlow does WhatsApp should
 * not have to pass CRM, campaigns and commerce to find out. Eight anchors, in
 * page order, sticky under the site header.
 *
 * Plain `<a href="#id">` rather than a router push or a scroll handler:
 * anchors are middle-clickable, copyable and survive JavaScript failing, and
 * the smooth scroll is `scroll-behavior` on the document, which the browser
 * already turns off for anyone who asked for reduced motion. The only thing
 * this component needs to be a client component for is knowing which link to
 * light.
 *
 * `overflow-x-auto` is the mobile floor: eight labels need about 560px, so
 * below that the row scrolls sideways inside its own strip rather than widening
 * the page.
 */

const ITEMS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "crm", label: "CRM" },
  { id: "campaigns", label: "Marketing" },
  { id: "automation", label: "Automation" },
  { id: "commerce", label: "Commerce" },
  { id: "social", label: "Social" },
  { id: "analytics", label: "Analytics" },
  { id: "integrations", label: "Integrations" },
];

export function FeatureNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ITEMS.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (sections.length === 0) return;

    /*
     * The band that decides what counts as "current".
     *
     * `rootMargin` pulls the viewport in to a strip just under the sticky
     * chrome: -30% off the top so a section is not current while it is still
     * behind the header, and -60% off the bottom so the next one does not claim
     * the highlight the moment its first pixel appears. Without the bottom
     * inset, two sections are intersecting for most of a scroll and the
     * highlight flickers between them.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Platform sections"
      className="sticky top-18 z-30 border-b border-border bg-surface/85 backdrop-blur"
    >
      <div className="custom-container">
        <ul className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
          {ITEMS.map((item) => {
            const current = active === item.id;

            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "inline-flex shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    current
                      ? "bg-primary-soft text-primary-dark"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
