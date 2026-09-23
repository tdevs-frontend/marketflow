"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { IconButton } from "@/components/ui/button";
import { useDismissable } from "@/components/ui/menu";
import { APP_ROUTES } from "@/constants/app";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { cn } from "@/lib/utils";
import {
  markAllRead,
  markRead,
} from "@/redux/features/notification/notificationSlice";
import type { FeedNotification } from "@/types/notification";

/**
 * The header bell, and what happened while you were elsewhere.
 *
 * This is the *feed*. Settings → Notifications is the *preference centre*, and
 * the two are deliberately different surfaces answering different questions:
 * the bell answers "what happened", that page answers "what do I want to be
 * told about". They share a vocabulary - `NotificationModule` mirrors
 * `NotificationCategory`, so a row here and the switch that governs it draw the
 * same icon - and nothing else.
 *
 * No tabs and no search. A panel you open to check whether anything needs you
 * is a panel that has to be readable in one glance; a tab strip makes the
 * reader choose a filter before they have seen anything, and a search box in a
 * 368px panel is answering a question that belongs to a full archive. That
 * archive now exists at `/dashboard/notifications`, which is where the footer
 * link goes and where the search and the paging live.
 *
 * The rows are `NotificationItem`, the same component the archive renders - at
 * its `compact` density rather than `full`. Two implementations of a
 * notification row is how one surface ends up bolding unread titles while the
 * other tints them.
 *
 * The button itself is unchanged from the header it replaced - same
 * `IconButton` geometry, same bell, same badge - because this is an interaction
 * being added, not a header being redesigned.
 */

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

export function NotificationPopover() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const items = useAppSelector((state) => state.notification.items);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  /* The same three listeners `Menu` uses - outside pointer-down, Escape, focus
     back to the trigger - rather than a second implementation that disagrees
     with it about what Escape does. */
  useDismissable(
    open,
    useCallback(() => setOpen(false), []),
    wrapperRef,
    triggerRef,
  );

  const unread = items.filter((item) => !item.read).length;

  /**
   * Opening a notification: mark it read, then go where it points.
   *
   * Both, and in that order. A reader who lands on the orders page and comes
   * back to find the row still bold learns the count is decorative. `href` is
   * nullable and checked - a row with nowhere real to go marks itself read and
   * closes the panel, which is a better outcome than navigating somewhere that
   * does not exist and losing the reader's place.
   */
  const open_ = (item: FeedNotification) => {
    if (!item.read) dispatch(markRead(item.id));
    setOpen(false);
    if (item.href) router.push(item.href);
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      {/* The header's own button, unchanged - same component, same geometry,
          same bell, same badge. Only the ARIA wiring and the ref are new, and
          the ref is why `IconButtonProps` now forwards one. */}
      <IconButton
        ref={triggerRef}
        label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 ? (
          /* Ringed in the button's own grey, so the dot reads as a badge on
             the control rather than a white hole punched through it. */
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-secondary ring-2 ring-gray-soft" />
        ) : null}
      </IconButton>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          /*
           * `right-0` anchors it to the bell, which is already at the right of
           * a full-width header - so the panel grows leftwards, into the page,
           * and cannot leave the viewport on that side.
           *
           * The width is the part that has to be said out loud: `w-[min(...)]`
           * rather than a fixed `w-96`. A 380px panel anchored `right-0` inside
           * a header with 16px gutters overflows a 360px phone by a hair, and
           * the symptom is a horizontal scrollbar on the whole dashboard rather
           * than anything visibly wrong with the panel. Clamping to the
           * viewport minus both gutters makes that impossible at any width.
           */
          className={cn(
            "absolute top-full right-0 z-40 mt-2 flex flex-col overflow-hidden",
            "max-h-128 w-[min(25rem,calc(100vw-2rem))]",
            /*
             * One border, one shadow, one radius - on the container and
             * nowhere else. The rows inside carry none of the three, which is
             * what makes the panel read as a feed rather than as a stack of
             * cards that happen to be adjacent.
             *
             * `rounded-panel` (12px), stepped down from `rounded-card` (16px).
             * It is the radius `Menu` already uses for the other thing in this
             * product that floats above the page, so the two dropdowns in the
             * header region agree; 16px is the radius of a card sitting *in*
             * the page, and on a 368px panel it reads as soft rather than as
             * precise.
             */
            "rounded-panel border border-border bg-surface shadow-float",
          )}
        >
          <Header unread={unread} onMarkAll={() => dispatch(markAllRead())} />

          {/* Only the list scrolls. The header keeps the count and the footer
              keeps the way out, both of which are useless once they have been
              scrolled past. */}
          {/* `custom-scrollbar` is the product's own: a 6px thumb on the
              border colour. The default Windows scrollbar is 17px of grey
              furniture down the side of a 368px panel, which is wider than the
              unread dot and darker than the separators. */}
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <EmptyFeed />
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <NotificationItem item={item} onOpen={() => open_(item)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            /* Settings › Notifications, which opens on its Activity tab - the
               full feed, beside the preferences that govern it. The label is
               honest now that the tab exists; it used to promise a list and
               land on a page of switches. */
            href={APP_ROUTES.settingsNotifications}
            onClick={() => setOpen(false)}
            /* Same hover as the header's action: an underline, no tint. The
               full-width wash it replaced made the footer light up as a band
               and read as a button stuck to the bottom of the panel rather
               than as the link it is. */
            className="border-t border-border px-4 py-4 text-center text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Header({
  unread,
  onMarkAll,
}: {
  unread: number;
  onMarkAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-text-primary">
          Notifications
        </h2>
        {unread > 0 ? (
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-dark tabular-nums">
            {unread}
          </span>
        ) : null}
      </div>

      {/* Rendered only when it would do something. A permanently visible
          "Mark all as read" on an already-read feed is a control that teaches
          the reader their click did nothing. */}
      {unread > 0 ? (
        <button
          type="button"
          onClick={onMarkAll}
          /* Underline on hover and nothing else - the same treatment every
             other inline link in the product carries. The colour shift it
             replaced made this read as a second state of the text rather than
             as a link answering the pointer, and `transition-colors` went with
             it: `text-decoration-line` does not animate, so there was nothing
             left for it to do. */
          className="rounded-btn text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
        >
          Mark all as read
        </button>
      ) : null}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-full bg-surface-secondary text-text-muted"
      >
        <BellOff className="size-5" />
      </span>
      <p className="text-sm font-semibold text-text-primary">
        You&rsquo;re all caught up
      </p>
      <p className="max-w-56 text-sm text-text-muted">
        No new notifications right now.
      </p>
    </div>
  );
}
