import type { Metadata } from "next";

import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Orders, leads, campaigns, automations, messages and account activity.",
};

/**
 * The archive behind the header bell.
 *
 * A route of its own rather than a taller dropdown: forty-eight rows with
 * search and pages is a page, and a panel anchored to a button is the wrong
 * container for something a merchant reads through. The bell stays what it is
 * — the last handful, at a glance — and links here.
 *
 * Client all the way down, because the feed lives in the Redux store the header
 * already reads. That is the point: one list, one unread count, two surfaces.
 */
export default function NotificationsPage() {
  return <NotificationsWorkspace />;
}
