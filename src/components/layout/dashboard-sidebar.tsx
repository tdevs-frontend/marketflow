"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { APP_ROUTES, dashboardNav } from "@/constants";
import { siteConfig } from "@/config/site";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { setMobileNavOpen } from "@/redux/features/ui/uiSlice";
import { cn, isActiveRoute } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => dispatch(setMobileNavOpen(false))}
          className="fixed inset-0 z-40 bg-text-primary/40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-semibold">
          <Link href={APP_ROUTES.dashboard} className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-btn bg-primary text-sm font-bold text-white">
              M
            </span>
            {siteConfig.name}
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {dashboardNav.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {section.title}
              </p>
              {section.items.map((item) => {
                const active = isActiveRoute(
                  pathname,
                  item.href,
                  item.href === APP_ROUTES.dashboard,
                );
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => dispatch(setMobileNavOpen(false))}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-btn px-2.5 py-2 text-sm transition-all",
                      "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:transition-opacity",
                      active
                        ? "bg-primary-soft font-semibold text-primary-dark before:opacity-100"
                        : "text-text-secondary before:opacity-0 hover:bg-primary-subtle hover:text-primary",
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn("h-4 w-4 transition-colors", active && "text-primary")}
                    />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
