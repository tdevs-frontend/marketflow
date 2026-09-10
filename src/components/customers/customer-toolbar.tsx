"use client";

import { Columns3, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { PAGE_SIZES } from "@/hooks/useTableState";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Active filter chips                                                        */
/* -------------------------------------------------------------------------- */

export interface FilterChip {
  /** The query-param key, used as the remove handle. */
  key: string;
  /** What the filter is called — "Status", "Tag". */
  label: string;
  /** The chosen value, already humanised. */
  value: string;
}

/**
 * What is currently filtered, and how to undo it.
 *
 * The row exists because a `Select` that has scrolled out of view, or one
 * collapsed behind the mobile Filters button, is an invisible filter — and an
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
      <span className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
        Filtered by
      </span>

      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <li key={chip.key}>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-border bg-primary-soft py-0.5 pr-1 pl-2.5 text-[11px] font-medium text-primary-dark">
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
/* Column visibility                                                          */
/* -------------------------------------------------------------------------- */

export interface ColumnOption<T extends string> {
  value: T;
  label: string;
  /** Columns the table cannot function without — Contact, Actions. */
  locked?: boolean;
}

/**
 * Which columns are on show.
 *
 * A `Menu` of checkboxes rather than a dialog: the reader is mid-scan when
 * they reach for this, and a modal that covers the table they are adjusting
 * makes the change impossible to judge. Locked columns are listed but
 * disabled, so the menu still describes the whole table rather than implying
 * the identity column was forgotten.
 */
export function ColumnsMenu<T extends string>({
  columns,
  isVisible,
  onToggle,
  onReset,
}: {
  columns: ColumnOption<T>[];
  isVisible: (column: T) => boolean;
  onToggle: (column: T) => void;
  onReset: () => void;
}) {
  const hiddenCount = columns.filter(
    (column) => !column.locked && !isVisible(column.value),
  ).length;

  return (
    <Menu
      label="Choose visible columns"
      align="right"
      trigger={
        <span className="inline-flex h-10 items-center gap-2 rounded-btn border border-border bg-surface px-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-secondary hover:text-text-primary">
          <Columns3 className="size-4" aria-hidden />
          Columns
          {hiddenCount > 0 ? (
            <span className="grid size-4.5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
              {hiddenCount}
            </span>
          ) : null}
        </span>
      }
      items={[
        ...columns.map((column) => ({
          label: column.label,
          /* `closeOnSelect: false` — toggling three columns should not need the
             menu reopened three times. */
          closeOnSelect: false,
          disabled: column.locked,
          icon: (
            <Checkbox
              checked={column.locked ? true : isVisible(column.value)}
              disabled={column.locked}
              onCheckedChange={() => onToggle(column.value)}
              label={`Show ${column.label}`}
            />
          ),
          onSelect: () => {
            if (!column.locked) onToggle(column.value);
          },
        })),
        {
          label: "Reset columns",
          onSelect: onReset,
          disabled: hiddenCount === 0,
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Rows per page                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Rows per page, beside the pagination it controls.
 *
 * Hidden below `sm`: on a phone the list is a stack of cards and the choice
 * between 20 and 100 of them is not one anybody wants to make by thumb.
 */
export function RowsPerPage({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 max-sm:hidden", className)}>
      <span className="text-xs whitespace-nowrap text-text-muted">Rows</span>
      <Select
        label="Rows per page"
        hideLabel
        size="sm"
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        options={PAGE_SIZES.map((size) => ({
          value: String(size),
          label: String(size),
        }))}
        className="w-20"
      />
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
 * actions are `danger`, never primary — the whole bar sits one click from a
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
      <p className="text-[13px] font-medium text-primary-dark">
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
