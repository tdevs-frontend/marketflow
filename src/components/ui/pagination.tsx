"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Page numbers around the current one, with gaps marked as `null`. */
function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const out: (number | null)[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) out.push(null);
    out.push(value);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onChange,
  /** Names what is being paged, for the "1–8 of 12" line. */
  noun = "results",
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
  noun?: string;
}) {
  if (total === 0) return null;

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  const step = (delta: number) =>
    onChange(Math.min(Math.max(page + delta, 1), totalPages));

  const arrow =
    "grid size-8 place-items-center rounded-btn border border-border text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-40 focus-visible:shadow-focus focus-visible:outline-none";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-text-muted">
        Showing <span className="font-medium text-text-secondary">{first}–{last}</span>{" "}
        of <span className="font-medium text-text-secondary">{total}</span> {noun}
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={arrow}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        {pageWindow(page, totalPages).map((value, index) =>
          value === null ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-xs text-text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-label={`Page ${value}`}
              aria-current={value === page ? "page" : undefined}
              className={cn(
                "grid size-8 place-items-center rounded-btn text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                value === page
                  ? "bg-primary text-white"
                  : "border border-border text-text-secondary hover:border-border-strong hover:text-text-primary",
              )}
            >
              {value}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => step(1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={arrow}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}
