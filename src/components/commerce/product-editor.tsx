"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Layers,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/constants/commerce";
import { CATEGORIES, COMMERCE_PRODUCTS } from "@/lib/commerce-fixtures";
import { collectSkus, duplicateSkuIds, rollUpStock } from "@/lib/variants";
import { cn, slugify } from "@/lib/utils";
import type {
  Product,
  ProductStatus,
  ProductType,
  ProductVariant,
  VariantOption,
} from "@/types/commerce";
import { useToast } from "@/components/ui/toast";
import { APP_ROUTES } from "@/constants";
import { VariantManager } from "./variants";

type TabKey =
  | "basic"
  | "pricing"
  | "variants"
  | "inventory"
  | "media"
  | "seo"
  | "advanced";

/*
 * Variants sits directly after Pricing, because pricing is what it changes.
 *
 * Once it is on, the product no longer has one price or one stock figure —
 * both become readings of the grid. Meeting it before Inventory is what makes
 * the disabled Stock field on the next tab read as a consequence of a choice
 * rather than as a broken form.
 */
const TABS: TabItem<TabKey>[] = [
  { value: "basic", label: "Basic Information" },
  { value: "pricing", label: "Pricing" },
  { value: "variants", label: "Variants" },
  { value: "inventory", label: "Inventory" },
  { value: "media", label: "Media" },
  { value: "seo", label: "SEO" },
  { value: "advanced", label: "Advanced" },
];

/**
 * The tabs, read as an ordered path.
 *
 * Creating a product is a sequence — you cannot price a thing you have not
 * named — so on the create form the same seven tabs drive Back/Next and the
 * final step is the only one that offers Publish. Editing keeps them as plain
 * tabs: someone fixing a typo in the description should not have to walk six
 * steps to save it.
 */
const STEP_ORDER = TABS.map((item) => item.value);

/** Which step owns each error, so a failed publish lands on the right tab. */
const ERROR_STEP: Record<string, TabKey> = {
  name: "basic",
  categoryId: "basic",
  type: "basic",
  price: "pricing",
  salePrice: "pricing",
  costPrice: "pricing",
  taxRate: "pricing",
  variants: "variants",
  sku: "inventory",
  stock: "inventory",
  lowStockThreshold: "inventory",
};

/**
 * Which control each error points at.
 *
 * Keyed separately from `ERROR_STEP` because the two do not always agree: the
 * category error is called `categoryId` in the draft and the field it belongs
 * to is `#category`. `variants` is absent on purpose — it is a table, not a
 * field, so there is nothing to focus and the tab itself is the answer.
 */
const ERROR_FIELD: Record<string, string> = {
  name: "name",
  categoryId: "category",
  type: "type",
  price: "price",
  salePrice: "salePrice",
  costPrice: "costPrice",
  taxRate: "taxRate",
  sku: "sku",
  stock: "stock",
  lowStockThreshold: "lowStockThreshold",
};

/**
 * Where the write goes once there is a backend.
 *
 * `commerceApi` already exposes `useCreateProductMutation` and
 * `useUpdateProductMutation`, but nothing in the product calls a mutation yet —
 * every page reads fixtures — so wiring one here would make Publish fail
 * against an API that is not running. This stands in for it and is the only
 * line that changes when it is: the surrounding code already awaits, guards
 * against a double submit and shows a pending label.
 */
function persist(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 450));
}

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
  /*
   * Variants live in the draft like everything else on this form.
   *
   * They are kept even while `hasVariants` is off, so switching the toggle back
   * and forth does not destroy a grid the merchant already filled in — turning
   * the question off is an answer, not a delete.
   */
  hasVariants: boolean;
  options: VariantOption[];
  variants: ProductVariant[];
}

function draftFrom(product?: Product, initialType?: ProductType): Draft {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? CATEGORIES[0].id,
    /* An existing product's type wins; otherwise the chooser's answer; only
     then the default, for anyone who reached the form directly. */
    type: product?.type ?? initialType ?? "physical",
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
    hasVariants: product?.hasVariants ?? false,
    options: product?.options ?? [],
    variants: product?.variants ?? [],
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

export function ProductEditor({
  product,
  initialType,
}: {
  product?: Product;
  /**
   * The answer to "what are you selling?", carried from the chooser.
   *
   * Only used when creating: an existing product's type comes from the record.
   * Passing it through the URL rather than a store keeps `/products/new?type=service`
   * a link a merchant can bookmark or share.
   */
  initialType?: ProductType;
}) {
  const idBase = useId();
  const [tab, setTab] = useState<TabKey>("basic");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(product, initialType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  /* One flag for both writes, so neither can run twice or run at once. */
  const [busy, setBusy] = useState<null | "draft" | "publish">(null);

  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  /* Variants own stock only for a physical product — a service's capacity and
     a digital licence are managed on the variant, not in the warehouse. */
  const variantsManageStock =
    draft.hasVariants && draft.type === "physical" && draft.variants.length > 0;
  const rolledUp = rollUpStock(draft.variants);
  /* One media library per product — the Variants tab picks from exactly this. */
  const images = product?.images ?? [];

  /*
   * The wizard only applies to creating.
   *
   * An existing product opens on whichever tab the merchant wants and saves
   * from any of them; walking someone through seven steps to correct a price
   * is the behaviour this flag exists to avoid.
   */
  const wizard = !product;
  const stepIndex = STEP_ORDER.indexOf(tab);
  const prevStep = stepIndex > 0 ? STEP_ORDER[stepIndex - 1] : undefined;
  const nextStep =
    stepIndex < STEP_ORDER.length - 1 ? STEP_ORDER[stepIndex + 1] : undefined;

  /* ---------------------------------------------------------------------- */
  /* Validation                                                             */
  /* ---------------------------------------------------------------------- */

  /**
   * What one step requires, and nothing else.
   *
   * Per step rather than one form-wide check, because Next must not refuse to
   * advance over a field three tabs away that the merchant has not reached
   * yet. Publish runs every step's rules together — see `validateAll` — so
   * nothing is lost by checking them one at a time on the way through.
   */
  function validateStep(step: TabKey): Record<string, string> {
    const next: Record<string, string> = {};

    switch (step) {
      case "basic":
        if (!draft.name.trim()) next.name = "Enter a product name.";
        if (!draft.categoryId) next.categoryId = "Choose a category.";
        if (!draft.type) next.type = "Choose a product type.";
        return next;

      case "pricing":
        if (!draft.price.trim()) {
          next.price = "Enter a regular price.";
        } else if (Number.isNaN(Number(draft.price))) {
          next.price = "Price must be a number.";
        } else if (Number(draft.price) < 0) {
          next.price = "Price cannot be negative.";
        }
        if (draft.salePrice && Number(draft.salePrice) > Number(draft.price)) {
          next.salePrice = "Sale price should be below the regular price.";
        }
        if (draft.costPrice && Number(draft.costPrice) < 0) {
          next.costPrice = "Cost cannot be negative.";
        }
        if (draft.taxRate && Number(draft.taxRate) < 0) {
          next.taxRate = "Tax rate cannot be negative.";
        }
        return next;

      case "variants":
        /*
         * Variant codes have to be unique across the whole catalogue, not
         * just within this product — a SKU is what a warehouse, a courier and
         * an invoice all key on, so two of them meaning different things is a
         * picking error rather than a validation nicety.
         */
        if (draft.hasVariants) {
          if (draft.variants.length === 0) {
            next.variants =
              "Add at least one option value, or turn variants off.";
          } else if (draft.variants.some((variant) => !variant.sku.trim())) {
            next.variants = "Every variant needs a code.";
          } else {
            const clashes = duplicateSkuIds(
              draft.variants,
              collectSkus(COMMERCE_PRODUCTS, { productId: product?.id }),
            );
            if (clashes.size > 0) {
              next.variants = `${clashes.size} variant ${clashes.size === 1 ? "code is" : "codes are"} already in use.`;
            }
          }
        }
        return next;

      case "inventory":
        /*
         * The product SKU is a *reference*, and only required when it is the
         * code a customer actually buys. Once variants are on, every
         * purchasable thing carries its own and this one is just the stem
         * they are generated from.
         */
        if (!draft.sku.trim() && !draft.hasVariants) {
          next.sku = "Enter a SKU.";
        }
        /* Skipped while variants own the figures — those fields are disabled
           and show the roll-up, so there is nothing here to be wrong. */
        if (draft.trackInventory && !variantsManageStock) {
          if (Number(draft.stock) < 0) {
            next.stock = "Stock cannot be negative.";
          }
          if (Number(draft.lowStockThreshold) < 0) {
            next.lowStockThreshold = "Threshold cannot be negative.";
          }
        }
        return next;

      case "media":
      case "seo":
      case "advanced":
        /*
         * Nothing required.
         *
         * Media has no upload control wired yet, SEO is optional by design —
         * an empty slug falls back to the name — and Advanced holds only
         * status, visibility and tags, all of which have defaults. They are
         * listed rather than omitted so the switch stays exhaustive and a new
         * tab cannot be added without someone deciding what it requires.
         */
        return next;
    }
  }

  /** Every step's rules at once. What Publish has to pass. */
  function validateAll(): Record<string, string> {
    return STEP_ORDER.reduce<Record<string, string>>(
      (all, step) => ({ ...all, ...validateStep(step) }),
      {},
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  /** Puts the cursor in the first failed field, once the tab has swapped. */
  function focusFirstError(found: Record<string, string>) {
    const id = ERROR_FIELD[Object.keys(found)[0]];
    if (!id) return;
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.focus();
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function goToStep(step: TabKey) {
    setTab(step);
    /* The form runs past a laptop viewport by the Inventory step, so a tab
       change without this drops the merchant halfway down the next one. */
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goNext() {
    if (busy) return;
    const found = validateStep(tab);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }
    if (nextStep) goToStep(nextStep);
  }

  function goBack() {
    if (busy || !prevStep) return;
    /* Never validated and never cleared: stepping back is not a claim that
       what you typed was finished, and it must not lose any of it. */
    setErrors({});
    goToStep(prevStep);
  }

  /* ---------------------------------------------------------------------- */
  /* Writes                                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Saves whatever has been filled in so far.
   *
   * Deliberately runs no validation: a draft is the answer to "I have not
   * finished", and refusing to save one because the price is still blank is
   * refusing to do the one thing it is for.
   */
  async function saveDraft() {
    if (busy) return;
    setBusy("draft");
    try {
      await persist();
      setDraft((prev) => ({ ...prev, status: "draft" }));
      toast("Saved as draft", "success");
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (busy) return;

    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      /* Land on the tab that owns the first problem rather than leaving the
         merchant on Advanced wondering which of seven steps is wrong. */
      goToStep(ERROR_STEP[Object.keys(found)[0]] ?? "basic");
      focusFirstError(found);
      return;
    }

    setBusy("publish");
    try {
      await persist();
      toast(product ? "Product saved" : "Product published", "success");
      router.push(APP_ROUTES.products);
    } finally {
      setBusy(null);
    }
  }
  return (
    <Card className="p-5" ref={formRef}>
      {/*
        * The tabs stay directly clickable, wizard or not.
        *
        * Nothing is gated behind Next: the draft is one piece of state, so
        * jumping from Basic to SEO and back loses nothing. Only the errors are
        * dropped, because they describe a step the merchant has just left.
        */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={(next) => {
          setErrors({});
          goToStep(next);
        }}
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

        {tab === "variants" ? (
          <TabPanel idBase={idBase} value="variants">
            <VariantManager
              type={draft.type}
              baseSku={draft.sku}
              basePrice={Number(draft.salePrice || draft.price) || 0}
              enabled={draft.hasVariants}
              onEnabledChange={(value) => set("hasVariants", value)}
              options={draft.options}
              variants={draft.variants}
              onChange={(options, variants) =>
                setDraft((prev) => ({ ...prev, options, variants }))
              }
              productId={product?.id}
              images={product?.images}
            />
          </TabPanel>
        ) : null}

        {tab === "inventory" ? (
          <TabPanel idBase={idBase} value="inventory" className="space-y-5">
            <div className={GRID}>
              <Field
                label={draft.hasVariants ? "Product SKU" : "SKU"}
                htmlFor="sku"
                error={errors.sku}
                hint={
                  draft.hasVariants
                    ? "Optional reference. Each variant carries the SKU that is actually sold."
                    : undefined
                }
              >
                <Input
                  id="sku"
                  value={draft.sku}
                  error={Boolean(errors.sku)}
                  className="font-mono"
                  onChange={(event) => set("sku", event.target.value.toUpperCase())}
                />
              </Field>

              {/*
                * Stock is the variants' to own, or the product's — never both.
                *
                * A parent quantity sitting beside twelve variant quantities is
                * two answers to one question, and the moment they disagree the
                * merchant has no way to tell which one the shop is selling
                * against. So when variants are on, these two fields show the
                * roll-up and refuse to be edited; the numbers are changed on
                * the Variants tab, where the stock actually is.
                */}
              <Field
                label="Stock Quantity"
                htmlFor="stock"
                hint={
                  variantsManageStock
                    ? "Totalled from the active variants."
                    : undefined
                }
              >
                <Input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={variantsManageStock ? rolledUp.stock : draft.stock}
                  disabled={!draft.trackInventory || variantsManageStock}
                  onChange={(event) => set("stock", event.target.value)}
                />
              </Field>

              <Field
                label="Low Stock Threshold"
                htmlFor="lowStockThreshold"
                hint={
                  variantsManageStock
                    ? "Each variant carries its own."
                    : "Below this, the product shows as Low Stock."
                }
              >
                <Input
                  id="lowStockThreshold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={
                    variantsManageStock
                      ? rolledUp.lowStockThreshold
                      : draft.lowStockThreshold
                  }
                  disabled={!draft.trackInventory || variantsManageStock}
                  onChange={(event) => set("lowStockThreshold", event.target.value)}
                />
              </Field>
            </div>

            {variantsManageStock ? (
              <p className="flex flex-wrap items-center gap-2 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-3 text-sm text-primary-dark">
                <Layers className="size-4 shrink-0" aria-hidden />
                Stock is tracked per variant.
                <button
                  type="button"
                  onClick={() => setTab("variants")}
                  className="font-bold underline underline-offset-2 focus-visible:shadow-focus focus-visible:outline-none"
                >
                  Manage it on the Variants tab
                </button>
              </p>
            ) : null}

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
              <p className="mt-1 text-sm text-text-muted">
                PNG or JPG, up to 5 MB each. The first image becomes the thumbnail.
              </p>
            </div>

            {/*
              * The product's real media, not four empty slots.
              *
              * This grid used to render a fixed set of placeholders regardless
              * of what the product had. That was tolerable while nothing read
              * the images; it is not now that variants assign one of *these*
              * files to a combination — a merchant would be picking from a
              * library the Media tab never showed them.
              */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative grid aspect-square place-items-center overflow-hidden rounded-panel border",
                    image.isThumbnail ? "border-primary" : "border-border",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt ?? ""}
                    className="size-full object-cover"
                  />
                  {image.isThumbnail ? (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-surface px-1.5 py-0.5 text-sm font-bold text-primary uppercase">
                      <Star className="size-2.5" aria-hidden />
                      Thumb
                    </span>
                  ) : null}
                </div>
              ))}

              {/* One empty slot to add to, rather than a fixed four. */}
              <div className="grid aspect-square place-items-center rounded-panel border border-dashed border-border bg-surface-secondary text-text-muted">
                <ImagePlus className="size-4" aria-hidden />
              </div>
            </div>

            {draft.hasVariants && images.length > 0 ? (
              <p className="text-sm font-medium text-text-muted">
                Variants can be assigned any of these on the Variants tab.
              </p>
            ) : null}
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
                onChange={(event) => set("seoTitle", event.target.value)}
              />
            </Field>

            <Field label="Meta Description" htmlFor="metaDescription">
              <Textarea
                id="metaDescription"
                value={draft.metaDescription}
                onChange={(event) => set("metaDescription", event.target.value)}
              />
            </Field>

            <Field label="URL Slug" htmlFor="slug">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-text-muted">/products/</span>
                <Input
                  id="slug"
                  value={draft.slug}
                  className="font-mono"
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

      {/*
        * The step footer.
        *
        * Publish appears on the last step and nowhere else. Offering it on
        * Basic Information was an invitation to publish a product that had a
        * name and nothing else, and it made the six tabs after it look
        * optional — which is the actual bug, not the button's position.
        *
        * Save Draft sits on every step because "I am not finished" is true on
        * every step. The container keeps its existing classes; Back is pushed
        * left by the group that holds it, so the row still wraps cleanly on a
        * phone rather than needing a second layout.
        */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
        <div className="mr-auto flex flex-wrap items-center gap-2.5">
          {wizard && prevStep ? (
            <Button
              type="button"
              variant="outline"
              size="compact"
              disabled={busy !== null}
              onClick={goBack}
            >
              <ChevronLeft aria-hidden />
              Back
            </Button>
          ) : null}

          {Object.keys(errors).length > 0 ? (
            <p role="alert" className="text-sm text-error">
              {nextStep
                ? "Check the highlighted fields before continuing."
                : "Check the highlighted fields before publishing."}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="compact"
          disabled={busy !== null}
          onClick={saveDraft}
        >
          {busy === "draft" ? "Saving…" : "Save Draft"}
        </Button>

        {wizard && nextStep ? (
          <Button
            type="button"
            size="compact"
            disabled={busy !== null}
            onClick={goNext}
          >
            Next: {TABS[stepIndex + 1].label}
            <ChevronRight aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            size="compact"
            disabled={busy !== null}
            onClick={publish}
          >
            {busy === "publish"
              ? product
                ? "Saving…"
                : "Publishing…"
              : product
                ? "Save Product"
                : "Publish Product"}
          </Button>
        )}
      </div>
    </Card>
  );
}
