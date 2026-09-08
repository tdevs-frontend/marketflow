import type { Metadata } from "next";

import { CampaignWizard } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Create campaign" };

/**
 * The breadcrumb replaces the ad-hoc "Back to campaigns" link this page used
 * to carry — one way back, in the same place as every other page.
 */
export default function CreateCampaignPage() {
  return (
    <>
      <PageHeader
        title="Create campaign"
        description="Seven steps: what it is, who gets it, what it says, how it is personalised, and when it sends."
        breadcrumb={[
          { label: "Dashboard", href: APP_ROUTES.dashboard },
          { label: "Marketing", href: APP_ROUTES.marketing },
          { label: "Campaigns", href: APP_ROUTES.marketingCampaigns },
          { label: "Create" },
        ]}
      />

      <CampaignWizard />
    </>
  );
}
