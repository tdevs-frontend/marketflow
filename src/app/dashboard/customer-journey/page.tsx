import type { Metadata } from "next";

import { JourneyWorkspace } from "@/components/customers";

export const metadata: Metadata = { title: "Customer Journey" };

/**
 * The module's most visual page. New route — the sidebar has linked here since
 * the Customers group was added, ahead of the page existing.
 */
export default function CustomerJourneyPage() {
  return <JourneyWorkspace />;
}
