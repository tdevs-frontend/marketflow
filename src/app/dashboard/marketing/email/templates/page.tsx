import type { Metadata } from "next";

import { EmailTemplatesWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Email Templates" };

/** Create and Edit both open the builder in place, so the header has no CTA. */
export default function EmailTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Email Templates"
        description="Reusable layouts built from blocks. Editing one opens the builder in place."
        breadcrumb={channelCrumbs("email", "Templates")}
      />

      <EmailTemplatesWorkspace />
    </>
  );
}
