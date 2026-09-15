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
 *
 * The active tab is read *here*, on the server, rather than with
 * `useSearchParams` in the workspace. Both survive a refresh and both make
 * `?tab=digital` shareable, but the hook would put the whole list behind a
 * Suspense boundary and ship a skeleton where the table used to be prerendered.
 * Reading it server-side keeps the page's content in its HTML — the same thing
 * the product detail route does with its own `?tab=`.
 *
 * It is handed over as a plain string and validated by the workspace, which
 * owns the list of views. Importing that list here would look tidier and would
 * not work: `products-workspace` is a client module, so a value imported from
 * it into a server component arrives as a client *reference* rather than the
 * array itself.
 */
export default async function ProductsPage({
  searchParams,
}: PageProps<"/dashboard/products">) {
  const { tab } = await searchParams;

  return (
    <>
      <ProductViewsNav />
      <ProductsWorkspace initialTab={typeof tab === "string" ? tab : undefined} />
    </>
  );
}
