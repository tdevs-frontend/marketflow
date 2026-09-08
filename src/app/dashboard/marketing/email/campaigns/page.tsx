import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { EmailCampaignsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Email Campaigns" };

export default function EmailCampaignsPage() {
  return (
    <>
      <PageHeader
        title="Email Campaigns"
        description="Create, schedule and measure email campaigns — by subject line, not just by name."
        breadcrumb={channelCrumbs("email", "Campaigns")}
        action={
          <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="compact">
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <EmailCampaignsWorkspace />
    </>
  );
}
