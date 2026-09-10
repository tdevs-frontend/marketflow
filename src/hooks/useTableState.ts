"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { SortDirection } from "@/components/ui/table";

/**
 * Table state that lives in the URL rather than in component state.
 *
 * The point is refresh and back-button behaviour: a support agent who has
 * filtered to unsubscribed WhatsApp contacts on page three should be able to
 * paste that URL to a colleague, and pressing Back after opening a contact
 * should return to the same filtered page rather than to an unfiltered first
 * page. Neither is possible while the state is in `useState`.
 *
 * `router.replace` with `scroll: false`, not `push`: a filter change is not a
 * navigation the user wants to step back through one keystroke at a time, and
 * scrolling to the top on every character typed into search is worse than no
 * URL state at all.
 *
 * Defaults are never written to the query string, so a clean page has a clean
 * URL and "is anything filtered?" is answerable by looking at it.
 */
export interface TableStateOptions<Column extends string> {
  /** Every column that can be hidden, in display order. */
  columns?: readonly Column[];
  /** Columns hidden unless the user turns them on. */
  hiddenByDefault?: readonly Column[];
  defaultPageSize?: number;
}

export const PAGE_SIZES = [20, 50, 100] as const;

export function useTableState<
  Filter extends string,
  Column extends string = string,
>(filterKeys: readonly Filter[], options: TableStateOptions<Column> = {}) {
  const { columns = [], hiddenByDefault = [], defaultPageSize = 20 } = options;

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  /**
   * One writer for every change.
   *
   * Takes a patch rather than a full state so callers cannot accidentally drop
   * a param they did not know about, and clears a key when handed `null` —
   * which is what keeps defaults out of the URL.
   */
  const write = useCallback(
    (patch: Record<string, string | number | null>) => {
      const next = new URLSearchParams(params.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  const search = params.get("q") ?? "";

  const filters = useMemo(() => {
    const out = {} as Record<Filter, string>;
    for (const key of filterKeys) out[key] = params.get(key) ?? "all";
    return out;
  }, [params, filterKeys]);

  const activeFilters = filterKeys.filter((key) => filters[key] !== "all");

  const sortField = params.get("sort");
  const sortDirection: SortDirection = params.get("dir") === "asc" ? "asc" : "desc";

  const rawSize = Number(params.get("size"));
  const pageSize = (PAGE_SIZES as readonly number[]).includes(rawSize)
    ? rawSize
    : defaultPageSize;

  const page = Math.max(1, Number(params.get("page")) || 1);

  /*
   * Column visibility is stored as the *hidden* set, not the visible one.
   *
   * A visible list would have to be written in full the first time anything is
   * toggled and would then silently freeze out any column added later. Storing
   * what was turned off means a new column appears for everyone, and the
   * common case — nothing customised — writes nothing to the URL.
   */
  const hidden = useMemo(() => {
    const param = params.get("hide");
    if (param === null) return new Set<string>(hiddenByDefault);
    return new Set(param ? param.split(",") : []);
  }, [params, hiddenByDefault]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hidden.has(column)),
    [columns, hidden],
  );

  const isVisible = useCallback(
    (column: Column) => !hidden.has(column),
    [hidden],
  );

  return {
    search,
    filters,
    activeFilters,
    sortField,
    sortDirection,
    page,
    pageSize,
    hidden,
    visibleColumns,
    isVisible,

    /** Typing in search resets to page one — page three of the old result set
        is meaningless against a new query. */
    setSearch: (value: string) => write({ q: value || null, page: null }),

    setFilter: (key: Filter, value: string) =>
      write({ [key]: value === "all" ? null : value, page: null }),

    clearFilter: (key: Filter) => write({ [key]: null, page: null }),

    /**
     * Several filters in one write.
     *
     * Two `clearFilter` calls in the same handler do not compose: both read the
     * same `params` snapshot, so the second replaces the first and only one of
     * the two keys actually clears. Anything clearing more than one filter has
     * to go through here.
     */
    clearFilters: (keys: readonly Filter[]) => {
      const patch: Record<string, null> = { page: null };
      for (const key of keys) patch[key] = null;
      write(patch);
    },

    clearAll: () => {
      const patch: Record<string, null> = { q: null, page: null };
      for (const key of filterKeys) patch[key] = null;
      write(patch);
    },

    /** Same column toggles direction; a new column starts descending, which is
        what "most recent" and "highest value" both want. */
    toggleSort: (field: string) =>
      write(
        sortField === field
          ? { sort: field, dir: sortDirection === "asc" ? "desc" : "asc" }
          : { sort: field, dir: "desc" },
      ),

    setPage: (value: number) => write({ page: value === 1 ? null : value }),

    setPageSize: (value: number) =>
      write({ size: value === defaultPageSize ? null : value, page: null }),

    toggleColumn: (column: Column) => {
      const next = new Set(hidden);
      if (next.has(column)) next.delete(column);
      else next.add(column);
      write({ hide: next.size ? [...next].join(",") : null });
    },

    resetColumns: () => write({ hide: null }),
  };
}
