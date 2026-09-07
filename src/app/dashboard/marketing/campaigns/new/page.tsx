import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { CampaignWizard } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Create campaign" };

export default function CreateCampaignPage() {
  return (
    <>
      <Link
        href={APP_ROUTES.marketingCampaigns}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to campaigns
      </Link>

      <PageHeader
        title="Create campaign"
        description="Five steps: what it is, who gets it, what it says, when it sends."
      />

      <CampaignWizard />
    </>
  );
}
