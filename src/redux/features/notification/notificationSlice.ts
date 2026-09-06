import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type NotificationVariant = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  variant: NotificationVariant;
  title: string;
  message?: string;
  createdAt: number;
  read: boolean;
  /** Auto-dismiss delay in ms; 0 keeps the toast until dismissed. */
  duration: number;
}

export interface NotificationState {
  items: Notification[];
}

const initialState: NotificationState = { items: [] };

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    notify: {
      reducer: (state, action: PayloadAction<Notification>) => {
        state.items.unshift(action.payload);
      },
      prepare: (input: {
        variant?: NotificationVariant;
        title: string;
        message?: string;
        duration?: number;
      }) => ({
        payload: {
          id: nanoid(),
          variant: input.variant ?? "info",
          title: input.title,
          message: input.message,
          duration: input.duration ?? 5000,
          createdAt: Date.now(),
          read: false,
        } satisfies Notification,
      }),
    },
    dismiss: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    markAllRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },
    clearNotifications: () => initialState,
  },
});

export const { notify, dismiss, markAllRead, clearNotifications } =
  notificationSlice.actions;

export default notificationSlice.reducer;
