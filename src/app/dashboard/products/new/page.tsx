import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProductEditor } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";
import { APP_ROUTES } from "@/constants";
import { PRODUCT_TYPE_CHOICES } from "@/constants/commerce";
import type { ProductType } from "@/types/commerce";

export const metadata: Metadata = { title: "Add product" };

const TYPES = PRODUCT_TYPE_CHOICES.map((choice) => choice.value);

/**
 * The product form, opened with the type already chosen.
 *
 * `?type=` is optional. Add Product now links straight here and the merchant
 * picks the type on the form's first tab, so nothing produces the parameter —
 * but it is still honoured, because "/products/new?type=service" is a link
 * worth being able to bookmark or hand to someone.
 *
 * Validated rather than trusted either way: a hand-edited URL should land on
 * the default form, not on a form in an impossible state.
 */
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType = (TYPES as string[]).includes(type ?? "")
    ? (type as ProductType)
    : undefined;

  const label =
    PRODUCT_TYPE_CHOICES.find((choice) => choice.value === initialType)?.label ??
    "product";

  return (
    <>
      <Link
        href={APP_ROUTES.products}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-[15px] font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to products
      </Link>

      <PageHeader
        title={initialType ? `Add ${label.toLowerCase()}` : "Add product"}
        description="Everything a customer needs to buy it, and everything you need to track it."
      />

      <ProductEditor initialType={initialType} />
    </>
  );
}
