import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { MarketingOverview } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, OVERVIEW_CRUMBS } from "@/constants";

export const metadata: Metadata = { title: "Marketing" };

export default function MarketingPage() {
  return (
    <>
      <PageHeader
        title="Marketing"
        description="Turn conversations, campaigns and customer data into measurable growth."
        breadcrumb={OVERVIEW_CRUMBS}
        action={
          <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="compact">
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <MarketingOverview />
    </>
  );
}
