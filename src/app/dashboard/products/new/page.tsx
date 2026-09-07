import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProductEditor } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <>
      <Link
        href={APP_ROUTES.products}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to products
      </Link>

      <PageHeader
        title="Add product"
        description="Everything a customer needs to buy it, and everything you need to track it."
      />

      <ProductEditor />
    </>
  );
}
