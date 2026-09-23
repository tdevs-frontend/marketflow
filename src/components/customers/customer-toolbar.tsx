"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Active filter chips                                                        */
/* -------------------------------------------------------------------------- */

export interface FilterChip {
  /** The query-param key, used as the remove handle. */
  key: string;
  /** What the filter is called - "Status", "Tag". */
  label: string;
  /** The chosen value, already humanised. */
  value: string;
}

/**
 * What is currently filtered, and how to undo it.
 *
 * The row exists because a `Select` that has scrolled out of view, or one
 * collapsed behind the mobile Filters button, is an invisible filter - and an
 * invisible filter is why a table looks empty for no reason. A chip per active
 * filter answers all four questions the reader has at once: what is on, how
 * many, how to remove one, how to remove all.
 *
 * Renders nothing when nothing is filtered, so a clean table has no chrome it
 * does not need.
 */
export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
  className,
}: {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm font-medium text-text-muted">
        Filtered by
      </span>

      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <li key={chip.key}>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-border bg-primary-soft py-0.5 pr-1 pl-2.5 text-sm font-medium text-primary-dark">
              <span className="text-primary/70">{chip.label}:</span>
              {chip.value}
              <button
                type="button"
                onClick={() => onRemove(chip.key)}
                aria-label={`Remove ${chip.label} filter`}
                className="grid size-4 place-items-center rounded-full text-primary/70 transition-colors hover:bg-primary-soft-hover hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          </li>
        ))}
      </ul>

      <Button size="sm" variant="ghost" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bulk action bar                                                            */
/* -------------------------------------------------------------------------- */

/**
 * What can be done to a selection, and how many it will affect.
 *
 * The count is stated in words rather than left to the checkboxes, because the
 * selection can span pages and the reader can only see one of them. Destructive
 * actions are `danger`, never primary - the whole bar sits one click from a
 * delete and must not read as a row of equals.
 */
export function BulkActionBar({
  count,
  noun,
  onClear,
  children,
  className,
}: {
  count: number;
  noun: string;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label={`${count} ${noun} selected`}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-panel bg-primary-soft px-3.5 py-2.5",
        className,
      )}
    >
      <p className="text-sm font-medium text-primary-dark">
        {count} {noun}
        {count === 1 ? "" : "s"} selected
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <Tooltip content="Clear selection">
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
