import type { Metadata } from "next";

import { SmsAnalytics } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "SMS Analytics" };

export default function SmsAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="SMS Analytics"
        description="Delivery, replies and cost per reply — the efficiency measure this channel is judged on."
        breadcrumb={channelCrumbs("sms", "Analytics")}
      />

      <SmsAnalytics />
    </>
  );
}
