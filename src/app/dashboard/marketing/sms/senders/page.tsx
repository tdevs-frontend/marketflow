import type { Metadata } from "next";

import { SmsSendersWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "SMS Sender IDs" };

/** Add opens a dialog, so the header carries no CTA of its own. */
export default function SmsSendersPage() {
  return (
    <>
      <PageHeader
        title="Sender IDs"
        description="What the handset shows as the sender — and, with it, whether anyone can reply."
      />

      <SmsSendersWorkspace />
    </>
  );
}
