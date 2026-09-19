import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive = false,
  selected = false,
  ref,
  children,
}: {
  className?: string;
  /** Adds the lift-on-hover treatment. Use it for cards that link somewhere. */
  interactive?: boolean;
  /**
   * The product's selected-card treatment: the primary border and its tint.
   *
   * A prop rather than something a caller passes through `className`, because
   * a caller *cannot*. `cn` is a plain join, so a `bg-primary-subtle` arriving
   * in `className` lands next to this component's own `bg-surface` and the
   * winner is whichever Tailwind happened to emit last — which is `bg-surface`,
   * so the tint simply never appeared. Every selectable card in the product
   * worked around that by drawing a border and no tint, while the table row
   * beside it drew a tint and no border, and one act of selecting ended up
   * looking like two different states.
   *
   * Setting it here also means the two utilities are mutually exclusive
   * branches rather than overlapping declarations, so there is nothing left to
   * sort. Neither state changes the box, so selecting never moves anything.
   */
  selected?: boolean;
  /**
   * For callers that need to measure or scroll to the card — the product
   * wizard scrolls its form back to the top on every step change. A plain prop
   * rather than `forwardRef`: React 19 passes refs straight through, and it is
   * optional, so every existing call site is unchanged.
   */
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-card border shadow-card transition-all",
        selected
          ? "border-primary bg-primary-subtle"
          : "border-border bg-surface",
        interactive && "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-sm text-text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
