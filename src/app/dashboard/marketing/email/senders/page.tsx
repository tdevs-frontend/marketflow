import type { Metadata } from "next";

import { EmailSendersWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Email Senders" };

/** Add and Send test both live in the workspace, beside what they act on. */
export default function EmailSendersPage() {
  return (
    <>
      <PageHeader
        title="Sender Settings"
        description="Who your campaigns come from, where replies land, and the provider carrying them."
      />

      <EmailSendersWorkspace />
    </>
  );
}
