import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { NewTicketForm } from "@/components/support";
import { ButtonLink } from "@/components/ui/button";
import { SUPPORT_ROUTES } from "@/constants/support";

export const metadata: Metadata = { title: "Create Ticket" };

export default function NewTicketPage() {
  return (
    <>
      <ButtonLink href={SUPPORT_ROUTES.center} variant="subtle" size="inline" className="w-fit text-[15px]">
        <ChevronLeft aria-hidden />
        Back to Support Center
      </ButtonLink>
      <PageHeader
        title="Create Ticket"
        description="Tell us what is going wrong. The support team replies on the ticket."
      />
      <NewTicketForm />
    </>
  );
}
