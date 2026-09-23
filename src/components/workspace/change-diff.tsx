import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AuditChange } from "@/types/workspace";

/**
 * What changed, as before and after.
 *
 * A two-column diff rather than raw JSON, because the reader of an audit trail
 * is answering "what did this person actually alter" and a serialised object
 * makes them parse it themselves. The raw form is still available under
 * Advanced details for anyone who wants it - this is the default view, not the
 * only one.
 *
 * A `null` before is a value being set for the first time and renders as
 * "Not set"; a `null` after is one being cleared. Both are real events and
 * neither should render as an empty cell the reader has to interpret.
 */
export function ChangeDiff({
  changes,
  className,
}: {
  changes: AuditChange[];
  className?: string;
}) {
  if (changes.length === 0) {
    return (
      <p className={cn("text-sm text-text-muted", className)}>
        This action recorded no field changes.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2.5", className)}>
      {changes.map((change) => (
        <li
          key={change.field}
          className="rounded-panel border border-border px-3.5 py-3"
        >
          <p className="text-meta font-medium text-text-muted">{change.field}</p>

          {/* Stacks below `sm`: two values plus an arrow do not fit a phone
              row once either side runs past a couple of words. */}
          <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span
              className={cn(
                "min-w-0 flex-1 truncate rounded-btn bg-surface-secondary px-2.5 py-1.5 text-sm",
                change.before === null
                  ? "text-text-muted italic"
                  : "text-text-secondary line-through decoration-text-muted/50",
              )}
            >
              {change.before ?? "Not set"}
            </span>

            <ArrowRight
              className="hidden size-4 shrink-0 text-text-muted sm:block"
              aria-hidden
            />

            <span
              className={cn(
                "min-w-0 flex-1 truncate rounded-btn px-2.5 py-1.5 text-sm font-medium",
                change.after === null
                  ? "bg-surface-secondary text-text-muted italic"
                  : "bg-success-soft text-success-text",
              )}
            >
              {change.after ?? "Cleared"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
