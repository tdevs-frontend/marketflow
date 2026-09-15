"use client";

import { useState } from "react";
import { Check, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CheckboxField } from "@/components/ui/checkbox";
import { VARIANT_QUANTITY_LABEL } from "@/constants/commerce";
import { formatCurrency } from "@/lib/format";
import { variantName } from "@/lib/variants";
import { cn } from "@/lib/utils";
import type {
  ProductImage,
  ProductType,
  ProductVariant,
  VariantOption,
} from "@/types/commerce";

/**
 * The bulk editors.
 *
 * Three narrow dialogs rather than one "edit everything" sheet, because bulk
 * editing is only ever worth doing when the merchant already knows which single
 * thing they want to change across forty rows — a price rise, a delivery, a new
 * photograph. A combined dialog would make them scroll past two sections they
 * do not want on the way to the one they do, and would need a "leave unchanged"
 * state on every field to be safe.
 *
 * All three share the same contract: a field left empty is left alone. Nothing
 * here writes a value the merchant did not type, which is what makes it safe to
 * run over a selection without auditing every row afterwards.
 */

/** Empty means "leave this field as it is". */
const optionalNumber = (raw: string): number | undefined =>
  raw.trim() === "" ? undefined : Number(raw);

/* -------------------------------------------------------------------------- */
/* Pricing                                                                    */
/* -------------------------------------------------------------------------- */

export function BulkPricingDialog({
  open,
  count,
  basePrice,
  onClose,
  onApply,
}: {
  open: boolean;
  count: number;
  basePrice: number;
  onClose: () => void;
  onApply: (patch: Partial<ProductVariant>) => void;
}) {
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [cost, setCost] = useState("");
  /* The explicit way back to inheritance. Clearing a field means "don't touch",
     so there has to be a separate way to say "follow the product again". */
  const [inherit, setInherit] = useState(false);

  function apply() {
    const patch: Partial<ProductVariant> = {};
    if (inherit) patch.price = undefined;
    else if (price.trim() !== "") patch.price = Number(price);
    if (compareAt.trim() !== "") patch.compareAtPrice = Number(compareAt);
    if (cost.trim() !== "") patch.costPrice = Number(cost);

    onApply(patch);
    setPrice("");
    setCompareAt("");
    setCost("");
    setInherit(false);
  }

  const nothingToDo = !inherit && !price.trim() && !compareAt.trim() && !cost.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit pricing"
      description={`Applies to ${count} selected ${count === 1 ? "variant" : "variants"}. Empty fields are left unchanged.`}
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" disabled={nothingToDo} onClick={apply}>
            Apply to {count}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-panel border border-border px-3.5 py-3">
          <CheckboxField
            id="bulk-inherit"
            label="Use the product price"
            hint={`Clears the variant price so these follow ${formatCurrency(basePrice)} and any future change to it.`}
            checked={inherit}
            onCheckedChange={setInherit}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Price"
            htmlFor="bulk-price"
            hint={inherit ? "Ignored while inheriting." : undefined}
          >
            <Input
              id="bulk-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              disabled={inherit}
              placeholder="Leave empty"
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>

          <Field label="Compare-at Price" htmlFor="bulk-compare">
            <Input
              id="bulk-compare"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={compareAt}
              placeholder="Leave empty"
              onChange={(event) => setCompareAt(event.target.value)}
            />
          </Field>

          <Field label="Cost per item" htmlFor="bulk-cost">
            <Input
              id="bulk-cost"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={cost}
              placeholder="Leave empty"
              onChange={(event) => setCost(event.target.value)}
            />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export type InventoryMode = "set" | "increase" | "decrease";

const MODES = [
  { value: "set", label: "Set to" },
  { value: "increase", label: "Increase by" },
  { value: "decrease", label: "Decrease by" },
];

export function BulkInventoryDialog({
  open,
  count,
  type,
  onClose,
  onApply,
}: {
  open: boolean;
  count: number;
  type: ProductType;
  onClose: () => void;
  onApply: (input: {
    mode: InventoryMode;
    quantity?: number;
    threshold?: number;
    trackInventory?: boolean;
    continueSelling?: boolean;
  }) => void;
}) {
  const [mode, setMode] = useState<InventoryMode>("set");
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("");
  const [track, setTrack] = useState<"unchanged" | "on" | "off">("unchanged");
  const [oversell, setOversell] = useState<"unchanged" | "on" | "off">("unchanged");

  const quantityLabel = VARIANT_QUANTITY_LABEL[type].column;

  function apply() {
    onApply({
      mode,
      quantity: optionalNumber(quantity),
      threshold: optionalNumber(threshold),
      trackInventory: track === "unchanged" ? undefined : track === "on",
      continueSelling: oversell === "unchanged" ? undefined : oversell === "on",
    });
    setQuantity("");
    setThreshold("");
    setTrack("unchanged");
    setOversell("unchanged");
  }

  const nothingToDo =
    !quantity.trim() &&
    !threshold.trim() &&
    track === "unchanged" &&
    oversell === "unchanged";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={type === "service" ? "Adjust capacity" : "Adjust inventory"}
      description={`Applies to ${count} selected ${count === 1 ? "variant" : "variants"}. Empty fields are left unchanged.`}
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" disabled={nothingToDo} onClick={apply}>
            Apply to {count}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {/*
            * Set / increase / decrease, because both jobs are real: "these four
            * sizes now hold 40" when setting a product up, and "+12 to each"
            * after a delivery. A single absolute field forces a merchant to
            * read every current figure and do the arithmetic themselves.
            */}
          <Field label="Change" htmlFor="bulk-mode">
            <Select
              id="bulk-mode"
              label="Change"
              hideLabel={false}
              value={mode}
              onChange={(next) => setMode(next as InventoryMode)}
              options={MODES}
            />
          </Field>

          <Field label={quantityLabel} htmlFor="bulk-quantity">
            <Input
              id="bulk-quantity"
              type="number"
              inputMode="numeric"
              min={0}
              value={quantity}
              placeholder="Leave empty"
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>

          {type === "physical" ? (
            <Field
              label="Low stock threshold"
              htmlFor="bulk-threshold"
              hint="Below this, a variant reads Low Stock."
            >
              <Input
                id="bulk-threshold"
                type="number"
                inputMode="numeric"
                min={0}
                value={threshold}
                placeholder="Leave empty"
                onChange={(event) => setThreshold(event.target.value)}
              />
            </Field>
          ) : null}
        </div>

        {type === "physical" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Track inventory" htmlFor="bulk-track">
              <Select
                id="bulk-track"
                label="Track inventory"
                hideLabel={false}
                value={track}
                onChange={(next) => setTrack(next as typeof track)}
                options={[
                  { value: "unchanged", label: "Leave unchanged" },
                  { value: "on", label: "Track" },
                  { value: "off", label: "Do not track" },
                ]}
              />
            </Field>

            <Field
              label="Continue selling at zero"
              htmlFor="bulk-oversell"
              hint="For made-to-order sizes with no shelf."
            >
              <Select
                id="bulk-oversell"
                label="Continue selling at zero"
                hideLabel={false}
                value={oversell}
                onChange={(next) => setOversell(next as typeof oversell)}
                options={[
                  { value: "unchanged", label: "Leave unchanged" },
                  { value: "on", label: "Keep selling" },
                  { value: "off", label: "Stop at zero" },
                ]}
              />
            </Field>
          </div>
        ) : null}

        {/* Reserved is never offered here — it is read off the order book, and
            a bulk control that appeared to set it would be a lie. */}
        {type === "physical" ? (
          <p className="text-sm font-medium text-text-muted">
            Reserved and available are calculated from open orders and cannot be
            set by hand.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Assigning one of the product's photographs to a set of variants.
 *
 * It picks from `product.images` rather than uploading, which is the whole
 * point: there is one media library per product and a variant *references* it.
 * A second uploader here would let a merchant end up with a black shirt photo
 * on the product and a different black shirt photo on the variant, with no way
 * to tell which one the storefront shows.
 *
 * The option-value shortcut is what makes this worth opening at all — "apply to
 * every Black variant" is the real job, and doing it by ticking four rows in a
 * twelve-row table is the tedium this replaces.
 */
export function VariantMediaDialog({
  open,
  variants,
  options,
  images,
  onClose,
  onApply,
}: {
  open: boolean;
  /** The current selection. May be empty when opened from the option shortcut. */
  variants: ProductVariant[];
  options: VariantOption[];
  images: ProductImage[];
  onClose: () => void;
  onApply: (imageUrl: string | undefined, variantIds: string[]) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  /* "opt-1:Black" — which option value the assignment should sweep across. */
  const [scope, setScope] = useState("selection");

  const scopeOptions = [
    {
      value: "selection",
      label: `Selected variants (${variants.length})`,
      hint: "Only the rows you ticked",
    },
    ...options.flatMap((option, index) =>
      option.values.map((value) => ({
        value: `${index}:${value}`,
        label: `Every ${value} variant`,
        hint: option.name,
      })),
    ),
  ];

  /** Which ids the assignment lands on, given the chosen scope. */
  function targets(all: ProductVariant[]): string[] {
    if (scope === "selection") return variants.map((variant) => variant.id);
    /* Split on the first colon only — an option value may contain one. */
    const at = scope.indexOf(":");
    const index = scope.slice(0, at);
    const value = scope.slice(at + 1);
    return all
      .filter((variant) => variant.optionValues[Number(index)] === value)
      .map((variant) => variant.id);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Assign image"
      description="Variants show the product image unless they are given one of their own."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={chosen === null}
            onClick={() => {
              onApply(chosen === "" ? undefined : (chosen ?? undefined), targets(variants));
              setChosen(null);
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {images.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border-strong bg-surface-secondary px-3.5 py-6 text-center text-sm font-medium text-text-muted">
            This product has no images yet. Add them on the Media tab and they
            become available here.
          </p>
        ) : (
          <>
            <fieldset>
              <legend className="mb-2 block text-sm font-bold text-text-secondary">
                Image
              </legend>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {/* "Use the product image" is a real choice, not an absence —
                    it is how a merchant undoes an assignment. */}
                <li>
                  <button
                    type="button"
                    aria-pressed={chosen === ""}
                    onClick={() => setChosen("")}
                    className={cn(
                      "grid aspect-square w-full place-items-center gap-1 rounded-panel border text-text-muted transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      chosen === ""
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-dashed border-border bg-surface-secondary hover:border-border-strong",
                    )}
                  >
                    <ImageOff className="size-4" aria-hidden />
                    <span className="text-meta font-medium">Product image</span>
                  </button>
                </li>

                {images.map((image) => (
                  <li key={image.id}>
                    <button
                      type="button"
                      aria-pressed={chosen === image.url}
                      onClick={() => setChosen(image.url)}
                      className={cn(
                        "relative block aspect-square w-full overflow-hidden rounded-panel border transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                        chosen === image.url
                          ? "border-primary"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.alt ?? ""}
                        className="size-full object-cover"
                      />
                      {chosen === image.url ? (
                        <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-white">
                          <Check className="size-3" aria-hidden />
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>

            <Field label="Apply to" htmlFor="media-scope">
              <Select
                id="media-scope"
                label="Apply to"
                hideLabel={false}
                value={scope}
                onChange={setScope}
                options={scopeOptions}
              />
            </Field>

            {scope !== "selection" ? (
              <p className="rounded-panel bg-primary-soft px-3.5 py-3 text-sm text-primary-dark">
                Every variant sharing that option value gets this image —
                including any generated later.
              </p>
            ) : variants.length > 0 ? (
              <p className="text-sm font-medium text-text-muted">
                {variants
                  .slice(0, 4)
                  .map((variant) => variantName(variant.optionValues))
                  .join(", ")}
                {variants.length > 4 ? ` +${variants.length - 4} more` : ""}
              </p>
            ) : null}
          </>
        )}
      </div>
    </Dialog>
  );
}
