import type { Metadata } from "next";

import { ProfileSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal information and account details.",
};

export default function ProfileSettingsPage() {
  return <ProfileSettings />;
}
