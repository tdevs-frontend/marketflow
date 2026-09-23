import type { Metadata } from "next";

import { CommerceCustomersWorkspace } from "@/components/commerce";

export const metadata: Metadata = {
  title: "Customers",
  description:
    "View customers who have purchased products or services from your business.",
};

/**
 * Paying customers, nested under Sales because that is where the data is.
 *
 * The sidebar lists it as Commerce → Customers. The route says `sales/customers`
 * because these records *are* the sales ledger grouped by buyer - there is no
 * customer table behind it, only the CRM contacts and the orders they placed.
 */
export default function CommerceCustomersPage() {
  return <CommerceCustomersWorkspace />;
}
