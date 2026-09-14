import type { Metadata } from "next";

import { SmsCampaignsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "SMS Campaigns" };

/** Create Campaign opens the composer dialog, so the header carries no CTA. */
export default function SmsCampaignsPage() {
  return (
    <>
      <PageHeader
        title="SMS Campaigns"
        description="Write, count and schedule SMS broadcasts. The counter measures what the gateway bills, not what you type."
      />

      <SmsCampaignsWorkspace />
    </>
  );
}
