import type { Metadata } from "next";

import { CommerceCustomersWorkspace } from "@/components/commerce";

export const metadata: Metadata = {
  title: "Customers",
  description:
    "View customers who have purchased products or services from your business.",
};

/**
 * Paying customers - the one canonical Customers page.
 *
 * The sidebar lists it as Customers → Customers, beside Contacts and Leads.
 * The records are still the sales ledger grouped by buyer - there is no
 * customer table behind it, only the CRM contacts and the orders they placed.
 * It used to live at `/dashboard/sales/customers`, which now redirects here
 * (see `next.config.ts`).
 */
export default function CommerceCustomersPage() {
  return <CommerceCustomersWorkspace />;
}
