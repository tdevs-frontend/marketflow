"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hover and focus tooltip.
 *
 * Opens on pointer *and* on keyboard focus, and the trigger points at the
 * bubble with `aria-describedby` — a title-attribute tooltip is invisible to
 * touch and unreliable to screen readers, and a hover-only one is unreachable
 * by keyboard. Escape closes it, because a tooltip pinned open over the thing
 * you are reading is worse than none.
 *
 * For content longer than a sentence use a popover; this is sized for a label.
 */
export function Tooltip({
  content,
  side = "top",
  className,
  children,
}: {
  content: ReactNode;
  side?: "top" | "bottom";
  className?: string;
  /** The trigger. Must be focusable for the keyboard path to work. */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>

      {open ? (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-56 -translate-x-1/2 rounded-btn bg-text-primary px-2.5 py-1.5 text-center text-xs font-medium text-white shadow-float",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The `?` next to a metric whose definition is not obvious — "reply rate of
 * what, exactly". Its own component so every one of them is the same size.
 */
export function InfoHint({ content }: { content: ReactNode }) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        aria-label="What this means"
        className="grid size-4 place-items-center rounded-full border border-border-strong text-[9px] font-bold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        ?
      </button>
    </Tooltip>
  );
}
