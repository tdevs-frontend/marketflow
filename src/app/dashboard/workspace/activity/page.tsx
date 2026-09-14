import type { Metadata } from "next";

import { ActivityWorkspace } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Workspace Activity",
  description: "Track important actions made by your team across the workspace.",
};

export default function WorkspaceActivityPage() {
  return <ActivityWorkspace />;
}
