import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TriggerDetail } from "@/components/automation/triggers/trigger-detail";
import { AUTOMATION_TRIGGERS, triggerById } from "@/lib/workflow-fixtures";

export function generateStaticParams() {
  return AUTOMATION_TRIGGERS.map((trigger) => ({ triggerId: trigger.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/automation/triggers/[triggerId]">): Promise<Metadata> {
  const { triggerId } = await params;
  const trigger = triggerById(triggerId);

  return {
    title: trigger ? trigger.name : "Trigger",
    description: trigger?.description,
  };
}

export default async function TriggerDetailPage({
  params,
}: PageProps<"/dashboard/automation/triggers/[triggerId]">) {
  const { triggerId } = await params;
  const trigger = triggerById(triggerId);

  if (!trigger) notFound();

  return <TriggerDetail trigger={trigger} />;
}
