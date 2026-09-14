import type { Metadata } from "next";

import { RolesWorkspace } from "@/components/workspace";

export const metadata: Metadata = {
  title: "Roles & Permissions",
  description:
    "Control what workspace members can view, create, edit and manage.",
};

export default function RolesPage() {
  return <RolesWorkspace />;
}
