import type { Metadata } from "next";

import { WhatsAppInbox } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "WhatsApp Inbox" };

export default async function WhatsAppInboxPage({
  searchParams,
}: PageProps<"/dashboard/marketing/whatsapp/inbox">) {
  const { conversation } = await searchParams;

  return (
    <>
      <PageHeader
        title="WhatsApp Inbox"
        description="Every conversation, with the contact record beside it."
        breadcrumb={channelCrumbs("whatsapp", "Inbox")}
      />

      <WhatsAppInbox
        initialConversationId={
          typeof conversation === "string" ? conversation : undefined
        }
      />
    </>
  );
}
