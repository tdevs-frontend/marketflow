"use client";

import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import type { FeedNotification } from "@/types/notification";

import { NotificationIcon } from "./notification-icon";

/**
 * One notification, in the bell and on the archive page.
 *
 * The same component in both, which is the point: two implementations of a
 * notification row is how a product ends up with one surface bolding unread
 * titles and the other tinting them, and a reader who has to learn the feed
 * twice. What differs between the two places is a *density*, not a design.
 *
 *   `compact` is the bell. Title, one sentence, time. It is read standing up,
 *   in a 368px panel, to answer "does anything need me".
 *
 *   `full` is the page. It adds the `context` line — the product on the order,
 *   the step the workflow threw on — and gives the row more air. It is read
 *   sitting down, and the line that says *which* Premium Package is the one
 *   that saves opening the record.
 *
 * Unread is carried by a 5% tint and a 6px dot, in both. The tint is meant to
 * be felt rather than seen: at that strength it separates the unread block from
 * the read one without turning half the list into a coloured surface, and the
 * dot is what actually announces the state.
 */
export function NotificationItem({
  item,
  onOpen,
  density = "compact",
}: {
  item: FeedNotification;
  onOpen: () => void;
  density?: "compact" | "full";
}) {
  const full = density === "full";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full gap-3 text-left transition-colors",
        full ? "px-4 py-3.5 sm:px-5" : "px-4 py-3",
        /* The only rule between rows, and none after the last — a border under
           the final row would sit on the container's own edge and read as a
           double line. */
        "border-b border-border last:border-b-0",
        "focus-visible:shadow-focus focus-visible:outline-none",
        item.read
          ? "hover:bg-surface-secondary"
          : "bg-primary/5 hover:bg-primary/10",
      )}
    >
      <NotificationIcon
        module={item.module}
        tone={item.tone}
        className="mt-0.5"
      />

      <span className="min-w-0 flex-1">
        {/*
         * Title, time and dot on one line, with the dot at the row's right
         * edge — it shares a line with the timestamp rather than floating
         * beside the whole row, so it lines up without a hand-picked margin.
         *
         * `flex-wrap` is the narrow case: on a phone the title takes the width
         * it needs and the time drops to its own line rather than squeezing
         * the title into a two-word column.
         */}
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <span
            className={cn(
              "text-[15px] text-text-primary",
              item.read ? "font-medium" : "font-medium",
            )}
          >
            {item.title}
          </span>

          <span className="flex shrink-0 items-center gap-1.5">
            {/* Measured against the workspace's frozen clock, not `Date.now()`.
                A relative time computed on the server and again on the client
                is a hydration mismatch waiting for a slow response. */}
            <span className="text-xs font-medium whitespace-nowrap text-text-muted">
              {formatRelativeTime(item.createdAt, WORKSPACE_NOW_MS)}
            </span>

            {item.read ? null : (
              <>
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span className="sr-only">Unread</span>
              </>
            )}
          </span>
        </span>

        <span className="mt-0.5 block text-sm leading-relaxed text-text-secondary">
          {item.message}
        </span>

        {/* The third line only where there is room to read it. */}
        {full && item.context ? (
          <span className="mt-1 block truncate text-xs font-medium text-text-muted">
            {item.context}
          </span>
        ) : null}
      </span>
    </button>
  );
}
