"use client";

import type { ReactNode } from "react";
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

export type PaginationSize = "sm" | "md" | "lg";

/**
 * The three scales, as whole class strings.
 *
 * Whole strings rather than a box size interpolated into a template, because
 * Tailwind reads the source for literals - `size-${n}` compiles to a control
 * with no dimensions at all.
 *
 * `sm` is the dashboard's, unchanged: a 32px control in a table footer, where
 * the pagination is a quiet thing under a dense grid. `lg` is for a marketing
 * page, where it is the only control on the screen and is as likely to be
 * tapped as clicked - 44px is the size a finger expects.
 *
 * The icon is one number per row rather than one per arrow. The two arrows
 * were previously set at 20px and 16px, which is not a scale, and a size map
 * has to pick one - see the note on `PaginationSize` in this file's export.
 */
const SIZES: Record<
  PaginationSize,
  { control: string; text: string; icon: string; gap: string; ellipsis: string }
> = {
  sm: {
    control: "size-8",
    text: "text-sm",
    icon: "size-4",
    gap: "gap-1",
    ellipsis: "px-1 text-sm",
  },
  md: {
    control: "size-9",
    text: "text-sm",
    icon: "size-4",
    gap: "gap-1.5",
    ellipsis: "px-1.5 text-sm",
  },
  lg: {
    control: "size-11",
    text: "text-base",
    icon: "size-5",
    gap: "gap-2",
    ellipsis: "px-2 text-base",
  },
};

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onChange,
  /** Names what is being paged, for the "1–8 of 12" line. */
  noun = "results",
  size = "sm",
  showRange = true,
  summary,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
  noun?: string;
  /**
   * Control scale: 32, 36 or 44px. `sm` is the default, so every existing
   * caller is untouched. Only the geometry changes - border, radius, colours,
   * the active page's indigo and the behaviour are the same at all three.
   */
  size?: PaginationSize;
  /**
   * The "Showing 1–8 of 12" line on the left. On by default, for a table
   * footer. Off, the controls stand alone and sit centred - for a marketing
   * page, where a result count reads as dashboard furniture.
   */
  showRange?: boolean;
  /**
   * A second line under the range, in the same left slot.
   *
   * For the reading a table wants to leave a merchant with once they have
   * finished scanning it - "15 categories covering 15 products". It sits here
   * rather than above the table because it is a closing total, not a heading,
   * and rather than in its own row because a footer with two bars in it reads
   * as two controls.
   *
   * Optional, so every existing caller renders exactly as before.
   */
  summary?: ReactNode;
}) {
  if (total === 0) return null;

  const scale = SIZES[size];

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  const step = (delta: number) =>
    onChange(Math.min(Math.max(page + delta, 1), totalPages));

  /*
   * Disabled says inactive with colour, not with opacity.
   *
   * `opacity-40` faded the whole control - border included - so on the first
   * and last page the arrow stopped being a button at all: the box dissolved
   * into the card and the chevron landed around 2:1 against it. A merchant
   * could not tell whether the control was off or simply not there, which is
   * the one thing a disabled state has to communicate.
   *
   * So the shape stays at full strength and only the ink steps back: a tinted
   * ground plus muted text, which holds about 4.2:1 while still reading
   * clearly quieter than the 8.7:1 of an enabled arrow. This is the same
   * correction `Button`'s primary variant already makes - see the
   * `disabled:opacity-100` note there - that muting an already-neutral
   * surface by opacity buys nothing and costs the contrast.
   *
   * The cursor is the other half of saying so, and `pointer-events-none` was
   * what prevented it: an element that takes no pointer events cannot answer
   * one with a cursor either, so the arrow kept the plain pointer and gave no
   * feedback at all on hover. It is dropped for `cursor-not-allowed`, which is
   * what `Input`, `Select`, `Checkbox` and the menu items already use.
   *
   * Dropping it means the hover rules would otherwise still match a disabled
   * button - `:hover` applies to disabled controls even though they fire no
   * events - so they are scoped to `enabled:` rather than left to light up a
   * control that cannot be clicked.
   */
  const arrow = cn(
    "grid place-items-center rounded-btn border border-border text-text-secondary transition-colors",
    "enabled:hover:border-border-strong enabled:hover:text-text-primary",
    "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted",
    "focus-visible:shadow-focus focus-visible:outline-none",
    scale.control,
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 pt-4",
        showRange ? "justify-between" : "justify-center",
      )}
    >
      {showRange ? (
        <div className="min-w-0">
          <p className="text-sm text-text-muted">
            Showing{" "}
            <span className="font-medium text-text-secondary">
              {first}–{last}
            </span>{" "}
            of <span className="font-medium text-text-secondary">{total}</span>{" "}
            {noun}
          </p>
          {summary ? (
            <p className="mt-0.5 text-sm text-text-muted">{summary}</p>
          ) : null}
        </div>
      ) : null}

      <nav
        aria-label="Pagination"
        className={cn("flex items-center", scale.gap)}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={arrow}
        >
          <ChevronLeft className={scale.icon} aria-hidden />
        </button>

        {pageWindow(page, totalPages).map((value, index) =>
          value === null ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className={cn("text-text-muted", scale.ellipsis)}
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
                "grid place-items-center rounded-btn font-bold transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                scale.control,
                scale.text,
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
          <ChevronRight className={scale.icon} aria-hidden />
        </button>
      </nav>
    </div>
  );
}
