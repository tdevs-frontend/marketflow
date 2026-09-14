import type { Metadata } from "next";

import {
  AutomationActivity,
  CampaignPerformance,
  DashboardRangeProvider,
  GrowthOverview,
  KpiCards,
  OverviewHeader,
  RecentOrders,
  SalesFunnel,
  WhatsAppInbox,
} from "@/components/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The merchant overview, read as one lifecycle: campaigns bring leads, leads
 * become conversations, then orders and revenue.
 *
 * One twelve-column grid holds every widget, rather than a stack of
 * independently sized rows. That is what makes the page read as a single
 * surface: grid items stretch, so the two cards in a row always start and end
 * on the same line, and the rows share one set of gutters.
 *
 * The two cards that earn the full measure take it — the growth plot, because
 * a wide plot resolves more of the curve, and the activity log, because its
 * rows are one line each and a narrow column truncates the detail that makes
 * them worth reading. Between them sit two wide-left, narrow-right pairs at
 * 7/5, so the page alternates band, split, split, band instead of ending on a
 * ragged column.
 *
 * Tablet pairs only what fits: the orders table has a minimum width and would
 * scroll inside a half column, so it and the funnel hold the full measure
 * until `lg`. Mobile is a single column, and document order is reading order,
 * so no widget needs to be re-ordered.
 */
export default function DashboardPage() {
  return (
    <DashboardRangeProvider>
      <OverviewHeader />

      <KpiCards />

      <div className="grid gap-6 md:grid-cols-12">
        <GrowthOverview className="md:col-span-12" />

        <CampaignPerformance className="md:col-span-6 lg:col-span-7" />
        <WhatsAppInbox className="md:col-span-6 lg:col-span-5" />

        <RecentOrders className="md:col-span-12 lg:col-span-7" />
        <SalesFunnel className="md:col-span-12 lg:col-span-5" />

        <AutomationActivity className="md:col-span-12" />
      </div>
    </DashboardRangeProvider>
  );
}
