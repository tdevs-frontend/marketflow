"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, dashboardNav, type DashboardNavItem } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { setMobileNavOpen } from "@/redux/features/ui/uiSlice";
import { cn, isActiveRoute, slugify } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Active matching                                                            */
/* -------------------------------------------------------------------------- */

const ALL_HREFS = dashboardNav.flatMap((section) =>
  section.items.flatMap((item) => [
    ...(item.href ? [item.href] : []),
    ...(item.items?.map((child) => child.href) ?? []),
  ]),
);

/**
 * The one row the current route belongs to: the longest href that matches it.
 *
 * Longest-wins rather than a set of routes forced to match exactly, which is
 * what this replaced. The exact-match set was derived — any href another href
 * extended became exact — and that is a blunter rule than the sidebar needs.
 * `/dashboard/settings` is the parent of five pages, so it went exact, and the
 * Settings row went dark on Profile, Notifications and Security. It only looked
 * right because the sidebar happened to list no route under it.
 *
 * It stopped looking right the moment Billing and Developer moved out of
 * Settings into groups of their own. Their routes still live under
 * `/dashboard/settings/` — deliberately, so no bookmark breaks — so the
 * Settings row prefix-matches them, and a merchant on the billing page would
 * have seen two rows lit, one of which is a different module.
 *
 * Resolving the longest match answers both at once, with no per-row
 * configuration and nothing to keep in sync:
 *
 *   `/dashboard/settings/profile`  → only `/dashboard/settings` matches, so
 *                                    Settings lights, which is correct: the
 *                                    rail inside the module says which page.
 *   `/dashboard/settings/billing`  → `/dashboard/settings` *and*
 *                                    `/dashboard/settings/billing` match, and
 *                                    the longer one wins. Billing lights alone.
 *   `/dashboard/sales/customers`   → Customers, not Sales.
 *   `/dashboard/integrations/email`→ nothing deeper is listed, so the module
 *                                    row stays lit across all seven pages.
 *
 * A query string is not part of `pathname`, so `?tab=plans` and `?tab=history`
 * resolve exactly as the bare route does.
 */
function useActiveHref(pathname: string): string | null {
  return useMemo(
    () =>
      ALL_HREFS.reduce<string | null>((best, href) => {
        if (!isActiveRoute(pathname, href)) return best;
        return !best || href.length > best.length ? href : best;
      }, null),
    [pathname],
  );
}

/* -------------------------------------------------------------------------- */
/* Row styling                                                                */
/* -------------------------------------------------------------------------- */

const ROW =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus";

/* Brand ramp tokens, not opacity mixes — the ramp already has the tint steps. */
const ROW_ACTIVE = "bg-primary text-white";
/*
 * Top-level rows take the primary ink rather than the secondary.
 *
 * The colour lives here and not in `ROW` on purpose: `ROW` is shared with
 * `ROW_ACTIVE`, and `cn()` is a plain join, so a colour in the shell would race
 * `text-white` in the stylesheet rather than losing to it cleanly. Keeping
 * `ROW` to geometry means each state names its own ink and nothing collides.
 */
const ROW_IDLE =
  "text-text-primary hover:bg-primary-soft hover:text-primary-dark";
/** A collapsed parent holding the active page: tinted, not filled. */
const ROW_WITHIN = "bg-primary-soft text-primary-dark";

const SUB_ROW =
  "flex items-center rounded-lg px-3 py-1.5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus";
const SUB_ACTIVE = "bg-primary-soft text-primary-dark";
/* Sub-rows hover on the same tint the current page carries, so hovering a row
   previews exactly what picking it will look like. */
const SUB_IDLE = "text-text-muted hover:bg-primary-soft hover:text-primary-dark";

/* -------------------------------------------------------------------------- */
/* Items                                                                      */
/* -------------------------------------------------------------------------- */

/** The parent is a disclosure, not a link — its own page is the first child. */
function CollapsibleItem({
  item,
  activeHref,
  onNavigate,
}: {
  item: DashboardNavItem;
  activeHref: string | null;
  onNavigate: () => void;
}) {
  const children = item.items ?? [];
  const holdsActive = children.some((child) => child.href === activeHref);

  const [open, setOpen] = useState(holdsActive);

  /* Reveal the group when navigation moves into it. Adjusted during render,
     not in an effect, so it never paints closed then snaps open. */
  const [wasHoldingActive, setWasHoldingActive] = useState(holdsActive);
  if (holdsActive !== wasHoldingActive) {
    setWasHoldingActive(holdsActive);
    if (holdsActive) setOpen(true);
  }

  const submenuId = `nav-${slugify(item.title)}`;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={submenuId}
        className={cn(ROW, holdsActive && !open ? ROW_WITHIN : ROW_IDLE)}
      >
        <Icon name={item.icon} className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          id={submenuId}
          className="mt-1 ml-5 space-y-0.5 border-l border-border pl-2.5"
        >
          {children.map((child) => {
            const active = child.href === activeHref;

            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(SUB_ROW, active ? SUB_ACTIVE : SUB_IDLE)}
                >
                  {child.title}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function NavItemRow({
  item,
  activeHref,
  onNavigate,
}: {
  item: DashboardNavItem;
  activeHref: string | null;
  onNavigate: () => void;
}) {
  if (item.items?.length) {
    return (
      <CollapsibleItem
        item={item}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
    );
  }

  /* Guarded by the type: an item with no children always carries an href. */
  if (!item.href) return null;

  const active = item.href === activeHref;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
      >
        <Icon name={item.icon} className="size-4 shrink-0" />
        {item.title}
      </Link>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

export function DashboardSidebar() {
  const pathname = usePathname();
  const activeHref = useActiveHref(pathname);
  const dispatch = useAppDispatch();
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);

  const closeMobileNav = () => dispatch(setMobileNavOpen(false));

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-text-primary/40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-66 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-18 shrink-0 items-center border-b border-border px-5">
          <Link href={APP_ROUTES.home} className="inline-flex items-center">
            <Logo height={30} priority />
          </Link>
        </div>

        <nav
          aria-label="Dashboard"
          className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-5"
        >
          {dashboardNav.map((section) => (
            <div key={section.title}>
              <p className="px-2.5 text-xs font-medium  text-text-muted uppercase">
                {section.title}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <NavItemRow
                    key={item.href ?? item.title}
                    item={item}
                    activeHref={activeHref}
                    onNavigate={closeMobileNav}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
