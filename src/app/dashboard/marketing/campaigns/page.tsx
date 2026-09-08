import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CampaignsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, marketingCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Create, manage and track all your marketing campaigns."
        breadcrumb={marketingCrumbs("Campaigns")}
        action={
          <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="compact">
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <CampaignsWorkspace />
    </>
  );
}
