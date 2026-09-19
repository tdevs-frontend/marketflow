import type { Metadata } from "next";

import { BillingSettings } from "@/components/settings";

export const metadata: Metadata = {
  title: "Billing & Subscription",
  description: "Plans, usage and payment for this workspace.",
};

/**
 * The page the sidebar has linked to all along.
 *
 * "Billing & Subscription" sat in the Settings group pointing at this path
 * with nothing behind it, so the row 404'd. The workspace renders its own
 * `PageHeader` — same shape as the Settings tabs screen.
 */
export default function BillingPage() {
  return <BillingSettings />;
}
