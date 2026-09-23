import type { Metadata } from "next";
import { Plus, ScrollText } from "lucide-react";

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
        /*
         * The run log is a built page this module never linked to.
         *
         * `/dashboard/automation/activity` lists every execution with a
         * per-run drill-down, and until now the only way in was the global
         * Automation sidebar entry - so "what actually happened when this flow
         * ran" was two modules away from the flows themselves.
         *
         * It links to the log rather than to a per-flow view because the
         * workflow detail route is keyed on `workflow-fixtures`, which these
         * marketing flow ids are not in; a deep link would 404.
         */
        secondaryActions={
          <ButtonLink
            href={AUTOMATION_ROUTES.activity}
            variant="outline"
            size="compact"
          >
            <ScrollText aria-hidden />
            Run history
          </ButtonLink>
        }
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
