"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  DateRangePicker,
  DEFAULT_RANGE,
  type DateRangeValue,
} from "@/components/ui/date-range";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { APP_ROUTES } from "@/constants/app";
import {
  CHANNEL_LABEL,
  SALES_CHANNELS,
  SALE_STATUSES,
  UNIT_NOUN,
} from "@/constants/commerce";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  COMMERCE_NOW_MS,
  SALES,
  salesTotals,
  topSellers,
} from "@/lib/commerce-fixtures";
import { cn } from "@/lib/utils";
import type { OrderType, ProductType, SalesChannel } from "@/types/commerce";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import { FilterBar } from "./filter-bar";
import { SaleStatusBadge } from "./commerce-badges";

/**
 * Sales — how much did I sell?
 *
 * Deliberately not Orders. Orders is the operational queue: what needs packing,
 * what needs scheduling, whose access has not been granted. This is the
 * commercial reading of the same data — revenue, channel mix, what sells — and
 * it carries none of the operational actions. Clicking a row goes to the order,
 * which is the one place those live.
 *
 * Every figure here is derived from `ORDERS`. There is no sales ledger to drift
 * out of step with the order book, which is the failure this separation is
 * usually blamed for and does not have to cause.
 */

const ALL = "all";

type TypeView = typeof ALL | OrderType;

const TYPE_VIEWS: { value: TypeView; label: string }[] = [
  { value: ALL, label: "All" },
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "service", label: "Services" },
];

export function SalesWorkspace() {
  const [view, setView] = useState<TypeView>(ALL);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = rangeCutoff(range);

    return SALES.filter((sale) => {
      /* A mixed order counts under every type it contains, so filtering to
         Digital does not hide a sale that was half digital. */
      if (view !== ALL && sale.type !== view && sale.type !== "mixed") return false;
      if (channel !== ALL && sale.channel !== channel) return false;
      if (status !== ALL && sale.status !== status) return false;
      if (cutoff !== null && new Date(sale.at).getTime() < cutoff) return false;

      if (term) {
        const haystack = [
          sale.orderReference,
          sale.customerName,
          sale.productName,
          /* Searchable, so "XL" or "Commercial" finds the sales it should. */
          sale.variantName ?? "",
          CHANNEL_LABEL[sale.channel],
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  }, [view, search, channel, status, range]);

  const totals = useMemo(() => salesTotals(filtered), [filtered]);

  const kpis: CommerceKpi[] = [
    {
      label: "Gross Sales",
      value: formatCurrency(totals.gross),
      icon: Banknote,
      tone: "brand",
      hint: "Before discounts and refunds",
    },
    {
      label: "Net Sales",
      value: formatCurrency(totals.net),
      icon: TrendingUp,
      tone: "success",
      hint: "What reached the business",
    },
    /*
     * Orders is the one *count* in a row of money, so it takes the blue and
     * leaves indigo, green and violet to the three currency figures. Both of
     * these were untoned and came out as the same grey tile.
     */
    {
      label: "Orders",
      value: formatNumber(totals.orders),
      icon: ShoppingCart,
      tone: "info",
      hint: "Excluding failed payments",
    },
    {
      label: "Average Order Value",
      value: formatCurrency(totals.averageOrderValue),
      icon: Receipt,
      tone: "sms",
      hint: "Net, per order",
    },
    {
      label: "Refunds",
      value: formatCurrency(totals.refunds),
      icon: RotateCcw,
      tone: totals.refunds > 0 ? "warning" : "neutral",
      hint: totals.refunds > 0 ? "Returned to customers" : "Nothing refunded",
    },
  ];

  const activeFilters =
    (channel === ALL ? 0 : 1) + (status === ALL ? 0 : 1);

  return (
    <>
      <PageHeader
        title="Sales"
        description="Track revenue and sales performance across products, services and channels."
      />

      <CommerceKpis items={kpis} />

      {SALES.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="Revenue appears here as soon as your first order is paid."
          action={
            <ButtonLink href={APP_ROUTES.products} size="sm">
              Add a product
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Card className="p-5">
            <div className="mb-4 -mx-1 overflow-x-auto px-1">
              <SegmentedControl
                label="Filter sales by product type"
                value={view}
                onChange={setView}
                options={TYPE_VIEWS}
              />
            </div>

            <FilterBar
              search={search}
              onSearchChange={setSearch}
              placeholder="Search order, customer or product…"
              activeCount={activeFilters}
              onReset={() => {
                setSearch("");
                setChannel(ALL);
                setStatus(ALL);
              }}
            >
              <Select
                label="Channel"
                size="sm"
                value={channel}
                onChange={setChannel}
                options={[{ value: ALL, label: "All channels" }, ...SALES_CHANNELS]}
                className="lg:w-40"
              />
              <Select
                label="Status"
                size="sm"
                value={status}
                onChange={setStatus}
                options={[{ value: ALL, label: "All statuses" }, ...SALE_STATUSES]}
                className="lg:w-44"
              />
              <DateRangePicker value={range} onChange={setRange} />
            </FilterBar>

            <div className="mt-5">
              {filtered.length === 0 ? (
                <EmptyState
                  compact
                  title="No sales match"
                  description="Nothing here fits that search and filter."
                />
              ) : (
                <Table minWidth="66rem">
                  <THead>
                    <TH>Date</TH>
                    <TH>Order</TH>
                    <TH>Customer</TH>
                    <TH>Product / Service</TH>
                    <TH>Type</TH>
                    <TH>Channel</TH>
                    <TH align="right">Amount</TH>
                    <TH>Status</TH>
                  </THead>

                  <TBody>
                    {filtered.map((sale) => (
                      <TR key={sale.id}>
                        <TD className="whitespace-nowrap text-text-secondary">
                          {formatDate(sale.at)}
                        </TD>

                        <TD>
                          {/*
                           * The only action on this page.
                           *
                           * Sales reports; Orders acts. Duplicating fulfil,
                           * refund and cancel here would give a merchant two
                           * places to do the same thing and one of them would
                           * eventually fall behind.
                           */}
                          <Link
                            href={APP_ROUTES.orders}
                            className="font-mono text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            {sale.orderReference}
                          </Link>
                        </TD>

                        <TD className="max-w-44">
                          <span className="block truncate font-bold text-text-primary">
                            {sale.customerName}
                          </span>
                        </TD>

                        <TD className="max-w-56">
                          <span className="block truncate font-normal text-text-secondary">
                            {sale.productName}
                          </span>
                          {/* Which combination earned it. "Premium T-Shirt"
                              alone cannot tell a merchant that it is the black
                              mediums carrying the product — which is the
                              question this page exists to answer. */}
                          {sale.variantName ? (
                            <span className="block truncate text-sm text-text-muted">
                              {sale.variantName}
                            </span>
                          ) : null}
                        </TD>

                        <TD>
                          <Badge size="sm" className="normal-case">
                            {sale.type === "mixed"
                              ? "Mixed"
                              : sale.type.charAt(0).toUpperCase() + sale.type.slice(1)}
                          </Badge>
                        </TD>

                        <TD className="font-normal text-text-secondary">
                          {CHANNEL_LABEL[sale.channel as SalesChannel]}
                        </TD>

                        <TD align="right" className="whitespace-nowrap tabular-nums">
                          {formatCurrency(sale.net)}
                          {sale.discount > 0 ? (
                            <span className="mt-0.5 block text-meta font-normal text-text-muted">
                              −{formatCurrency(sale.discount)} discount
                            </span>
                          ) : null}
                        </TD>

                        <TD>
                          <SaleStatusBadge status={sale.status} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          </Card>

          <TopSellers />
        </>
      )}
    </>
  );
}

/**
 * The best sellers of each type, side by side.
 *
 * Three short lists rather than one ranked table, because a merchant selling
 * all three kinds wants to know their best *service* without it being buried
 * under physical volume. A type with nothing sold is dropped rather than shown
 * empty.
 */
function TopSellers() {
  const groups = (["physical", "digital", "service"] as ProductType[])
    .map((type) => ({ type, items: topSellers(type) }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  const TITLE: Record<ProductType, string> = {
    physical: "Top Physical Products",
    digital: "Top Digital Products",
    service: "Top Services",
  };

  return (
    <div className={cn("grid gap-4", groups.length > 1 && "lg:grid-cols-3")}>
      {groups.map((group) => (
        <Card key={group.type}>
          <CardHeader title={TITLE[group.type]} />
          <CardBody className="p-2">
            <ul className="space-y-0.5">
              {group.items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={`${APP_ROUTES.products}/${item.id}/edit`}
                    className="flex items-center gap-3 rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-secondary text-meta font-bold text-text-secondary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {item.name}
                      </span>
                      <span className="block text-meta text-text-muted">
                        {formatNumber(item.sales?.unitsSold ?? 0)}{" "}
                        {UNIT_NOUN[item.type][
                          (item.sales?.unitsSold ?? 0) === 1 ? "one" : "many"
                        ]}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                      {formatCurrency(item.sales?.revenue ?? 0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/**
 * The earliest timestamp a range admits, or `null` for everything.
 *
 * Measured against the commerce fixtures' frozen clock rather than the wall
 * clock — the same reason every relative figure in this codebase is: filtering
 * a fixed dataset against the real date empties it the month after it is
 * written.
 */
function rangeCutoff(range: DateRangeValue): number | null {
  const DAY = 86_400_000;

  switch (range.preset) {
    case "today":
      return COMMERCE_NOW_MS - DAY;
    case "7d":
      return COMMERCE_NOW_MS - 7 * DAY;
    case "30d":
      return COMMERCE_NOW_MS - 30 * DAY;
    case "90d":
      return COMMERCE_NOW_MS - 90 * DAY;
    case "ytd":
      return new Date(new Date(COMMERCE_NOW_MS).getUTCFullYear(), 0, 1).getTime();
    case "custom":
      return range.from ? new Date(range.from).getTime() : null;
    default:
      return null;
  }
}
