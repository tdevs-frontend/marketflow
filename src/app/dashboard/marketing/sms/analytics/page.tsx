import type { Metadata } from "next";

import { SmsAnalytics, SmsAnalyticsExport } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "SMS Analytics" };

export default function SmsAnalyticsPage() {
  return (
    <>
      {/*
        No date control here.

        The page used to open on a filter card - a range picker, an audience
        select and Export - which put the period on the page rather than on the
        dashboard, and did it again on three other analytics pages. The range
        now comes from the central filter and is passed to `SmsAnalytics` as a
        prop; until that control exists the component falls back to the same 30
        days the picker opened on, so nothing on screen has moved except the
        toolbar itself.
      */}
      <PageHeader
        title="SMS Analytics"
        description="Delivery, replies, opt-outs and cost per reply - the efficiency measures this channel is judged on."
        secondaryActions={<SmsAnalyticsExport />}
      />

      <SmsAnalytics />
    </>
  );
}
