"use client";

import { Ban, Check, Copy, FileDown, ImagePlus, Pencil, Trash2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Menu } from "@/components/ui/menu";
import { Input } from "@/components/ui/input";
import { SortableTH, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import type { SortDirection } from "@/components/ui/table";
import {
  VARIANT_CODE_LABEL,
  VARIANT_QUANTITY_LABEL,
  formatDuration,
} from "@/constants/commerce";
import { formatCurrency } from "@/lib/format";
import {
  availableOf,
  isTracked,
  variantAvailability,
  variantName,
  variantStockStatus,
} from "@/lib/variants";
import { cn } from "@/lib/utils";
import type { ProductType, ProductVariant } from "@/types/commerce";
import { ProductThumb, VariantAvailabilityBadge } from "../commerce-badges";

/**
 * The variant grid, as a working surface rather than a report.
 *
 * Which columns exist is decided by the product type, not by a union of all
 * three. A digital variant has no shelf and a service has no stock, so the
 * quantity column is *Available*, *Delivery* or *Capacity* and says something
 * different in each case. Showing all three and blanking two is exactly the
 * habit `FULFILLMENT_FLOW` exists to break.
 *
 * Only two things edit in place: the code and the price. They are the two a
 * merchant sweeps down the column changing, and neither is derived from
 * anything else.
 *
 * Quantities deliberately do *not* edit inline. Available is `current -
 * reserved`, and reserved is read off the open orders — so an editable cell
 * there would either be lying about which number it writes, or letting a
 * merchant type over a figure the order book owns. Stock changes go through the
 * bulk Adjust dialog or the drawer, which is also where the existing
 * stock-adjustment flow lives.
 */

export type VariantSortField = "variant" | "sku" | "price" | "quantity";

export interface VariantsTableProps {
  type: ProductType;
  variants: ProductVariant[];
  /** Falls back under an unpriced variant, so the cell shows what it inherits. */
  basePrice: number;
  /** The product image a variant with none of its own inherits. */
  fallbackImage?: string;
  /** Variant ids whose SKU collides — flagged inline rather than in a summary. */
  duplicateSkus: Set<string>;
  /** Ids currently ticked, for the bulk bar above the table. */
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  sortField: VariantSortField;
  direction: SortDirection;
  onSort: (field: VariantSortField) => void;
  onPatch: (id: string, patch: Partial<ProductVariant>) => void;
  onOpen: (variant: ProductVariant) => void;
  onDuplicate: (id: string) => void;
  onAssignImage: (variant: ProductVariant) => void;
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
    <span className="inline-flex flex-col items-end gap-1">
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
      {variant.compareAtPrice ? (
        <s className="text-meta text-text-muted tabular-nums">
          {formatCurrency(variant.compareAtPrice)}
        </s>
      ) : null}
    </span>
  );
}

/** Sellable units, with on-hand and reserved underneath as the working. */
function AvailableCell({ variant }: { variant: ProductVariant }) {
  if (!isTracked(variant)) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-text-muted">Not tracked</span>
        <span className="text-meta font-medium text-text-muted">Always available</span>
      </div>
    );
  }

  const available = availableOf(variant);
  const state = variantStockStatus(variant);

  return (
    <div className="flex flex-col items-end">
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          state === "out-of-stock"
            ? "text-error"
            : state === "low-stock"
              ? "text-warning-text"
              : "text-text-primary",
        )}
      >
        {available}
      </span>
      {/* The arithmetic, shown rather than asserted — a merchant looking at
          "12" needs to know whether the three claimed units are in it. */}
      <span className="text-meta font-medium text-text-muted tabular-nums">
        {variant.stock ?? 0} on hand
        {variant.reserved ? ` · ${variant.reserved} reserved` : ""}
      </span>
    </div>
  );
}

/** Capacity, in bookings per day. */
function CapacityCell({ variant }: { variant: ProductVariant }) {
  const unlimited =
    variant.capacityPerSlot === null || variant.capacityPerSlot === undefined;

  return (
    <div className="flex flex-col items-end">
      <span className="text-sm font-bold text-text-primary tabular-nums">
        {unlimited ? "∞" : variant.capacityPerSlot}
      </span>
      <span className="text-meta font-medium text-text-muted">
        {unlimited
          ? "unlimited"
          : `${VARIANT_QUANTITY_LABEL.service.noun}`}
        {variant.durationMinutes
          ? ` · ${formatDuration(variant.durationMinutes)}`
          : ""}
      </span>
    </div>
  );
}

/**
 * Delivery, for a digital variant.
 *
 * What is delivered is a file and a set of access rules, not a quantity — the
 * only number a download genuinely has is seats left in a finite licence pool,
 * and that is shown only when there is one.
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
        {variant.licensesAvailable !== undefined
          ? `${variant.licensesAvailable} licenses left · `
          : ""}
        {variant.downloadLimit === null || variant.downloadLimit === undefined
          ? "Unlimited downloads"
          : `${variant.downloadLimit} downloads`}
        {variant.accessExpiryDays ? ` · ${variant.accessExpiryDays} days` : ""}
      </p>
    </div>
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
  selected,
  onToggle,
  onToggleAll,
  sortField,
  direction,
  onSort,
  onPatch,
  onOpen,
  onDuplicate,
  onAssignImage,
  onRequestDelete,
}: VariantsTableProps) {
  const quantity = VARIANT_QUANTITY_LABEL[type];
  const allOn = variants.length > 0 && variants.every((v) => selected.includes(v.id));
  const someOn = variants.some((v) => selected.includes(v.id));

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
    /* Digital variants deliver a file, not a picture — offering an image
       assignment there would be a control with nothing to point at. */
    ...(type === "digital"
      ? []
      : [
          {
            label: "Assign image",
            icon: <ImagePlus className="size-4" />,
            onSelect: () => onAssignImage(variant),
          },
        ]),
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

  /** The quantity cell, in whichever vocabulary this type uses. */
  const quantityCell = (variant: ProductVariant) => {
    if (type === "physical") return <AvailableCell variant={variant} />;
    if (type === "service") return <CapacityCell variant={variant} />;
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
          aria-describedby={clash ? `${variant.id}-sku-error` : undefined}
          onChange={(event) =>
            onPatch(variant.id, { sku: event.target.value.toUpperCase() })
          }
          className="w-36 font-mono"
        />
        {/* The project's form-error pattern: message under the field, in the
            error ink, announced. A summary alone leaves a merchant hunting. */}
        {clash ? (
          <p id={`${variant.id}-sku-error`} role="alert" className="text-meta text-error">
            Already in use
          </p>
        ) : null}
      </div>
    );
  };

  /** The supporting line under a variant's name — what it is, in one phrase. */
  const subtitle = (variant: ProductVariant) => {
    if (type === "digital" && variant.licenseType) return variant.licenseType;
    if (type === "physical" && variant.barcode) return variant.barcode;
    return variant.price === undefined
      ? `Product price · ${formatCurrency(basePrice)}`
      : undefined;
  };

  /** Thumbnail plus name — §3's variant cell. */
  const variantCell = (variant: ProductVariant) => {
    const hint = subtitle(variant);

    return (
      <div className="flex items-center gap-3">
        {type === "digital" ? (
          <span className="grid size-8 shrink-0 place-items-center rounded-panel border border-border bg-primary-soft text-primary">
            <FileDown className="size-3.5" aria-hidden />
          </span>
        ) : (
          <ProductThumb
            size="sm"
            url={variant.imageUrl ?? fallbackImage}
            alt={variantName(variant.optionValues)}
          />
        )}

        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onOpen(variant)}
            className="block max-w-48 truncate text-left font-bold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
          >
            {variantName(variant.optionValues)}
          </button>
          {hint ? (
            <span className="block truncate text-meta font-medium text-text-muted">
              {hint}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop: the grid. */}
      <div className="max-lg:hidden">
        <Table minWidth="58rem">
          <THead>
            <TH className="w-10 pr-0">
              <Checkbox
                checked={allOn}
                indeterminate={!allOn && someOn}
                onCheckedChange={onToggleAll}
                label="Select all variants"
              />
            </TH>
            <SortableTH
              field="variant"
              activeField={sortField}
              direction={direction}
              onSort={onSort}
            >
              Variant
            </SortableTH>
            <SortableTH
              field="sku"
              activeField={sortField}
              direction={direction}
              onSort={onSort}
            >
              {VARIANT_CODE_LABEL[type]}
            </SortableTH>
            <SortableTH
              field="price"
              activeField={sortField}
              direction={direction}
              onSort={onSort}
              align="right"
            >
              Price
            </SortableTH>
            {type === "digital" ? (
              <TH>{quantity.column}</TH>
            ) : (
              <SortableTH
                field="quantity"
                activeField={sortField}
                direction={direction}
                onSort={onSort}
                align="right"
              >
                {quantity.column}
              </SortableTH>
            )}
            <TH>Status</TH>
            <TH align="right">Actions</TH>
          </THead>

          <TBody>
            {variants.map((variant) => (
              <TR key={variant.id} selected={selected.includes(variant.id)}>
                <TD className="pr-0">
                  <Checkbox
                    checked={selected.includes(variant.id)}
                    onCheckedChange={() => onToggle(variant.id)}
                    label={`Select ${variantName(variant.optionValues)}`}
                  />
                </TD>

                <TD>{variantCell(variant)}</TD>
                <TD>{skuInput(variant)}</TD>
                <TD align="right">
                  <PriceCell
                    variant={variant}
                    basePrice={basePrice}
                    onPatch={onPatch}
                  />
                </TD>

                <TD
                  align={type === "digital" ? "left" : "right"}
                  className="max-w-56"
                >
                  {quantityCell(variant)}
                </TD>

                <TD>
                  <VariantAvailabilityBadge
                    availability={variantAvailability(variant, type)}
                  />
                </TD>

                <TD align="right">
                  <Menu
                    items={actions(variant)}
                    label={`Actions for ${variantName(variant.optionValues)}`}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Mobile: the same rows as cards — the module's existing responsive
          pattern, not a second mobile design. A seven-column grid on a phone is
          a horizontal scroll nobody completes. */}
      <ul className="space-y-2.5 lg:hidden">
        {variants.map((variant) => (
          <li
            key={variant.id}
            className={cn(
              "rounded-panel border p-3.5",
              selected.includes(variant.id)
                ? "border-primary-border bg-primary-subtle"
                : "border-border",
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selected.includes(variant.id)}
                onCheckedChange={() => onToggle(variant.id)}
                label={`Select ${variantName(variant.optionValues)}`}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">{variantCell(variant)}</div>
              <Menu
                items={actions(variant)}
                label={`Actions for ${variantName(variant.optionValues)}`}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <label className="min-w-0 space-y-1">
                <span className="block text-sm font-bold text-text-secondary">
                  {VARIANT_CODE_LABEL[type]}
                </span>
                {skuInput(variant)}
              </label>

              <label className="space-y-1">
                <span className="block text-sm font-bold text-text-secondary">
                  Price
                </span>
                <PriceCell
                  variant={variant}
                  basePrice={basePrice}
                  onPatch={onPatch}
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
              <VariantAvailabilityBadge
                availability={variantAvailability(variant, type)}
              />
              <div className="text-right">{quantityCell(variant)}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
