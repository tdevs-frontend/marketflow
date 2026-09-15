import { Layers, Package } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  CUSTOMER_TYPES,
  FULFILLMENT_LABEL,
  SALE_STATUSES,
} from "@/constants/commerce";
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
  CustomerType,
  FulfillmentStatus,
  SaleStatus,
  VariantStatus,
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
  return <span className="text-sm text-text-muted">{TYPE_LABELS[type]}</span>;
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

/**
 * Payment outcome, which is not fulfilment.
 *
 * Sales reports in this vocabulary and Orders reports in the fulfilment one, so
 * "Paid" and "Shipped" can be true of the same order at the same time without
 * either badge having to compromise.
 *
 * `partially-refunded` is amber rather than red: money came back but the sale
 * stands, and colouring it as a failure overstates what happened.
 */
const SALE_TONES: Record<SaleStatus, BadgeTone> = {
  paid: "success",
  pending: "warning",
  refunded: "neutral",
  "partially-refunded": "warning",
  failed: "danger",
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return (
    <Badge tone={SALE_TONES[status]} size="sm" className="normal-case">
      {SALE_STATUSES.find((item) => item.value === status)?.label ?? status}
    </Badge>
  );
}

/**
 * Fulfilment, in the vocabulary of the order's own product type.
 *
 * The label comes from `FULFILLMENT_LABEL`, so a booking reads *Scheduled* and
 * a download reads *Access granted* — neither is ever told it has been packed.
 */
const FULFILLMENT_TONES: Partial<Record<FulfillmentStatus, BadgeTone>> = {
  delivered: "success",
  "access-granted": "success",
  completed: "success",
  cancelled: "danger",
  "payment-pending": "warning",
  pending: "warning",
};

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <Badge tone={FULFILLMENT_TONES[status] ?? "info"} size="sm" className="normal-case">
      {FULFILLMENT_LABEL[status]}
    </Badge>
  );
}

/**
 * How a buyer behaves, derived from their orders.
 *
 * VIP is the only one that gets the brand tint — it is the label a merchant
 * scans for. Inactive stays neutral rather than red: a lapsed customer is an
 * opportunity, not an error.
 */
const CUSTOMER_TONES: Record<CustomerType, BadgeTone> = {
  new: "info",
  repeat: "success",
  vip: "brand",
  inactive: "neutral",
};

export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  return (
    <Badge tone={CUSTOMER_TONES[type]} size="sm" className="normal-case">
      {CUSTOMER_TYPES.find((item) => item.value === type)?.label ?? type}
    </Badge>
  );
}

/**
 * Whether one combination is sellable.
 *
 * Neutral rather than red for `inactive`: a switched-off size is a deliberate
 * merchandising choice, not a fault, and colouring it as an error puts a row of
 * alarms down a table where nothing is wrong.
 */
export function VariantStatusBadge({ status }: { status: VariantStatus }) {
  return (
    <Badge tone={status === "active" ? "success" : "neutral"} size="sm">
      {status}
    </Badge>
  );
}

/**
 * The "6 variants" marker on a parent product row.
 *
 * Deliberately a count and not a list: the product list answers "what do I
 * sell", and spilling twelve sizes into it answers a question nobody asked
 * while burying the eleven other products. The count is the link into the
 * detail page's Variants tab, which is where that question belongs.
 */
export function VariantCountBadge({ count }: { count: number }) {
  return (
    <Badge tone="brand" size="sm" className="normal-case">
      <Layers className="size-3" aria-hidden />
      {count} {count === 1 ? "variant" : "variants"}
    </Badge>
  );
}
