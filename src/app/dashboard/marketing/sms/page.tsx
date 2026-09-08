import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { SmsOverview } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES, channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "SMS Overview" };

export default function SmsOverviewPage() {
  return (
    <>
      <PageHeader
        title="SMS Overview"
        description="Delivery, replies and spend — every message on this channel costs money."
        breadcrumb={channelCrumbs("sms", "Overview")}
        secondaryActions={
          <ButtonLink href={APP_ROUTES.smsTemplates} variant="outline" size="compact">
            Templates
          </ButtonLink>
        }
        action={
          <ButtonLink href={APP_ROUTES.smsCampaigns} size="compact">
            <Plus aria-hidden />
            Create Campaign
          </ButtonLink>
        }
      />

      <SmsOverview />
    </>
  );
}
