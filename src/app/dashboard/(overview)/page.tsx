import type { Metadata } from "next";

import {
  AutomationActivity,
  BusinessPulse,
  CampaignPerformance,
  DashboardRangeProvider,
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
 * One twelve-column grid holds every widget, rather than a stack of
 * independently sized rows. That is what makes the page read as a single
 * surface: grid items stretch, so the two cards in a row always start and end
 * on the same line, and the four rows share one set of gutters.
 *
 * Desktop runs wide-left, narrow-right at 8/4, 7/5, 6/6, 7/5. Mobile is a
 * single column in a different order — `order-*` puts what needs the merchant
 * (today's signals, then the inbox) above what merely informs them.
 */
export default function DashboardPage() {
  return (
    <DashboardRangeProvider>
      <OverviewHeader />

      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-12">
        <GrowthOverview className="order-2 lg:col-span-8 lg:col-start-1 lg:row-start-1" />
        <BusinessPulse className="order-1 lg:col-span-4 lg:col-start-9 lg:row-start-1" />

        <CampaignPerformance className="order-4 lg:col-span-7 lg:col-start-1 lg:row-start-2" />
        <WhatsAppInbox className="order-3 lg:col-span-5 lg:col-start-8 lg:row-start-2" />

        <ProductPerformance className="order-7 lg:col-span-6 lg:col-start-1 lg:row-start-3" />
        <RecentOrders className="order-5 lg:col-span-6 lg:col-start-7 lg:row-start-3" />

        <AutomationActivity className="order-6 lg:col-span-7 lg:col-start-1 lg:row-start-4" />
        <SalesFunnel className="order-8 lg:col-span-5 lg:col-start-8 lg:row-start-4" />
      </div>
    </DashboardRangeProvider>
  );
}
