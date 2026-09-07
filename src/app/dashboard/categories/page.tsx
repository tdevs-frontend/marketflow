import type { Metadata } from "next";

import { CategoriesWorkspace } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize your products into easy-to-manage categories."
      />

      <CategoriesWorkspace />
    </>
  );
}
