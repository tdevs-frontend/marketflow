import type { Metadata } from "next";

import { EmailIntegration } from "@/components/integrations";

export const metadata: Metadata = {
  title: "Email Integration",
  description:
    "Configure the provider MarketFlow uses for campaigns and automated email.",
};

export default function EmailIntegrationPage() {
  return <EmailIntegration />;
}
