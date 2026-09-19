import type { Metadata } from "next";

import { SocialAnalytics, SocialAnalyticsExport } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Social Analytics" };

export default function SocialAnalyticsPage() {
  return (
    <>
      {/*
        No date control here.

        The page opened on a filter card carrying a range picker, a platform
        select and Export. The range now comes from the dashboard's central
        filter and is passed to `SocialAnalytics` as a prop, the same way Email
        and SMS take it; the platform select stays on the page because it is
        social's own question. Until the central control exists the component
        falls back to the same 30 days the picker opened on, so nothing on
        screen has moved except the range itself.
      */}
      <PageHeader
        title="Social Analytics"
        description="Reach, engagement and follower growth per platform — ranked by rate, not by follower count."
        secondaryActions={<SocialAnalyticsExport />}
      />

      <SocialAnalytics />
    </>
  );
}
