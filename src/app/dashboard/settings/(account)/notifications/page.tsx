import type { Metadata } from "next";

import { NotificationSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Choose how you receive important workspace notifications.",
};

export default function NotificationSettingsPage() {
  return <NotificationSettings />;
}
