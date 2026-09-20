"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CreditCard,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Plug,
  Megaphone,
  Share2,
  ShoppingCart,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { useDismissable } from "@/components/ui/menu";
import { APP_ROUTES } from "@/constants/app";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import {
  markAllRead,
  markRead,
} from "@/redux/features/notification/notificationSlice";
import type {
  FeedNotification,
  NotificationModule,
} from "@/types/notification";

/**
 * The header bell, and what happened while you were elsewhere.
 *
 * This is the *feed*. Settings → Notifications is the *preference centre*, and
 * the two are deliberately different surfaces answering different questions:
 * the bell answers "what happened", that page answers "what do I want to be
 * told about". They share a vocabulary — `NotificationModule` mirrors
 * `NotificationCategory`, so a row here and the switch that governs it draw the
 * same icon — and nothing else.
 *
 * No tabs and no search. A panel you open to check whether anything needs you
 * is a panel that has to be readable in one glance; a tab strip makes the
 * reader choose a filter before they have seen anything, and a search box in a
 * 400px panel is answering a question that belongs to a full archive. Fourteen
 * items scroll faster than either control resolves.
 *
 * The button itself is unchanged from the header it replaced — same
 * `IconButton` geometry, same bell, same badge — because this is an interaction
 * being added, not a header being redesigned.
 */

/* -------------------------------------------------------------------------- */
/* Module vocabulary                                                          */
/* -------------------------------------------------------------------------- */

/**
 * One icon per module, from the set the sidebar and the settings page already
 * use.
 *
 * The icon is the only thing a reader uses to triage a feed before reading it,
 * so it has to mean *where this came from* rather than *how bad it is* — Orders
 * is always a cart whether the order arrived or its payment failed. Severity is
 * carried by colour, on one axis, in `TONES`.
 */
const MODULE_ICON: Record<NotificationModule, LucideIcon> = {
  order: ShoppingCart,
  inventory: Package,
  customer: Users,
  marketing: Megaphone,
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageSquare,
  social: Share2,
  automation: Workflow,
  integration: Plug,
  workspace: Users,
  billing: CreditCard,
};

/**
 * Three tones, and only one of them is warm.
 *
 * A palette a reader has to learn is a palette they ignore. `alert` is the only
 * state that changes what somebody does next, so it is the only one that
 * carries the error ramp; `success` marks the things that went right, and
 * everything else sits on the neutral surface so the two that matter stand out
 * against it.
 */
const TONES = {
  info: "bg-surface-secondary text-text-secondary",
  success: "bg-success-soft text-success-text",
  alert: "bg-error-soft text-error-text",
} as const;

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

  /* The same three listeners `Menu` uses — outside pointer-down, Escape, focus
     back to the trigger — rather than a second implementation that disagrees
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
   * nullable and checked — a row with nowhere real to go marks itself read and
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
      {/* The header's own button, unchanged — same component, same geometry,
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
           * a full-width header — so the panel grows leftwards, into the page,
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
            "max-h-128 w-[min(23rem,calc(100vw-2rem))]",
            /*
             * One border, one shadow, one radius — on the container and
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
                    <NotificationRow item={item} onOpen={() => open_(item)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href={APP_ROUTES.settingsNotifications}
            onClick={() => setOpen(false)}
            /* Same hover as the header's action: an underline, no tint. The
               full-width wash it replaced made the footer light up as a band
               and read as a button stuck to the bottom of the panel rather
               than as the link it is. */
            className="border-t border-border px-4 py-4 text-center text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
          >
            View All Notification
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
          /* Underline on hover and nothing else — the same treatment every
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

function NotificationRow({
  item,
  onOpen,
}: {
  item: FeedNotification;
  onOpen: () => void;
}) {
  const Icon = MODULE_ICON[item.module];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full gap-3 px-4 py-3 text-left transition-colors",
        /* The only rule between rows, and none after the last one — a border
           under the final row would sit directly on the footer's own divider
           and read as a double line. */
        "border-b border-border last:border-b-0",
        "focus-visible:shadow-focus focus-visible:outline-none",
        /*
         * Unread is `primary` at 5%, mixed from the brand colour itself
         * rather than taken from `primary-subtle`. Two reasons. The tint is
         * meant to be *felt* and not seen — at 5% it separates the unread
         * block from the read one without turning half the panel into a
         * coloured surface, and the dot is what actually announces the state.
         * And an alpha of the real token stays on the brand hue: the named
         * tints are their own colours, which is why the old row read as a
         * violet band rather than as a wash of the indigo beside it.
         *
         * Read rows take no background at all, so they are the panel.
         */
        item.read
          ? "hover:bg-surface-secondary"
          : "bg-primary/5 hover:bg-primary/10",
      )}
    >
      {/* 32px, down from 36. The tile identifies the module at a glance and
          then gets out of the way; at the larger size it was the heaviest
          thing in a row whose point is the sentence beside it. */}
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-btn",
          TONES[item.tone],
        )}
      >
        <Icon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        {/*
         * Title, time and dot on one line, with the dot at the row's right
         * edge — it shares a line with the timestamp rather than floating
         * beside the whole row, so it lines up without being nudged into
         * place with a hand-picked margin.
         *
         * `flex-wrap` is what §10's narrow case needs: on a phone the title
         * takes the width it needs and the time drops to its own line rather
         * than squeezing the title into a two-word column.
         */}
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-[15px] text-text-primary",
              item.read ? "font-semibold" : "font-semibold",
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

            {/* 6px, and the real signal for unread now that the row's tint is
                down at 5%. Sized to sit under the timestamp's cap height
                rather than to be noticed on its own. */}
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
      </span>
    </button>
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
