import type { Metadata } from "next";

import { EmailAnalytics } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Email Analytics" };

export default function EmailAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Email Analytics"
        description="The funnel, the engagement trend and every campaign side by side."
      />

      <EmailAnalytics />
    </>
  );
}
