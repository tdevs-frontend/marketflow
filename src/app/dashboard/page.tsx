import type { Metadata } from "next";

import {
  AutomationActivity,
  CampaignPerformance,
  ChannelPerformance,
  GrowthInsight,
  GrowthOverview,
  KpiCards,
  LeadFunnel,
  OverviewHeader,
  WhatsAppInbox,
} from "@/components/dashboard";

export const metadata: Metadata = { title: "Dashboard" };
export default function DashboardPage() {
  return (
    <>
      <OverviewHeader />

      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <GrowthOverview className="order-1 lg:col-span-2 lg:col-start-1 lg:row-start-1" />
        <LeadFunnel className="order-2 lg:col-start-3 lg:row-start-1" />

        <WhatsAppInbox className="order-3 lg:col-start-3 lg:row-start-2" />
        <CampaignPerformance className="order-4 lg:col-span-2 lg:col-start-1 lg:row-start-2" />

        <ChannelPerformance className="order-5 lg:col-start-1 lg:row-start-3" />
        <AutomationActivity className="order-6 lg:col-span-2 lg:col-start-2 lg:row-start-3" />
      </div>

      <GrowthInsight />
    </>
  );
}
