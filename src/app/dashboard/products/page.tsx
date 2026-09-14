import type { Metadata } from "next";

import { ProductsWorkspace, ProductViewsNav } from "@/components/commerce";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Manage physical products, digital products and services from one place.",
};

/**
 * The product workspace, and the strip that reaches its other two views.
 *
 * The header lives in the workspace because Add Product opens a dialog it owns
 * — the same shape `contacts-workspace` and the WhatsApp workspaces already
 * use. Splitting them would put the button here and its state one file away.
 */
export default function ProductsPage() {
  return (
    <>
      <ProductViewsNav />
      <ProductsWorkspace />
    </>
  );
}
