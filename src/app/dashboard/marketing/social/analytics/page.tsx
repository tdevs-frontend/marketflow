import type { Metadata } from "next";

import { SocialAnalytics } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Social Analytics" };

export default function SocialAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Social Analytics"
        description="Reach, engagement and follower growth per platform — ranked by rate, not by follower count."
        breadcrumb={channelCrumbs("social", "Analytics")}
      />

      <SocialAnalytics />
    </>
  );
}
