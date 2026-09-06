import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Plan, schedule, and measure sends across email, SMS, and WhatsApp."
        action={<Button>New campaign</Button>}
      />

      <EmptyState
        title="No campaigns yet"
        description="Build your first campaign and pick an audience segment to send it to."
        action={<Button size="sm">New campaign</Button>}
      />
    </>
  );
}
