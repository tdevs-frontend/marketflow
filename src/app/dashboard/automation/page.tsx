import type { Metadata } from "next";

import { WorkflowsWorkspace } from "@/components/automation";

export const metadata: Metadata = {
  title: "Automation Workflows",
  description:
    "Build, manage and monitor automated customer journeys across WhatsApp, Email, SMS and CRM.",
};

/**
 * The Automation module's landing page.
 *
 * The workspace renders its own `PageHeader`, because every header action
 * opens a dialog it owns — the same shape `ContactsWorkspace` and the
 * WhatsApp workspaces already use. Splitting them would put the button here
 * and its state one component away.
 */
export default function AutomationPage() {
  return <WorkflowsWorkspace />;
}
