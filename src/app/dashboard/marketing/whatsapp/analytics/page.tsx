import type { Metadata } from "next";

import { WhatsAppAnalytics } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "WhatsApp Analytics" };

export default function WhatsAppAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Analytics"
        description="Volume, delivery, response times and conversion — and which templates and agents earned them."
      />

      <WhatsAppAnalytics />
    </>
  );
}
