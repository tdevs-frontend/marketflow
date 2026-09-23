import { Suspense } from "react";
import type { Metadata } from "next";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { SettingsPageSkeleton } from "@/components/settings";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Orders, leads, campaigns, automations, messages and account activity, and how you are told about them.",
};

/**
 * Activity and Preferences, under one heading.
 *
 * The active tab lives in the query string, so the shell reads
 * `useSearchParams` - and a client component that does cannot be statically
 * prerendered unless something above it can suspend. This boundary is that
 * something: the frame is built at build time, the panel resolves on the
 * client against whatever `?tab=` says, and a link to `?tab=preferences` opens
 * on the preference centre.
 *
 * The fallback is the module's own skeleton rather than `null`, so the page
 * does not collapse for the moment before the panel lands.
 */
export default function NotificationsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <NotificationCenter />
    </Suspense>
  );
}
