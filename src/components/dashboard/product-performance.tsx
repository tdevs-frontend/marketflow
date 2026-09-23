import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { APP_ROUTES } from "@/constants";
import { formatCount, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

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

/* Ranked by revenue, not units - Starter outsells Business and earns less. */
const PRODUCTS: Product[] = [
  { name: "Premium Package", unitsSold: 184, revenue: 12840, changePercent: 18.2 },
  { name: "Starter Package", unitsSold: 142, revenue: 8920, changePercent: 9.4 },
  { name: "Business Package", unitsSold: 98, revenue: 7450, changePercent: 12.6 },
  { name: "Growth Package", unitsSold: 76, revenue: 5820, changePercent: -4.1 },
];

const TOP_REVENUE = Math.max(...PRODUCTS.map((product) => product.revenue), 0);

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

function ProductRow({ product, rank }: { product: Product; rank: number }) {
  const positive = product.changePercent >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <li className="flex items-start gap-3 py-3">
      {/* The leader takes the brand tint and the rest stay neutral, so the
          ranking is legible before a single figure is read. */}
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-panel text-sm font-bold tabular-nums",
          rank === 1
            ? "bg-primary-soft text-primary-dark"
            : "bg-surface-secondary text-text-secondary",
        )}
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-text-primary">
            {product.name}
          </p>
          <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
            {formatCurrency(product.revenue)}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-sm text-text-secondary tabular-nums">
            {formatCount(product.unitsSold)} sold
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 text-meta font-medium tabular-nums",
              positive ? "text-primary" : "text-error",
            )}
          >
            <TrendIcon className="size-3.5" aria-hidden />
            {Math.abs(product.changePercent).toFixed(1)}%
          </span>
        </div>

        {/* Share of the top seller, so the gap between first and fourth is a
            length rather than a subtraction. */}
        <ProgressBar
          size="sm"
          value={TOP_REVENUE === 0 ? 0 : (product.revenue / TOP_REVENUE) * 100}
          label={`${product.name} revenue`}
          className="mt-2"
        />
      </div>
    </li>
  );
}

export function ProductPerformance({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base">Product Performance</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Your best sellers by revenue over the last 30 days.
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

      {PRODUCTS.length === 0 ? (
        <div className="mt-5 flex-1">
          <EmptyState
            compact
            title="No products yet"
            description="Add a product and its sales will be ranked here as orders come in."
            action={
              <ButtonLink href={APP_ROUTES.products} size="sm">
                Add Product
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ul className="mt-2 flex-1 divide-y divide-border">
          {PRODUCTS.map((product, index) => (
            <ProductRow key={product.name} product={product} rank={index + 1} />
          ))}
        </ul>
      )}
    </Card>
  );
}
