import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ProductEditor } from "@/components/commerce";
import { ProductStatusBadge } from "@/components/commerce/commerce-badges";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { COMMERCE_PRODUCTS, commerceProductById } from "@/lib/commerce-fixtures";

/** Prerenders an edit page per product; swap for the API once it is live. */
export function generateStaticParams() {
  return COMMERCE_PRODUCTS.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/products/[id]/edit">): Promise<Metadata> {
  const { id } = await params;
  const product = commerceProductById(id);
  return { title: product ? `Edit ${product.name}` : "Edit product" };
}

export default async function EditProductPage({
  params,
}: PageProps<"/dashboard/products/[id]/edit">) {
  const { id } = await params;
  const product = commerceProductById(id);

  if (!product) notFound();

  return (
    <>
      <ButtonLink
        href={APP_ROUTES.products}
        variant="subtle"
        size="inline"
        className="w-fit text-[15px]"
      >
        <ChevronLeft aria-hidden />
        Back to products
      </ButtonLink>

      <PageHeader
        title={product.name}
        description={`${product.sku} · ${product.categoryName}`}
        action={<ProductStatusBadge status={product.status} />}
      />

      <ProductEditor product={product} />
    </>
  );
}
