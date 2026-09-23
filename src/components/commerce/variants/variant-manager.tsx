"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  ImagePlus,
  Layers,
  Package,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu } from "@/components/ui/menu";
import type { SortDirection } from "@/components/ui/table";
import {
  MAX_VARIANTS,
  UNIT_NOUN,
  VARIANT_QUANTITY_LABEL,
} from "@/constants/commerce";
import { COMMERCE_PRODUCTS } from "@/lib/commerce-fixtures";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  autoSku,
  collectSkus,
  combinationCount,
  duplicateSkuIds,
  effectivePrice,
  formatPriceRange,
  generateVariants,
  priceRangeFrom,
  reorderVariantValues,
  rollUpStock,
  variantAvailability,
  variantName,
  variantsAffectedByValue,
} from "@/lib/variants";
import { cn } from "@/lib/utils";
import type {
  ProductImage,
  ProductType,
  ProductVariant,
  VariantOption,
} from "@/types/commerce";
import {
  BulkInventoryDialog,
  BulkPricingDialog,
  VariantMediaDialog,
  type InventoryMode,
} from "./variant-bulk-dialogs";
import { VariantDrawer } from "./variant-drawer";
import { VariantOptionsEditor } from "./variant-options-editor";
import { VariantsTable, type VariantSortField } from "./variants-table";

/**
 * The Variants section, whole: the toggle, the option builder, the generated
 * grid, the bulk bar, the table and the drawer.
 *
 * One component because those pieces share one piece of state and one
 * invariant - the grid is a pure function of the options, and every path that
 * changes an option has to regenerate through `generateVariants` so that
 * existing rows keep their SKUs, stock and images. Splitting the toggle from
 * the builder is how that invariant gets broken by the second person to touch
 * the file.
 *
 * It is controlled rather than stateful, so the product editor can hold the
 * draft and the detail page can hold the saved record without either of them
 * learning how combinations work.
 *
 * Destructive edits route through `pending`. Removing a value or an option
 * silently drops every variant underneath it, and a merchant who has spent ten
 * minutes entering stock for twelve rows deserves to be told that before it
 * happens - "Removing 'Blue' will remove 4 variants", in the `ConfirmDialog`
 * the rest of the module already uses.
 */

/** A destructive edit, held until the merchant confirms it. */
type Pending =
  | { kind: "remove-option"; index: number }
  | { kind: "remove-value"; optionIndex: number; value: string }
  | { kind: "delete-variant"; id: string }
  | { kind: "delete-selected" }
  | { kind: "disable" };

type BulkDialog = "pricing" | "inventory" | "media" | null;

export interface VariantManagerProps {
  type: ProductType;
  /** The stem for generated codes - the product's own reference SKU. */
  baseSku: string;
  /** What an unpriced variant sells at. */
  basePrice: number;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  options: VariantOption[];
  variants: ProductVariant[];
  onChange: (options: VariantOption[], variants: ProductVariant[]) => void;
  /** Excluded from the cross-product SKU check - a product cannot clash with itself. */
  productId?: string;
  /** The product's media library. Variants pick from it; they never upload. */
  images?: ProductImage[];
  /** Hides the toggle where the answer is already yes - the detail page's tab. */
  showToggle?: boolean;
}

export function VariantManager({
  type,
  baseSku,
  basePrice,
  enabled,
  onEnabledChange,
  options,
  variants,
  onChange,
  productId,
  images = [],
  showToggle = true,
}: VariantManagerProps) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [openVariantId, setOpenVariantId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState<BulkDialog>(null);
  /* A row-level "Assign image" reuses the bulk dialog with a selection of one,
     rather than a second single-variant picker that would drift from it. */
  const [mediaTarget, setMediaTarget] = useState<ProductVariant[] | null>(null);
  const [sortField, setSortField] = useState<VariantSortField>("variant");
  const [direction, setDirection] = useState<SortDirection>("asc");
  /*
   * Progressive disclosure: once a grid exists, the builder is the thing a
   * merchant needs least often. It stays open while there is nothing generated,
   * because then it *is* the task.
   */
  const [editingOptions, setEditingOptions] = useState(variants.length === 0);

  const now = new Date().toISOString();
  const context = { type, baseSku, now };
  const thumbnail =
    images.find((image) => image.isThumbnail)?.url ?? images[0]?.url;

  /* SKUs already spoken for by every *other* product and its variants - the
     uniqueness rule is catalogue-wide, so the check has to look outside this
     product as well as within it. */
  const takenElsewhere = useMemo(
    () => collectSkus(COMMERCE_PRODUCTS, { productId }),
    [productId],
  );

  const duplicates = useMemo(
    () => duplicateSkuIds(variants, takenElsewhere),
    [variants, takenElsewhere],
  );

  const expected = combinationCount(options);
  /* The grid is stale when the options no longer describe the rows - after
     adding a value, before the merchant regenerates. */
  const stale = expected !== variants.length;

  /** Every option change funnels through here, so the grid cannot drift. */
  function apply(nextOptions: VariantOption[], nextVariants: ProductVariant[]) {
    onChange(nextOptions, generateVariants(nextOptions, nextVariants, context));
  }

  function patch(id: string, changes: Partial<ProductVariant>) {
    onChange(
      options,
      variants.map((variant) =>
        variant.id === id ? { ...variant, ...changes, updatedAt: now } : variant,
      ),
    );
  }

  /** The same patch across every ticked row - the spine of every bulk action. */
  function patchMany(ids: string[], changes: Partial<ProductVariant>) {
    const target = new Set(ids);
    onChange(
      options,
      variants.map((variant) =>
        target.has(variant.id)
          ? { ...variant, ...changes, updatedAt: now }
          : variant,
      ),
    );
  }

  function duplicate(id: string) {
    const source = variants.find((variant) => variant.id === id);
    if (!source) return;

    /* A copy is a real row and needs its own identity, so it gets a fresh id
       and a suffixed SKU rather than silently colliding with its source. */
    const copy: ProductVariant = {
      ...source,
      id: `${source.id}-copy-${Math.random().toString(36).slice(2, 6)}`,
      sku: source.sku ? `${source.sku}-COPY` : "",
      updatedAt: now,
    };

    const at = variants.findIndex((variant) => variant.id === id);
    const next = [...variants];
    next.splice(at + 1, 0, copy);
    onChange(options, next);
  }

  /** Re-mints every SKU from the product's, discarding hand-typed ones. */
  function regenerateSkus(ids?: string[]) {
    const target = ids ? new Set(ids) : null;
    onChange(
      options,
      variants.map((variant) =>
        !target || target.has(variant.id)
          ? {
              ...variant,
              sku: autoSku(baseSku, variant.optionValues),
              updatedAt: now,
            }
          : variant,
      ),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Bulk                                                                     */
  /* ------------------------------------------------------------------------ */

  function applyInventory(input: {
    mode: InventoryMode;
    quantity?: number;
    threshold?: number;
    trackInventory?: boolean;
    continueSelling?: boolean;
  }) {
    const target = new Set(selected);

    onChange(
      options,
      variants.map((variant) => {
        if (!target.has(variant.id)) return variant;

        const next: ProductVariant = { ...variant, updatedAt: now };

        if (input.quantity !== undefined) {
          /* Services count capacity, everything physical counts units - the
             same three modes, applied to whichever field this type owns. */
          const field = type === "service" ? "capacityPerSlot" : "stock";
          const current = (variant[field] as number | null | undefined) ?? 0;
          const value =
            input.mode === "set"
              ? input.quantity
              : input.mode === "increase"
                ? current + input.quantity
                : current - input.quantity;

          if (field === "stock") next.stock = Math.max(0, value);
          else next.capacityPerSlot = Math.max(0, value);
        }

        if (input.threshold !== undefined) next.lowStockThreshold = input.threshold;
        if (input.trackInventory !== undefined) {
          next.trackInventory = input.trackInventory;
        }
        if (input.continueSelling !== undefined) {
          next.continueSellingWhenOutOfStock = input.continueSelling;
        }

        return next;
      }),
    );

    setBulk(null);
  }

  function applyImage(imageUrl: string | undefined, ids: string[]) {
    patchMany(ids, { imageUrl });
    setBulk(null);
    setMediaTarget(null);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Sorting                                                                  */
  /* ------------------------------------------------------------------------ */

  function onSort(field: VariantSortField) {
    if (field === sortField) {
      setDirection((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setDirection("asc");
    }
  }

  /**
   * Display order only.
   *
   * `variants` keeps its generated order as the canonical sequence - that is
   * what "S / Black, S / White, …" means and what regeneration matches against.
   * Sorting a copy lets a merchant find the low-stock rows without rewriting
   * the grid's identity.
   */
  const ordered = useMemo(() => {
    const factor = direction === "asc" ? 1 : -1;
    const quantityOf = (variant: ProductVariant) =>
      type === "service"
        ? (variant.capacityPerSlot ?? Number.MAX_SAFE_INTEGER)
        : (variant.stock ?? 0) - (variant.reserved ?? 0);

    return [...variants].sort((a, b) => {
      if (sortField === "variant") {
        return variantName(a.optionValues).localeCompare(variantName(b.optionValues)) * factor;
      }
      if (sortField === "sku") return a.sku.localeCompare(b.sku) * factor;
      if (sortField === "price") {
        return (
          (effectivePrice(a, basePrice) - effectivePrice(b, basePrice)) * factor
        );
      }
      return (quantityOf(a) - quantityOf(b)) * factor;
    });
  }, [variants, sortField, direction, basePrice, type]);

  function toggleAll() {
    const ids = ordered.map((variant) => variant.id);
    setSelected((prev) => (ids.every((id) => prev.includes(id)) ? [] : ids));
  }

  /* ------------------------------------------------------------------------ */
  /* Confirmations                                                            */
  /* ------------------------------------------------------------------------ */

  /** How many rows the pending edit destroys - the figure the dialog quotes. */
  const affected = useMemo(() => {
    if (!pending) return 0;
    if (pending.kind === "remove-value") {
      return variantsAffectedByValue(variants, pending.optionIndex, pending.value)
        .length;
    }
    if (pending.kind === "remove-option") return variants.length;
    if (pending.kind === "disable") return variants.length;
    if (pending.kind === "delete-selected") return selected.length;
    return 1;
  }, [pending, variants, selected]);

  function confirmPending() {
    if (!pending) return;

    if (pending.kind === "remove-option") {
      const nextOptions = options.filter((_, index) => index !== pending.index);
      /* Values are positional, so dropping an option has to re-slice every
         variant or "Medium / Black" quietly becomes "Black". */
      const order = options
        .map((_, index) => index)
        .filter((index) => index !== pending.index);
      apply(nextOptions, reorderVariantValues(variants, order));
    }

    if (pending.kind === "remove-value") {
      apply(
        options.map((option, index) =>
          index === pending.optionIndex
            ? {
                ...option,
                values: option.values.filter((value) => value !== pending.value),
              }
            : option,
        ),
        variants,
      );
    }

    if (pending.kind === "delete-variant") {
      onChange(
        options,
        variants.filter((variant) => variant.id !== pending.id),
      );
    }

    if (pending.kind === "delete-selected") {
      const target = new Set(selected);
      onChange(
        options,
        variants.filter((variant) => !target.has(variant.id)),
      );
      setSelected([]);
    }

    if (pending.kind === "disable") {
      /* Options and variants are kept, not wiped: turning the toggle back on
         should return the merchant to their grid, not to a blank builder. */
      onEnabledChange(false);
    }

    setPending(null);
  }

  const confirmCopy = (): { title: string; description: string; label: string } => {
    if (!pending) return { title: "", description: "", label: "" };

    switch (pending.kind) {
      case "remove-value":
        return {
          title: `Remove “${pending.value}”?`,
          description:
            affected === 0
              ? "No variants use this value yet."
              : `Removing “${pending.value}” will remove ${affected} ${affected === 1 ? "variant" : "variants"}, along with their SKUs, stock and images.`,
          label: "Remove & Continue",
        };
      case "remove-option":
        return {
          title: `Delete the ${options[pending.index]?.name || "option"} option?`,
          description:
            options.length === 1
              ? `This is the last option, so all ${affected} ${affected === 1 ? "variant" : "variants"} will be removed.`
              : `Every variant is rebuilt without it. ${affected} existing ${affected === 1 ? "row" : "rows"} will be replaced.`,
          label: "Delete & Continue",
        };
      case "delete-variant":
        return {
          title: "Delete this variant?",
          description:
            "Its SKU, price and stock go with it. Regenerating will recreate the combination as a blank row.",
          label: "Delete variant",
        };
      case "delete-selected":
        return {
          title: `Delete ${affected} ${affected === 1 ? "variant" : "variants"}?`,
          description:
            "Their SKUs, prices and stock go with them. Past orders keep the variant they recorded and are unaffected.",
          label: `Delete ${affected}`,
        };
      case "disable":
        return {
          title: "Turn variants off?",
          description: `This product will sell as a single item at ${formatCurrency(basePrice)}. Your ${affected} ${affected === 1 ? "variant" : "variants"} are kept, and come back if you turn this on again.`,
          label: "Turn off",
        };
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Readings                                                                 */
  /* ------------------------------------------------------------------------ */

  const range = useMemo(
    () => formatPriceRange(priceRangeFrom(variants, basePrice, enabled)),
    [enabled, variants, basePrice],
  );

  const stock = useMemo(() => rollUpStock(variants), [variants]);
  const states = useMemo(() => {
    const counts = { active: 0, "out-of-stock": 0, disabled: 0 };
    for (const variant of variants) counts[variantAvailability(variant, type)] += 1;
    return counts;
  }, [variants, type]);

  const openVariant = variants.find((item) => item.id === openVariantId) ?? null;
  const copy = confirmCopy();
  const selectedVariants = variants.filter((item) => selected.includes(item.id));

  /** The bulk bar's overflow - kept short so the bar never wraps to two lines. */
  const bulkMenu = [
    {
      label: "Auto-generate SKUs",
      icon: <Sparkles className="size-4" />,
      onSelect: () => regenerateSkus(selected),
    },
    ...(type === "digital"
      ? []
      : [
          {
            label: "Assign image",
            icon: <ImagePlus className="size-4" />,
            onSelect: () => setBulk("media"),
          },
        ]),
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setPending({ kind: "delete-selected" }),
      destructive: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* The question itself. Off by default, because most products are one
          thing at one price and an option grid is work nobody asked for. */}
      {showToggle ? (
        <div className="rounded-panel border border-border px-3.5 py-3">
          <CheckboxField
            id="has-variants"
            label="This product has variants"
            hint={
              type === "service"
                ? "Different durations, tiers or packages of the same service."
                : type === "digital"
                  ? "Different licences, formats or access levels of the same download."
                  : "Different sizes, colours or materials of the same product."
            }
            checked={enabled}
            onCheckedChange={(next) => {
              /* Turning it off destroys nothing, but it does change what the
                 product costs - worth a confirmation once rows exist. */
              if (!next && variants.length > 0) setPending({ kind: "disable" });
              else onEnabledChange(next);
            }}
          />
        </div>
      ) : null}

      {!enabled ? (
        showToggle ? (
          <p className="text-sm font-medium text-text-muted">
            This product sells as a single item at {formatCurrency(basePrice)}.
          </p>
        ) : (
          <EmptyState
            title="This product has no variants"
            description="Turn variants on to sell it in more than one size, tier or package - each with its own code, price and stock."
            action={
              <Button size="sm" onClick={() => onEnabledChange(true)}>
                <Layers aria-hidden />
                Add Variants
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* -------------------------------------------------------------- */}
          {/* Options                                                        */}
          {/* -------------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-primary">Options</h3>
                <p className="mt-0.5 text-sm font-medium text-text-muted">
                  {editingOptions || options.length === 0
                    ? "What this product varies along. Every combination becomes a variant you can price and stock on its own."
                    : options
                        .map(
                          (option) =>
                            `${option.name || "Untitled"} · ${option.values.length} ${option.values.length === 1 ? "value" : "values"}`,
                        )
                        .join("  ·  ")}
                </p>
              </div>

              {/* Collapsed once a grid exists: with twelve rows below it, the
                  builder is the part a merchant needs least often, and leaving
                  it open pushes the table off the screen. */}
              {variants.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={editingOptions}
                  onClick={() => setEditingOptions((value) => !value)}
                >
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "transition-transform",
                      editingOptions && "rotate-180",
                    )}
                  />
                  {editingOptions ? "Done" : "Edit options"}
                </Button>
              ) : null}
            </div>

            {editingOptions || options.length === 0 ? (
              <VariantOptionsEditor
                type={type}
                options={options}
                onChange={(next) => apply(next, variants)}
                onReorder={(next, order) =>
                  apply(next, reorderVariantValues(variants, order))
                }
                onRequestRemoveOption={(index) =>
                  setPending({ kind: "remove-option", index })
                }
                onRequestRemoveValue={(optionIndex, value) =>
                  setPending({ kind: "remove-value", optionIndex, value })
                }
              />
            ) : null}
          </section>

          {/* -------------------------------------------------------------- */}
          {/* The grid                                                       */}
          {/* -------------------------------------------------------------- */}
          {variants.length === 0 ? (
            <EmptyState
              compact
              title="No combinations yet"
              description={
                options.length === 0
                  ? "Add an option and at least one value - the grid builds itself from there."
                  : "Add a value to an option and the combinations appear here."
              }
            />
          ) : (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {variants.length} {variants.length === 1 ? "variant" : "variants"}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-text-muted">
                    {range}
                    {states["out-of-stock"] > 0
                      ? ` · ${states["out-of-stock"]} out of stock`
                      : ""}
                    {states.disabled > 0 ? ` · ${states.disabled} disabled` : ""}
                    {type === "physical"
                      ? ` · ${formatNumber(stock.stock)} ${VARIANT_QUANTITY_LABEL.physical.noun}`
                      : ""}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateSkus()}
                  title="Rebuild every SKU from the product SKU"
                >
                  <Sparkles aria-hidden />
                  Auto-generate SKUs
                </Button>
              </div>

              {/* Duplicate SKUs are a picking error waiting to happen, so they
                  are called out above the table as well as marked in it. */}
              {duplicates.size > 0 ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-panel border border-error bg-error-soft px-3.5 py-3 text-sm text-error-text"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {duplicates.size}{" "}
                    {duplicates.size === 1 ? "variant has" : "variants have"} a code
                    already used by another product or variant. Codes have to be
                    unique across the catalogue.
                  </span>
                </p>
              ) : null}

              {stale ? (
                <p className="flex flex-wrap items-center gap-2 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5 text-sm text-primary-dark">
                  <RefreshCw className="size-4 shrink-0" aria-hidden />
                  Your options now describe {expected}{" "}
                  {expected === 1 ? "combination" : "combinations"}.
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => apply(options, variants)}
                  >
                    Regenerate
                  </Button>
                </p>
              ) : null}

              {expected > MAX_VARIANTS ? (
                <p className="text-sm font-medium text-warning-text">
                  Only the first {MAX_VARIANTS} combinations are generated. Fewer
                  values, or fewer options, keeps this manageable.
                </p>
              ) : null}

              {/* The bulk bar - the same tinted strip the products, contacts and
                  campaigns tables already use when rows are ticked. */}
              {selected.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
                  <p className="text-sm font-medium text-primary-dark">
                    {selected.length} selected
                  </p>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulk("pricing")}
                    >
                      <Tag aria-hidden />
                      Pricing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulk("inventory")}
                    >
                      <Package aria-hidden />
                      {type === "service" ? "Capacity" : "Inventory"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patchMany(selected, { status: "active" })
                      }
                    >
                      <Check aria-hidden />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => patchMany(selected, { status: "inactive" })}
                    >
                      <Ban aria-hidden />
                      Disable
                    </Button>
                    <Menu items={bulkMenu} label="More bulk actions" />
                    <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              ) : null}

              <VariantsTable
                type={type}
                variants={ordered}
                basePrice={basePrice}
                fallbackImage={thumbnail}
                duplicateSkus={duplicates}
                selected={selected}
                onToggle={toggleOne}
                onToggleAll={toggleAll}
                sortField={sortField}
                direction={direction}
                onSort={onSort}
                onPatch={patch}
                onOpen={(variant) => setOpenVariantId(variant.id)}
                onDuplicate={duplicate}
                onAssignImage={(variant) => setMediaTarget([variant])}
                onRequestDelete={(id) => setPending({ kind: "delete-variant", id })}
              />

              {/* The one figure the parent product now shows instead of its own
                  price and stock. Saying it here is what makes the list view's
                  "$29 – $34" predictable rather than surprising. */}
              <p className="text-sm font-medium text-text-muted">
                The product list shows{" "}
                <span className="font-bold text-text-primary">{range}</span>
                {type === "physical" ? (
                  <>
                    {" "}
                    and {formatNumber(stock.stock)} in stock, both totalled from the
                    active, tracked variants above.
                  </>
                ) : (
                  <>
                    , totalled from the active variants above. Sold as{" "}
                    {UNIT_NOUN[type].many}.
                  </>
                )}
              </p>
            </section>
          )}
        </>
      )}

      {/* One dialog for every destructive edit - the shared `ConfirmDialog`,
          not a bespoke one per action. */}
      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirmPending}
        title={copy.title}
        confirmLabel={copy.label}
        cancelLabel="Cancel"
        tone={pending?.kind === "disable" ? "primary" : "danger"}
      >
        <p className="text-sm text-text-secondary">{copy.description}</p>

        {/* Name the rows being destroyed. A count alone asks the merchant to
            take it on trust; the list lets them check. */}
        {pending?.kind === "remove-value" && affected > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {variantsAffectedByValue(variants, pending.optionIndex, pending.value)
              .slice(0, 8)
              .map((variant) => (
                <li
                  key={variant.id}
                  className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-meta font-medium text-text-secondary"
                >
                  {variantName(variant.optionValues)}
                </li>
              ))}
            {affected > 8 ? (
              <li className="px-1 text-meta font-medium text-text-muted">
                +{affected - 8} more
              </li>
            ) : null}
          </ul>
        ) : null}

        {pending?.kind === "delete-selected" ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {selectedVariants.slice(0, 8).map((variant) => (
              <li
                key={variant.id}
                className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-meta font-medium text-text-secondary"
              >
                {variantName(variant.optionValues)}
              </li>
            ))}
            {selectedVariants.length > 8 ? (
              <li className="px-1 text-meta font-medium text-text-muted">
                +{selectedVariants.length - 8} more
              </li>
            ) : null}
          </ul>
        ) : null}

        {pending?.kind === "delete-variant" ? (
          <p className="mt-3 rounded-panel bg-surface-secondary px-3 py-2 text-sm font-medium text-text-secondary">
            {(() => {
              const target = variants.find((item) => item.id === pending.id);
              if (!target) return null;
              return `${variantName(target.optionValues)} · ${target.sku || "no code"} · ${formatCurrency(effectivePrice(target, basePrice))}`;
            })()}
          </p>
        ) : null}
      </ConfirmDialog>

      <BulkPricingDialog
        open={bulk === "pricing"}
        count={selected.length}
        basePrice={basePrice}
        onClose={() => setBulk(null)}
        onApply={(changes) => {
          /* `price: undefined` is a deliberate reset to the product price, and
             a spread would drop it - so it is applied as an explicit key. */
          patchMany(selected, changes);
          setBulk(null);
        }}
      />

      <BulkInventoryDialog
        open={bulk === "inventory"}
        count={selected.length}
        type={type}
        onClose={() => setBulk(null)}
        onApply={applyInventory}
      />

      <VariantMediaDialog
        open={bulk === "media" || mediaTarget !== null}
        variants={mediaTarget ?? selectedVariants}
        options={options}
        images={images}
        onClose={() => {
          setBulk(null);
          setMediaTarget(null);
        }}
        onApply={(url, ids) => applyImage(url, ids)}
      />

      <VariantDrawer
        variant={openVariant}
        type={type}
        basePrice={basePrice}
        optionNames={options.map((option) => option.name)}
        fallbackImage={thumbnail}
        images={images}
        onClose={() => setOpenVariantId(null)}
        onPatch={patch}
      />
    </div>
  );
}
