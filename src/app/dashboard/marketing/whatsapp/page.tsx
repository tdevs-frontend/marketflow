import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { WhatsAppOverview } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "WhatsApp Overview" };

export default function WhatsAppOverviewPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Overview"
        description="Delivery, conversations and automations for your WhatsApp Business account."
        breadcrumb={channelCrumbs("whatsapp", "Overview")}
        secondaryActions={
          <ButtonLink
            href={APP_ROUTES.whatsappInbox}
            variant="outline"
            size="compact"
          >
            Open Inbox
          </ButtonLink>
        }
        action={
          <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="compact">
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <WhatsAppOverview />
    </>
  );
}
