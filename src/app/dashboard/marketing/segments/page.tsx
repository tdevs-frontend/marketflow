import type { Metadata } from "next";

import { SegmentsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { marketingCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Audience Segments" };

/** Create Segment opens the rule builder, so the header carries no CTA. */
export default function SegmentsPage() {
  return (
    <>
      <PageHeader
        title="Audience Segments"
        description="Build an audience once and reuse it on WhatsApp, Email and SMS."
        breadcrumb={marketingCrumbs("Audience Segments")}
      />

      <SegmentsWorkspace />
    </>
  );
}
