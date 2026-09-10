import type { Metadata } from "next";

import { SegmentsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Segments" };

/**
 * Audience segments, under Customers.
 *
 * This renders the same `SegmentsWorkspace` that `/dashboard/marketing/segments`
 * does, rather than a second implementation. It already carries everything the
 * Customers brief asks for — the card grid, the rule builder with a live
 * estimate, duplicate, export and a dependency-aware delete — and a Customers
 * copy of it would be two segment builders drifting apart, which is exactly the
 * kind of duplication the brief rules out.
 *
 * Only the framing differs: the Marketing route describes segments as something
 * to send to, this one as a way to group people. The workspace carries no
 * header of its own, so each route supplies its own.
 */
export default function SegmentsPage() {
  return (
    <>
      <PageHeader
        title="Segments"
        description="Group customers using behavior, profile and engagement conditions."
      />

      <SegmentsWorkspace />
    </>
  );
}
