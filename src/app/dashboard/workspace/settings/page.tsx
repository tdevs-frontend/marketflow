import type { Metadata } from "next";

import { WorkspaceSettingsForm } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Workspace Settings",
  description: "Configure business defaults and workspace-wide preferences.",
};

export default function WorkspaceSettingsPage() {
  return <WorkspaceSettingsForm />;
}
