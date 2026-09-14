import type { Metadata } from "next";

import { SocialWorkspace } from "@/components/integrations";

export const metadata: Metadata = {
  title: "Social Media Integration",
  description:
    "Connect and manage the social accounts MarketFlow uses for publishing, scheduling and analytics.",
};

export default function SocialIntegrationPage() {
  return <SocialWorkspace />;
}
