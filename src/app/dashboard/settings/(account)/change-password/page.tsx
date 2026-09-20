import type { Metadata } from "next";

import { ChangePasswordSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Set a new password for your MarketFlow account.",
};

export default function ChangePasswordPage() {
  return <ChangePasswordSettings />;
}
