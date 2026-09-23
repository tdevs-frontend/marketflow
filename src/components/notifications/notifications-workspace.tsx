"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { markRead } from "@/redux/features/notification/notificationSlice";
import type { FeedNotification } from "@/types/notification";

import { NotificationItem } from "./notification-item";

/**
 * Every notification, paged - the archive behind the header bell.
 *
 * The bell and this page are one system seen at two distances. They read the
 * same slice, render the same `NotificationItem`, and share one unread count:
 * marking something read here drops the badge in the header without a reload,
 * because there is only ever one list. A second store for "all notifications"
 * is how a product ends up showing 8 in the header and 7 on the page.
 *
 * What this page adds is what a panel 368px wide cannot hold - the third line
 * of context, room to breathe, search, and pages. What it deliberately does
 * *not* add is a filter rail. Two controls, both of which answer a question a
 * reader actually arrives with: "where is the one about the order" (search) and
 * "what still needs me" (unread). A module filter on top of those would be a
 * third way to narrow a list that is already forty-eight rows long, and the
 * search box covers it - typing "whatsapp" matches the module as surely as a
 * chip would.
 */

const PER_PAGE = 10;

type View = "all" | "unread";

export function NotificationsWorkspace() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const items = useAppSelector((state) => state.notification.items);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const [page, setPage] = useState(1);

  const unread = items.filter((item) => !item.read).length;

  /**
   * The list after both controls, in feed order.
   *
   * Search reads the title, the message, the context line and the module key.
   * The module matters: somebody looking for a delivery problem types
   * "whatsapp", not the sentence the notification happens to be phrased in,
   * and matching the key is what makes that work without a filter chip.
   */
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      if (view === "unread" && item.read) return false;
      if (!needle) return true;

      return [item.title, item.message, item.context ?? "", item.module].some(
        (field) => field.toLowerCase().includes(needle),
      );
    });
  }, [items, query, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  /*
   * Clamped rather than reset. Narrowing the list while on page 5 should land
   * on the last page that still exists, not throw the reader back to the top -
   * and clamping during render means it never paints an empty page first.
   */
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PER_PAGE;
  const visible = filtered.slice(start, start + PER_PAGE);

  /** Narrowing the list can strand the reader mid-way; start them at the top. */
  const narrow = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  /**
   * Opening a notification: mark it read, then go where it points.
   *
   * Both, and in that order. A reader who lands on the orders page and comes
   * back to find the row still bold learns the count is decorative. `href` is
   * nullable and checked - a row with nowhere real to go marks itself read and
   * stays put, which is better than navigating somewhere that does not exist.
   *
   * The row keeps its position either way. Re-sorting read items to the bottom
   * under the reader's cursor is how the next click lands on the wrong thing.
   */
  const open = (item: FeedNotification) => {
    if (!item.read) dispatch(markRead(item.id));
    if (item.href) router.push(item.href);
  };

  return (
    <>
      {/* No heading here. `NotificationCenter` owns the page title and the
          "Mark all as read" action, so the title does not change when the tab
          does and the action cannot appear above the Preferences list. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
          />
          <Input
            size="sm"
            className="pl-9"
            placeholder="Search notifications..."
            aria-label="Search notifications"
            value={query}
            onChange={(event) => narrow(setQuery)(event.target.value)}
          />
        </div>

        <SegmentedControl
          label="Show"
          value={view}
          onChange={narrow(setView)}
          options={[
            { value: "all", label: `All ${items.length}` },
            { value: "unread", label: `Unread ${unread}` },
          ]}
        />
      </div>

      {/*
        One card around the whole list, not one per notification. Forty-eight
        bordered boxes stacked down a page is a list nobody reads to the bottom;
        a single surface with rules between rows is a feed. `p-0` because the
        rows carry their own padding and the separators have to reach the card's
        edges.
      */}
      <Card className="overflow-hidden p-0">
        {visible.length === 0 ? (
          <EmptyState
            compact
            className="border-0"
            title="No notifications found"
            description={
              query.trim() || view === "unread"
                ? "Nothing matches that. Try a different search, or switch back to All."
                : "You’re all caught up."
            }
          />
        ) : (
          <ul>
            {visible.map((item) => (
              <li key={item.id}>
                <NotificationItem
                  item={item}
                  density="full"
                  onOpen={() => open(item)}
                />
              </li>
            ))}
          </ul>
        )}

        {filtered.length > 0 ? (
          <div className="border-t border-border px-4 py-3 sm:px-5">
            <Pagination
              page={current}
              totalPages={totalPages}
              total={filtered.length}
              perPage={PER_PAGE}
              onChange={setPage}
              noun="notifications"
            />
          </div>
        ) : null}
      </Card>
    </>
  );
}
