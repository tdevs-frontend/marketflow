import type { Metadata } from "next";

import { SocialAccounts } from "@/components/marketing-hub";
import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";

export const metadata: Metadata = { title: "Social Accounts" };

/** Connect Account is on the add tile, next to the accounts it would join. */
export default function SocialAccountsPage() {
  return (
    <>
      <PageHeader
        title="Connected Accounts"
        description="Which profiles MarketFlow can publish to, and which need reconnecting."
        breadcrumb={channelCrumbs("social", "Accounts")}
      />

      <SocialAccounts />
    </>
  );
}
