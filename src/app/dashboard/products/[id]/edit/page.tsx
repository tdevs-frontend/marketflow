import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ProductEditor } from "@/components/commerce";
import { ProductStatusBadge } from "@/components/commerce/commerce-badges";
import { PageHeader } from "@/components/layout/page-header";
import { APP_ROUTES } from "@/constants";
import { PRODUCTS, productById } from "@/lib/commerce-fixtures";

/** Prerenders an edit page per product; swap for the API once it is live. */
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/products/[id]/edit">): Promise<Metadata> {
  const { id } = await params;
  const product = productById(id);
  return { title: product ? `Edit ${product.name}` : "Edit product" };
}

export default async function EditProductPage({
  params,
}: PageProps<"/dashboard/products/[id]/edit">) {
  const { id } = await params;
  const product = productById(id);

  if (!product) notFound();

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
        title={product.name}
        description={`${product.sku} · ${product.categoryName}`}
        action={<ProductStatusBadge status={product.status} />}
      />

      <ProductEditor product={product} />
    </>
  );
}
