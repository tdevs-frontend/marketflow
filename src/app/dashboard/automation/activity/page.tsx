import type { Metadata } from "next";

import { ActivityWorkspace } from "@/components/automation/activity/activity-workspace";

export const metadata: Metadata = {
  title: "Automation Activity",
  description:
    "Monitor workflow executions, scheduled actions, failures and customer journeys.",
};

export default function AutomationActivityPage() {
  return <ActivityWorkspace />;
}
