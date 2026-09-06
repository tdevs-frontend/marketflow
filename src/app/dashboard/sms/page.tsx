import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "SMS" };

export default function SmsPage() {
  return (
    <>
      <PageHeader
        title="SMS"
        description="Two-way text messaging with automatic opt-out handling."
        action={<Button>New SMS</Button>}
      />

      <EmptyState
        title="No SMS activity"
        description="Connect a sending number to start two-way text conversations."
        action={<Button size="sm">New SMS</Button>}
      />
    </>
  );
}
