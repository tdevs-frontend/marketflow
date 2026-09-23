import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RunDetail } from "@/components/automation/activity/run-detail";
import { WORKFLOW_RUNS, runById } from "@/lib/workflow-fixtures";

export function generateStaticParams() {
  return WORKFLOW_RUNS.map((run) => ({ runId: run.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/automation/activity/[runId]">): Promise<Metadata> {
  const { runId } = await params;
  const run = runById(runId);

  return {
    title: run ? `Run ${run.id}` : "Run",
    description: run ? `${run.contactName} in ${run.workflowName}` : undefined,
  };
}

/**
 * One execution, at its own address.
 *
 * Failures get linked to - from an alert, a support ticket, a message to a
 * colleague - and a drawer has no URL to paste. Readers already inside the
 * product get the drawer instead, which keeps their place in the log.
 */
export default async function RunDetailPage({
  params,
}: PageProps<"/dashboard/automation/activity/[runId]">) {
  const { runId } = await params;
  const run = runById(runId);

  if (!run) notFound();

  return <RunDetail run={run} />;
}
