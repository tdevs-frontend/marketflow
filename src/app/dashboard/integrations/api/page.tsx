import type { Metadata } from "next";

import { ApiWorkspace } from "@/components/integrations";

export const metadata: Metadata = {
  title: "API Access",
  description: "Connect your applications securely to MarketFlow.",
};

export default function ApiAccessPage() {
  return <ApiWorkspace />;
}
