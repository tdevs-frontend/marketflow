import type { Metadata } from "next";

import { EmailAnalytics } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Email Analytics" };

export default function EmailAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Email Analytics"
        description="Engagement and deliverability side by side — they fail for different reasons and need different fixes."
        breadcrumb={channelCrumbs("email", "Analytics")}
      />

      <EmailAnalytics />
    </>
  );
}
