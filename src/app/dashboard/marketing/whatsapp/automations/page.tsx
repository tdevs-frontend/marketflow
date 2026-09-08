import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { AutomationsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "WhatsApp Automations" };

export default function WhatsAppAutomationsPage() {
  return (
    <>
      <PageHeader
        title="WhatsApp Automations"
        description="Follow-ups that run on their own, so a lead never waits on someone remembering to reply."
        breadcrumb={channelCrumbs("whatsapp", "Automations")}
        action={
          <Button size="compact">
            <Plus aria-hidden />
            Create Automation
          </Button>
        }
      />

      <AutomationsWorkspace channel="whatsapp" />
    </>
  );
}
