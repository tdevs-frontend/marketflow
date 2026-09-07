"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
 * Routes that another route extends, and so cannot use a prefix match.
 *
 * `/dashboard/settings` is General *and* the parent of Profile, Billing and
 * the rest; a prefix match would leave General lit on every one of them. Same
 * for `/dashboard`, `/dashboard/integrations`, `/dashboard/automation`,
 * `/dashboard/templates` and `/dashboard/whatsapp`. Deriving the set from the
 * nav itself means a new child route can never reintroduce the bug.
 */
const EXACT_HREFS = new Set(
  ALL_HREFS.filter((href) =>
    ALL_HREFS.some((other) => other !== href && other.startsWith(`${href}/`)),
  ),
);

const isActive = (pathname: string, href: string) =>
  isActiveRoute(pathname, href, EXACT_HREFS.has(href));

/* -------------------------------------------------------------------------- */
/* Row styling                                                                */
/* -------------------------------------------------------------------------- */

const ROW =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus";

/** Active rows carry a solid fill — the emphasis the old left rail gave. */
const ROW_ACTIVE = "bg-nav-active text-white";
const ROW_IDLE =
  "text-text-secondary hover:bg-nav-active/10 hover:text-nav-active";
/** A collapsed parent holding the active page: tinted, not filled. */
const ROW_WITHIN = "bg-nav-active/10 text-nav-active";

const SUB_ROW =
  "flex items-center rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus";
const SUB_ACTIVE = "bg-nav-active/12 text-nav-active";
const SUB_IDLE = "text-text-muted hover:bg-nav-active/10 hover:text-nav-active";

/* -------------------------------------------------------------------------- */
/* Items                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * An item with children. The parent is a disclosure button rather than a link
 * — every child is a real destination, and the parent's own page is the first
 * of them, so there is nothing left for the parent row itself to point at.
 */
function CollapsibleItem({
  item,
  pathname,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const children = item.items ?? [];
  const holdsActive = children.some((child) => isActive(pathname, child.href));

  const [open, setOpen] = useState(holdsActive);

  /*
   * Arriving at a child from elsewhere should reveal the group it lives in,
   * without overriding a deliberate collapse on every render.
   *
   * Adjusted during render rather than from an effect: React re-runs the
   * component before committing, so the disclosure never paints closed and
   * then snaps open. Collapsing a group by hand sticks until navigation
   * actually moves into it.
   */
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
          className="mt-1 ml-[1.4rem] space-y-0.5 border-l border-border pl-2.5"
        >
          {children.map((child) => {
            const active = isActive(pathname, child.href);

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
  pathname,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  if (item.items?.length) {
    return (
      <CollapsibleItem
        item={item}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    );
  }

  /* Guarded by the type: an item with no children always carries an href. */
  if (!item.href) return null;

  const active = isActive(pathname, item.href);

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
        <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
          <Link href={APP_ROUTES.home} className="inline-flex items-center">
            <Logo height={30} priority />
          </Link>
        </div>

        <nav
          aria-label="Dashboard"
          className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
        >
          {dashboardNav.map((section) => (
            <div key={section.title}>
              <p className="px-2.5 text-[11px] font-medium text-text-heading/10 uppercase">
                {section.title}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <NavItemRow
                    key={item.href ?? item.title}
                    item={item}
                    pathname={pathname}
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
