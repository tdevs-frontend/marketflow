import type { Metadata } from "next";

import { FormsWorkspace } from "@/components/forms";

export const metadata: Metadata = {
  title: "Forms",
  description: "Create embeddable forms to capture leads and trigger automated workflows.",
};

/**
 * The Forms list. The header lives in the workspace because Import and the
 * row actions open dialogs it owns - the same shape as Customers.
 */
export default function FormsPage() {
  return <FormsWorkspace />;
}
