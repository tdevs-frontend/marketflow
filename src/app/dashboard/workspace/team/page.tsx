import type { Metadata } from "next";

import { TeamWorkspace } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Team Members",
  description: "Invite and manage people who work in this workspace.",
};

export default function TeamMembersPage() {
  return <TeamWorkspace />;
}
