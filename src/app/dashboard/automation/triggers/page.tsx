import type { Metadata } from "next";

import { TriggersWorkspace } from "@/components/automation/triggers/triggers-workspace";

export const metadata: Metadata = {
  title: "Automation Triggers",
  description:
    "Manage the customer and business events that can start automated workflows.",
};

export default function AutomationTriggersPage() {
  return <TriggersWorkspace />;
}
