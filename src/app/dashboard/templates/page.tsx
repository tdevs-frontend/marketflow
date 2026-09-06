import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Reusable message content for every channel, including approved WhatsApp templates."
        action={<Button>New template</Button>}
      />

      <EmptyState
        title="No templates yet"
        description="Save a message as a template to reuse it across campaigns and automations."
        action={<Button size="sm">New template</Button>}
      />
    </>
  );
}
