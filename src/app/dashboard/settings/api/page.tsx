import type { Metadata } from "next";

import { DeveloperSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "API & Developer",
  description: "Keys, webhooks and reference for building against MarketFlow.",
};

/**
 * The route the sidebar has linked to all along.
 *
 * "API & Developer" sat in the Settings group pointing here, the permission
 * model's `developer` resource names this exact path, and no page was ever
 * emitted for it — so the row 404'd.
 */
export default function DeveloperSettingsPage() {
  return <DeveloperSettings />;
}
