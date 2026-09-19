import type { Metadata } from "next";

import { SecuritySettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Security",
  description: "Protect your account and manage authentication.",
};

export default function SecuritySettingsPage() {
  return <SecuritySettings />;
}
