"use client";

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { panelId, tabId } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface FilterTab {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
}

export interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Shared with the panel below, via `tabId` / `panelId`. */
  idBase: string;
  /** Renders the counts as skeletons, so a 0 never flashes before the real figure. */
  loading?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Count chip                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The count, as a chip rather than "(14)".
 *
 * `min-w` and `tabular-nums` together are what stop the row twitching: without
 * them a tab jumps sideways the moment its count crosses from 9 to 10.
 *
 * The active chip steps one rung deeper than the tab it sits in -
 * `primary-soft-hover` on `primary-soft` - so it stays a distinct object rather
 * than dissolving into the tab's own ground. It holds 5.1:1 against that deeper
 * tint, which a digit needs and a decorative icon would not.
 *
 * A zero is dimmed but never disabled. "Nothing archived" is a useful answer,
 * and a tab you cannot click is a tab that refuses to tell you so.
 */
function CountChip({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-meta font-bold tabular-nums transition-colors leading-none",
        active
          ? "bg-primary-soft-hover text-primary"
          : "bg-surface text-text-secondary",
        count === 0 && "opacity-80",
      )}
    >
      {count}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The filter row a Commerce list opens with.
 *
 * One component for Products, Sales and Customers. They filter different
 * things - a catalogue by type, a ledger by what sold, buyers by how they
 * behave - but they are the same control doing the same job, and three
 * hand-matched copies is how three pages slowly stop looking alike.
 *
 * Filled tabs rather than an underline. An underline is the right marker when
 * tabs swap whole panels and the reader is already looking at them; these are
 * the first control on the page and have to announce themselves as *filters*
 * from across the screen. A tinted, bordered box does that at a glance - the
 * selected filter reads as switched on, rather than as a line you have to go
 * looking for.
 *
 * Every tab carries a border, transparent when idle, so selecting one cannot
 * shift the row by a pixel. There is no sliding marker any more: the fill *is*
 * the marker, and a bar underneath a filled box would be the same thing said
 * twice.
 */
export function FilterTabs({
  tabs,
  activeTab,
  onTabChange,
  idBase,
  loading = false,
  className,
}: FilterTabsProps) {
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  /* On a phone the active tab can start off-screen - a filter you cannot see
     is one you will not realise is applied. `nearest` keeps the page itself
     from scrolling. */
  useEffect(() => {
    buttons.current
      .get(activeTab)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Arrow keys move *and* select.
   *
   * Automatic activation, matching `ui/tabs`: these tabs filter a list in
   * place, so there is nothing to be gained by making a merchant press Enter
   * after arrowing onto the thing they wanted.
   */
  function onKeyDown(event: React.KeyboardEvent) {
    const index = tabs.findIndex((tab) => tab.id === activeTab);
    if (index < 0) return;

    const go = (next: number) => {
      event.preventDefault();
      const target = tabs[(next + tabs.length) % tabs.length];
      if (!target) return;
      onTabChange(target.id);
      buttons.current.get(target.id)?.focus();
    };

    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
    if (event.key === "Home") go(0);
    if (event.key === "End") go(tabs.length - 1);
  }

  const renderTab = (tab: FilterTab) => {
    const active = tab.id === activeTab;
    const Icon = tab.icon;

    return (
      <button
        key={tab.id}
        ref={(node) => {
          if (node) buttons.current.set(tab.id, node);
          else buttons.current.delete(tab.id);
        }}
        type="button"
        role="tab"
        id={tabId(idBase, tab.id)}
        aria-selected={active}
        aria-controls={panelId(idBase, "list")}
        /* Roving tabindex: one stop for the whole row, arrows do the rest. */
        tabIndex={active ? 0 : -1}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[15px] whitespace-nowrap transition-colors leading-none",
          "focus-visible:shadow-focus focus-visible:outline-none",
          /* Weight lives in the branches, never in the base: it is a
             font-*family* swap here, and two of them on one element would be
             settled by stylesheet order rather than by which branch ran. */
          active
            ? "border-primary-border bg-primary-soft font-semibold text-primary"
            : "border-transparent bg-surface-secondary font-semibold text-text-secondary hover:bg-border hover:text-text-primary leading-none",
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {tab.label}
        {loading ? (
          /* Not `Skeleton`: its ground is `surface-secondary`, which is now
             the idle tab's own colour, so it would pulse invisibly. A
             className cannot fix that - `cn()` is a plain join and the
             component's own background wins on stylesheet order. */
          <span
            aria-hidden
            className="h-5 w-6 animate-pulse rounded-full bg-surface"
          />
        ) : (
          <CountChip count={tab.count} active={active} />
        )}
      </button>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className="no-scrollbar snap-x overflow-x-auto">
        <div
          role="tablist"
          aria-label="Filter products"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          /*
           * `min-w-max` keeps the row from wrapping; it overflows and scrolls
           * instead.
           *
           * No negative margin. The row used to be pulled left by one tab's
           * padding so the first *label* sat on the table's first column -
           * correct while a tab was only its text, and wrong now that every tab
           * is a filled box: it left the first box hanging into the card's
           * padding. With a visible edge, the edge is the thing to align.
           */
          className="flex min-w-max items-center gap-1"
        >
          {tabs.map(renderTab)}
        </div>
      </div>

      {/* Says "there is more" on a phone, and nothing at all on a desktop where
          the row already fits. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-surface to-transparent md:hidden"
      />
    </div>
  );
}
