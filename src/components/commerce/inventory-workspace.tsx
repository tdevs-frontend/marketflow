"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  Minus,
  PackageX,
  Plus,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { APP_ROUTES } from "@/constants";
import { STOCK_ADJUSTMENT_REASONS } from "@/constants/commerce";
import { INVENTORY, STOCK_ACTIVITY, stockStatusOf } from "@/lib/commerce-fixtures";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockAdjustmentReason } from "@/types/commerce";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import { ProductThumb, StockBadge } from "./commerce-badges";

const REASON_LABEL = Object.fromEntries(
  STOCK_ADJUSTMENT_REASONS.map((item) => [item.value, item.label]),
) as Record<StockAdjustmentReason, string>;

function kpis(): CommerceKpi[] {
  const low = INVENTORY.filter(
    (item) => stockStatusOf(item.stock, item.lowStockThreshold) === "low-stock",
  );
  const out = INVENTORY.filter(
    (item) => stockStatusOf(item.stock, item.lowStockThreshold) === "out-of-stock",
  );
  const value = INVENTORY.reduce(
    (sum, item) => sum + item.stock * item.unitCost,
    0,
  );

  return [
    {
      label: "Total Items",
      value: formatNumber(INVENTORY.reduce((sum, item) => sum + item.stock, 0)),
      icon: Boxes,
      /* Rows, not products — a shirt in twelve sizes is twelve things to count
         and one thing to sell, and this page is about the counting. */
      hint: `${INVENTORY.length} tracked ${INVENTORY.length === 1 ? "item" : "items"}`,
    },
    {
      label: "Low Stock",
      value: formatNumber(low.length),
      icon: TriangleAlert,
      tone: low.length ? "warning" : "neutral",
    },
    {
      label: "Out of Stock",
      value: formatNumber(out.length),
      icon: PackageX,
      tone: out.length ? "danger" : "neutral",
    },
    {
      label: "Inventory Value",
      value: formatCurrency(value),
      icon: CircleDollarSign,
      tone: "brand",
      hint: "Stock on hand at cost",
    },
  ];
}

/**
 * A row's identity.
 *
 * Product id alone stopped being unique the moment stock moved to the variant:
 * twelve T-shirt rows all share one `productId`, so the adjustment dialog's
 * selection, the table's keys and the "which shelf" question all key on the
 * pair. `variantId` is absent for a product that has no variants, which is
 * exactly the single-row case this keeps working.
 */
const rowKey = (item: { productId: string; variantId?: string }) =>
  item.variantId ? `${item.productId}::${item.variantId}` : item.productId;

/** "Premium T-Shirt — M / Black", or just the product where there is no variant. */
const rowLabel = (item: { productName: string; variantName?: string }) =>
  item.variantName ? `${item.productName} — ${item.variantName}` : item.productName;

export function InventoryWorkspace() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(INVENTORY[0] ? rowKey(INVENTORY[0]) : "");
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState<StockAdjustmentReason>("stock-received");
  const [note, setNote] = useState("");

  const selected = useMemo(
    () => INVENTORY.find((item) => rowKey(item) === target),
    [target],
  );

  const parsedDelta = Number(delta) || 0;
  const resulting = (selected?.stock ?? 0) + parsedDelta;

  /* Sorted worst-first: the point of this page is what needs attention. */
  const rows = useMemo(
    () =>
      [...INVENTORY].sort(
        (a, b) =>
          a.stock - a.lowStockThreshold - (b.stock - b.lowStockThreshold),
      ),
    [],
  );

  return (
    <>
      <CommerceKpis items={kpis()} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base">Stock levels</h2>
              <p className="mt-1 text-sm text-text-secondary font-medium">
                One row per variant, sorted by how close each is to running out.
              </p>
            </div>
            <Button size="compact" onClick={() => setOpen(true)}>
              <SlidersHorizontal aria-hidden />
              Stock Adjustment
            </Button>
          </div>

          <div className="mt-4 max-lg:hidden">
            <Table minWidth="68rem">
              <THead>
                <TH>Product</TH>
                {/* Variant gets a column of its own rather than being appended
                    to the product name: it is what a picker scans for, and a
                    name that reads "Premium T-Shirt — M / Black" cannot be
                    sorted, filtered or truncated independently of the product. */}
                <TH>Variant</TH>
                <TH>SKU</TH>
                <TH align="right">Current</TH>
                <TH align="right">Reserved</TH>
                <TH align="right">Available</TH>
                <TH align="right">Threshold</TH>
                <TH>Status</TH>
                <TH>Updated</TH>
              </THead>

              <TBody>
                {rows.map((item) => {
                  const available = item.stock - item.reserved;
                  const state = stockStatusOf(item.stock, item.lowStockThreshold);

                  return (
                    <TR key={rowKey(item)}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <ProductThumb size="sm" />
                          <Link
                            href={`${APP_ROUTES.products}/${item.productId}`}
                            className="truncate font-bold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            {item.productName}
                          </Link>
                        </div>
                      </TD>
                      <TD className="text-text-secondary">
                        {item.variantName ?? (
                          <span className="text-text-muted">—</span>
                        )}
                      </TD>
                      <TD className="font-mono text-sm text-text-muted">{item.sku}</TD>
                      <TD align="right" className="font-bold text-text-primary tabular-nums">
                        {item.stock}
                      </TD>
                      <TD align="right" className="text-text-secondary tabular-nums">
                        {item.reserved}
                      </TD>
                      <TD
                        align="right"
                        className={cn(
                          "font-medium tabular-nums",
                          available <= 0 ? "text-error" : "text-text-primary",
                        )}
                      >
                        {available}
                      </TD>
                      <TD align="right" className="text-text-muted tabular-nums">
                        {item.lowStockThreshold}
                      </TD>
                      <TD>
                        <StockBadge status={state} variant="health" />
                      </TD>
                      <TD className="text-sm whitespace-nowrap text-text-muted">
                        {formatRelativeTime(item.updatedAt)}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>

          <ul className="mt-4 space-y-2.5 lg:hidden">
            {rows.map((item) => {
              const available = item.stock - item.reserved;
              const state = stockStatusOf(item.stock, item.lowStockThreshold);

              return (
                <li
                  key={rowKey(item)}
                  className="rounded-panel border border-border p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <ProductThumb size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {item.productName}
                      </p>
                      {item.variantName ? (
                        <p className="truncate text-sm font-medium text-text-secondary">
                          {item.variantName}
                        </p>
                      ) : null}
                      <p className="font-mono text-sm text-text-muted">
                        {item.sku}
                      </p>
                    </div>
                    <StockBadge status={state} variant="health" />
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Current", value: item.stock },
                      { label: "Reserved", value: item.reserved },
                      { label: "Available", value: available },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-panel bg-surface-secondary py-2"
                      >
                        <dt className="text-sm font-medium text-text-muted">
                          {cell.label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
                          {cell.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Activity */}
        <Card className="p-5">
          <h2 className="text-base">Inventory Activity</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Every movement, newest first.
          </p>

          <ol className="mt-4">
            {STOCK_ACTIVITY.map((entry, index) => {
              const positive = entry.delta > 0;
              const last = index === STOCK_ACTIVITY.length - 1;

              return (
                <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {last ? null : (
                    <span
                      aria-hidden
                      className="absolute top-9 bottom-0 left-4 w-px bg-border"
                    />
                  )}

                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      positive
                        ? "bg-primary-soft text-primary"
                        : "bg-error-soft text-error-text",
                    )}
                  >
                    {positive ? (
                      <Plus className="size-4" aria-hidden />
                    ) : (
                      <Minus className="size-4" aria-hidden />
                    )}
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm">
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          positive ? "text-primary" : "text-error",
                        )}
                      >
                        {positive ? "+" : ""}
                        {entry.delta}
                      </span>{" "}
                      <span className="font-medium text-text-primary">
                        {entry.productName}
                      </span>
                      {/* Which shelf moved. Without it the feed says a number
                          changed somewhere inside a product. */}
                      {entry.variantName ? (
                        <span className="font-medium text-text-secondary">
                          {" · "}
                          {entry.variantName}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {entry.note ?? REASON_LABEL[entry.reason]}
                    </p>
                    <p className="text-sm text-text-muted">
                      {formatRelativeTime(entry.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Stock adjustment"
        description="Record stock coming in or going out, against the exact item it moved."
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="compact"
              disabled={parsedDelta === 0 || resulting < 0}
              onClick={() => setOpen(false)}
            >
              Apply adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/*
            * The adjustment targets a variant, not a product.
            *
            * "+24 Premium T-Shirt" is not something anyone can act on once the
            * shirt exists in twelve sizes — there is no shelf it describes. The
            * option list is therefore one entry per stocked combination, with
            * the SKU as the second line because that is what is printed on the
            * box being counted.
            */}
          <Field label="Item" htmlFor="adj-product">
            <Select
              id="adj-product"
              label="Item"
              hideLabel={false}
              value={target}
              onChange={setTarget}
              options={INVENTORY.map((item) => ({
                value: rowKey(item),
                label: rowLabel(item),
                hint: item.sku,
              }))}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Current Stock" htmlFor="adj-current">
              <Input
                id="adj-current"
                value={selected?.stock ?? 0}
                readOnly
                className="bg-surface-secondary"
              />
            </Field>

            <Field
              label="Adjustment"
              htmlFor="adj-delta"
              hint="Negative removes stock."
              error={resulting < 0 ? "That would take stock below zero." : undefined}
            >
              <Input
                id="adj-delta"
                type="number"
                inputMode="numeric"
                value={delta}
                error={resulting < 0}
                onChange={(event) => setDelta(event.target.value)}
              />
            </Field>
          </div>

          {/* The number the merchant is actually deciding on. */}
          <div className="flex items-center justify-between rounded-panel bg-surface-secondary px-3.5 py-3 text-sm">
            <span className="text-text-secondary">Resulting stock</span>
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                resulting < 0 ? "text-error" : "text-text-primary",
              )}
            >
              {resulting}
            </span>
          </div>

          <Field label="Reason" htmlFor="adj-reason">
            <Select
              id="adj-reason"
              label="Reason"
              hideLabel={false}
              value={reason}
              onChange={(next) => setReason(next as StockAdjustmentReason)}
              options={STOCK_ADJUSTMENT_REASONS}
            />
          </Field>

          <Field label="Note" htmlFor="adj-note" hint="Optional. Shows in the activity feed.">
            <Textarea
              id="adj-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
