import type { Metadata } from "next";

import { CustomerSegmentsWorkspace } from "@/components/customers";

export const metadata: Metadata = { title: "Segments" };

/**
 * Audience segments, under Customers.
 *
 * A different view of the same segments the Marketing module lists: a
 * comparative table with a nested condition builder, rather than Marketing's
 * card grid framed around which channels a segment can reach. Both read
 * `GET /segments`, and the ids and names are shared, so a segment is the same
 * segment wherever it is named.
 *
 * The workspace renders its own `PageHeader` because the New segment button
 * opens a dialog it owns.
 */
export default function SegmentsPage() {
  return <CustomerSegmentsWorkspace />;
}
