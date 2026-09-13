import type { Metadata } from "next";

import { CreateWorkflowWizard } from "@/components/automation/create/create-workflow-wizard";

export const metadata: Metadata = {
  title: "Create Automation",
  description: "Choose how customers should enter this workflow.",
};

/**
 * The creation flow, as a route rather than a dialog.
 *
 * It is two steps with a rule builder in the middle, which is more than a
 * modal should hold — and it matches `/dashboard/products/new` and
 * `/dashboard/marketing/campaigns/new`, the two other places in this dashboard
 * where something substantial gets made. A static segment, so it takes
 * precedence over the sibling `[workflowId]` route.
 */
export default function CreateAutomationPage() {
  return <CreateWorkflowWizard />;
}
