import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { AutomationsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "SMS Automations" };

export default function SmsAutomationsPage() {
  return (
    <>
      <PageHeader
        title="SMS Automations"
        description="Reminders and alerts that fire on a trigger rather than a schedule."
        breadcrumb={channelCrumbs("sms", "Automations")}
        action={
          <Button size="compact">
            <Plus aria-hidden />
            Create Automation
          </Button>
        }
      />

      <AutomationsWorkspace channel="sms" />
    </>
  );
}
