"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  FileDown,
  MapPin,
  Package,
  Repeat,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { TabCount, TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { APP_ROUTES } from "@/constants";
import {
  UNIT_NOUN,
  VARIANT_QUANTITY_LABEL,
  formatDuration,
} from "@/constants/commerce";
import { COMMERCE_NOW_MS, ORDERS, STOCK_ACTIVITY } from "@/lib/commerce-fixtures";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import {
  availableOf,
  formatPriceRange,
  variantAvailability,
  priceRangeFrom,
  rollUpStock,
  variantName,
  variantStockStatus,
} from "@/lib/variants";
import { cn } from "@/lib/utils";
import type {
  Product,
  ProductVariant,
  VariantOption,
} from "@/types/commerce";
import {
  ProductStatusBadge,
  ProductThumb,
  StockBadge,
  VariantAvailabilityBadge,
} from "./commerce-badges";
import { VariantManager } from "./variants";

/**
 * A product, read rather than edited.
 *
 * The edit form answers "what should this be"; this page answers "how is it
 * doing" - which is a different question with a different shape, and the reason
 * the two are separate routes rather than one form with a stats header.
 *
 * The tab strip is per §15: five tabs every product has, then one more named in
 * the vocabulary of what it is. A shirt has *Inventory*, a download has *Files
 * & Delivery*, a consultation has *Bookings*. Giving all three the same tab and
 * blanking two thirds of it is exactly the habit the fulfilment ladders exist
 * to break.
 */

type TabKey =
  | "overview"
  | "variants"
  | "sales"
  | "customers"
  | "activity"
  | "type";

/** The sixth tab's label, in the product's own vocabulary. */
const TYPE_TAB_LABEL = {
  physical: "Inventory",
  digital: "Files & Delivery",
  service: "Bookings",
} as const;

/* -------------------------------------------------------------------------- */
/* Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function Figure({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: typeof Package;
}) {
  return (
    <div className="rounded-panel border border-border px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold text-text-primary tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-sm font-medium text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm font-medium text-text-secondary">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/** Label/value rows, for the type-specific summaries. */
function DetailList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-border rounded-panel border border-border">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5"
        >
          <dt className="text-sm font-medium text-text-secondary">{label}</dt>
          <dd className="text-sm font-bold text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                     */
/* -------------------------------------------------------------------------- */

export function ProductDetail({
  product,
  initialTab = "overview",
}: {
  product: Product;
  /** `?tab=variants` - what the product list's variant badge links to. */
  initialTab?: TabKey;
}) {
  const idBase = useId();
  const [tab, setTab] = useState<TabKey>(initialTab);

  /*
   * Variants are held here, seeded from the record.
   *
   * The writes stop at the fixtures like everywhere else in Commerce, but the
   * grid has to stay live while a merchant works down it - an inline stock edit
   * that snapped back on the next render would be worse than no editing at all.
   */
  const [hasVariants, setHasVariants] = useState(product.hasVariants);
  const [options, setOptions] = useState<VariantOption[]>(product.options ?? []);
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants ?? []);

  const basePrice = product.salePrice ?? product.price;
  const live = hasVariants && variants.length > 0;
  const range = priceRangeFrom(variants, basePrice, hasVariants);
  const stock = rollUpStock(variants);
  const unit = UNIT_NOUN[product.type];

  /* Orders that contain this product, newest first. Everything on the Sales,
     Customers and Activity tabs is a reading of this one list. */
  const orders = useMemo(
    () =>
      ORDERS.filter((order) =>
        order.lines.some((line) => line.productId === product.id),
      ).sort((a, b) => b.placedAt.localeCompare(a.placedAt)),
    [product.id],
  );

  /** Buyers, with what they spent on this product. */
  const customers = useMemo(() => {
    const byId = new Map<
      string,
      { name: string; orders: number; units: number; spent: number; last: string }
    >();

    for (const order of orders) {
      const lines = order.lines.filter((line) => line.productId === product.id);
      const existing = byId.get(order.customer.id);
      const units = lines.reduce((sum, line) => sum + line.quantity, 0);
      const spent = lines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0,
      );

      byId.set(order.customer.id, {
        name: order.customer.name,
        orders: (existing?.orders ?? 0) + 1,
        units: (existing?.units ?? 0) + units,
        spent: (existing?.spent ?? 0) + spent,
        last: existing?.last ?? order.placedAt,
      });
    }

    return [...byId.values()].sort((a, b) => b.spent - a.spent);
  }, [orders, product.id]);

  /** Variants ranked by what they sold - §17's "Top Variants", where it belongs. */
  const topVariants = useMemo(
    () =>
      [...variants]
        .filter((variant) => (variant.sales?.unitsSold ?? 0) > 0)
        .sort((a, b) => (b.sales?.revenue ?? 0) - (a.sales?.revenue ?? 0)),
    [variants],
  );

  const movements = useMemo(
    () => STOCK_ACTIVITY.filter((entry) => entry.productId === product.id),
    [product.id],
  );

  const tabs: TabItem<TabKey>[] = [
    { value: "overview", label: "Overview" },
    {
      value: "variants",
      label: "Variants",
      badge: live ? <TabCount value={variants.length} /> : undefined,
    },
    { value: "sales", label: "Sales" },
    { value: "customers", label: "Customers", badge: <TabCount value={customers.length} /> },
    { value: "activity", label: "Activity" },
    { value: "type", label: TYPE_TAB_LABEL[product.type] },
  ];

  return (
    <Card className="p-5">
      <Tabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        label="Product sections"
        idBase={idBase}
      />

      <div className="pt-6">
        {/* ------------------------------------------------------------------ */}
        {/* Overview                                                           */}
        {/* ------------------------------------------------------------------ */}
        {tab === "overview" ? (
          <TabPanel idBase={idBase} value="overview" className="space-y-5">
            <div className="flex flex-wrap items-start gap-4">
              <ProductThumb
                size="lg"
                url={product.images.find((image) => image.isThumbnail)?.url}
                alt={product.name}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ProductStatusBadge status={product.status} />
                  <Badge size="sm" casing="none">
                    {product.categoryName}
                  </Badge>
                  {live ? (
                    <Badge variant="primary" size="sm" casing="none">
                      {variants.length} variants
                    </Badge>
                  ) : null}
                </div>
                {product.description ? (
                  <p className="mt-2 max-w-2xl text-sm font-medium text-text-secondary">
                    {product.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {/* The price *range*, not a single figure, the moment a product
                  sells at more than one - see §8. */}
              <Figure
                label="Price"
                value={formatPriceRange(range)}
                hint={
                  live && range.min !== range.max
                    ? "Across active variants"
                    : product.salePrice
                      ? `Regular ${formatCurrency(product.price)}`
                      : undefined
                }
              />
              <Figure
                label={unit.many === "bookings" ? "Bookings" : "Units sold"}
                value={formatNumber(product.sales?.unitsSold ?? 0)}
                hint={`${product.sales?.orders ?? 0} orders`}
                icon={TrendingUp}
              />
              <Figure
                label="Revenue"
                value={formatCurrency(product.sales?.revenue ?? 0)}
                hint={
                  product.sales?.lastSoldAt
                    ? `Last sold ${formatDate(product.sales.lastSoldAt)}`
                    : "No sales yet"
                }
              />
              {product.type === "physical" ? (
                <Figure
                  label="Stock"
                  value={formatNumber(live ? stock.stock : product.stock)}
                  hint={live ? "Totalled from variants" : undefined}
                  icon={Package}
                />
              ) : product.type === "service" ? (
                <Figure
                  label="Capacity"
                  value={
                    product.service?.capacityPerSlot === null
                      ? "Unlimited"
                      : `${product.service?.capacityPerSlot ?? 1}/slot`
                  }
                  icon={CalendarCheck}
                />
              ) : (
                <Figure
                  label="Delivery"
                  value={product.digital?.accessType.replace("-", " ") ?? "Download"}
                  icon={FileDown}
                />
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Details">
                <DetailList
                  rows={[
                    ["SKU", product.sku],
                    ["Type", product.type],
                    ["Category", product.categoryName],
                    ["Visibility", product.visibility],
                    ["Updated", formatDate(product.updatedAt)],
                  ]}
                />
              </SectionCard>

              <SectionCard title="Tags">
                {product.tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <li key={tag}>
                        <Badge size="sm" casing="none">
                          {tag}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-text-muted">
                    No tags on this product.
                  </p>
                )}
              </SectionCard>
            </div>
          </TabPanel>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Variants                                                           */}
        {/* ------------------------------------------------------------------ */}
        {tab === "variants" ? (
          <TabPanel idBase={idBase} value="variants">
            {/*
              * No toggle here - the empty state's button is the way in.
              *
              * "This product has no variants / [Add Variants]" is a clearer
              * offer than a checkbox a merchant has to recognise, and turning
              * the whole system back off is a bigger decision that belongs on
              * the edit form beside the price it changes.
              */}
            <VariantManager
              type={product.type}
              baseSku={product.sku}
              basePrice={basePrice}
              enabled={hasVariants}
              onEnabledChange={setHasVariants}
              options={options}
              variants={variants}
              onChange={(nextOptions, nextVariants) => {
                setOptions(nextOptions);
                setVariants(nextVariants);
              }}
              productId={product.id}
              images={product.images}
              showToggle={false}
            />
          </TabPanel>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Sales                                                              */}
        {/* ------------------------------------------------------------------ */}
        {tab === "sales" ? (
          <TabPanel idBase={idBase} value="sales" className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Figure
                label={unit.many === "bookings" ? "Bookings" : "Units sold"}
                value={formatNumber(product.sales?.unitsSold ?? 0)}
              />
              <Figure
                label="Revenue"
                value={formatCurrency(product.sales?.revenue ?? 0)}
              />
              <Figure label="Orders" value={formatNumber(product.sales?.orders ?? 0)} />
              <Figure
                label="Customers"
                value={formatNumber(product.sales?.customers ?? 0)}
                icon={Users}
              />
            </div>

            {/* Variant-level sales, only where there are variants to compare.
                §17 is explicit that this must not crowd the page when it has
                nothing to say - so on a single-variant product it is absent. */}
            {live ? (
              <SectionCard
                title="Sales by variant"
                description="Which combinations are actually carrying the product."
              >
                {topVariants.length === 0 ? (
                  <EmptyState
                    compact
                    title="No variant sales yet"
                    description="Once an order records a variant, it appears here."
                  />
                ) : (
                  <Table minWidth="40rem">
                    <THead>
                      <TH>Variant</TH>
                      <TH>SKU</TH>
                      <TH align="right">
                        {unit.many === "bookings" ? "Booked" : "Sold"}
                      </TH>
                      <TH align="right">Revenue</TH>
                      <TH align="right">Orders</TH>
                    </THead>
                    <TBody>
                      {topVariants.map((variant) => (
                        <TR key={variant.id}>
                          <TD className="text-text-primary">
                            {variantName(variant.optionValues)}
                          </TD>
                          <TD className="font-mono text-text-muted">
                            {variant.sku}
                          </TD>
                          <TD align="right" className="tabular-nums">
                            {formatNumber(variant.sales?.unitsSold ?? 0)}
                          </TD>
                          <TD
                            align="right"
                            className="text-text-primary tabular-nums"
                          >
                            {formatCurrency(variant.sales?.revenue ?? 0)}
                          </TD>
                          <TD align="right" className="text-text-secondary tabular-nums">
                            {formatNumber(variant.sales?.orders ?? 0)}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </SectionCard>
            ) : null}
          </TabPanel>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Customers                                                          */}
        {/* ------------------------------------------------------------------ */}
        {tab === "customers" ? (
          <TabPanel idBase={idBase} value="customers">
            {customers.length === 0 ? (
              <EmptyState
                title="Nobody has bought this yet"
                description="Buyers appear here as soon as the first order comes in."
              />
            ) : (
              <Table minWidth="40rem">
                <THead>
                  <TH>Customer</TH>
                  <TH align="right">Orders</TH>
                  <TH align="right">
                    {unit.many === "bookings" ? "Bookings" : "Units"}
                  </TH>
                  <TH align="right">Spent</TH>
                </THead>
                <TBody>
                  {customers.map((customer) => (
                    <TR key={customer.name}>
                      <TD>
                        <Link
                          href={APP_ROUTES.contacts}
                          className="font-semibold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          {customer.name}
                        </Link>
                      </TD>
                      <TD align="right" className="tabular-nums text-text-secondary">
                        {customer.orders}
                      </TD>
                      <TD align="right" className="tabular-nums text-text-secondary">
                        {customer.units}
                      </TD>
                      <TD
                        align="right"
                        className="text-text-primary tabular-nums"
                      >
                        {formatCurrency(customer.spent)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </TabPanel>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Activity                                                           */}
        {/* ------------------------------------------------------------------ */}
        {tab === "activity" ? (
          <TabPanel idBase={idBase} value="activity" className="space-y-5">
            <SectionCard
              title="Recent orders"
              description="What was bought, down to the variant."
            >
              {orders.length === 0 ? (
                <EmptyState
                  compact
                  title="No orders yet"
                  description="Orders containing this product show up here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {orders.slice(0, 8).map((order) => (
                    <li key={order.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          href={APP_ROUTES.orders}
                          className="font-mono text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          {order.reference}
                        </Link>
                        <span className="text-sm text-text-muted">
                          {formatRelativeTime(order.placedAt, COMMERCE_NOW_MS)}
                        </span>
                      </div>

                      {/* The variant, spelled out - the reason §16 exists. */}
                      <ul className="mt-1 space-y-0.5">
                        {order.lines
                          .filter((line) => line.productId === product.id)
                          .map((line) => (
                            <li
                              key={`${line.productId}-${line.variantId ?? "base"}`}
                              className="text-sm font-medium text-text-secondary"
                            >
                              {line.variantName ? (
                                <span className="font-bold text-text-primary">
                                  {line.variantName}
                                </span>
                              ) : (
                                product.name
                              )}{" "}
                              · {line.quantity} × {formatCurrency(line.unitPrice)}
                              {line.sku ? (
                                <span className="ml-1.5 font-mono text-text-muted">
                                  {line.sku}
                                </span>
                              ) : null}
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {movements.length > 0 ? (
              <SectionCard
                title="Stock movements"
                description="Every adjustment, against the variant it moved."
              >
                <ul className="divide-y divide-border">
                  {movements.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {entry.variantName ?? product.name}
                        </p>
                        <p className="text-sm text-text-muted">
                          {entry.note ?? entry.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            entry.delta > 0 ? "text-primary" : "text-error",
                          )}
                        >
                          {entry.delta > 0 ? "+" : ""}
                          {entry.delta}
                        </span>
                        <p className="text-sm text-text-muted">
                          {formatRelativeTime(entry.at, COMMERCE_NOW_MS)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </TabPanel>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Type-specific                                                      */}
        {/* ------------------------------------------------------------------ */}
        {tab === "type" ? (
          <TabPanel idBase={idBase} value="type" className="space-y-5">
            {/* Physical → Inventory, per variant. */}
            {product.type === "physical" ? (
              live ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Figure
                      label="On hand"
                      value={formatNumber(stock.stock)}
                      hint="Across active variants"
                    />
                    <Figure
                      label="Reserved"
                      value={formatNumber(stock.reserved)}
                      hint="Held by open orders"
                    />
                    <Figure
                      label="Available"
                      value={formatNumber(stock.stock - stock.reserved)}
                      hint="Sellable right now"
                    />
                  </div>

                  <Table minWidth="44rem">
                    <THead>
                      <TH>Variant</TH>
                      <TH>SKU</TH>
                      <TH align="right">On hand</TH>
                      <TH align="right">Reserved</TH>
                      <TH align="right">Available</TH>
                      <TH>Status</TH>
                    </THead>
                    <TBody>
                      {variants.map((variant) => (
                        <TR key={variant.id}>
                          <TD className="text-text-primary">
                            {variantName(variant.optionValues)}
                          </TD>
                          <TD className="font-mono text-text-muted">
                            {variant.sku}
                          </TD>
                          <TD align="right" className="tabular-nums">
                            {variant.stock ?? 0}
                          </TD>
                          <TD
                            align="right"
                            className="tabular-nums text-text-secondary"
                          >
                            {variant.reserved ?? 0}
                          </TD>
                          <TD
                            align="right"
                            className={cn(
                              "tabular-nums",
                              availableOf(variant) <= 0
                                ? "text-error"
                                : "text-text-primary",
                            )}
                          >
                            {availableOf(variant)}
                          </TD>
                          <TD>
                            <StockBadge
                              status={variantStockStatus(variant)}
                              variant="health"
                            />
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </>
              ) : (
                <DetailList
                  rows={[
                    ["On hand", formatNumber(product.stock)],
                    ["Low stock threshold", formatNumber(product.lowStockThreshold)],
                    [
                      "Weight",
                      product.physical?.weightGrams
                        ? `${product.physical.weightGrams} g`
                        : "-",
                    ],
                    [
                      "Shipping",
                      product.physical?.shippingRequired ? "Required" : "Not required",
                    ],
                  ]}
                />
              )
            ) : null}

            {/* Digital → what is delivered, per licence tier. */}
            {product.type === "digital" ? (
              live ? (
                <Table minWidth="46rem">
                  <THead>
                    <TH>Variant</TH>
                    <TH>File</TH>
                    <TH align="right">Downloads</TH>
                    <TH align="right">Access</TH>
                    <TH>Status</TH>
                  </THead>
                  <TBody>
                    {variants.map((variant) => (
                      <TR key={variant.id}>
                        <TD className="text-text-primary">
                          {variantName(variant.optionValues)}
                        </TD>
                        <TD className="font-mono text-text-secondary">
                          {variant.fileName ?? "-"}
                          {variant.fileSizeMb ? (
                            <span className="ml-1.5 text-text-muted">
                              {variant.fileSizeMb} MB
                            </span>
                          ) : null}
                        </TD>
                        <TD align="right" className="tabular-nums text-text-secondary">
                          {variant.downloadLimit ?? "Unlimited"}
                        </TD>
                        <TD align="right" className="tabular-nums text-text-secondary">
                          {variant.accessExpiryDays
                            ? `${variant.accessExpiryDays} days`
                            : "Permanent"}
                        </TD>
                        <TD>
                          <VariantAvailabilityBadge
                            availability={variantAvailability(variant, product.type)}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              ) : (
                <DetailList
                  rows={[
                    ["Access type", product.digital?.accessType ?? "download"],
                    ["File", product.digital?.fileName ?? "-"],
                    [
                      "Download limit",
                      product.digital?.downloadLimit === null
                        ? "Unlimited"
                        : String(product.digital?.downloadLimit ?? "-"),
                    ],
                    [
                      "Access expiry",
                      product.digital?.accessExpiryDays
                        ? `${product.digital.accessExpiryDays} days`
                        : "Permanent",
                    ],
                  ]}
                />
              )
            ) : null}

            {/* Service → how it is booked and delivered, per session length. */}
            {product.type === "service" ? (
              live ? (
                <Table minWidth="46rem">
                  <THead>
                    <TH>Variant</TH>
                    <TH>Duration</TH>
                    <TH align="right">Capacity</TH>
                    <TH>Location</TH>
                    <TH>Status</TH>
                  </THead>
                  <TBody>
                    {variants.map((variant) => (
                      <TR key={variant.id}>
                        <TD className="text-text-primary">
                          {variantName(variant.optionValues)}
                        </TD>
                        <TD className="text-text-secondary">
                          <span className="inline-flex items-center gap-1.5">
                            <Timer className="size-3.5 text-text-muted" aria-hidden />
                            {variant.durationMinutes
                              ? formatDuration(variant.durationMinutes)
                              : "-"}
                          </span>
                        </TD>
                        <TD align="right" className="tabular-nums text-text-secondary">
                          {variant.capacityPerSlot === null ||
                          variant.capacityPerSlot === undefined
                            ? "Unlimited"
                            : `${variant.capacityPerSlot} ${VARIANT_QUANTITY_LABEL.service.noun}`}
                        </TD>
                        <TD className="text-text-secondary">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-text-muted" aria-hidden />
                            {(variant.locationType ?? "online").replace("-", " ")}
                          </span>
                        </TD>
                        <TD>
                          <VariantAvailabilityBadge
                            availability={variantAvailability(variant, product.type)}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              ) : (
                <DetailList
                  rows={[
                    [
                      "Duration",
                      product.service?.durationMinutes
                        ? formatDuration(product.service.durationMinutes)
                        : "-",
                    ],
                    [
                      "Booking",
                      product.service?.bookingRequired ? "Required" : "Not required",
                    ],
                    [
                      "Location",
                      (product.service?.locationType ?? "online").replace("-", " "),
                    ],
                    [
                      "Capacity",
                      product.service?.capacityPerSlot === null
                        ? "Unlimited"
                        : `${product.service?.capacityPerSlot ?? 1} per slot`,
                    ],
                  ]}
                />
              )
            ) : null}

            {/* A product whose type detail is managed per variant should say so
                rather than leave the merchant hunting for the fields. */}
            {live ? (
              <p className="flex items-center gap-2 text-sm font-medium text-text-muted">
                <Repeat className="size-4 shrink-0" aria-hidden />
                Managed per variant. Change any of it on the Variants tab.
              </p>
            ) : null}
          </TabPanel>
        ) : null}
      </div>
    </Card>
  );
}
