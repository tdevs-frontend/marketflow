import type { Metadata } from "next";

import { ContactsWorkspace } from "@/components/customers";

export const metadata: Metadata = { title: "Contacts" };

/**
 * The master customer database, and the page every other Customers route
 * refers back to.
 *
 * The workspace renders its own `PageHeader`, because both header actions open
 * dialogs it owns — the same shape `catalog-workspace` and the WhatsApp
 * workspaces already use. Splitting them would put the button here and its
 * state one component away.
 */
export default function ContactsPage() {
  return <ContactsWorkspace />;
}
