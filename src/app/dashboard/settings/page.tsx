import type { Metadata } from "next";

import { SettingsWorkspace } from "@/components/settings";

export const metadata: Metadata = { title: "Settings" };

/**
 * Workspace settings, plus the three account panels that used to be their own
 * sidebar rows.
 *
 * The workspace renders its own `PageHeader` because the tab strip has to sit
 * directly under it — the same shape `ContactsWorkspace` and the workflow
 * detail screen already use.
 */
export default function SettingsPage() {
  return <SettingsWorkspace />;
}
