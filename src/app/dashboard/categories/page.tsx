import type { Metadata } from "next";

import { CategoriesWorkspace, ProductViewsNav } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Categories" };

/**
 * Categories, as a view of Products rather than a sidebar entry of its own.
 *
 * Categories group every kind of product — Apparel sits beside Consulting and
 * Digital Resources — so the page is unchanged by the type work; only how it is
 * reached has.
 */
export default function CategoriesPage() {
  return (
    <>
      <ProductViewsNav />

      <PageHeader
        title="Categories"
        description="Organize physical products, digital products and services into categories."
      />

      <CategoriesWorkspace />
    </>
  );
}
