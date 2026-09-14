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
 * Six cards in three rows, each row a pair: 8/4, 7/5, 6/6. The narrow column
 * tightens as the page descends, and the wide column never repeats the same
 * width twice running, so the rows stay distinguishable without a rule between
 * them. Pairing the inbox with the plot is what buys the third row back — it
 * is the one narrow card tall enough to sit beside a chart without leaving a
 * gap under it.
 *
 * Tablet drops to even halves, since a 4- or 5-column card is too narrow to
 * read at that width, and the two cards that need the full measure — the
 * orders table, which has a minimum width, and the activity log, whose rows
 * are one line each — take it until `lg`. Mobile is a single column, and
 * document order is reading order, so no widget needs to be re-ordered.
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
        <SalesFunnel className="md:col-span-6 lg:col-span-5" />

        <RecentOrders className="md:col-span-12 lg:col-span-6" />
        <AutomationActivity className="md:col-span-12 lg:col-span-6" />
      </div>
    </DashboardRangeProvider>
  );
}
