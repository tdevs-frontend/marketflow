import type { Metadata } from "next";

import { SupportCenter } from "@/components/support";

export const metadata: Metadata = {
  title: "Support Center",
  description: "Get help from the MarketFlow support team and track your support requests.",
};

export default function SupportCenterPage() {
  return <SupportCenter />;
}
