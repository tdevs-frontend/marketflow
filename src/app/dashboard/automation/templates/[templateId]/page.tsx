import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TemplatePreview } from "@/components/automation/templates/template-preview";
import { AUTOMATION_TEMPLATES, templateById } from "@/lib/workflow-fixtures";

export function generateStaticParams() {
  return AUTOMATION_TEMPLATES.map((template) => ({ templateId: template.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/automation/templates/[templateId]">): Promise<Metadata> {
  const { templateId } = await params;
  const template = templateById(templateId);

  return {
    title: template ? `${template.name} template` : "Template",
    description: template?.description,
  };
}

/**
 * A template in full, before anybody adopts it.
 *
 * A route rather than a drawer: the page is linkable ("use this one"), and it
 * carries the step-by-step explanation and the requirements block, which is
 * more than a drawer holds without scrolling twice.
 */
export default async function TemplatePreviewPage({
  params,
}: PageProps<"/dashboard/automation/templates/[templateId]">) {
  const { templateId } = await params;
  const template = templateById(templateId);

  if (!template) notFound();

  return <TemplatePreview template={template} />;
}
