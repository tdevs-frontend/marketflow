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
 * become conversations, then product interest, then orders and revenue.
 *
 * Desktop is rows of wide-card-left, narrow-card-right. Mobile order differs
 * via `order-*` — the funnel belongs near the top on a phone.
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
