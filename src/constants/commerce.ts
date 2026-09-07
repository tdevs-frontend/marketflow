import type {
  CatalogStatus,
  CategoryStatus,
  DiscountScope,
  DiscountStatus,
  DiscountType,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ProductType,
  StockAdjustmentReason,
  StockStatus,
} from "@/types/commerce";

/** `value` is the stored key, `label` the merchant-facing wording. */
export interface Option<T extends string> {
  value: T;
  label: string;
}

export const PRODUCT_STATUSES: Option<ProductStatus>[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export const PRODUCT_TYPES: Option<ProductType>[] = [
  { value: "physical", label: "Physical Product" },
  { value: "digital", label: "Digital Product" },
  { value: "service", label: "Service" },
];

export const STOCK_STATUSES: Option<StockStatus>[] = [
  { value: "in-stock", label: "In Stock" },
  { value: "low-stock", label: "Low Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
];

export const CATEGORY_STATUSES: Option<CategoryStatus>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export const ORDER_STATUSES: Option<OrderStatus>[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export const PAYMENT_STATUSES: Option<PaymentStatus>[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

/**
 * The happy path, in order. Cancelled and refunded are outcomes rather than
 * steps, so they never appear on the timeline.
 */
export const ORDER_TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order Placed" },
  { status: "paid", label: "Payment Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

export const STOCK_ADJUSTMENT_REASONS: Option<StockAdjustmentReason>[] = [
  { value: "stock-received", label: "Stock Received" },
  { value: "order", label: "Order" },
  { value: "return", label: "Return" },
  { value: "damage", label: "Damage" },
  { value: "manual", label: "Manual Adjustment" },
];

export const CATALOG_STATUSES: Option<CatalogStatus>[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export const DISCOUNT_TYPES: Option<DiscountType>[] = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed Amount" },
  { value: "free-shipping", label: "Free Shipping" },
];

export const DISCOUNT_SCOPES: Option<DiscountScope>[] = [
  { value: "all", label: "All Products" },
  { value: "products", label: "Specific Products" },
  { value: "categories", label: "Specific Categories" },
];

export const DISCOUNT_STATUSES: Option<DiscountStatus>[] = [
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "draft", label: "Draft" },
];

export const PRODUCTS_PER_PAGE = 8;
export const ORDERS_PER_PAGE = 8;
