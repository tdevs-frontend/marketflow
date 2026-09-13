import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Landing Pages" };

/**
 * Same as Forms: the sidebar link existed under Growth, the route did not.
 */
export default function LandingPagesPage() {
  return (
    <ModulePlaceholder
      title="Landing Pages"
      description="Build campaign pages that feed the same contacts, segments and workflows."
      summary="Landing Pages will let you publish a page per campaign and attribute the contacts it brings in. Campaigns already track their own links and conversions in the meantime."
      action={
        <ButtonLink
          href={APP_ROUTES.marketingCampaigns}
          size="sm"
          variant="outline"
        >
          Go to Campaigns
        </ButtonLink>
      }
    />
  );
}
