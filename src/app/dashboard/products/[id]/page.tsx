import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import { ProductDetail } from "@/components/commerce";
import { ProductStatusBadge } from "@/components/commerce/commerce-badges";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { APP_ROUTES } from "@/constants";
import { PRODUCT_TYPE_LABEL } from "@/constants/commerce";
import { COMMERCE_PRODUCTS, commerceProductById } from "@/lib/commerce-fixtures";
import { formatPriceRange, priceRangeOf, variantCount } from "@/lib/variants";

/** Prerenders a detail page per product; swap for the API once it is live. */
export function generateStaticParams() {
  return COMMERCE_PRODUCTS.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = commerceProductById(id);
  return {
    title: product?.name ?? "Product",
    description: product?.description,
  };
}

/**
 * A product, read.
 *
 * `?tab=variants` is what the product list's variant badge links to, so a
 * merchant clicking "12 variants" lands on the grid rather than on an overview
 * they then have to navigate out of. Validated rather than trusted - a
 * hand-edited tab name falls back to the overview.
 */
const TABS = [
  "overview",
  "variants",
  "sales",
  "customers",
  "activity",
  "type",
] as const;

export default async function ProductDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/products/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const product = commerceProductById(id);

  if (!product) notFound();

  const initialTab = (TABS as readonly string[]).includes(String(tab))
    ? (tab as (typeof TABS)[number])
    : "overview";

  const count = variantCount(product);

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
        /* The summary line says what the product *is* and what it costs - and
           for a product with variants, cost is a range, not a number. */
        description={[
          product.sku,
          PRODUCT_TYPE_LABEL[product.type],
          formatPriceRange(priceRangeOf(product)),
          product.hasVariants && count > 0
            ? `${count} ${count === 1 ? "variant" : "variants"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        secondaryActions={<ProductStatusBadge status={product.status} />}
        action={
          <ButtonLink
            href={`${APP_ROUTES.products}/${product.id}/edit`}
            size="compact"
          >
            <Pencil aria-hidden />
            Edit Product
          </ButtonLink>
        }
      />

      <ProductDetail product={product} initialTab={initialTab} />
    </>
  );
}
