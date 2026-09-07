"use client";

import { ArrowDownRight, ArrowUpRight, Package } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductRevenueChart } from "./charts/product-revenue-chart";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Product {
  name: string;
  unitsSold: number;
  revenue: number;
  /** Change in revenue against the previous period. */
  changePercent: number;
}

/**
 * Ranked by revenue, not units — the merchant question is which product earns
 * most, and the two do not always agree. Starter outsells Business on units
 * and still earns less.
 */
const PRODUCTS: Product[] = [
  { name: "Premium Package", unitsSold: 184, revenue: 12840, changePercent: 18.2 },
  { name: "Starter Package", unitsSold: 142, revenue: 8920, changePercent: 9.4 },
  { name: "Business Package", unitsSold: 98, revenue: 7450, changePercent: 12.6 },
  { name: "Growth Package", unitsSold: 76, revenue: 5820, changePercent: -4.1 },
];

const TOP_REVENUE = Math.max(...PRODUCTS.map((product) => product.revenue));

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

function ProductRow({ product, rank }: { product: Product; rank: number }) {
  const positive = product.changePercent >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary">
        <Package className="size-4" aria-hidden />
        <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-surface text-[9px] font-bold text-text-muted ring-1 ring-border">
          {rank}
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium text-text-primary">
            {product.name}
          </p>
          <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
            {formatCurrency(product.revenue)}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-text-muted">{product.unitsSold} sold</span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium",
              positive ? "text-primary" : "text-error",
            )}
          >
            <TrendIcon className="size-3" aria-hidden />
            {Math.abs(product.changePercent).toFixed(1)}%
          </span>
        </div>

        {/* Share of the top seller — the ranking made visible in the row. */}
        <div
          aria-hidden
          className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-secondary"
        >
          <span
            className="block h-full rounded-full bg-primary/70"
            style={{ width: `${(product.revenue / TOP_REVENUE) * 100}%` }}
          />
        </div>
      </div>
    </li>
  );
}

export function ProductPerformance({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base">Product Performance</h2>
          <p className="mt-1 text-sm text-text-secondary">
            See which products are driving your sales.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.products}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          View Products
        </ButtonLink>
      </div>

      {/* List and chart side by side at xl, where the card is two columns
          wide. Stacked below that, so neither gets squeezed. */}
      <div className="mt-3 grid gap-x-8 gap-y-2 xl:grid-cols-2">
        <ul className="divide-y divide-border">
          {PRODUCTS.map((product, index) => (
            <ProductRow key={product.name} product={product} rank={index + 1} />
          ))}
        </ul>

        <div className="self-center max-xl:-mx-2">
          <ProductRevenueChart
            products={PRODUCTS.map((product) => product.name)}
            revenue={PRODUCTS.map((product) => product.revenue)}
          />
        </div>
      </div>
    </Card>
  );
}
