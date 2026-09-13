"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn, isActiveRoute } from "@/lib/utils";

export interface ModuleNavItem {
  title: string;
  href: string;
}

/**
 * A module's own pages, as a strip of links.
 *
 * This is the second half of the navigation strategy the sidebar depends on.
 * The global sidebar carries business areas — WhatsApp, Email, Commerce — and
 * stops there; the pages inside a module are reached from here. That split is
 * what took the sidebar from fifty links to nine entries without a single page
 * becoming unreachable.
 *
 * It also fixes something a global sidebar cannot: "Templates" means a
 * different thing under Email than under Automation, and only the module it
 * sits in can say which one you are looking at.
 *
 * Links, not `Tabs`. The tab component owns `role="tablist"`, arrow-key
 * movement and a `tabpanel` — promises that belong to panels swapped in place.
 * These are routes: they belong in a `<nav>`, they are middle-clickable, and
 * the current one is announced with `aria-current`, not `aria-selected`.
 * The look is deliberately the same as `Tabs` so the two read as one system.
 */
export function ModuleNav({
  items,
  label,
  className,
}: {
  items: ModuleNavItem[];
  /** Names the module for assistive tech — "WhatsApp pages". */
  label: string;
  className?: string;
}) {
  const pathname = usePathname();

  /* Longest match wins, so `/email/campaigns` lights Campaigns rather than
     Campaigns *and* the module's own Overview at `/email`. */
  const active = items.reduce<string | null>((best, item) => {
    if (!isActiveRoute(pathname, item.href)) return best;
    return !best || item.href.length > best.length ? item.href : best;
  }, null);

  return (
    <nav
      aria-label={label}
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto border-b border-border",
        className,
      )}
    >
      {items.map((item) => {
        const current = item.href === active;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:shadow-focus focus-visible:outline-none",
              current
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
