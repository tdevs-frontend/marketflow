import type { Metadata } from "next";

import { LeadsBoard } from "@/components/customers";

export const metadata: Metadata = { title: "Leads" };

/**
 * The sales pipeline. The board owns its own header, because both header
 * actions and the board/list switch are client state.
 */
export default function LeadsPage() {
  return <LeadsBoard />;
}
