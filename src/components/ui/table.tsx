import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { mergeClasses } from "@/lib/merge-classes";
import { cn } from "@/lib/utils";

/**
 * A compact data table - the one table system in the product.
 *
 * The wrapper owns the horizontal scroll so a wide table never widens the
 * page. `minWidth` sets where scrolling starts - below it the columns would
 * crush rather than wrap.
 *
 * The cell type lives here and nowhere else: `TH` and `TD` set the size and
 * the weight, and a call site brings only what its column means - an ink
 * token, `tabular-nums`, a width, a no-wrap. `className` goes through
 * `mergeClasses`, so an override replaces the cell's own class instead of
 * racing it on stylesheet order.
 */
export function Table({
  minWidth = "56rem",
  className,
  children,
}: {
  minWidth?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    /* `relative` makes the wrapper the containing block for anything absolutely
       positioned inside the table - a `sr-only` header label, a tooltip - so
       the scroll clips it too. Without it those escape the overflow and widen
       the page on a phone even though the table itself scrolls. */
    <div className={cn("relative -mx-5 overflow-x-auto px-5", className)}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({
  className,
  children,
}: {
  /**
   * Applied to the header row, for the tables that want a tinted header band
   * rather than the default rule-only header.
   */
  className?: string;
  children: ReactNode;
}) {
  return (
    <thead className="border-b border-border">
      <tr className={cn("text-sm font-medium text-text-muted", className)}>
        {children}
      </tr>
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({
  selected = false,
  className,
  children,
  ...props
}: { selected?: boolean } & ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "transition-colors",
        /*
         * Hover belongs to unselected rows only.
         *
         * Both branches set a background, and `hover:` sorts after the base
         * utility, so a selected row used to swap its violet selection tint
         * for the indigo hover tint the moment the cursor crossed it - the
         * same row reading as two different states, and the two tints being
         * different hues rather than two steps of one. A row that is already
         * selected does not need a second colour to say so.
         */
        selected ? "bg-primary-subtle" : "hover:bg-primary-soft/50",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TH({
  align = "left",
  className,
  children,
  ...props
}: { align?: "left" | "right" | "center" } & ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={mergeClasses(
        "px-3 py-2.5 text-sm font-medium whitespace-nowrap first:pl-0 last:pr-0",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({
  align = "left",
  className,
  children,
  ...props
}: { align?: "left" | "right" | "center" } & ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className={mergeClasses(
        "px-3 py-3 align-middle text-sm font-medium first:pl-0 last:pr-0",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export type SortDirection = "asc" | "desc";

/**
 * A sortable column header. `aria-sort` is what actually tells a screen reader
 * the state - the arrow is decoration on top of it.
 *
 * The padding moves from the cell onto the button, so the whole header is the
 * hit target, and it moves exactly: `px-3 py-2.5`, flush at the row's two ends
 * the way `TH` is. The label therefore sits on the same line as the plain
 * headers beside it and the cells below it.
 */
export function SortableTH<T extends string>({
  field,
  activeField,
  direction,
  onSort,
  align = "left",
  children,
}: {
  field: T;
  activeField: T | null;
  direction: SortDirection;
  onSort: (field: T) => void;
  align?: "left" | "right" | "center";
  children: ReactNode;
}) {
  const active = activeField === field;
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TH
      align={align}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className="p-0"
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex w-full items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none",
          "[th:first-child>&]:pl-0 [th:last-child>&]:pr-0",
          align === "right" && "justify-end",
          active ? "text-text-primary" : "text-text-muted",
        )}
      >
        {children}
        <Icon className={cn("size-3.5 shrink-0", !active && "opacity-50")} aria-hidden />
      </button>
    </TH>
  );
}
