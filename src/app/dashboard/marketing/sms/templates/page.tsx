import type { Metadata } from "next";

import { SmsTemplatesWorkspace } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "SMS Templates" };

export default function SmsTemplatesPage() {
  return (
    <>
      <PageHeader
        title="SMS Templates"
        description="Reusable messages with their segment count on the card — a two-part template doubles the cost of every campaign using it."
        breadcrumb={channelCrumbs("sms", "Templates")}
      />

      <SmsTemplatesWorkspace />
    </>
  );
}
