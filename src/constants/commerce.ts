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
  CustomerType,
  FulfillmentStatus,
  OrderType,
  SaleStatus,
  SalesChannel,
  VariantStatus,
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

/* -------------------------------------------------------------------------- */
/* Fulfilment, per product type                                               */
/* -------------------------------------------------------------------------- */

/**
 * The fulfilment ladder each product type actually climbs.
 *
 * Three vocabularies, not one. A merchant selling consultations should never
 * see a booking marked *Shipped*, and a customer downloading an ebook is not
 * waiting for it to be *Packed*. The arrays are ordered, so a step's position
 * is its progress — which is what lets one `OrderStatus` map onto whichever
 * ladder the order belongs to.
 */
export const FULFILLMENT_FLOW: Record<
  ProductType,
  { value: FulfillmentStatus; label: string }[]
> = {
  physical: [
    { value: "processing", label: "Processing" },
    { value: "packed", label: "Packed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
  ],
  digital: [
    { value: "payment-pending", label: "Payment pending" },
    { value: "access-pending", label: "Access pending" },
    { value: "access-granted", label: "Access granted" },
  ],
  service: [
    { value: "pending", label: "Pending" },
    { value: "scheduled", label: "Scheduled" },
    { value: "in-progress", label: "In progress" },
    { value: "completed", label: "Completed" },
  ],
};

/**
 * The commercial statuses an order moves through, in order.
 *
 * Used to index into a fulfilment ladder: an order at `shipped` is three steps
 * along, whichever vocabulary its type uses.
 */
export const ORDER_PROGRESS: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  "payment-pending": "Payment pending",
  "access-pending": "Access pending",
  "access-granted": "Access granted",
  pending: "Pending",
  scheduled: "Scheduled",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Every fulfilment state, for the Orders filter. */
export const FULFILLMENT_STATUSES: Option<FulfillmentStatus>[] = (
  Object.keys(FULFILLMENT_LABEL) as FulfillmentStatus[]
).map((value) => ({ value, label: FULFILLMENT_LABEL[value] }));

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

export const SALE_STATUSES: Option<SaleStatus>[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "partially-refunded", label: "Partially refunded" },
  { value: "failed", label: "Failed" },
];

export const SALES_CHANNELS: Option<SalesChannel>[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "campaign", label: "Campaign" },
  { value: "website", label: "Website" },
  { value: "manual", label: "Manual" },
  { value: "other", label: "Other" },
];

export const CHANNEL_LABEL: Record<SalesChannel, string> = {
  whatsapp: "WhatsApp",
  campaign: "Campaign",
  website: "Website",
  manual: "Manual",
  other: "Other",
};

/** Order types, including the mixed case, for the Orders filter. */
export const ORDER_TYPES: Option<OrderType>[] = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "service", label: "Service" },
  { value: "mixed", label: "Mixed" },
];

/* -------------------------------------------------------------------------- */
/* Commerce customers                                                         */
/* -------------------------------------------------------------------------- */

export const CUSTOMER_TYPES: Option<CustomerType>[] = [
  { value: "new", label: "New" },
  { value: "repeat", label: "Repeat" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Inactive" },
];

/**
 * Where the derived customer classifications fall.
 *
 * Thresholds in one place so the table, the KPI row and the filter agree. They
 * are read off order history — nobody assigns these, which is what keeps them
 * from drifting away from what a customer actually did.
 */
export const CUSTOMER_RULES = {
  /** Spend at or above this is VIP, regardless of order count. */
  vipSpend: 1000,
  /** Orders at or above this is VIP too — loyal beats large. */
  vipOrders: 6,
  /** No purchase in this many days moves an existing buyer to Inactive. */
  inactiveDays: 120,
} as const;

/* -------------------------------------------------------------------------- */
/* Product type presentation                                                  */
/* -------------------------------------------------------------------------- */

/**
 * What a unit of each type is called.
 *
 * A physical product sells *units*, a service takes *bookings*. Using "sales"
 * for both is tolerable; using "stock" for both is not, and this is the table
 * that keeps the copy honest per type.
 */
export const UNIT_NOUN: Record<ProductType, { one: string; many: string }> = {
  physical: { one: "sale", many: "sales" },
  digital: { one: "sale", many: "sales" },
  service: { one: "booking", many: "bookings" },
};

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  physical: "Physical",
  digital: "Digital",
  service: "Service",
};

/** The three cards on the "What are you selling?" step. */
export const PRODUCT_TYPE_CHOICES: {
  value: ProductType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "physical",
    label: "Physical Product",
    description: "Something you ship. Tracks stock, weight and delivery.",
    icon: "package",
  },
  {
    value: "digital",
    label: "Digital Product",
    description: "A file or access you grant. No shipping, no stock.",
    icon: "book-open",
  },
  {
    value: "service",
    label: "Service",
    description: "Time or work you deliver. Priced by session, hour or job.",
    icon: "calendar-days",
  },
];

/** Human duration for a service — 90 → "1h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hour${hours === 1 ? "" : "s"}` : `${hours}h ${rest}m`;
}

/* -------------------------------------------------------------------------- */
/* Variants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Three axes, and no more.
 *
 * Not an arbitrary cap: the generated grid is the product of every option's
 * value count, so a fourth axis is where a merchant accidentally creates four
 * hundred rows they then have to price one at a time. Shopify settled on the
 * same number for the same reason. The builder says so in the hint rather than
 * silently disabling the button.
 */
export const MAX_VARIANT_OPTIONS = 3;

/**
 * The ceiling on generated combinations.
 *
 * A safety rail rather than a product decision — it exists so a stray paste of
 * two hundred values into a value field cannot lock the browser up building a
 * table nobody asked for.
 */
export const MAX_VARIANTS = 100;

/**
 * What each product type actually varies along.
 *
 * Suggestions in the option-name field, not a fixed list — a merchant can type
 * anything. The point is that the *first* thing a merchant selling a service
 * sees offered is "Duration" and not "Size", which is the difference between a
 * form that knows what they sell and a clothing form they have to work around.
 */
export const VARIANT_OPTION_PRESETS: Record<ProductType, string[]> = {
  physical: ["Size", "Color", "Material", "Pack Size"],
  digital: ["License Type", "Package", "File Format", "Access Level"],
  service: ["Duration", "Package", "Tier", "Service Level"],
};

/**
 * The quantity column, in each type's own vocabulary.
 *
 * A service has capacity, not stock — labelling a consultation's daily booking
 * limit "Stock" is the same mistake as marking a booking *Shipped*, and it is
 * the reason `FULFILLMENT_FLOW` above exists. `noun` is the unit the figure is
 * counted in, for the drawer's supporting line.
 */
export const VARIANT_QUANTITY_LABEL: Record<
  ProductType,
  { column: string; noun: string }
> = {
  /* "Available", not "Stock": the column shows sellable units, which is on
     hand minus what open orders have already claimed. Labelling a figure that
     nets off reservations as "Stock" is how a merchant promises the last three
     of something twice. */
  physical: { column: "Available", noun: "in stock" },
  digital: { column: "Delivery", noun: "licenses" },
  service: { column: "Capacity", noun: "bookings/day" },
};

/** The media column's heading, which is a file for a digital variant. */
export const VARIANT_MEDIA_LABEL: Record<ProductType, string> = {
  physical: "Image",
  digital: "File",
  service: "Image",
};

/** What a variant's identifying code is called, per type. */
export const VARIANT_CODE_LABEL: Record<ProductType, string> = {
  physical: "SKU",
  digital: "SKU / Code",
  service: "Service Code",
};

export const VARIANT_STATUSES: Option<VariantStatus>[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** Licence tiers offered as suggestions on a digital variant. */
export const LICENSE_TYPES: Option<string>[] = [
  { value: "personal", label: "Personal" },
  { value: "commercial", label: "Commercial" },
  { value: "extended", label: "Extended" },
  { value: "team", label: "Team" },
];
