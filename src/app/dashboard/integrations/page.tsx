import type { Metadata } from "next";

import { IntegrationsHub } from "@/components/integrations";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect the tools and channels that power your MarketFlow workspace.",
};

/** The hub. Header, KPIs and filters all live in the workspace component. */
export default function IntegrationsPage() {
  return <IntegrationsHub />;
}
