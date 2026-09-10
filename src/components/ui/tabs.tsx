"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Shown as a small count or dot beside the label. */
  badge?: ReactNode;
}

export const tabId = (idBase: string, value: string) =>
  `${idBase}-tab-${value}`;
export const panelId = (idBase: string, value: string) =>
  `${idBase}-panel-${value}`;

/**
 * An underlined tab strip with real `tablist` semantics — arrow keys move
 * between tabs and each panel is wired to its tab, which is the behaviour the
 * role promises. (The chart filters elsewhere use `SegmentedControl`, which
 * deliberately does not claim it.)
 *
 * `idBase` is passed in rather than generated here so `TabPanel` can build the
 * matching ids; give both the same `useId()` value.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idBase,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  idBase: string;
  className?: string;
}) {
  const move = (offset: number) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    const next = tabs[(index + offset + tabs.length) % tabs.length];
    if (next) onChange(next.value);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
      className={cn(
        "-mx-5 flex gap-1 overflow-x-auto border-b border-border px-5",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={tabId(idBase, tab.value)}
            aria-selected={selected}
            aria-controls={panelId(idBase, tab.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:shadow-focus focus-visible:outline-none",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The count a tab's `badge` usually wants.
 *
 * An element rather than a bare number: adjacent text nodes merge into one
 * anonymous flex item, so the tab's own `gap` never applies and the tab reads
 * "Notes3". A span is a flex item of its own, and gives the count a shape that
 * separates it from the label at a glance.
 */
export function TabCount({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-surface-secondary px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary tabular-nums">
      {value}
    </span>
  );
}

export function TabPanel({
  idBase,
  value,
  className,
  children,
}: {
  idBase: string;
  value: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={panelId(idBase, value)}
      aria-labelledby={tabId(idBase, value)}
      tabIndex={0}
      className={cn("focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}
