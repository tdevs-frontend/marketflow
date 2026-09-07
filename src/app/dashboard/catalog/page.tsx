import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CatalogWorkspace } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Product Catalog" };

export default function CatalogPage() {
  return (
    <>
      <PageHeader
        title="Product Catalog"
        description="Create and manage the product catalog you share with customers."
        action={
          <Button size="compact">
            <Plus aria-hidden />
            Create Catalog
          </Button>
        }
      />

      <CatalogWorkspace />
    </>
  );
}
