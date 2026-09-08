import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { AutomationsWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Email Automations" };

export default function EmailAutomationsPage() {
  return (
    <>
      <PageHeader
        title="Email Automations"
        description="Onboarding series, win-backs and follow-ups that send themselves."
        breadcrumb={channelCrumbs("email", "Automations")}
        action={
          <Button size="compact">
            <Plus aria-hidden />
            Create Automation
          </Button>
        }
      />

      <AutomationsWorkspace channel="email" />
    </>
  );
}
