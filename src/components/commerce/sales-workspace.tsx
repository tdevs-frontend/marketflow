"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  BookOpen,
  CalendarDays,
  Package,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
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
 * How each of the three cards is dressed.
 *
 * The hues come from the *Brand* block of `variables.css` — primary, accent
 * and secondary — and deliberately not from Channel identity. `--color-email`
 * and `--color-sms` mean "the Email channel" and "the SMS channel" in this
 * product; spending them on a product category makes a violet tile on Top
 * Services read as SMS, which is a claim about a module that has nothing to do
 * with the card. The brand's own indigo-cyan-violet is what a merchant already
 * reads as "this dashboard".
 *
 * Two classes per group rather than one, because the tile and the rank badge
 * want different ink. The icon is decorative and takes the hue; the rank is a
 * *number*, so it takes `text-text-primary` — cyan on cyan-soft is 2.33:1,
 * fine behind an icon and far too faint to set a digit in.
 *
 * Where a family has no soft or border step, the tint is mixed from its own
 * token rather than invented: `secondary/10` and `secondary/20` land at the
 * same 1.33:1 weight `primary-border` has against `primary-soft`, so the three
 * tiles read as one set.
 *
 * Structure is identical across the three on purpose. Only the hue, the icon
 * and the wording change; three differently-shaped cards in one row would read
 * as three unrelated widgets rather than one comparison.
 */
const GROUP_STYLE: Record<
  ProductType,
  {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    /** Header tile: ground, border and the icon's ink. */
    tile: string;
    /** Rank badge: ground and border only — the digit is set separately. */
    badge: string;
    bar: string;
  }
> = {
  physical: {
    title: "Top Physical Products",
    subtitle: "Best performing physical items by revenue",
    icon: Package,
    tile: "border-primary-border bg-primary-soft text-primary",
    badge: "border-primary-border bg-primary-soft",
    bar: "bg-primary",
  },
  digital: {
    title: "Top Digital Products",
    subtitle: "Best performing digital items by revenue",
    icon: BookOpen,
    /*
     * Blue, not the brand cyan.
     *
     * `accent` is the only Brand hue left once indigo and violet are taken,
     * and it cannot be read: #06b6d4 on `accent-soft` is 2.33:1, which is
     * below the 3:1 this file's own tokens hold themselves to. `info` is the
     * one family with a purpose-built ink step — `--color-info-text` — and it
     * lands at 5.49:1, between the 5.62 of primary and the 4.91 of secondary,
     * so all three cards read at one weight.
     *
     * It is also the tone `kpi-strip` already defines for exactly this, which
     * is why the classes below are identical to the ones a KPI tile uses.
     */
    tile: "border-info/20 bg-info-soft text-info-text",
    badge: "border-info/20 bg-info-soft",
    bar: "bg-info",
  },
  service: {
    title: "Top Services",
    subtitle: "Best performing services by revenue",
    icon: CalendarDays,
    tile: "border-secondary/20 bg-secondary/10 text-secondary",
    badge: "border-secondary/20 bg-secondary/10",
    bar: "bg-secondary",
  },
};

/**
 * The best sellers of each type, side by side.
 *
 * Three short lists rather than one ranked table, because a merchant selling
 * all three kinds wants to know their best *service* without it being buried
 * under physical volume. A type with nothing sold is dropped rather than shown
 * empty.
 *
 * Each card is a small leaderboard: rank, what it is, what it sold, what it
 * made. The bar under each row is the part that makes it readable at a glance —
 * it is drawn against the *top seller in that card*, not against some global
 * total, so it answers "how far ahead is first place" rather than restating the
 * revenue figure already printed beside it.
 */
function TopSellers() {
  const groups = (["physical", "digital", "service"] as ProductType[])
    .map((type) => ({ type, items: topSellers(type) }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-4",
        /* Two up on a tablet, three on a desktop — and neither if there is
           only one type with sales, where a third-width card would look
           like two are missing. */
        groups.length > 1 && "sm:grid-cols-2",
        groups.length > 2 && "lg:grid-cols-3",
      )}
    >
      {groups.map((group) => {
        const style = GROUP_STYLE[group.type];
        const Icon = style.icon;
        /* The leader sets the scale. Guarded so a single zero-revenue row
           cannot divide by nothing. */
        const leader = Math.max(
          ...group.items.map((item) => item.sales?.revenue ?? 0),
          1,
        );

        return (
          <Card key={group.type}>
            {/* The header is built here rather than with `CardHeader` because
                it wants a heavier title and an icon; the border, padding and
                rhythm are the ones `CardHeader` already sets, so the card
                still matches every other card on the page. */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-text-primary">
                  {style.title}
                </h3>
                <p className="mt-0.5 text-sm font-medium text-text-secondary">
                  {style.subtitle}
                </p>
              </div>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-panel border",
                  style.tile,
                )}
              >
                <Icon className="size-4.5" aria-hidden />
              </span>
            </div>

            <CardBody className="p-2">
              <ul className="space-y-0.5">
                {group.items.map((item, index) => {
                  const revenue = item.sales?.revenue ?? 0;
                  const sold = item.sales?.unitsSold ?? 0;

                  return (
                    <li key={item.id}>
                      <Link
                        href={`${APP_ROUTES.products}/${item.id}`}
                        className="block rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold text-text-primary tabular-nums",
                              style.badge,
                            )}
                          >
                            {index + 1}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-text-primary">
                              {item.name}
                            </span>
                            <span className="block text-sm font-medium text-text-secondary">
                              {formatNumber(sold)}{" "}
                              {UNIT_NOUN[item.type][sold === 1 ? "one" : "many"]}
                            </span>
                          </span>

                          <span className="shrink-0 text-base font-bold text-text-primary tabular-nums">
                            {formatCurrency(revenue)}
                          </span>
                        </span>

                        {/* Decorative: the number it encodes is printed two
                            inches to its left, so it carries no label. */}
                        <span
                          aria-hidden
                          className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-secondary"
                        >
                          <span
                            className={cn("block h-full rounded-full", style.bar)}
                            style={{
                              width: `${Math.max((revenue / leader) * 100, 4)}%`,
                            }}
                          />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        );
      })}
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
