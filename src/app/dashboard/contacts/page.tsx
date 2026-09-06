import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return (
    <>
      <PageHeader
        title="Contacts"
        description="Every person in your workspace, with consent tracked per channel."
        action={<Button>Add contact</Button>}
      />

      <EmptyState
        title="No contacts yet"
        description="Import a CSV or add contacts one at a time to start building your audience."
        action={<Button size="sm">Add contact</Button>}
      />
    </>
  );
}
