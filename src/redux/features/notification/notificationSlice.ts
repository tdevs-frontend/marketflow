import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import { NOTIFICATION_FEED } from "@/lib/notification-fixtures";
import type { FeedNotification } from "@/types/notification";

/**
 * The header bell's feed.
 *
 * This slice already existed and was shaped like a toast queue - `variant`,
 * `duration`, a `dismiss` that removed the item - which is a different thing
 * with a different lifetime. Nothing dispatched to it: toasts are their own
 * React context in `components/ui/toast`, so the only consumer was the header's
 * unread badge, and that badge counted an array nothing ever filled. The bell
 * has therefore read zero since it was built.
 *
 * Rather than adding a second notification system beside it, the slice is now
 * what its name always claimed: a list of things that happened, newest first,
 * each either read or not. A toast is a message about the action you just took
 * and it goes away; a notification is a record of something the product did
 * while you were elsewhere, and it waits.
 *
 * Seeded from `lib/notification-fixtures` - the same demo workspace every other
 * module is seeded from, with real orders, campaigns and workflows in it. When
 * a notification service exists, it replaces `initialState.items` and the
 * reducers become the optimistic half of `PATCH /notifications/:id`.
 */

export interface NotificationState {
  items: FeedNotification[];
}

const initialState: NotificationState = { items: NOTIFICATION_FEED };

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    /**
     * Push a notification onto the feed.
     *
     * Here for the day something in the product raises one - a finished
     * import, a failed send - rather than for the fixtures, which arrive as
     * `initialState`. `read` starts false because a notification the reader has
     * not seen is the only kind worth adding.
     */
    notify: {
      reducer: (state, action: PayloadAction<FeedNotification>) => {
        state.items.unshift(action.payload);
      },
      prepare: (input: Omit<FeedNotification, "id" | "read" | "createdAt">) => ({
        payload: {
          ...input,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          read: false,
        } satisfies FeedNotification,
      }),
    },

    /** One notification, opened. Idempotent - reopening a read item is a no-op. */
    markRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((entry) => entry.id === action.payload);
      if (item) item.read = true;
    },

    markAllRead: (state) => {
      for (const item of state.items) item.read = true;
    },

    /**
     * Removes a notification outright.
     *
     * Distinct from `markRead`, which is what the panel does: reading is not
     * deleting, and a feed that empties as you look at it cannot be re-read to
     * find the thing you half-noticed. Nothing in the UI calls this yet.
     */
    dismiss: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    clearNotifications: () => ({ items: [] }),
  },
});

export const { notify, markRead, markAllRead, dismiss, clearNotifications } =
  notificationSlice.actions;

export default notificationSlice.reducer;
