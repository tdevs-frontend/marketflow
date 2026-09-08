import type { Metadata } from "next";

import { SocialCalendar } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Content Calendar" };

/** Create Post opens the composer, so the header carries no primary action. */
export default function SocialCalendarPage() {
  return (
    <>
      <PageHeader
        title="Content Calendar"
        description="Everything scheduled, published and still a draft — month, week or day."
        breadcrumb={channelCrumbs("social", "Calendar")}
      />

      <SocialCalendar />
    </>
  );
}
