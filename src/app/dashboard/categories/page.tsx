import type { Metadata } from "next";

import { CategoriesWorkspace, ProductViewsNav } from "@/components/commerce";

export const metadata: Metadata = { title: "Categories" };

/**
 * Categories, as a view of Products rather than a sidebar entry of its own.
 *
 * Categories group every kind of product - Apparel sits beside Consulting and
 * Digital Resources - so the page is unchanged by the type work; only how it is
 * reached has.
 *
 * The header is the workspace's, not this route's: its one action opens a
 * dialog the workspace owns. Same split as the Products page.
 */
export default function CategoriesPage() {
  return (
    <>
      <ProductViewsNav />
      <CategoriesWorkspace />
    </>
  );
}
