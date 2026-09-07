import type { Metadata } from "next";

import { InventoryWorkspace } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and prevent products from going out of stock."
      />

      <InventoryWorkspace />
    </>
  );
}
