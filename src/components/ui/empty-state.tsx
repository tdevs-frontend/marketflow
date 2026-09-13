import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  compact = false,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /**
   * The inside-a-card size.
   *
   * The page-level empty state is 56px of padding tall, which is right when it
   * is the only thing on the screen and wrong inside a dashboard widget — there
   * it doubles the card's height and the row it sits in stretches to match. The
   * compact variant keeps the same dashed-panel treatment at a third of the
   * height, and steps the radius down to `panel` the way every other nested
   * surface in a card does.
   */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-border-strong bg-surface text-center",
        compact
          ? "gap-2 rounded-panel px-4 py-7"
          : "gap-3 rounded-card px-6 py-14",
        className,
      )}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className={cn("text-sm text-text-secondary", compact ? "max-w-xs" : "max-w-sm")}>
        {description}
      </p>
      {action}
    </div>
  );
}
