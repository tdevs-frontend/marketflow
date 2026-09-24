import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { ProductEditor } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { PRODUCT_TYPE_CHOICES } from "@/constants/commerce";
import type { ProductType } from "@/types/commerce";

export const metadata: Metadata = { title: "Add product" };

const TYPES = PRODUCT_TYPE_CHOICES.map((choice) => choice.value);

/**
 * The product form, opened with the type already chosen.
 *
 * `?type=` is optional. Add Product now links straight here and the merchant
 * picks the type on the form's first tab, so nothing produces the parameter -
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
        title={initialType ? `Add ${label.toLowerCase()}` : "Add product"}
        description="Everything a customer needs to buy it, and everything you need to track it."
      />

      <ProductEditor initialType={initialType} />
    </>
  );
}
