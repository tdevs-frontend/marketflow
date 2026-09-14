import type { Metadata } from "next";

import { CampaignWizard } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Create campaign" };

export default function CreateCampaignPage() {
  return (
    <>
      <PageHeader
        title="Create campaign"
        description="Seven steps: what it is, who gets it, what it says, how it is personalised, and when it sends."
      />

      <CampaignWizard />
    </>
  );
}
