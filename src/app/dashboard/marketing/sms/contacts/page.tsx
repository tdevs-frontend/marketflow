import type { Metadata } from "next";

import { SmsContactsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "SMS Contacts" };

export default function SmsContactsPage() {
  return (
    <>
      <PageHeader
        title="SMS Contacts"
        description="Numbers, opt-in state and destination country — which is a cost question as much as a demographic one."
      />

      <SmsContactsWorkspace />
    </>
  );
}
