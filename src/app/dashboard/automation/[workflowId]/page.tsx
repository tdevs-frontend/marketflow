import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkflowDetail } from "@/components/automation/detail/workflow-detail";
import { WORKFLOWS, workflowById } from "@/lib/workflow-fixtures";

/** Prerenders a page per workflow; swap for the API once it is live. */
export function generateStaticParams() {
  return WORKFLOWS.map((workflow) => ({ workflowId: workflow.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/automation/[workflowId]">): Promise<Metadata> {
  const { workflowId } = await params;
  const workflow = workflowById(workflowId);

  return {
    title: workflow ? workflow.name : "Workflow",
    description: workflow?.description,
  };
}

/**
 * One workflow, with its Builder, Analytics, Activity and Settings tabs.
 *
 * The detail component renders its own header rather than a `PageHeader`: this
 * screen's top bar carries a save state and three actions that all read the
 * builder's draft, and splitting them would put the buttons here and the state
 * they act on one component away.
 */
export default async function WorkflowDetailPage({
  params,
}: PageProps<"/dashboard/automation/[workflowId]">) {
  const { workflowId } = await params;
  const workflow = workflowById(workflowId);

  if (!workflow) notFound();

  return <WorkflowDetail workflow={workflow} />;
}
