import type { Metadata } from "next";

import { EmailContactsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Email Contacts" };

/** Import, Export and Add all live in the toolbar, beside the filters. */
export default function EmailContactsPage() {
  return (
    <>
      <PageHeader
        title="Email Contacts"
        description="Your subscriber list, and how much of it is still reading."
        breadcrumb={channelCrumbs("email", "Contacts")}
      />

      <EmailContactsWorkspace />
    </>
  );
}
