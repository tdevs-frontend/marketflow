import type { Metadata } from "next";

import { BillingSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Billing & Subscription",
  description: "Your plan, what it costs and what this workspace is using.",
};

export default function BillingSettingsPage() {
  return <BillingSettings />;
}
