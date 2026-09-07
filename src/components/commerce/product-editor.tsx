"use client";

import { useId, useState } from "react";
import { ImagePlus, Star, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/constants/commerce";
import { CATEGORIES } from "@/lib/commerce-fixtures";
import { cn, slugify } from "@/lib/utils";
import type { Product, ProductStatus, ProductType } from "@/types/commerce";

type TabKey =
  | "basic"
  | "pricing"
  | "inventory"
  | "media"
  | "seo"
  | "advanced";

const TABS: TabItem<TabKey>[] = [
  { value: "basic", label: "Basic Information" },
  { value: "pricing", label: "Pricing" },
  { value: "inventory", label: "Inventory" },
  { value: "media", label: "Media" },
  { value: "seo", label: "SEO" },
  { value: "advanced", label: "Advanced" },
];

interface Draft {
  name: string;
  description: string;
  categoryId: string;
  type: ProductType;
  price: string;
  salePrice: string;
  costPrice: string;
  taxRate: string;
  sku: string;
  stock: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  status: ProductStatus;
  featured: boolean;
  visibility: "visible" | "hidden";
  tags: string;
}

function draftFrom(product?: Product): Draft {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? CATEGORIES[0].id,
    type: product?.type ?? "physical",
    price: product ? String(product.price) : "",
    salePrice: product?.salePrice ? String(product.salePrice) : "",
    costPrice: product?.costPrice ? String(product.costPrice) : "",
    taxRate: product?.taxRate ? String(product.taxRate) : "",
    sku: product?.sku ?? "",
    stock: product ? String(product.stock) : "0",
    lowStockThreshold: product ? String(product.lowStockThreshold) : "10",
    trackInventory: product?.trackInventory ?? true,
    seoTitle: product?.seoTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
    slug: product?.slug ?? "",
    status: product?.status ?? "draft",
    featured: product?.featured ?? false,
    visibility: product?.visibility ?? "visible",
    tags: product?.tags.join(", ") ?? "",
  };
}

/** Boolean setting in a bordered row. */
function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-panel border border-border px-3.5 py-3">
      <CheckboxField
        id={id}
        label={label}
        hint={hint}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

const GRID = "grid gap-5 sm:grid-cols-2";

export function ProductEditor({ product }: { product?: Product }) {
  const idBase = useId();
  const [tab, setTab] = useState<TabKey>("basic");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(product));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  /**
   * Validates across every tab, not just the visible one — a required field
   * hidden behind an unopened tab must still block publishing, and the message
   * has to say which tab to go to.
   */
  function validateForPublish() {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Enter a product name.";
    if (!draft.price.trim()) next.price = "Enter a regular price.";
    if (Number(draft.price) < 0) next.price = "Price cannot be negative.";
    if (draft.salePrice && Number(draft.salePrice) > Number(draft.price)) {
      next.salePrice = "Sale price should be below the regular price.";
    }
    if (!draft.sku.trim()) next.sku = "Enter a SKU.";
    setErrors(next);

    if (next.name) setTab("basic");
    else if (next.price || next.salePrice) setTab("pricing");
    else if (next.sku) setTab("inventory");

    return Object.keys(next).length === 0;
  }

  return (
    <Card className="p-5">
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Product sections"
        idBase={idBase}
      />

      <div className="pt-6">
        {tab === "basic" ? (
          <TabPanel idBase={idBase} value="basic" className="space-y-5">
            <Field label="Product Name" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                value={draft.name}
                error={Boolean(errors.name)}
                placeholder="Premium Package"
                className="h-11"
                onChange={(event) => {
                  set("name", event.target.value);
                  /* Slug follows the name until it is edited by hand. */
                  if (!product) set("slug", slugify(event.target.value));
                }}
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                value={draft.description}
                placeholder="What the customer gets, in a sentence or two."
                onChange={(event) => set("description", event.target.value)}
              />
            </Field>

            <div className={GRID}>
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  label="Category"
                  hideLabel={false}
                  value={draft.categoryId}
                  onChange={(next) => set("categoryId", next)}
                  options={CATEGORIES.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                />
              </Field>

              <Field label="Product Type" htmlFor="type">
                <Select
                  id="type"
                  label="Product Type"
                  hideLabel={false}
                  value={draft.type}
                  onChange={(next) => set("type", next as ProductType)}
                  options={PRODUCT_TYPES}
                />
              </Field>
            </div>
          </TabPanel>
        ) : null}

        {tab === "pricing" ? (
          <TabPanel idBase={idBase} value="pricing" className="space-y-5">
            <div className={GRID}>
              <Field label="Regular Price" htmlFor="price" error={errors.price}>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={draft.price}
                  error={Boolean(errors.price)}
                  placeholder="149.00"
                  className="h-11"
                  onChange={(event) => set("price", event.target.value)}
                />
              </Field>

              <Field
                label="Sale Price"
                htmlFor="salePrice"
                error={errors.salePrice}
                hint="Leave empty to sell at the regular price."
              >
                <Input
                  id="salePrice"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={draft.salePrice}
                  error={Boolean(errors.salePrice)}
                  placeholder="129.00"
                  className="h-11"
                  onChange={(event) => set("salePrice", event.target.value)}
                />
              </Field>

              <Field
                label="Cost Price"
                htmlFor="costPrice"
                hint="Used for margin reporting. Never shown to customers."
              >
                <Input
                  id="costPrice"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={draft.costPrice}
                  placeholder="48.00"
                  className="h-11"
                  onChange={(event) => set("costPrice", event.target.value)}
                />
              </Field>

              <Field label="Tax Rate (%)" htmlFor="taxRate">
                <Input
                  id="taxRate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={draft.taxRate}
                  placeholder="5"
                  className="h-11"
                  onChange={(event) => set("taxRate", event.target.value)}
                />
              </Field>
            </div>

            {/* Margin is the one number a merchant checks on this tab. */}
            {draft.price && draft.costPrice ? (
              <p className="rounded-panel bg-primary-soft px-3.5 py-3 text-sm text-primary-dark">
                Margin at{" "}
                {draft.salePrice ? "sale price" : "regular price"}:{" "}
                <strong className="font-bold">
                  {(
                    ((Number(draft.salePrice || draft.price) -
                      Number(draft.costPrice)) /
                      Number(draft.salePrice || draft.price)) *
                    100
                  ).toFixed(1)}
                  %
                </strong>
              </p>
            ) : null}
          </TabPanel>
        ) : null}

        {tab === "inventory" ? (
          <TabPanel idBase={idBase} value="inventory" className="space-y-5">
            <div className={GRID}>
              <Field label="SKU" htmlFor="sku" error={errors.sku}>
                <Input
                  id="sku"
                  value={draft.sku}
                  error={Boolean(errors.sku)}
                  placeholder="MF-PREM-01"
                  className="h-11 font-mono"
                  onChange={(event) => set("sku", event.target.value.toUpperCase())}
                />
              </Field>

              <Field label="Stock Quantity" htmlFor="stock">
                <Input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.stock}
                  disabled={!draft.trackInventory}
                  className="h-11"
                  onChange={(event) => set("stock", event.target.value)}
                />
              </Field>

              <Field
                label="Low Stock Threshold"
                htmlFor="lowStockThreshold"
                hint="Below this, the product shows as Low Stock."
              >
                <Input
                  id="lowStockThreshold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.lowStockThreshold}
                  disabled={!draft.trackInventory}
                  className="h-11"
                  onChange={(event) => set("lowStockThreshold", event.target.value)}
                />
              </Field>
            </div>

            <Toggle
              id="trackInventory"
              label="Track inventory"
              hint="Turn off for services and unlimited digital goods."
              checked={draft.trackInventory}
              onChange={(value) => set("trackInventory", value)}
            />
          </TabPanel>
        ) : null}

        {tab === "media" ? (
          <TabPanel idBase={idBase} value="media" className="space-y-4">
            <div className="rounded-panel border border-dashed border-border-strong bg-surface-secondary px-6 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-surface text-primary">
                <ImagePlus className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium text-text-primary">
                Drop images here, or browse
              </p>
              <p className="mt-1 text-xs text-text-muted">
                PNG or JPG, up to 5 MB each. The first image becomes the thumbnail.
              </p>
              <Button variant="outline" size="compact" className="mt-4">
                <Upload aria-hidden />
                Choose files
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((slot) => (
                <div
                  key={slot}
                  className={cn(
                    "relative grid aspect-square place-items-center rounded-panel border text-text-muted",
                    slot === 0
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-dashed border-border bg-surface-secondary",
                  )}
                >
                  <ImagePlus className="size-4" aria-hidden />
                  {slot === 0 ? (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                      <Star className="size-2.5" aria-hidden />
                      Thumb
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </TabPanel>
        ) : null}

        {tab === "seo" ? (
          <TabPanel idBase={idBase} value="seo" className="space-y-5">
            <Field
              label="SEO Title"
              htmlFor="seoTitle"
              hint="Around 60 characters reads well in search results."
            >
              <Input
                id="seoTitle"
                value={draft.seoTitle}
                placeholder="Premium Package — MarketFlow"
                className="h-11"
                onChange={(event) => set("seoTitle", event.target.value)}
              />
            </Field>

            <Field label="Meta Description" htmlFor="metaDescription">
              <Textarea
                id="metaDescription"
                value={draft.metaDescription}
                placeholder="One or two sentences a customer would click."
                onChange={(event) => set("metaDescription", event.target.value)}
              />
            </Field>

            <Field label="URL Slug" htmlFor="slug">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-text-muted">/products/</span>
                <Input
                  id="slug"
                  value={draft.slug}
                  placeholder="premium-package"
                  className="h-11 font-mono"
                  onChange={(event) => set("slug", slugify(event.target.value))}
                />
              </div>
            </Field>
          </TabPanel>
        ) : null}

        {tab === "advanced" ? (
          <TabPanel idBase={idBase} value="advanced" className="space-y-5">
            <div className={GRID}>
              <Field label="Status" htmlFor="status">
                <Select
                  id="status"
                  label="Status"
                  hideLabel={false}
                  value={draft.status}
                  onChange={(next) => set("status", next as ProductStatus)}
                  options={PRODUCT_STATUSES}
                />
              </Field>

              <Field label="Visibility" htmlFor="visibility">
                <Select
                  id="visibility"
                  label="Visibility"
                  hideLabel={false}
                  value={draft.visibility}
                  onChange={(next) => set("visibility", next as Draft["visibility"])}
                  options={[
                    { value: "visible", label: "Visible in catalog" },
                    { value: "hidden", label: "Hidden — direct link only" },
                  ]}
                />
              </Field>
            </div>

            <Field
              label="Tags"
              htmlFor="tags"
              hint="Comma separated. Used for segments and catalog filters."
            >
              <Input
                id="tags"
                value={draft.tags}
                placeholder="bestseller, whatsapp"
                className="h-11"
                onChange={(event) => set("tags", event.target.value)}
              />
            </Field>

            <Toggle
              id="featured"
              label="Featured product"
              hint="Featured products lead the shared catalog."
              checked={draft.featured}
              onChange={(value) => set("featured", value)}
            />
          </TabPanel>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
        {Object.keys(errors).length > 0 ? (
          <p role="alert" className="mr-auto text-sm text-error">
            Check the highlighted fields before publishing.
          </p>
        ) : null}

        <Button variant="outline" size="compact">
          Save Draft
        </Button>
        <Button size="compact" onClick={validateForPublish}>
          {product ? "Save Product" : "Publish Product"}
        </Button>
      </div>
    </Card>
  );
}
