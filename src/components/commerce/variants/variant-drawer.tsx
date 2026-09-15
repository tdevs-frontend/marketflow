"use client";

import type { ReactNode } from "react";
import { FileDown, ImagePlus, Upload } from "lucide-react";

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
  variantName,
  variantStockStatus,
} from "@/lib/variants";
import type {
  ProductType,
  ProductVariant,
  ServiceLocationType,
  VariantStatus,
} from "@/types/commerce";
import { ProductThumb, StockBadge, VariantStatusBadge } from "../commerce-badges";

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
 * duration, a capacity and where it happens; only a physical one gets weight
 * and a barcode. This is where the table's deliberate shallowness is paid back.
 */

/** A read-only figure in the drawer's stat strip. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-panel bg-surface-secondary px-3 py-2.5">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
        {title}
      </h3>
      <div className="mt-2.5 space-y-5">{children}</div>
    </section>
  );
}

const GRID = "grid gap-5 sm:grid-cols-2";

export function VariantDrawer({
  variant,
  type,
  basePrice,
  optionNames,
  fallbackImage,
  onClose,
  onPatch,
}: {
  variant: ProductVariant | null;
  type: ProductType;
  basePrice: number;
  /** The option each value belongs to — "Size: Medium", not just "Medium". */
  optionNames: string[];
  fallbackImage?: string;
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

  return (
    <Drawer
      open={Boolean(variant)}
      onClose={onClose}
      title={variant ? variantName(variant.optionValues) : "Variant"}
      description={
        variant
          ? `${VARIANT_CODE_LABEL[type]} ${variant.sku || "—"}`
          : undefined
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
            <VariantStatusBadge status={variant.status} />
            {type === "physical" ? (
              <StockBadge status={variantStockStatus(variant)} />
            ) : null}
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
              <Field label={VARIANT_CODE_LABEL[type]} htmlFor="variant-sku">
                <Input
                  id="variant-sku"
                  value={variant.sku}
                  className="font-mono"
                  onChange={(event) => set({ sku: event.target.value.toUpperCase() })}
                />
              </Field>

              <Field label="Status" htmlFor="variant-status">
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
                  label="Cost"
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
                    onChange={(event) =>
                      set({ costPrice: number(event.target.value) })
                    }
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
              <div className={GRID}>
                <Field label="Stock" htmlFor="variant-stock">
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
                  label="Reserved"
                  htmlFor="variant-reserved"
                  hint="Held by unfulfilled orders."
                >
                  <Input
                    id="variant-reserved"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.reserved ?? 0}
                    onChange={(event) =>
                      set({ reserved: Math.max(0, Number(event.target.value) || 0) })
                    }
                  />
                </Field>

                <Field
                  label="Low Stock Threshold"
                  htmlFor="variant-threshold"
                  hint="Below this, the variant shows as Low Stock."
                >
                  <Input
                    id="variant-threshold"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={variant.lowStockThreshold ?? 0}
                    onChange={(event) =>
                      set({
                        lowStockThreshold: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                </Field>

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

              <dl className="grid grid-cols-2 gap-2">
                <Stat label="Available" value={formatNumber(availableOf(variant))} />
                <Stat label="Reserved" value={formatNumber(variant.reserved ?? 0)} />
              </dl>
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
                <Field label="License Type" htmlFor="variant-license">
                  <Select
                    id="variant-license"
                    label="License Type"
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
                  label="Download Limit"
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
                  label="Access Expiration (days)"
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
              <div className="flex items-center gap-3 rounded-panel border border-border p-3.5">
                <ProductThumb
                  size="lg"
                  url={variant.imageUrl ?? fallbackImage}
                  alt={variantName(variant.optionValues)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {variant.imageUrl ? "Variant image" : "Inherited from product"}
                  </p>
                  <p className="text-sm text-text-muted">
                    A variant with no image of its own shows the product’s.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <ImagePlus aria-hidden />
                  Upload
                </Button>
              </div>
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
                  variant.sales?.lastSoldAt
                    ? formatDate(variant.sales.lastSoldAt)
                    : "—"
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
