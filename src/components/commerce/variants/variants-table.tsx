"use client";

import { Ban, Check, Copy, FileDown, Pencil, Trash2 } from "lucide-react";

import { Menu } from "@/components/ui/menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  VARIANT_CODE_LABEL,
  VARIANT_MEDIA_LABEL,
  VARIANT_QUANTITY_LABEL,
  VARIANT_STATUSES,
  formatDuration,
} from "@/constants/commerce";
import { formatCurrency } from "@/lib/format";
import {
  availableOf,
  variantName,
  variantStockStatus,
} from "@/lib/variants";
import { cn } from "@/lib/utils";
import type { ProductType, ProductVariant, VariantStatus } from "@/types/commerce";
import { ProductThumb, StockBadge } from "../commerce-badges";

/**
 * The variant grid, as a working surface rather than a report.
 *
 * Which columns exist is decided by the product type, not by a union of all
 * three. A digital variant has no stock and a service has no shelf, so the
 * quantity column is *Stock*, *Delivery* or *Capacity* and carries a different
 * control in each case. Showing all three and blanking two is exactly the habit
 * `FULFILLMENT_FLOW` exists to break.
 *
 * Four fields edit in place — code, price, quantity and status — because those
 * are the four a merchant changes in a sweep down the table after a delivery or
 * a price rise. Everything with more to it (the image, the file, compare-at,
 * cost, barcode, expiry) opens the drawer instead. That split is the whole
 * reason the table stays readable at twelve rows.
 */

export interface VariantsTableProps {
  type: ProductType;
  variants: ProductVariant[];
  /** Falls back under an unpriced variant, so the cell can show what it inherits. */
  basePrice: number;
  /** The product image a variant with none of its own inherits. */
  fallbackImage?: string;
  /** Variant ids whose SKU collides — flagged inline rather than in a summary. */
  duplicateSkus: Set<string>;
  onPatch: (id: string, patch: Partial<ProductVariant>) => void;
  onOpen: (variant: ProductVariant) => void;
  onDuplicate: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Price, with the inherited figure as the placeholder.
 *
 * An empty field is not missing data — it is "sells at the product price", and
 * showing that price greyed in the box is what makes the rule legible without a
 * second column explaining it. Clearing the field is how a merchant goes back
 * to following the parent.
 */
function PriceCell({
  variant,
  basePrice,
  onPatch,
}: {
  variant: ProductVariant;
  basePrice: number;
  onPatch: VariantsTableProps["onPatch"];
}) {
  return (
    <Input
      size="sm"
      type="number"
      inputMode="decimal"
      min={0}
      step="0.01"
      value={variant.price ?? ""}
      placeholder={String(basePrice)}
      aria-label={`Price for ${variantName(variant.optionValues)}`}
      onChange={(event) => {
        const raw = event.target.value;
        onPatch(variant.id, { price: raw === "" ? undefined : Number(raw) });
      }}
      className="w-24 text-right tabular-nums"
    />
  );
}

/** Stock, with the available/reserved reading underneath it. */
function StockCell({
  variant,
  onPatch,
}: {
  variant: ProductVariant;
  onPatch: VariantsTableProps["onPatch"];
}) {
  const available = availableOf(variant);
  const state = variantStockStatus(variant);

  return (
    <div className="flex flex-col items-end gap-1">
      <Input
        size="sm"
        type="number"
        inputMode="numeric"
        min={0}
        value={variant.stock ?? 0}
        aria-label={`Stock for ${variantName(variant.optionValues)}`}
        onChange={(event) =>
          onPatch(variant.id, { stock: Math.max(0, Number(event.target.value) || 0) })
        }
        className="w-20 text-right tabular-nums"
      />
      {/* Reserved units are spoken for — the sellable figure is the one that
          decides whether this row can take another order. */}
      <span
        className={cn(
          "text-meta font-medium tabular-nums",
          state === "out-of-stock"
            ? "text-error"
            : state === "low-stock"
              ? "text-warning-text"
              : "text-text-muted",
        )}
      >
        {available} available
        {variant.reserved ? ` · ${variant.reserved} reserved` : ""}
      </span>
    </div>
  );
}

/** Capacity, in bookings. `null` is unlimited, which an empty field means. */
function CapacityCell({
  variant,
  onPatch,
}: {
  variant: ProductVariant;
  onPatch: VariantsTableProps["onPatch"];
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <Input
        size="sm"
        type="number"
        inputMode="numeric"
        min={0}
        value={variant.capacityPerSlot ?? ""}
        placeholder="∞"
        aria-label={`Capacity for ${variantName(variant.optionValues)}`}
        onChange={(event) => {
          const raw = event.target.value;
          onPatch(variant.id, {
            capacityPerSlot: raw === "" ? null : Math.max(0, Number(raw) || 0),
          });
        }}
        className="w-20 text-right tabular-nums"
      />
      <span className="text-meta font-medium text-text-muted">
        {variant.capacityPerSlot === null || variant.capacityPerSlot === undefined
          ? "unlimited"
          : "bookings/day"}
      </span>
    </div>
  );
}

/**
 * Delivery, for a digital variant — read-only on purpose.
 *
 * What is delivered is a file and a set of access rules, not a number, and
 * there is nothing here a merchant can usefully sweep down the column changing.
 * Editing it opens the drawer, which is where the file lives.
 */
function DeliveryCell({ variant }: { variant: ProductVariant }) {
  return (
    <div className="min-w-0">
      {variant.fileName ? (
        <p className="truncate font-mono text-sm text-text-secondary">
          {variant.fileName}
        </p>
      ) : (
        <p className="text-sm font-medium text-text-muted">No file attached</p>
      )}
      <p className="text-meta font-medium text-text-muted">
        {variant.downloadLimit === null || variant.downloadLimit === undefined
          ? "Unlimited downloads"
          : `${variant.downloadLimit} downloads`}
        {variant.accessExpiryDays ? ` · ${variant.accessExpiryDays} days` : ""}
      </p>
    </div>
  );
}

/** The media cell: a thumbnail for things you can see, a file chip for a download. */
function MediaCell({
  variant,
  type,
  fallbackImage,
}: {
  variant: ProductVariant;
  type: ProductType;
  fallbackImage?: string;
}) {
  if (type === "digital") {
    return variant.fileName ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <FileDown className="size-3.5 shrink-0 text-text-muted" aria-hidden />
        {variant.fileSizeMb ? `${variant.fileSizeMb} MB` : "Attached"}
      </span>
    ) : (
      <span className="text-sm text-text-muted">—</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <ProductThumb
        size="sm"
        url={variant.imageUrl ?? fallbackImage}
        alt={variantName(variant.optionValues)}
      />
      {/* An inherited image is not a missing one, and saying so stops a
          merchant re-uploading the same shirt photo six times. */}
      {!variant.imageUrl && fallbackImage ? (
        <span className="text-meta text-text-muted">inherited</span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export function VariantsTable({
  type,
  variants,
  basePrice,
  fallbackImage,
  duplicateSkus,
  onPatch,
  onOpen,
  onDuplicate,
  onRequestDelete,
}: VariantsTableProps) {
  const quantity = VARIANT_QUANTITY_LABEL[type];

  const actions = (variant: ProductVariant) => [
    {
      label: "Edit variant",
      icon: <Pencil className="size-4" />,
      onSelect: () => onOpen(variant),
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => onDuplicate(variant.id),
    },
    {
      label: variant.status === "active" ? "Disable" : "Enable",
      icon:
        variant.status === "active" ? (
          <Ban className="size-4" />
        ) : (
          <Check className="size-4" />
        ),
      onSelect: () =>
        onPatch(variant.id, {
          status: variant.status === "active" ? "inactive" : "active",
        }),
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => onRequestDelete(variant.id),
      destructive: true,
    },
  ];

  /** The quantity control, in whichever vocabulary this type uses. */
  const quantityCell = (variant: ProductVariant) => {
    if (type === "physical") return <StockCell variant={variant} onPatch={onPatch} />;
    if (type === "service") return <CapacityCell variant={variant} onPatch={onPatch} />;
    return <DeliveryCell variant={variant} />;
  };

  const skuInput = (variant: ProductVariant) => {
    const clash = duplicateSkus.has(variant.id);

    return (
      <div className="space-y-1">
        <Input
          size="sm"
          value={variant.sku}
          error={clash}
          aria-label={`${VARIANT_CODE_LABEL[type]} for ${variantName(variant.optionValues)}`}
          onChange={(event) =>
            onPatch(variant.id, { sku: event.target.value.toUpperCase() })
          }
          className="w-36 font-mono"
        />
        {clash ? (
          <p role="alert" className="text-meta text-error">
            Already in use
          </p>
        ) : null}
      </div>
    );
  };

  const statusSelect = (variant: ProductVariant) => (
    <Select
      size="sm"
      label={`Status for ${variantName(variant.optionValues)}`}
      value={variant.status}
      onChange={(next) => onPatch(variant.id, { status: next as VariantStatus })}
      options={VARIANT_STATUSES}
      className="w-28"
    />
  );

  /** The supporting line under a variant's name — what it is, in one phrase. */
  const subtitle = (variant: ProductVariant) => {
    if (type === "service" && variant.durationMinutes) {
      return formatDuration(variant.durationMinutes);
    }
    if (type === "digital" && variant.licenseType) return variant.licenseType;
    if (type === "physical" && variant.barcode) return variant.barcode;
    return variant.price === undefined
      ? `At product price · ${formatCurrency(basePrice)}`
      : undefined;
  };

  return (
    <>
      {/* Desktop: the grid. */}
      <div className="max-lg:hidden">
        <Table minWidth="66rem">
          <THead>
            <TH>Variant</TH>
            <TH>{VARIANT_CODE_LABEL[type]}</TH>
            <TH align="right">Price</TH>
            <TH align={type === "digital" ? "left" : "right"}>{quantity.column}</TH>
            <TH>Status</TH>
            <TH>{VARIANT_MEDIA_LABEL[type]}</TH>
            <TH align="right">Actions</TH>
          </THead>

          <TBody>
            {variants.map((variant) => {
              const hint = subtitle(variant);

              return (
                <TR key={variant.id} className={cn(variant.status === "inactive" && "opacity-65")}>
                  <TD>
                    <button
                      type="button"
                      onClick={() => onOpen(variant)}
                      className="block max-w-56 truncate text-left font-bold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      {variantName(variant.optionValues)}
                    </button>
                    {hint ? (
                      <span className="mt-0.5 block text-meta font-medium text-text-muted">
                        {hint}
                      </span>
                    ) : null}
                  </TD>

                  <TD>{skuInput(variant)}</TD>
                  <TD align="right">
                    <span className="inline-flex flex-col items-end gap-1">
                      <PriceCell
                        variant={variant}
                        basePrice={basePrice}
                        onPatch={onPatch}
                      />
                      {variant.compareAtPrice ? (
                        <s className="text-meta text-text-muted tabular-nums">
                          {formatCurrency(variant.compareAtPrice)}
                        </s>
                      ) : null}
                    </span>
                  </TD>

                  <TD align={type === "digital" ? "left" : "right"} className="max-w-56">
                    {quantityCell(variant)}
                  </TD>

                  <TD>
                    <div className="flex flex-col items-start gap-1">
                      {statusSelect(variant)}
                      {type === "physical" ? (
                        <StockBadge status={variantStockStatus(variant)} />
                      ) : null}
                    </div>
                  </TD>

                  <TD>
                    <MediaCell
                      variant={variant}
                      type={type}
                      fallbackImage={fallbackImage}
                    />
                  </TD>

                  <TD align="right">
                    <Menu
                      items={actions(variant)}
                      label={`Actions for ${variantName(variant.optionValues)}`}
                    />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      {/* Mobile: the same rows as cards. A seven-column grid on a phone is a
          horizontal scroll nobody completes. */}
      <ul className="space-y-2.5 lg:hidden">
        {variants.map((variant) => (
          <li
            key={variant.id}
            className={cn(
              "rounded-panel border border-border p-3.5",
              variant.status === "inactive" && "opacity-65",
            )}
          >
            <div className="flex items-start gap-3">
              <MediaCell variant={variant} type={type} fallbackImage={fallbackImage} />

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onOpen(variant)}
                  className="block truncate text-left text-sm font-bold text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {variantName(variant.optionValues)}
                </button>
                <p className="font-mono text-sm text-text-muted">{variant.sku}</p>
              </div>

              <Menu
                items={actions(variant)}
                label={`Actions for ${variantName(variant.optionValues)}`}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-sm font-bold text-text-secondary">
                  Price
                </span>
                <PriceCell variant={variant} basePrice={basePrice} onPatch={onPatch} />
              </label>

              <label className="space-y-1">
                <span className="block text-sm font-bold text-text-secondary">
                  {quantity.column}
                </span>
                {quantityCell(variant)}
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {statusSelect(variant)}
              {type === "physical" ? (
                <StockBadge status={variantStockStatus(variant)} />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
