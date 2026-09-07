import type { Metadata } from "next";

import { TemplatesWorkspace } from "@/components/marketing-hub";

export const metadata: Metadata = { title: "WhatsApp Templates" };

/** The header lives in the workspace — Create Template opens a dialog. */
export default function WhatsAppTemplatesPage() {
  return <TemplatesWorkspace />;
}
