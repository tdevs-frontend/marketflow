import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { AutomationsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { AUTOMATION_ROUTES } from "@/constants/automation";

export const metadata: Metadata = { title: "WhatsApp Automations" };

export default function WhatsAppAutomationsPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Automations"
        description="Follow-ups that run on their own, so a lead never waits on someone remembering to reply."
        /* A `<button>` with no handler until now: the page's primary call to
           action closed nothing, opened nothing and toasted nothing. The
           builder it should have reached has existed all along at
           `AUTOMATION_ROUTES.create`. */
        action={
          <ButtonLink href={AUTOMATION_ROUTES.create} size="compact">
            <Plus aria-hidden />
            Create Automation
          </ButtonLink>
        }
      />

      <AutomationsWorkspace channel="whatsapp" />
    </>
  );
}
