import type { Metadata } from "next";

import { CampaignWizard } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { CHANNEL_THEME } from "@/constants/channels";
import type { MarketingChannel } from "@/types/marketing";

export const metadata: Metadata = { title: "Create campaign" };

/**
 * `?channel=email` opens the wizard on that channel.
 *
 * It is how a channel module's Create Campaign button stays honest: from
 * Email → Campaigns the wizard should already be an email campaign, rather than
 * starting on WhatsApp and asking someone to correct it. Validated against the
 * theme table so an unknown value falls back to the default rather than
 * reaching `applyChannel` as a string it has no branch for.
 */
export default async function CreateCampaignPage({
  searchParams,
}: PageProps<"/dashboard/marketing/campaigns/new">) {
  const { channel } = await searchParams;
  const requested =
    typeof channel === "string" && channel in CHANNEL_THEME
      ? (channel as MarketingChannel)
      : undefined;

  return (
    <>
      <PageHeader
        title="Create campaign"
        description="Seven steps: what it is, who gets it, what it says, who it comes from, and when it sends."
      />

      <CampaignWizard channel={requested} />
    </>
  );
}
