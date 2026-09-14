import type { Metadata } from "next";

import { SmsIntegration } from "@/components/integrations";

export const metadata: Metadata = {
  title: "SMS Integration",
  description:
    "Configure the gateway MarketFlow uses for transactional and marketing SMS.",
};

export default function SmsIntegrationPage() {
  return <SmsIntegration />;
}
