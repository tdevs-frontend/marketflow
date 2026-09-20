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

/**
 * A card's bordered header band.
 *
 * The dense one: a 14px semibold line over a muted note, inside a rule, for a
 * dialog panel or a settings block whose card is `p-0` and whose body is a
 * `CardBody`. It is *not* the heading the dashboard's section cards use —
 * those are `PanelCard`, which sets the title at `text-base sm:text-lg` and
 * pads the whole card once rather than padding a band inside it. Putting this
 * inside a `p-5` card double-pads the header, which is how a title ends up
 * inset forty pixels from an edge its own content sits twenty from.
 *
 * ---
 *
 * `title` and `description` are `ReactNode`, and both branch on whether what
 * arrived is actually text. That is not a style choice — it is the HTML
 * content model.
 *
 * `<h3>` and `<p>` both accept *phrasing* content only, so an element child
 * that renders a `<div>` — a `Skeleton`, a chart, a stacked hint — produces
 * markup the parser cannot represent. The browser closes the paragraph before
 * the `<div>` and reopens it after, so the tree it builds is not the tree
 * React rendered on the server, and hydration reports the mismatch:
 *
 *     In HTML, <div> cannot be a descendant of <p>.
 *
 * A string gets the semantic element it deserves; anything else gets a plain
 * box carrying the identical classes, so nothing moves by a pixel either way.
 * That is also the honest reading of a non-text heading: a loading placeholder
 * is not an `<h3>`, and announcing a grey bar as one is noise.
 */
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
        {typeof title === "string" ? (
          <h3 className="text-sm font-semibold">{title}</h3>
        ) : (
          <div className="text-sm font-semibold">{title}</div>
        )}
        {description ? (
          typeof description === "string" ? (
            <p className="text-sm text-text-muted">{description}</p>
          ) : (
            <div className="text-sm text-text-muted">{description}</div>
          )
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
