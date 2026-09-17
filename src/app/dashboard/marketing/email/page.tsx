import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { EmailOverview } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Email Overview" };

export default function EmailOverviewPage() {
  return (
    <>
      <PageHeader
        title="Email Overview"
        description="Delivery, engagement and what has happened on the channel today."
        secondaryActions={
          <ButtonLink href={APP_ROUTES.emailTemplates} variant="outline" size="compact">
            Templates
          </ButtonLink>
        }
        action={
          <ButtonLink
            href={`${APP_ROUTES.marketingCampaignNew}?channel=email`}
            size="compact"
          >
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <EmailOverview />
    </>
  );
}
