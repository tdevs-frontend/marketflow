import type { Metadata } from "next";

import { WhatsAppAnalytics } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "WhatsApp Analytics" };

export default function WhatsAppAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Analytics"
        description="Every outcome from sent through to converted, and which campaigns, audiences and templates earned it."
        breadcrumb={channelCrumbs("whatsapp", "Analytics")}
      />

      <WhatsAppAnalytics />
    </>
  );
}
