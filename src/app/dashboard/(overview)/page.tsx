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
 * on the same line, and the three rows share one set of gutters.
 *
 * Six cards in three rows, each row a pair: 8/4, 7/5, 7/5. The plot takes the
 * widest column because it is the only widget whose reading degrades with
 * width, and the inbox - the one narrow card tall enough to sit beside a chart
 * - is what keeps that row from leaving a gap under it. The two rows below it
 * share a measure: a 7-column card is wide enough for the orders table's six
 * columns, and a 5-column card is where the activity feed and the funnel both
 * still read, since neither has columns to lose.
 *
 * Tablet drops to even halves, since a 4- or 5-column card is too narrow to
 * read at that width. The orders table is the exception and keeps the full
 * measure until `lg` - it has a minimum width, and half a tablet is under it -
 * so the funnel beside it takes the full measure too rather than sitting in a
 * half-empty row. Mobile is a single column, and document order is reading
 * order, so no widget needs to be re-ordered.
 */
export default function DashboardPage() {
  return (
    <DashboardRangeProvider>
      <OverviewHeader />

      <KpiCards />

      <div className="grid gap-6 md:grid-cols-12">
        <GrowthOverview className="md:col-span-6 lg:col-span-8" />
        <WhatsAppInbox className="md:col-span-6 lg:col-span-4" />

        <CampaignPerformance className="md:col-span-6 lg:col-span-7" />
        <AutomationActivity className="md:col-span-6 lg:col-span-5" />

        <RecentOrders className="md:col-span-12 lg:col-span-7" />
        <SalesFunnel className="md:col-span-12 lg:col-span-5" />
      </div>
    </DashboardRangeProvider>
  );
}
