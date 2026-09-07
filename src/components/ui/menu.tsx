"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Renders in the error colour and sits below a divider. */
  destructive?: boolean;
  disabled?: boolean;
}

/**
 * Row-actions menu.
 *
 * Closes on outside pointer-down, on Escape, and returns focus to the trigger
 * so keyboard users are not dropped at the top of the document. Positioned
 * right-aligned; in a scrolling table that keeps it inside the viewport more
 * often than left-aligned would.
 */
export function Menu({
  items,
  label = "Row actions",
  align = "right",
}: {
  items: MenuItem[];
  label?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="grid size-8 place-items-center rounded-btn text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full z-30 mt-1 min-w-48 rounded-panel border border-border bg-surface p-1 shadow-float",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => {
            const firstDestructive =
              item.destructive && !items[index - 1]?.destructive && index > 0;

            return (
              <div key={item.label}>
                {firstDestructive ? (
                  <div role="separator" className="my-1 h-px bg-border" />
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-[13px] font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    item.destructive
                      ? "text-error hover:bg-error-soft"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
