import type { Metadata } from "next";

import { CatalogWorkspace, ProductViewsNav } from "@/components/commerce";

export const metadata: Metadata = {
  title: "Product Catalog",
  description: "A shareable view of what you sell.",
};

/**
 * The catalogue view of the product database.
 *
 * Reached from the strip inside Products rather than its own sidebar row - it
 * is the same dataset presented for sharing, not a second product store. The
 * header lives inside the workspace because both its actions open dialogs.
 */
export default function CatalogPage() {
  return (
    <>
      <ProductViewsNav />
      <CatalogWorkspace />
    </>
  );
}
