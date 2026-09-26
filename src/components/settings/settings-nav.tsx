"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SETTINGS_NAV, SETTINGS_PAGES } from "@/constants/settings";
import { cn, isActiveRoute } from "@/lib/utils";

/**
 * The Settings module's own navigation.
 *
 * One component, two shapes, because the two viewports are answering different
 * questions. On desktop there is room for a rail that shows the whole module at
 * once - every destination, with the current one lit - and that standing map is
 * what makes Settings feel like a place rather than a series of pages. On a phone there is no such room, so it collapses to a scrolling strip
 * of the same links in the same order: fewer things visible, nothing hidden
 * behind a control you have to think to open.
 *
 * Links, not tabs. These are routes, so they belong in a `<nav>`, they are
 * middle-clickable, and the current one is announced with `aria-current="page"`
 * rather than `aria-selected`. The tab strip this replaced could not be deep
 * linked at all - there was no URL for Security to paste to anybody.
 *
 * `SETTINGS_NAV` is the single list, and it is now a single group: the person
 * signed in. Billing and API & Developer used to be the other two and are
 * dashboard modules of their own - their routes still sit under
 * `/dashboard/settings/`, so no link breaks, but they are outside this rail's
 * route group and never render it. See `app/dashboard/settings/(account)`.
 */

/**
 * Longest match wins, so `/settings/profile` lights Profile rather than Profile
 * *and* Overview at `/settings`.
 */
function useActiveHref(): string | null {
  const pathname = usePathname();

  return SETTINGS_PAGES.reduce<string | null>((best, page) => {
    if (!isActiveRoute(pathname, page.href)) return best;
    return !best || page.href.length > best.length ? page.href : best;
  }, null);
}

export function SettingsNav() {
  const active = useActiveHref();

  return (
    <>
      <DesktopNav active={active} />
      <MobileNav active={active} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Sticky, because Notifications and Security are long pages and a rail that
 * scrolls away is a rail you have to go back for. `top-22` clears the dashboard
 * header, which is `h-18` and sticky itself.
 */
function DesktopNav({ active }: { active: string | null }) {
  return (
    <nav
      aria-label="Settings sections"
      className="sticky top-22 hidden self-start lg:block"
    >
      <div className="space-y-6">
        {SETTINGS_NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-meta font-semibold text-text-muted capitalize">
              {group.title}
            </p>

            <ul className="mt-2 space-y-0.5">
              {group.items.map((page) => {
                const current = page.href === active;
                const Icon = page.icon;

                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                        /* The colour lives on each branch rather than in a
                           shared base: `cn()` is a plain join, so a base-level
                           colour would race the active one in the stylesheet
                           instead of losing to it cleanly. */
                        current
                          ? "bg-primary-soft font-semibold text-primary-dark"
                          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The same links as a horizontally scrolling strip.
 *
 * Not a `<select>`. A dropdown hides every destination behind a tap and gives
 * no sense of how much there is; the strip shows three at a time and the cut-off
 * fourth is what tells the reader to swipe. The group heading is dropped rather
 * than squeezed in - a handful of items on one line do not need one.
 *
 * `-mx-4` and the matching padding let it bleed to the screen edge inside the
 * dashboard's `p-4` main, so the last item scrolls fully into view instead of
 * stopping against a gutter.
 */
function MobileNav({ active }: { active: string | null }) {
  return (
    <nav
      aria-label="Settings sections"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:-mx-7 md:px-7 lg:hidden"
    >
      {SETTINGS_PAGES.map((page) => {
        const current = page.href === active;
        const Icon = page.icon;

        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:shadow-focus focus-visible:outline-none",
              current
                ? "border-primary bg-primary-soft font-semibold text-primary-dark"
                : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {page.title}
          </Link>
        );
      })}
    </nav>
  );
}
