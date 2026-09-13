import type { Metadata } from "next";

import { TemplatesWorkspace } from "@/components/automation/templates/templates-workspace";

export const metadata: Metadata = {
  title: "Automation Templates",
  description:
    "Launch proven customer journeys without building every workflow from scratch.",
};

export default function AutomationTemplatesPage() {
  return <TemplatesWorkspace />;
}
