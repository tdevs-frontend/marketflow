import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Email" };

export default function EmailPage() {
  return (
    <>
      <PageHeader
        title="Email"
        description="Broadcast and transactional email, with deliverability at a glance."
        action={<Button>New email</Button>}
      />

      <EmptyState
        title="No emails sent yet"
        description="Design an email, choose a segment, and schedule your first send."
        action={<Button size="sm">New email</Button>}
      />
    </>
  );
}
