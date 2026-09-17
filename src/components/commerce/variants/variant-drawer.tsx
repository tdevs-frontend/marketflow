"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, FileDown, ImageOff, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  LICENSE_TYPES,
  VARIANT_CODE_LABEL,
  VARIANT_STATUSES,
  formatDuration,
} from "@/constants/commerce";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  availableOf,
  effectivePrice,
  isTracked,
  variantAvailability,
  variantName,
} from "@/lib/variants";
import { cn } from "@/lib/utils";
import type {
  ProductImage,
  ProductType,
  ProductVariant,
  ServiceLocationType,
  VariantStatus,
} from "@/types/commerce";
import { ProductThumb, VariantAvailabilityBadge } from "../commerce-badges";

/**
 * Everything about one combination, in the drawer the rest of Commerce already
 * uses for record detail.
 *
 * A drawer rather than a route, for the same reason the order drawer is one: a
 * variant is read *alongside* its siblings — you scan the grid, open one, fix
 * it, close and carry on — and a full page would lose the merchant's place in a
 * twelve-row table every time.
 *
 * The fields shown are the parent product's type and nothing else. A digital
 * variant gets a file, a download limit and an expiry; a service gets a
 * duration, a capacity and where it happens; only a physical one gets weight,
 * dimensions and a barcode. This is where the table's deliberate shallowness is
 * paid back.
 *
 * Reserved and available are *shown* here but never editable. Both are computed
 * — reserved off the open orders, available as `on hand − reserved` — and an
 * input on either would be a control that either lies about what it writes or
 * lets a merchant type over a figure the order book owns.
 */

/** A read-only figure. Used for everything derived. */
function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "danger" | "warning";
}) {
  return (
    <div className="rounded-panel bg-surface-secondary px-3 py-2.5">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          tone === "danger"
            ? "text-error"
            : tone === "warning"
              ? "text-warning-text"
              : "text-text-primary",
        )}
      >
        {value}
      </dd>
      {hint ? (
        <dd className="mt-0.5 text-meta font-medium text-text-muted">{hint}</dd>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium  text-text-muted uppercase">
        {title}
      </h3>
      <div className="mt-2.5 space-y-5">{children}</div>
    </section>
  );
}

/**
 * The secondary fields, folded away.
 *
 * Weight, dimensions and barcodes matter to the merchant who needs them and are
 * noise to the one setting up a price list. Progressive disclosure keeps the
 * drawer's first screen to the things that change often.
 */
function Advanced({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-panel border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left focus-visible:shadow-focus focus-visible:outline-none"
      >
        <span className="text-sm font-bold text-text-secondary">{title}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-5 border-t border-border px-3.5 py-3.5">{children}</div>
      ) : null}
    </div>
  );
}

const GRID = "grid gap-5 sm:grid-cols-2";

export function VariantDrawer({
  variant,
  type,
  basePrice,
  optionNames,
  fallbackImage,
  images = [],
  onClose,
  onPatch,
}: {
  variant: ProductVariant | null;
  type: ProductType;
  basePrice: number;
  /** The option each value belongs to — "Size: Medium", not just "Medium". */
  optionNames: string[];
  fallbackImage?: string;
  /** The product's media library. A variant picks from it; it never uploads. */
  images?: ProductImage[];
  onClose: () => void;
  onPatch: (id: string, patch: Partial<ProductVariant>) => void;
}) {
  /* The element stays mounted so the native dialog keeps ownership of its open
     state; only the contents are conditional. Same contract as `OrderDrawer`. */
  const set = (patch: Partial<ProductVariant>) => {
    if (variant) onPatch(variant.id, patch);
  };

  const number = (raw: string): number | undefined =>
    raw === "" ? undefined : Number(raw);

  const tracked = variant ? isTracked(variant) : true;

  return (
    <Drawer
      open={Boolean(variant)}
      onClose={onClose}
      title={variant ? variantName(variant.optionValues) : "Variant"}
      description={
        variant ? `${VARIANT_CODE_LABEL[type]} ${variant.sku || "—"}` : undefined
      }
      footer={
        variant ? (
          <Button size="compact" className="w-full" onClick={onClose}>
            Done
          </Button>
        ) : null
      }
    >
      {variant ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <VariantAvailabilityBadge
              availability={variantAvailability(variant, type)}
            />
            {variant.price === undefined ? (
              <span className="text-sm text-text-muted">
                Sells at the product price
              </span>
            ) : null}
          </div>

          {/* What this combination is, spelled out per option. Reading
              "Medium / Black" is fine in a table and ambiguous on its own. */}
          <Section title="Option values">
            <dl className="grid grid-cols-2 gap-2">
              {variant.optionValues.map((value, index) => (
                <div
                  key={`${optionNames[index] ?? index}-${value}`}
                  className="rounded-panel border border-border px-3 py-2"
                >
                  <dt className="text-sm font-medium text-text-muted">
                    {optionNames[index] ?? `Option ${index + 1}`}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-text-primary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Identity">
            <div className={GRID}>
              <Field
                label={VARIANT_CODE_LABEL[type]}
                htmlFor="variant-sku"
                hint="Unique across the whole catalogue."
              >
                <Input
                  id="variant-sku"
                  value={variant.sku}
                  className="font-mono"
                  onChange={(event) => set({ sku: event.target.value.toUpperCase() })}
                />
              </Field>

              <Field
                label="Status"
                htmlFor="variant-status"
                hint="Disabling this variant leaves the product on sale."
              >
                <Select
                  id="variant-status"
                  label="Status"
                  hideLabel={false}
                  value={variant.status}
                  onChange={(next) => set({ status: next as VariantStatus })}
                  options={VARIANT_STATUSES}
                />
              </Field>
            </div>
          </Section>

          <Section title="Pricing">
            <div className={GRID}>
              <Field
                label="Price"
                htmlFor="variant-price"
                hint="Leave empty to sell at the product price."
              >
                <Input
                  id="variant-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={variant.price ?? ""}
                  placeholder={String(basePrice)}
                  onChange={(event) => set({ price: number(event.target.value) })}
                />
              </Field>

              <Field
                label="Compare-at Price"
                htmlFor="variant-compare"
                hint="The struck-through “was” figure."
              >
                <Input
                  id="variant-compare"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={variant.compareAtPrice ?? ""}
                  onChange={(event) =>
                    set({ compareAtPrice: number(event.target.value) })
                  }
                />
              </Field>

              {/* Cost is a physical and digital question — a service's cost is
                  the practitioner's time, which is not modelled per variant. */}
              {type !== "service" ? (
                <Field
                  label="Cost per item"
                  htmlFor="variant-cost"
                  hint="For margin reporting. Never shown to customers."
                >
                  <Input
                    id="variant-cost"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={variant.costPrice ?? ""}
                    onChange={(event) => set({ costPrice: number(event.target.value) })}
                  />
                </Field>
              ) : null}
            </div>

            <p className="rounded-panel bg-primary-soft px-3.5 py-3 text-sm text-primary-dark">
              Sells at{" "}
              <strong className="font-bold">
                {formatCurrency(effectivePrice(variant, basePrice))}
              </strong>
              {variant.price === undefined ? " — inherited from the product." : "."}
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/* Physical                                                         */}
          {/* ---------------------------------------------------------------- */}
          {type === "physical" ? (
            <Section title="Inventory">
              <div className="rounded-panel border border-border px-3.5 py-3">
                <CheckboxField
                  id="variant-track"
                  label="Track inventory"
                  hint="Off for made-to-order sizes that have no shelf to count."
                  checked={tracked}
                  onCheckedChange={(value) => set({ trackInventory: value })}
                />
              </div>

              {tracked ? (
                <>
                  <div className={GRID}>
                    <Field
                      label="On hand"
                      htmlFor="variant-stock"
                      hint="Physically in the warehouse."
                    >
                      <Input
                        id="variant-stock"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={variant.stock ?? 0}
                        onChange={(event) =>
                          set({ stock: Math.max(0, Number(event.target.value) || 0) })
                        }
                      />
                    </Field>

                    <Field
                      label="Low stock threshold"
                      htmlFor="variant-threshold"
                      hint="At or below this, the variant reads Low Stock."
                    >
                      <Input
                        id="variant-threshold"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={variant.lowStockThreshold ?? 0}
                        onChange={(event) =>
                          set({
                            lowStockThreshold: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          })
                        }
                      />
                    </Field>
                  </div>

                  {/*
                    * Derived, so shown rather than editable.
                    *
                    * Reserved is the quantity open orders have claimed and
                    * available is what is left — both computed from the order
                    * book. An input here would let a merchant type a number the
                    * next order would silently overwrite.
                    */}
                  <dl className="grid grid-cols-2 gap-2">
                    <Stat
                      label="Reserved"
                      value={formatNumber(variant.reserved ?? 0)}
                      hint="Claimed by open orders"
                    />
                    <Stat
                      label="Available"
                      value={formatNumber(availableOf(variant))}
                      hint="On hand − reserved"
                      tone={
                        availableOf(variant) <= 0
                          ? "danger"
                          : availableOf(variant) <= (variant.lowStockThreshold ?? 0)
                            ? "warning"
                            : "default"
                      }
                    />
                  </dl>

                  <div className="rounded-panel border border-border px-3.5 py-3">
                    <CheckboxField
                      id="variant-oversell"
                      label="Continue selling when out of stock"
                      hint="Keeps this combination buyable at zero — for pre-orders and print-on-demand."
                      checked={variant.continueSellingWhenOutOfStock ?? false}
                      onCheckedChange={(value) =>
                        set({ continueSellingWhenOutOfStock: value })
                      }
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-text-muted">
                  Not counted. This variant is always available to buy.
                </p>
              )}

              <Advanced title="Shipping & identifiers">
                <div className={GRID}>
                  <Field label="Weight (g)" htmlFor="variant-weight">
                    <Input
                      id="variant-weight"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={variant.weightGrams ?? ""}
                      onChange={(event) =>
                        set({ weightGrams: number(event.target.value) })
                      }
                    />
                  </Field>

                  <Field label="Barcode" htmlFor="variant-barcode" hint="Optional.">
                    <Input
                      id="variant-barcode"
                      value={variant.barcode ?? ""}
                      className="font-mono"
                      onChange={(event) => set({ barcode: event.target.value })}
                    />
                  </Field>
                </div>

                <fieldset>
                  <legend className="mb-1.5 block text-sm font-bold text-text-secondary">
                    Dimensions (cm)
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(["length", "width", "height"] as const).map((axis) => (
                      <Input
                        key={axis}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.1"
                        aria-label={`${axis} in centimetres`}
                        placeholder={axis[0].toUpperCase() + axis.slice(1)}
                        value={variant.dimensionsCm?.[axis] ?? ""}
                        onChange={(event) => {
                          const current = variant.dimensionsCm ?? {
                            length: 0,
                            width: 0,
                            height: 0,
                          };
                          set({
                            dimensionsCm: {
                              ...current,
                              [axis]: Number(event.target.value) || 0,
                            },
                          });
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-text-muted">
                    Left empty, this variant ships at the product’s dimensions.
                  </p>
                </fieldset>
              </Advanced>
            </Section>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* Digital                                                          */}
          {/* ---------------------------------------------------------------- */}
          {type === "digital" ? (
            <Section title="Delivery">
              <div className="rounded-panel border border-border p-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary">
                    <FileDown className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-text-primary">
                      {variant.fileName ?? "No file attached"}
                    </p>
                    <p className="text-sm text-text-muted">
                      {variant.fileSizeMb ? `${variant.fileSizeMb} MB` : "—"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload aria-hidden />
                    Replace
                  </Button>
                </div>
              </div>

              <div className={GRID}>
                <Field label="License type" htmlFor="variant-license">
                  <Select
                    id="variant-license"
                    label="License type"
                    hideLabel={false}
                    value={variant.licenseType?.toLowerCase() ?? "personal"}
                    onChange={(next) =>
                      set({
                        licenseType:
                          LICENSE_TYPES.find((item) => item.value === next)?.label ??
                          next,
                      })
                    }
                    options={LICENSE_TYPES}
                  />
                </Field>

                <Field
                  label="Download limit"
                  htmlFor="variant-downloads"
                  hint="Leave empty for unlimited."
                >
                  <Input
                    id="variant-downloads"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.downloadLimit ?? ""}
                    placeholder="Unlimited"
                    onChange={(event) => {
                      const raw = event.target.value;
                      set({ downloadLimit: raw === "" ? null : Number(raw) });
                    }}
                  />
                </Field>

                <Field
                  label="Access expiration (days)"
                  htmlFor="variant-expiry"
                  hint="Leave empty for permanent access."
                >
                  <Input
                    id="variant-expiry"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.accessExpiryDays ?? ""}
                    placeholder="Never"
                    onChange={(event) => {
                      const raw = event.target.value;
                      set({ accessExpiryDays: raw === "" ? null : Number(raw) });
                    }}
                  />
                </Field>

                {/*
                  * Licence seats, and emphatically not "stock".
                  *
                  * The only quantity a download has. It is never picked, packed
                  * or reserved, so it gets its own word — labelling it stock is
                  * how a merchant selling forty team licences ends up with a
                  * reorder level and a warehouse row.
                  */}
                <Field
                  label="Licenses available"
                  htmlFor="variant-licenses"
                  hint="For a finite pool. Empty means unlimited."
                >
                  <Input
                    id="variant-licenses"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.licensesAvailable ?? ""}
                    placeholder="Unlimited"
                    onChange={(event) =>
                      set({ licensesAvailable: number(event.target.value) })
                    }
                  />
                </Field>
              </div>
            </Section>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* Service                                                          */}
          {/* ---------------------------------------------------------------- */}
          {type === "service" ? (
            <Section title="Delivery">
              <div className={GRID}>
                <Field label="Duration (minutes)" htmlFor="variant-duration">
                  <Input
                    id="variant-duration"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={5}
                    value={variant.durationMinutes ?? ""}
                    onChange={(event) =>
                      set({ durationMinutes: number(event.target.value) })
                    }
                  />
                </Field>

                {/*
                  * Capacity, not stock. A consultation is limited by how many
                  * bookings the practitioner can take in a day — nothing is
                  * consumed and nothing runs out permanently.
                  */}
                <Field
                  label="Capacity"
                  htmlFor="variant-capacity"
                  hint="Bookings per day. Empty is unlimited."
                >
                  <Input
                    id="variant-capacity"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.capacityPerSlot ?? ""}
                    placeholder="Unlimited"
                    onChange={(event) => {
                      const raw = event.target.value;
                      set({ capacityPerSlot: raw === "" ? null : Number(raw) });
                    }}
                  />
                </Field>

                <Field label="Location" htmlFor="variant-location">
                  <Select
                    id="variant-location"
                    label="Location"
                    hideLabel={false}
                    value={variant.locationType ?? "online"}
                    onChange={(next) =>
                      set({ locationType: next as ServiceLocationType })
                    }
                    options={[
                      { value: "online", label: "Online" },
                      { value: "business-location", label: "Our location" },
                      { value: "customer-location", label: "Customer location" },
                    ]}
                  />
                </Field>
              </div>

              <div className="rounded-panel border border-border px-3.5 py-3">
                <CheckboxField
                  id="variant-booking"
                  label="Booking required"
                  hint="Customers pick a slot before this can be delivered."
                  checked={variant.bookingRequired ?? true}
                  onCheckedChange={(value) => set({ bookingRequired: value })}
                />
              </div>

              {variant.durationMinutes ? (
                <p className="text-sm font-medium text-text-muted">
                  Reads as “{formatDuration(variant.durationMinutes)}” everywhere it
                  is shown.
                </p>
              ) : null}
            </Section>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* Media                                                            */}
          {/* ---------------------------------------------------------------- */}
          {type !== "digital" ? (
            <Section title="Image">
              {/*
                * Picked from the product's media, never uploaded here.
                *
                * One library per product; a variant holds a reference into it.
                * A second uploader in this drawer is how a merchant ends up with
                * two different black-shirt photographs and no way to tell which
                * one the storefront shows.
                */}
              {images.length === 0 ? (
                <div className="flex items-center gap-3 rounded-panel border border-dashed border-border-strong bg-surface-secondary p-3.5">
                  <ProductThumb size="lg" url={fallbackImage} />
                  <p className="text-sm font-medium text-text-muted">
                    This product has no images yet. Add them on the Media tab and
                    they become assignable here.
                  </p>
                </div>
              ) : (
                <fieldset>
                  <legend className="sr-only">Variant image</legend>
                  <ul className="flex flex-wrap gap-2">
                    <li>
                      <button
                        type="button"
                        aria-pressed={!variant.imageUrl}
                        onClick={() => set({ imageUrl: undefined })}
                        className={cn(
                          "grid size-16 place-items-center gap-0.5 rounded-panel border text-text-muted transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                          !variant.imageUrl
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-dashed border-border bg-surface-secondary hover:border-border-strong",
                        )}
                      >
                        <ImageOff className="size-4" aria-hidden />
                        <span className="text-meta font-medium">Product</span>
                      </button>
                    </li>

                    {images.map((image) => (
                      <li key={image.id}>
                        <button
                          type="button"
                          aria-pressed={variant.imageUrl === image.url}
                          aria-label={image.alt ?? "Variant image"}
                          onClick={() => set({ imageUrl: image.url })}
                          className={cn(
                            "relative block size-16 overflow-hidden rounded-panel border transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                            variant.imageUrl === image.url
                              ? "border-primary"
                              : "border-border hover:border-border-strong",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.url}
                            alt=""
                            className="size-full object-cover"
                          />
                          {variant.imageUrl === image.url ? (
                            <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-white">
                              <Check className="size-2.5" aria-hidden />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-2 text-sm font-medium text-text-muted">
                    {variant.imageUrl
                      ? "Using its own image."
                      : "Showing the product’s image."}
                  </p>
                </fieldset>
              )}
            </Section>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* Performance                                                      */}
          {/* ---------------------------------------------------------------- */}
          <Section title="Performance">
            <dl className="grid grid-cols-2 gap-2">
              <Stat
                label={type === "service" ? "Bookings" : "Units sold"}
                value={formatNumber(variant.sales?.unitsSold ?? 0)}
              />
              <Stat
                label="Revenue"
                value={formatCurrency(variant.sales?.revenue ?? 0)}
              />
              <Stat label="Orders" value={formatNumber(variant.sales?.orders ?? 0)} />
              <Stat
                label="Last sold"
                value={
                  variant.sales?.lastSoldAt ? formatDate(variant.sales.lastSoldAt) : "—"
                }
              />
            </dl>
            <p className="text-sm font-medium text-text-muted">
              Last updated {formatDate(variant.updatedAt)}.
            </p>
          </Section>
        </div>
      ) : null}
    </Drawer>
  );
}
