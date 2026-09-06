import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect your store, forms, and data warehouse to keep contacts in sync."
        action={<Button>Browse catalog</Button>}
      />

      <EmptyState
        title="No integrations connected"
        description="Connect a source to sync contacts and events into your workspace automatically."
        action={<Button size="sm">Browse catalog</Button>}
      />
    </>
  );
}
