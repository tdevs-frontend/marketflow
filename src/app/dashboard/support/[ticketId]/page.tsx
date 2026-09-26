import type { Metadata } from "next";

import { MerchantTicket } from "@/components/support";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/support/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Ticket #${ticketId}` };
}

/**
 * A ticket, from the merchant's side. Resolved on the client through the
 * support service's workspace-scoped read - the title deliberately uses only
 * the number from the URL, so it cannot reveal another workspace's subject.
 */
export default async function MerchantTicketPage({
  params,
}: PageProps<"/dashboard/support/[ticketId]">) {
  const { ticketId } = await params;
  return <MerchantTicket ticketNumber={ticketId} />;
}
