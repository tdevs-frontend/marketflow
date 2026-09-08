import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { WhatsAppCampaignsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "WhatsApp Campaigns" };

export default function WhatsAppCampaignsPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Campaigns"
        description="Create, manage and track your WhatsApp marketing campaigns."
        breadcrumb={channelCrumbs("whatsapp", "Campaigns")}
        action={
          <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="compact">
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <WhatsAppCampaignsWorkspace />
    </>
  );
}
