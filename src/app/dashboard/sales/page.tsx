import type { Metadata } from "next";

import { SalesWorkspace } from "@/components/commerce";

export const metadata: Metadata = {
  title: "Sales",
  description:
    "Track revenue and sales performance across products, services and channels.",
};

/**
 * Sales - the commercial reading of the order book.
 *
 * Separate from Orders on purpose: Orders is the queue of work, this is the
 * performance. Both read the same data, and only Orders can change it.
 */
export default function SalesPage() {
  return <SalesWorkspace />;
}
