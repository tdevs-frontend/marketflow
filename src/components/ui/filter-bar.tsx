"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Search plus filters.
 *
 * The selects sit inline from `lg` and collapse behind a "Filters" button
 * below it — on a phone four dropdowns in a row are unusable, and a sheet
 * keeps them reachable without stealing the whole screen. `activeCount` shows
 * on the trigger so a collapsed filter is never invisible.
 */
export function FilterBar({
  search,
  onSearchChange,
  placeholder = "Search…",
  activeCount = 0,
  onReset,
  trailing,
  children,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  activeCount?: number;
  onReset?: () => void;
  /**
   * Pinned to the right of the row and never collapsed: Export, a view
   * toggle, anything that is an action rather than a filter.
   */
  trailing?: ReactNode;
  /**
   * The `Select` controls.
   *
   * Optional, because a page can legitimately have search and nothing else —
   * Tags is one. With none, the collapsed "Filters" button and its sheet are
   * suppressed too: a button that opens an empty panel is worse than no button.
   */
  children?: ReactNode;
  className?: string;
}) {
  const [openSheet, setOpenSheet] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 pl-9"
          />
        </div>

        {children ? (
          <div className="hidden items-center gap-2.5 lg:flex">{children}</div>
        ) : null}

        {children ? (
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => setOpenSheet((value) => !value)}
            aria-expanded={openSheet}
            className="lg:hidden"
          >
            <SlidersHorizontal aria-hidden />
            Filters
            {activeCount > 0 ? (
              <span className="grid size-4.5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeCount}
              </span>
            ) : null}
          </Button>
        ) : null}

        {activeCount > 0 && onReset ? (
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={onReset}
            className="max-lg:hidden"
          >
            <X aria-hidden />
            Clear
          </Button>
        ) : null}

        {trailing ? (
          /* `ml-auto` rather than a spacer, so it still sits right when the
             filters collapse and the row holds only search. */
          <div className="ml-auto flex items-center gap-2.5">{trailing}</div>
        ) : null}
      </div>

      {openSheet && children ? (
        <div className="grid gap-2.5 rounded-panel border border-border bg-surface-secondary p-3 sm:grid-cols-2 lg:hidden">
          {children}
          {activeCount > 0 && onReset ? (
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={onReset}
              className="sm:col-span-2"
            >
              <X aria-hidden />
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** A labelled select sized for the filter row. */
export function FilterSelect({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="contents">
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}
