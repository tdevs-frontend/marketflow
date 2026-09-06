import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Leads"
        description="Track deals through your pipeline from first touch to closed won."
        action={<Button>New lead</Button>}
      />

      <EmptyState
        title="No leads in this pipeline"
        description="Leads created from forms, campaigns, or by hand will show up on this board."
        action={<Button size="sm">New lead</Button>}
      />
    </>
  );
}
