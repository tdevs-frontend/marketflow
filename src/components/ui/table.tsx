import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A compact data table.
 *
 * The wrapper owns the horizontal scroll so a wide table never widens the
 * page. `minWidth` sets where scrolling starts — below it the columns would
 * crush rather than wrap.
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
    <div className={cn("-mx-5 overflow-x-auto px-5", className)}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border">
      <tr className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
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
        "transition-colors hover:bg-primary-soft/50",
        selected && "bg-primary-subtle",
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
      className={cn(
        "px-3 py-2.5 font-medium whitespace-nowrap first:pl-0 last:pr-0",
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
      className={cn(
        "px-3 py-3 align-middle first:pl-0 last:pr-0",
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
 * the state — the arrow is decoration on top of it.
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
      className="p-0 first:pl-0 last:pr-0"
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex w-full items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none",
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
