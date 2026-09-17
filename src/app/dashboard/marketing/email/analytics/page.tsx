import type { Metadata } from "next";

import { EmailAnalytics, EmailAnalyticsExport } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Email Analytics" };

export default function EmailAnalyticsPage() {
  return (
    <>
      {/*
        No date control here.

        The page used to open on a filter card — a range picker, an audience
        select and Export — which put the period on the page rather than on the
        dashboard, and did it again on three other analytics pages. The range
        now comes from the central filter and is passed to `EmailAnalytics` as
        a prop; until that control exists the component falls back to the same
        30 days the picker opened on, so nothing on screen has moved except the
        toolbar itself.
      */}
      <PageHeader
        title="Email Analytics"
        description="Engagement, the sending trend, and which campaigns and templates earned it."
        secondaryActions={<EmailAnalyticsExport />}
      />

      <EmailAnalytics />
    </>
  );
}
