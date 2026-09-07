import type { Metadata } from "next";
import { Plus, Upload } from "lucide-react";

import { ProductsWorkspace } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your products, pricing, inventory and product information."
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="compact">
              <Upload aria-hidden />
              Import Products
            </Button>
            <ButtonLink href={`${APP_ROUTES.products}/new`} size="compact">
              <Plus aria-hidden />
              Add Product
            </ButtonLink>
          </div>
        }
      />

      <ProductsWorkspace />
    </>
  );
}
