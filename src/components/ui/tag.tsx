"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A contact or content label.
 *
 * Separate from `Badge`: a badge reports state the system owns (a status, a
 * count) and is read-only, while a tag is user data and can be removed. They
 * look similar on purpose and behave differently on purpose.
 */
export function Tag({
  label,
  onRemove,
  tone,
  className,
}: {
  label: string;
  /** Present only where the tag is editable — adds the remove affordance. */
  onRemove?: () => void;
  /** Class pair for ground and ink. Defaults to the neutral chip. */
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-btn px-2 py-0.5 text-xs font-medium",
        tone ?? "bg-surface-secondary text-text-secondary",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="-mr-0.5 grid size-4 shrink-0 place-items-center rounded-full transition-colors hover:bg-text-primary/10 focus-visible:shadow-focus focus-visible:outline-none"
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

/**
 * A row of tags that collapses past `max`.
 *
 * A contact with nine tags would otherwise set the row height for the whole
 * table, so the overflow becomes a count with the rest in its `title`.
 */
export function TagList({
  tags,
  max = 2,
  tone,
  className,
}: {
  tags: string[];
  max?: number;
  tone?: string;
  className?: string;
}) {
  if (tags.length === 0) {
    return <span className="text-xs text-text-muted">—</span>;
  }

  const shown = tags.slice(0, max);
  const extra = tags.slice(max);

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((tag) => (
        <Tag key={tag} label={tag} tone={tone} />
      ))}
      {extra.length > 0 ? (
        <span
          title={extra.join(", ")}
          className="text-xs font-medium text-text-muted"
        >
          +{extra.length}
        </span>
      ) : null}
    </div>
  );
}
