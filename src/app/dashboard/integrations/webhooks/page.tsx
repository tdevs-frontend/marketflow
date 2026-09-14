import type { Metadata } from "next";

import { WebhooksWorkspace } from "@/components/integrations";

export const metadata: Metadata = {
  title: "Webhooks",
  description: "Send MarketFlow events to external applications in real time.",
};

export default function WebhooksPage() {
  return <WebhooksWorkspace />;
}
