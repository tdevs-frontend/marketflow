import type { Metadata } from "next";

import { CatalogWorkspace } from "@/components/commerce";

export const metadata: Metadata = { title: "Product Catalog" };

/** The header lives inside the workspace — both its actions open dialogs. */
export default function CatalogPage() {
  return <CatalogWorkspace />;
}
