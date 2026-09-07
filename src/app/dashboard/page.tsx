import type { Metadata } from "next";

import {
  AutomationActivity,
  CampaignPerformance,
  GrowthOverview,
  KpiCards,
  OverviewHeader,
  ProductPerformance,
  RecentOrders,
  SalesFunnel,
  WhatsAppInbox,
} from "@/components/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The merchant overview, read as one lifecycle: campaigns bring leads, leads
 * become conversations, conversations become product interest, interest
 * becomes orders and revenue, and automation is what moved each step.
 *
 * Desktop is four rows of wide-card-left, narrow-card-right. Growth Overview
 * takes the full width because the funnel moved down beside Automation
 * Activity, and a hole in the top row would read as a mistake.
 *
 * Mobile order is set with `order-*` and deliberately differs: the funnel is
 * the second thing a merchant should see on a phone, even though on desktop it
 * sits at the bottom of the right rail.
 */
export default function DashboardPage() {
  return (
    <>
      <OverviewHeader />

      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <GrowthOverview className="order-1 lg:col-span-3 lg:col-start-1 lg:row-start-1" />

        <CampaignPerformance className="order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2" />
        <WhatsAppInbox className="order-4 lg:col-start-3 lg:row-start-2" />

        <ProductPerformance className="order-5 lg:col-span-2 lg:col-start-1 lg:row-start-3" />
        <RecentOrders className="order-6 lg:col-start-3 lg:row-start-3" />

        <AutomationActivity className="order-7 lg:col-span-2 lg:col-start-1 lg:row-start-4" />
        <SalesFunnel className="order-2 lg:col-start-3 lg:row-start-4" />
      </div>
    </>
  );
}
