"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { panelId, tabId } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ProductTab {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
}

export interface ProductTabsProps {
  tabs: ProductTab[];
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
 * them a tab jumps sideways the moment its count crosses from 9 to 10, and the
 * underline chases it.
 *
 * A zero is dimmed but never disabled. "Nothing archived" is a useful answer,
 * and a tab you cannot click is a tab that refuses to tell you so.
 */
function CountChip({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums transition-colors",
        active
          ? "bg-primary-soft text-primary-dark"
          : "bg-surface-secondary text-text-secondary",
        count === 0 && "opacity-55",
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
 * The product list's filter row.
 *
 * Underlined tabs on the table's own rule rather than a pill track floating
 * above it: the row and the table beneath it are one object, and a grey capsule
 * with its own edges made the filters look like a widget that had landed on the
 * page. The single bottom border is shared — the active tab's marker sits *on*
 * the line the table hangs from.
 *
 * The marker is one element that moves, not a border per tab. That is what lets
 * it travel between tabs instead of blinking out and in, and it animates on
 * `transform` alone — `translateX` for position and `scaleX` on a 1px bar for
 * width — so the browser never re-lays-out the row mid-slide.
 */
export function ProductTabs({
  tabs,
  activeTab,
  onTabChange,
  idBase,
  loading = false,
  className,
}: ProductTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const [marker, setMarker] = useState({ x: 0, width: 0 });
  /* The first measurement must not animate, or the marker slides in from the
     left edge on every mount. */
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    const active = buttons.current.get(activeTab);
    if (!list || !active) return;
    setMarker({ x: active.offsetLeft, width: active.offsetWidth });
  }, [activeTab]);

  useLayoutEffect(() => {
    measure();
    /* Fonts and a horizontal scroll both change the geometry after first
       paint, so the marker is re-measured rather than trusted once. */
    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [measure, tabs, loading]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* On a phone the active tab can start off-screen — a filter you cannot see
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

  const renderTab = (tab: ProductTab) => {
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
          /* `first:pl-0` is what lines the first label up with the table's
             first column — the same rule `TH` and `TD` already use, so the
             row and the header below it start on one vertical. */
          "group inline-flex shrink-0 snap-start items-center gap-2 font-semibold border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors first:pl-0",
          "focus-visible:rounded-btn focus-visible:shadow-focus focus-visible:outline-none",
          /* The 2px border is never painted — it only holds the height steady
             so the row does not move when the marker slides under a tab. Hover
             is a colour change alone: a grey rule appearing under whichever tab
             the pointer crossed competed with the indigo one marking the tab
             that is actually selected. */
          active
            ? "border-transparent font-semibold text-primary"
            : "border-transparent font-medium text-text-muted hover:text-text-primary",
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {tab.label}
        {loading ? (
          <Skeleton className="h-5 w-6 rounded-full" />
        ) : (
          <CountChip count={tab.count} active={active} />
        )}
      </button>
    );
  };

  return (
    <div className={cn("relative border-b border-border", className)}>
      <div ref={scrollRef} className="no-scrollbar snap-x overflow-x-auto">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Filter products"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          /* `min-w-max` keeps the row from wrapping; it overflows and scrolls
             instead. No `w-full`, because nothing is pushed to the far edge
             any more — every tab reads left to right in one sequence. */
          className="relative flex min-w-max items-center gap-1"
        >
          {/*
            * One uninterrupted sequence.
            *
            * Type and lifecycle were split by a rule at one point. It bought
            * less than it cost: the tabs already read in that order, the
            * arrow keys already run straight through them, and a divider in
            * a row this short mostly added a thing to look at. Order carries
            * the grouping now.
            */}
          {tabs.map(renderTab)}

          {/* The marker. 1px wide and scaled, so position and size are one
              composited transform rather than a layout pass per frame. */}
          <span
            aria-hidden
            className={cn(
              "absolute -bottom-px left-0 h-0.5 w-px origin-left rounded-full bg-primary",
              ready && "transition-transform duration-200 ease-out",
              marker.width === 0 && "opacity-0",
            )}
            style={{
              transform: `translateX(${marker.x}px) scaleX(${marker.width})`,
            }}
          />
        </div>
      </div>

      {/* Says "there is more" on a phone, and nothing at all on a desktop where
          the row already fits. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent md:hidden"
      />
    </div>
  );
}
