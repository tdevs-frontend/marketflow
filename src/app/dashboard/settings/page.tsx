import type { Metadata } from "next";

import { GeneralSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Workspace name, locale, business details and default senders.",
};

/**
 * General — the workspace, as opposed to the person.
 *
 * The module's landing page, and deliberately the workspace one: somebody who
 * clicks "Settings" is usually after the workspace name, the timezone or the
 * currency. Anything personal is one link away under Profile.
 */
export default function SettingsPage() {
  return <GeneralSettings />;
}
