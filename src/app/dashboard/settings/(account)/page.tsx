import type { Metadata } from "next";

import { SettingsOverview } from "@/components/settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, notifications, security and subscription.",
};

/**
 * The account hub, not a form.
 *
 * This route used to be "General" and carried a second copy of the workspace
 * name, timezone, currency, business details and default senders — all of which
 * Workspace Settings owns. It now shows those values read-only with a link to
 * that editor, and gives each account section a live status line.
 */
export default function SettingsPage() {
  return <SettingsOverview />;
}
