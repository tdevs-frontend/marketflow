import type { Metadata } from "next";

import { WhatsAppIntegration } from "@/components/integrations";

export const metadata: Metadata = {
  title: "WhatsApp Integration",
  description: "Connect and monitor your WhatsApp messaging provider.",
};

export default function WhatsAppIntegrationPage() {
  return <WhatsAppIntegration />;
}
