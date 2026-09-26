import type { Metadata } from "next";

import { SupportDesk } from "@/components/support";

export const metadata: Metadata = { title: "Support Desk" };

export default function SupportDeskPage() {
  return <SupportDesk />;
}
