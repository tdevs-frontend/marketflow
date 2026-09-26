import type { Metadata } from "next";

import { AgentTicket } from "@/components/support";

export async function generateMetadata({
  params,
}: PageProps<"/admin/support/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Ticket #${ticketId}` };
}

export default async function DeskTicketPage({
  params,
}: PageProps<"/admin/support/[ticketId]">) {
  const { ticketId } = await params;
  return <AgentTicket ticketNumber={ticketId} />;
}
