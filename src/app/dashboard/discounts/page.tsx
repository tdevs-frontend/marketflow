import type { Metadata } from "next";

import { DiscountsWorkspace } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Discounts & Coupons" };

export default function DiscountsPage() {
  return (
    <>
      <PageHeader
        title="Discounts & Coupons"
        description="Create offers that help you convert more customers."
      />

      <DiscountsWorkspace />
    </>
  );
}
