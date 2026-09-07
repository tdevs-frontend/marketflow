import type { Metadata } from "next";

import { ContactsWorkspace } from "@/components/marketing-hub";

export const metadata: Metadata = { title: "WhatsApp Contacts" };

/** The header lives in the workspace — its actions open dialogs. */
export default function WhatsAppContactsPage() {
  return <ContactsWorkspace />;
}
