import type { Metadata } from "next";

import { WhatsAppInbox } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "WhatsApp Inbox" };

export default function WhatsAppInboxPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Inbox"
        description="Every conversation, with the contact record beside it."
      />

      <WhatsAppInbox />
    </>
  );
}
