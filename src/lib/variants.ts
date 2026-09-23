import { MAX_VARIANTS } from "@/constants/commerce";
import { formatCurrency } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type {
  PriceRange,
  Product,
  ProductType,
  ProductVariant,
  StockStatus,
  VariantOption,
} from "@/types/commerce";

/**
 * The variant engine.
 *
 * Deliberately pure and free of React: generating combinations, naming them,
 * minting SKUs and rolling stock up to the parent are decisions a backend will
 * make the same way, and keeping them in one module means the editor, the
 * detail tab, the product list and the inventory page cannot drift into three
 * different answers for "what does this product cost".
 */

/** How option values are joined into a variant's name. */
export const VARIANT_SEPARATOR = " / ";

/** "Medium / Black" - the one name a variant is known by, everywhere. */
export function variantName(optionValues: string[]): string {
  return optionValues.join(VARIANT_SEPARATOR);
}

/**
 * The identity of a combination, for matching across a regeneration.
 *
 * Normalised rather than the display name, so a merchant retyping "black" as
 * "Black" does not orphan the variant's stock. JSON rather than a delimiter
 * join because an option value is free text and any separator picked here is a
 * separator a merchant can type.
 */
export function variantKey(optionValues: string[]): string {
  return JSON.stringify(optionValues.map((value) => value.trim().toLowerCase()));
}

/* -------------------------------------------------------------------------- */
/* SKUs                                                                       */
/* -------------------------------------------------------------------------- */

const VOWELS = /[AEIOU]/g;

/**
 * One option value, shortened into a SKU segment.
 *
 * Deterministic rather than clever: the same value always gives the same token,
 * which is what lets a merchant predict a code before they generate it. Short
 * values are already codes ("S", "XL", "4K") and survive whole; longer ones
 * drop their vowels, and anything still over three characters keeps its first
 * two letters and its last - the shape that turns "Black" into BLK and
 * "Large" into LRG rather than the unreadable first-three-letters BLA.
 *
 * It is a starting point, not a rule: every generated SKU is editable, and the
 * table flags duplicates rather than trusting this to be unique.
 */
export function skuToken(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean) return "";
  if (clean.length <= 3) return clean;

  const stripped = clean.replace(VOWELS, "") || clean;
  if (stripped.length <= 3) return stripped;
  return `${stripped.slice(0, 2)}${stripped.slice(-1)}`;
}

/** "TSHIRT" + ["Medium", "Black"] -> "TSHIRT-MDM-BLK". */
export function autoSku(baseSku: string, optionValues: string[]): string {
  const base = baseSku.trim().toUpperCase().replace(/\s+/g, "-");
  const tokens = optionValues.map(skuToken).filter(Boolean);
  return [base, ...tokens].filter(Boolean).join("-");
}

/**
 * Every SKU already spoken for, so a new one can be checked against it.
 *
 * Spans products *and* their variants: a SKU is the code a warehouse, a courier
 * and an invoice all key on, and two of them meaning different things is a
 * picking error rather than a validation nicety.
 */
export function collectSkus(
  products: Product[],
  exclude?: { productId?: string; variantId?: string },
): Map<string, string> {
  const taken = new Map<string, string>();

  for (const item of products) {
    if (item.sku && item.id !== exclude?.productId) {
      taken.set(item.sku.trim().toUpperCase(), item.name);
    }
    for (const variant of item.variants ?? []) {
      if (!variant.sku || variant.id === exclude?.variantId) continue;
      taken.set(
        variant.sku.trim().toUpperCase(),
        `${item.name} · ${variantName(variant.optionValues)}`,
      );
    }
  }

  return taken;
}

/**
 * Which variants in one list share a SKU with each other or with another product.
 *
 * Returns variant ids rather than a boolean so the table can mark the exact
 * rows in conflict - telling a merchant "a SKU is duplicated" across forty rows
 * is telling them to go and find it themselves.
 */
export function duplicateSkuIds(
  variants: ProductVariant[],
  takenElsewhere: Map<string, string> = new Map(),
): Set<string> {
  const seen = new Map<string, string>();
  const clashing = new Set<string>();

  for (const variant of variants) {
    const key = variant.sku.trim().toUpperCase();
    if (!key) continue;

    if (takenElsewhere.has(key)) clashing.add(variant.id);

    const first = seen.get(key);
    if (first) {
      clashing.add(first);
      clashing.add(variant.id);
    } else {
      seen.set(key, variant.id);
    }
  }

  return clashing;
}

/* -------------------------------------------------------------------------- */
/* Combinations                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The cartesian product of the options' values, in option order.
 *
 * Options with no values are skipped rather than collapsing the result to
 * nothing: a merchant who has added "Color" and not yet typed a value should
 * still see their Size variants, not an empty table implying they broke
 * something.
 */
export function combinationsOf(options: VariantOption[]): string[][] {
  const axes = options
    .map((option) => option.values.filter((value) => value.trim()))
    .filter((values) => values.length > 0);

  if (axes.length === 0) return [];

  return axes.reduce<string[][]>(
    (rows, values) => rows.flatMap((row) => values.map((value) => [...row, value])),
    [[]],
  );
}

/** How many rows the current options would generate. */
export function combinationCount(options: VariantOption[]): number {
  return combinationsOf(options).length;
}

interface GenerateContext {
  type: ProductType;
  /** The parent's SKU, used as the stem for generated codes. */
  baseSku: string;
  now: string;
}

/**
 * A new variant, with the defaults its product type actually needs.
 *
 * `price` is deliberately left unset - an unedited variant follows the parent
 * price, and stamping a copy of it here is what silently detaches a variant the
 * next time the product is repriced.
 */
export function blankVariant(
  optionValues: string[],
  context: GenerateContext,
): ProductVariant {
  const slug = slugify(optionValues.join("-"));
  const base: ProductVariant = {
    id: `var-${slug || Math.random().toString(36).slice(2, 8)}`,
    optionValues,
    sku: autoSku(context.baseSku, optionValues),
    status: "active",
    updatedAt: context.now,
  };

  switch (context.type) {
    case "physical":
      return { ...base, stock: 0, reserved: 0, lowStockThreshold: 5 };
    case "digital":
      return { ...base, downloadLimit: null, accessExpiryDays: null };
    case "service":
      return { ...base, capacityPerSlot: null, bookingRequired: true };
  }
}

/**
 * The variant grid for a set of options, preserving everything already edited.
 *
 * Regeneration is idempotent by design: a combination that already exists keeps
 * its row untouched - its SKU, its price, its stock, its image - and only
 * genuinely new combinations are created. Anything whose combination no longer
 * exists is dropped, which is the deletion the confirm dialog warns about
 * before this ever runs.
 *
 * Without the match-by-key step, adding a fourth colour would rebuild the table
 * from scratch and throw away the stock counts for the three already there.
 * That is the bug this function exists to not have.
 */
export function generateVariants(
  options: VariantOption[],
  existing: ProductVariant[],
  context: GenerateContext,
): ProductVariant[] {
  const byKey = new Map(
    existing.map((variant) => [variantKey(variant.optionValues), variant]),
  );

  return combinationsOf(options)
    .slice(0, MAX_VARIANTS)
    .map((values) => {
      const kept = byKey.get(variantKey(values));
      /* Keep the record, but take the freshly typed casing of the values -
         renaming "black" to "Black" should show up, not be silently ignored. */
      return kept ? { ...kept, optionValues: values } : blankVariant(values, context);
    });
}

/**
 * How many existing variants a value removal would take with it.
 *
 * The number the confirm dialog quotes. Counted against the variants that are
 * actually there rather than against the theoretical grid, so a merchant who
 * has only generated half of their combinations is told the truth.
 */
export function variantsAffectedByValue(
  variants: ProductVariant[],
  optionIndex: number,
  value: string,
): ProductVariant[] {
  const needle = value.trim().toLowerCase();
  return variants.filter(
    (variant) => variant.optionValues[optionIndex]?.trim().toLowerCase() === needle,
  );
}

/**
 * Re-slices every variant's values when an option is removed or moved.
 *
 * `optionValues` is positional, so any change to the option list that is not a
 * rename has to be mirrored here or "Medium / Black" silently becomes
 * "Black / Medium". `order` holds the old index of each surviving option.
 */
export function reorderVariantValues(
  variants: ProductVariant[],
  order: number[],
): ProductVariant[] {
  return variants.map((variant) => ({
    ...variant,
    optionValues: order.map((index) => variant.optionValues[index] ?? ""),
  }));
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                    */
/* -------------------------------------------------------------------------- */

/** What a variant actually sells for - its own price, or the parent's. */
export function effectivePrice(variant: ProductVariant, basePrice: number): number {
  return variant.price ?? basePrice;
}

/**
 * The span a product sells across.
 *
 * Only `active` variants count. An inactive combination is not buyable, and
 * letting a switched-off $9 sample drag the range down to "$9 – $39" misstates
 * the product on every list that shows it.
 */
export function priceRangeFrom(
  variants: ProductVariant[],
  basePrice: number,
  hasVariants: boolean,
): PriceRange {
  const sellable = variants.filter((variant) => variant.status === "active");

  if (!hasVariants || sellable.length === 0) {
    return { min: basePrice, max: basePrice };
  }

  const prices = sellable.map((variant) => effectivePrice(variant, basePrice));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** The same reading, for a saved product. */
export function priceRangeOf(product: Product): PriceRange {
  return priceRangeFrom(
    product.variants ?? [],
    product.salePrice ?? product.price,
    product.hasVariants,
  );
}

/** "$29 – $39", or plain "$29" when every variant is priced the same. */
export function formatPriceRange(range: PriceRange): string {
  return range.min === range.max
    ? formatCurrency(range.min)
    : `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
}

/* -------------------------------------------------------------------------- */
/* Inventory roll-up                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Parent stock, read off the variants rather than stored beside them.
 *
 * A product with variants has no stock of its own - there is no such thing as
 * "12 Premium T-Shirts" once three of them are XL. Keeping a separate parent
 * figure guarantees two numbers that disagree, so the parent's is derived and
 * the editor's Stock field is disabled while variants are on.
 */
export function rollUpStock(variants: ProductVariant[]): {
  stock: number;
  reserved: number;
  lowStockThreshold: number;
} {
  /* Only tracked, sellable rows count. An untracked made-to-order size has no
     shelf to add, and a disabled one is not on sale - including either inflates
     the parent figure with units nobody can buy. */
  const live = variants.filter(
    (variant) => variant.status === "active" && isTracked(variant),
  );

  return {
    stock: live.reduce((sum, variant) => sum + (variant.stock ?? 0), 0),
    reserved: live.reduce((sum, variant) => sum + (variant.reserved ?? 0), 0),
    /* The highest threshold any variant sets: the parent should read "low" as
       soon as the first size does, not once the total dips. */
    lowStockThreshold: live.reduce(
      (max, variant) => Math.max(max, variant.lowStockThreshold ?? 0),
      0,
    ),
  };
}

/**
 * Whether this row is counted.
 *
 * Defaults to on: a variant created before the flag existed, or generated
 * without one, is a normal stocked row. Opting out is the deliberate act.
 */
export function isTracked(variant: ProductVariant): boolean {
  return variant.trackInventory ?? true;
}

/**
 * Sellable units - what is on the shelf minus what orders have claimed.
 *
 * This is the one definition of available in the system: `current - reserved`,
 * computed here and nowhere else, so the table, the drawer, the roll-up and the
 * Inventory page cannot disagree about it.
 */
export function availableOf(variant: ProductVariant): number {
  return (variant.stock ?? 0) - (variant.reserved ?? 0);
}

/**
 * A variant's stock state, measured on available rather than on-hand.
 *
 * Reserved units are spoken for, so counting them as in stock is how a merchant
 * oversells the last three of something.
 */
export function variantStockStatus(variant: ProductVariant): StockStatus {
  const available = availableOf(variant);
  if (available <= 0) return "out-of-stock";
  if (available <= (variant.lowStockThreshold ?? 0)) return "low-stock";
  return "in-stock";
}

/**
 * What a merchant actually sees in the Status column.
 *
 * Three states, not two, because `VariantStatus` answers a different question
 * from the shelf. *Disabled* is a decision - the merchant switched this
 * combination off. *Out of stock* is a fact - it is on sale and there is none
 * left. Collapsing them loses the distinction that matters: one is fixed by
 * changing your mind, the other by receiving stock.
 *
 * A variant that is allowed to oversell never reads out of stock, which is the
 * whole point of `continueSellingWhenOutOfStock` - a print-on-demand size has
 * no shelf and is always available.
 *
 * Crucially this is per variant. One disabled size does not take the product
 * down with it; the product's own status is a separate field on the parent.
 */
export type VariantAvailability = "active" | "out-of-stock" | "disabled";

export function variantAvailability(
  variant: ProductVariant,
  type: ProductType,
): VariantAvailability {
  if (variant.status === "inactive") return "disabled";

  /* Only a physical variant can run out in the shelf sense. A service is
     limited by capacity and a download by licences, neither of which is a
     quantity that gets picked - see `quantityLabelFor`. */
  if (type === "physical" && isTracked(variant)) {
    if (variant.continueSellingWhenOutOfStock) return "active";
    if (availableOf(variant) <= 0) return "out-of-stock";
  }

  if (type === "digital" && variant.licensesAvailable !== undefined) {
    return variant.licensesAvailable <= 0 ? "out-of-stock" : "active";
  }

  return "active";
}

/** True when a customer could buy this combination right now. */
export function isSellable(variant: ProductVariant, type: ProductType): boolean {
  return variantAvailability(variant, type) === "active";
}

/* -------------------------------------------------------------------------- */
/* Readings                                                                   */
/* -------------------------------------------------------------------------- */

/** True when the product sells by variant and actually has some. */
export function hasLiveVariants(product: Product): boolean {
  return product.hasVariants && (product.variants?.length ?? 0) > 0;
}

export function variantCount(product: Product): number {
  return product.variants?.length ?? 0;
}

export function findVariant(
  product: Product,
  variantId: string,
): ProductVariant | undefined {
  return product.variants?.find((variant) => variant.id === variantId);
}

/**
 * The image that stands for a product: its thumbnail, or its first photo.
 *
 * `images.find((image) => image.isThumbnail)?.url ?? images[0]?.url` was
 * written out at five call sites - the catalogue picker, the catalogue rows,
 * the detail header, the variant manager and `variantImage` below - which is
 * five chances to disagree about what a product looks like. The `?? images[0]`
 * half is the part that kept getting dropped: a product whose media was
 * uploaded without one being marked as the thumbnail has photos and would
 * still have rendered the empty-state icon.
 *
 * Undefined when the product genuinely has no media, which is what selects the
 * fallback icon in `ProductThumb`.
 */
export function productImage(product: Product): string | undefined {
  return (
    product.images.find((image) => image.isThumbnail)?.url ??
    product.images[0]?.url
  );
}

/**
 * A variant's image, falling back to the product's.
 *
 * The fallback is the point: a merchant who has uploaded one shirt photo should
 * see it on all six rows, not five empty tiles that read as missing work.
 */
export function variantImage(
  variant: ProductVariant,
  product: Product,
): string | undefined {
  return variant.imageUrl ?? productImage(product);
}

/** A fresh option, named from whichever of the type's presets is unused. */
export function nextOptionName(used: string[], presets: string[]): string {
  const taken = new Set(used.map((name) => name.trim().toLowerCase()));
  return presets.find((name) => !taken.has(name.toLowerCase())) ?? "";
}

/** Case-insensitive membership, for the duplicate guards in the builder. */
export function containsValue(values: string[], candidate: string): boolean {
  const needle = candidate.trim().toLowerCase();
  return values.some((value) => value.trim().toLowerCase() === needle);
}

/** Moves an item within a list, for the reorder controls. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
