import { Package } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CatalogStatus,
  CategoryStatus,
  DiscountStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ProductType,
  StockStatus,
} from "@/types/commerce";

const PRODUCT_TONES: Record<ProductStatus, BadgeTone> = {
  active: "success",
  draft: "neutral",
  archived: "neutral",
};

const STOCK_TONES: Record<StockStatus, BadgeTone> = {
  "in-stock": "success",
  "low-stock": "warning",
  "out-of-stock": "danger",
};

const STOCK_LABELS: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

/** Healthy / Low / Out — the inventory page's wording for the same three states. */
const HEALTH_LABELS: Record<StockStatus, string> = {
  "in-stock": "Healthy",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

const ORDER_TONES: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "success",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

const PAYMENT_TONES: Record<PaymentStatus, BadgeTone> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

const CATALOG_TONES: Record<CatalogStatus, BadgeTone> = {
  published: "success",
  draft: "neutral",
  archived: "neutral",
};

const DISCOUNT_TONES: Record<DiscountStatus, BadgeTone> = {
  active: "success",
  scheduled: "info",
  expired: "neutral",
  draft: "neutral",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={PRODUCT_TONES[status]}>{status}</Badge>;
}

export function StockBadge({
  status,
  variant = "stock",
}: {
  status: StockStatus;
  /** `health` uses the inventory page's "Healthy" wording. */
  variant?: "stock" | "health";
}) {
  const labels = variant === "health" ? HEALTH_LABELS : STOCK_LABELS;
  return (
    <Badge tone={STOCK_TONES[status]} className="normal-case">
      {labels[status]}
    </Badge>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONES[status]}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONES[status]}>{status}</Badge>;
}

export function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  return <Badge tone={status === "active" ? "success" : "neutral"}>{status}</Badge>;
}

export function CatalogStatusBadge({ status }: { status: CatalogStatus }) {
  return <Badge tone={CATALOG_TONES[status]}>{status}</Badge>;
}

export function DiscountStatusBadge({ status }: { status: DiscountStatus }) {
  return <Badge tone={DISCOUNT_TONES[status]}>{status}</Badge>;
}

const TYPE_LABELS: Record<ProductType, string> = {
  physical: "Physical",
  digital: "Digital",
  service: "Service",
};

export function ProductTypeLabel({ type }: { type: ProductType }) {
  return <span className="text-xs text-text-muted">{TYPE_LABELS[type]}</span>;
}

/**
 * Product thumbnail. Falls back to a tinted icon tile rather than a broken
 * image or a grey box, so a product with no artwork still reads as a product.
 */
export function ProductThumb({
  url,
  alt,
  size = "md",
  className,
}: {
  url?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "size-8", md: "size-10", lg: "size-14" }[size];
  const icon = { sm: "size-3.5", md: "size-4", lg: "size-5" }[size];

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-panel border border-border bg-primary-soft text-primary",
        box,
        className,
      )}
    >
      {url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt={alt ?? ""} className="size-full object-cover" />
      ) : (
        <Package className={icon} aria-hidden />
      )}
    </span>
  );
}
