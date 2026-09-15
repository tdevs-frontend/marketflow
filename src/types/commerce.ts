/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export type ProductStatus = "active" | "draft" | "archived";

export type ProductType = "physical" | "digital" | "service";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isThumbnail: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  type: ProductType;
  categoryId: string;
  categoryName: string;
  status: ProductStatus;

  /* Pricing */
  price: number;
  salePrice?: number;
  costPrice?: number;
  taxRate?: number;

  /*
   * Inventory.
   *
   * Present on every product because the shape is shared, but only meaningful
   * where `trackInventory` is on — which for a service or a normal digital
   * product it is not. Anything rendering stock has to check that flag first;
   * showing "Untracked" in a stock column teaches a merchant selling
   * consultations that this product form is not for them.
   */
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;

  images: ProductImage[];

  /*
   * Type-specific detail.
   *
   * Exactly one of these is set, matching `type`. Optional rather than a
   * discriminated union so the existing list, editor and catalogue code keeps
   * compiling against the shared fields — the forms and detail tabs narrow on
   * `type` and reach for the matching object.
   */
  physical?: PhysicalDetails;
  digital?: DigitalDetails;
  service?: ServiceDetails;

  /*
   * Variants.
   *
   * Optional, and off by default: most products are one thing at one price, and
   * a form that opens with an empty option grid teaches a merchant selling a
   * single ebook that they have work to do. `hasVariants` is the merchant's
   * answer to that question, kept as its own flag rather than inferred from a
   * non-empty array — a product mid-setup has the toggle on and no options yet,
   * and inferring would flip it back off under them.
   *
   * When it is on, `variants` is the source of truth for price and stock and
   * the parent's own `price`/`stock` become derived readings of it. See
   * `priceRangeOf` and `rollUpStock` in `lib/variants`.
   */
  hasVariants: boolean;
  /** The axes, in display order. At most `MAX_VARIANT_OPTIONS`. */
  options?: VariantOption[];
  /** One per combination of option values. Generated, then edited. */
  variants?: ProductVariant[];

  /** What it has sold. Derived from orders; see `productSales` in fixtures. */
  sales?: ProductSales;

  /* SEO */
  seoTitle?: string;
  metaDescription?: string;
  slug: string;

  /* Advanced */
  featured: boolean;
  visibility: "visible" | "hidden";
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

export interface ProductListQuery {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  stockStatus?: StockStatus;
  page?: number;
  limit?: number;
  sortBy?: "name" | "price" | "stock" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export type CreateProductPayload = Omit<
  Product,
  "id" | "categoryName" | "createdAt" | "updatedAt"
>;

export type UpdateProductPayload = Partial<CreateProductPayload> & { id: string };

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export type CategoryStatus = "active" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  parentName?: string;
  productCount: number;
  status: CategoryStatus;
  updatedAt: string;
}

export type CreateCategoryPayload = Omit<
  Category,
  "id" | "parentName" | "productCount" | "updatedAt"
>;

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & { id: string };

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  /*
   * Exactly what was bought, when the product has variants.
   *
   * Stored on the line rather than looked up from the product later: a variant
   * can be renamed, repriced or deleted, and an order has to keep saying what
   * the customer actually received. `sku` is captured for the same reason — it
   * is the number that goes on a picking slip.
   */
  variantId?: string;
  /** "Medium / Black". */
  variantName?: string;
  /** The variant's SKU when there is one, else the product's. */
  sku?: string;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email?: string;
  /** Drives the WhatsApp cross-link from the order drawer. */
  whatsappNumber?: string;
}

/** One step of the fulfilment timeline. `at` is unset until the step happens. */
export interface OrderEvent {
  status: OrderStatus;
  label: string;
  at?: string;
}

export interface Order {
  id: string;
  reference: string;
  customer: OrderCustomer;
  lines: OrderLine[];
  /**
   * What the order contains, derived from its lines.
   *
   * Chooses which fulfilment vocabulary applies — a `service` order is
   * scheduled and completed, a `physical` one is packed and shipped.
   */
  orderType: OrderType;
  /** Independent of `paymentStatus`. Paid-but-undelivered is a real state. */
  fulfillmentStatus: FulfillmentStatus;
  /** Where the order came from, for the Sales channel breakdown. */
  channel: SalesChannel;
  subtotal: number;
  discount: number;
  discountCode?: string;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  /** The campaign that produced the order, when it came from one. */
  sourceCampaign?: string;
  timeline: OrderEvent[];
  placedAt: string;
}

export interface OrderListQuery {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  productId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface UpdateOrderStatusPayload {
  id: string;
  status: OrderStatus;
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  /*
   * The variant this row counts, when the product has them.
   *
   * Inventory is per variant, not per product: "12 Premium T-Shirts" is not a
   * number anyone can pick against when three of them are XL. A product without
   * variants keeps one row and leaves these unset.
   */
  variantId?: string;
  /** "Medium / Black". */
  variantName?: string;
  stock: number;
  /** Held by unfulfilled orders, so not sellable. */
  reserved: number;
  lowStockThreshold: number;
  unitCost: number;
  updatedAt: string;
}

export type StockAdjustmentReason =
  | "stock-received"
  | "order"
  | "return"
  | "damage"
  | "manual";

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  /*
   * Which combination moved, when the product has variants.
   *
   * An adjustment that names only the product is unusable the moment stock is
   * held per variant: "+20 Premium T-Shirt" tells a merchant nothing about
   * which shelf to look at. `variantName` rides along so the activity feed
   * reads without a second lookup.
   */
  variantId?: string;
  variantName?: string;
  /** Signed: positive receives stock, negative removes it. */
  delta: number;
  reason: StockAdjustmentReason;
  note?: string;
  at: string;
}

export interface CreateStockAdjustmentPayload {
  productId: string;
  /** The variant being adjusted, when the product has them. */
  variantId?: string;
  delta: number;
  reason: StockAdjustmentReason;
  note?: string;
}

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export type CatalogStatus = "published" | "draft" | "archived";

export interface Catalog {
  id: string;
  name: string;
  description?: string;
  productIds: string[];
  status: CatalogStatus;
  /** Public URL customers open. */
  shareUrl: string;
  views: number;
  updatedAt: string;
}

export type CreateCatalogPayload = Omit<
  Catalog,
  "id" | "shareUrl" | "views" | "updatedAt"
>;

/* -------------------------------------------------------------------------- */
/* Discounts                                                                  */
/* -------------------------------------------------------------------------- */

export type DiscountType = "percentage" | "fixed" | "free-shipping";

export type DiscountStatus = "active" | "scheduled" | "expired" | "draft";

export type DiscountScope = "all" | "products" | "categories";

export interface Discount {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  /**
   * Which kinds of product the code applies to. Empty means all of them.
   *
   * Separate from `scope`, which narrows to named products or categories:
   * "20% off everything digital" is a rule about the *type*, and expressing it
   * by listing every digital product breaks the next time one is added.
   */
  productTypes?: ProductType[];
  /** CRM segment ids the code is restricted to. Empty means everyone. */
  segmentIds?: string[];
  /** Channels the code can be redeemed through. Empty means all. */
  channels?: SalesChannel[];
  /** Redemptions allowed per customer. `undefined` is unlimited. */
  perCustomerLimit?: number;
  /** Percent for `percentage`, currency for `fixed`, ignored for shipping. */
  value: number;
  scope: DiscountScope;
  productIds?: string[];
  categoryIds?: string[];
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  /** Money handed out so far, for the KPI row. */
  discountGiven: number;
  revenueGenerated: number;
  status: DiscountStatus;
  startsAt: string;
  endsAt?: string;
}

export type CreateDiscountPayload = Omit<
  Discount,
  "id" | "usageCount" | "discountGiven" | "revenueGenerated"
>;

export type UpdateDiscountPayload = Partial<CreateDiscountPayload> & { id: string };

/* -------------------------------------------------------------------------- */
/* Type-specific product details                                              */
/* -------------------------------------------------------------------------- */

/**
 * What a product is, beyond the fields every product shares.
 *
 * One `Product` entity with an optional detail object per type, rather than
 * three product tables. A merchant selling a T-shirt, an ebook and a
 * consultation manages all three in one list, filters across them, and reports
 * on them together — which is impossible the moment they live in separate
 * databases.
 *
 * The detail object is what makes the forms and the detail tabs adapt: a
 * digital product has no weight, a service has no stock, and rendering those
 * fields as empty or "Untracked" is how a merchant learns the product form is
 * not about their business.
 */
export interface PhysicalDetails {
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  shippingRequired: boolean;
}

export type DigitalAccessType = "download" | "stream" | "external-url" | "license-key";

export interface DigitalDetails {
  accessType: DigitalAccessType;
  fileName?: string;
  fileSizeMb?: number;
  externalUrl?: string;
  /** `null` for unlimited downloads. */
  downloadLimit: number | null;
  /** Days after purchase before access lapses. `null` never expires. */
  accessExpiryDays: number | null;
  /** Licence seats left, where the product is sold with a finite pool. */
  licensesAvailable?: number;
}

export type ServicePricingType = "fixed" | "hourly" | "starting-from" | "free";

export type ServiceLocationType = "online" | "business-location" | "customer-location";

export interface ServiceDetails {
  pricingType: ServicePricingType;
  /** Minutes. Drives "30 minutes", "2 hours" in the list and the booking tab. */
  durationMinutes?: number;
  bookingRequired: boolean;
  locationType: ServiceLocationType;
  /** Concurrent bookings the business can take. `null` is unlimited. */
  capacityPerSlot: number | null;
}

/**
 * What a product has actually sold.
 *
 * Attached to the product so every list and detail view can answer "how did
 * this do" without joining orders at the call site. Derived from `ORDERS` in
 * the fixtures, which is where a backend would compute it too.
 */
export interface ProductSales {
  /** Units for physical and digital; bookings for a service. */
  unitsSold: number;
  revenue: number;
  orders: number;
  /** Distinct buyers, for the product detail's Customers tab. */
  customers: number;
  lastSoldAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Orders — payment and fulfilment as separate axes                           */
/* -------------------------------------------------------------------------- */

/**
 * Fulfilment, which means something different per product type.
 *
 * A physical order ships, a digital one grants access, a service is scheduled
 * and completed. Forcing one vocabulary on all three is how a merchant selling
 * consultations ends up marking a booking "Shipped".
 *
 * Kept apart from `PaymentStatus` on purpose: a service can be paid and not yet
 * delivered, and a physical order can ship before payment clears. Collapsing
 * them into one status loses whichever half is inconvenient.
 */
export type PhysicalFulfillment =
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DigitalFulfillment =
  | "payment-pending"
  | "access-pending"
  | "access-granted"
  | "cancelled";

export type ServiceFulfillment =
  | "pending"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

export type FulfillmentStatus =
  | PhysicalFulfillment
  | DigitalFulfillment
  | ServiceFulfillment;

/**
 * What an order contains.
 *
 * `mixed` is a real case — a merchant selling a course plus a printed workbook
 * ships one and grants access to the other — and it is why the order's
 * fulfilment vocabulary is chosen per order rather than per workspace.
 */
export type OrderType = ProductType | "mixed";

/** Where the sale came from. Ties commerce back to the marketing modules. */
export type SalesChannel = "whatsapp" | "campaign" | "website" | "manual" | "other";

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Payment outcome, which is not fulfilment.
 *
 * `partially-refunded` earns its place: a mixed order where the workbook was
 * returned and the course was not is neither paid nor refunded, and reporting
 * it as either misstates revenue.
 */
export type SaleStatus =
  | "paid"
  | "pending"
  | "refunded"
  | "partially-refunded"
  | "failed";

/**
 * One line of commercial performance.
 *
 * Derived from orders rather than stored separately — Sales is a *reading* of
 * the order book, not a second ledger. Clicking a row goes to the order it came
 * from, which is the only place the operational actions live.
 */
export interface Sale {
  id: string;
  orderId: string;
  orderReference: string;
  customerId: string;
  customerName: string;
  /** The headline item; the order holds the full list. */
  productName: string;
  productId: string;
  /*
   * The variant behind the headline item, when it had one.
   *
   * Sales is a reading of the order book, so it reports what the order line
   * recorded. "Premium T-Shirt" alone cannot tell a merchant which size is
   * actually selling — which is the whole question this page exists to answer.
   */
  variantId?: string;
  /** "Medium / Black". */
  variantName?: string;
  type: OrderType;
  channel: SalesChannel;
  gross: number;
  discount: number;
  refunded: number;
  /** `gross - discount - refunded`. The figure that reaches the business. */
  net: number;
  status: SaleStatus;
  at: string;
}

/* -------------------------------------------------------------------------- */
/* Commerce customers                                                         */
/* -------------------------------------------------------------------------- */

/**
 * How a buyer behaves, derived rather than assigned.
 *
 * These are not CRM segments and not tags — nobody sets them. They are read off
 * the order history, which means they cannot drift from the truth and there is
 * no second customer record to keep in step.
 */
export type CustomerType = "new" | "repeat" | "vip" | "inactive";

/**
 * A contact who has bought something.
 *
 * Deliberately a *projection* of `CustomerContact`, holding its id rather than
 * copying its fields. One contact database: Commerce adds purchase attributes
 * to a contact, it does not create a parallel customer. Everything here is
 * computed from `ORDERS`, and "View full profile" goes to the CRM record.
 */
export interface CommerceCustomer {
  /** The contact id. Same record the CRM shows. */
  contactId: string;
  name: string;
  email?: string;
  whatsappNumber?: string;
  orders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstPurchaseAt: string;
  lastPurchaseAt: string;
  /** The product or service they have bought most. */
  topProductName: string;
  /** Which types they buy, for the type filter on the customers table. */
  purchasedTypes: ProductType[];
  customerType: CustomerType;
}

/* -------------------------------------------------------------------------- */
/* Variants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A variant is live or it is not.
 *
 * Deliberately two states rather than the product's three. `draft` and
 * `archived` are answers to "is this thing in my catalogue at all", which is a
 * question about the *product* — a single size of a shirt is never
 * independently unpublished, it is either sellable or it is switched off while
 * the shirt stays on sale. Two states also keep the table's Disable action
 * honest: one toggle, one meaning.
 */
export type VariantStatus = "active" | "inactive";

/**
 * One axis a product varies along, and the values it takes.
 *
 * Order matters and is the array's own order: it fixes how a variant reads
 * ("Medium / Black", never "Black / Medium") and which position in
 * `ProductVariant.optionValues` belongs to which option. Reordering options
 * therefore has to reorder every variant's values in step — see
 * `reorderVariantValues` in `lib/variants`.
 */
export interface VariantOption {
  id: string;
  /** "Size", "Colour", "License Type". */
  name: string;
  /** "S", "M", "L". Unique within the option. */
  values: string[];
}

/**
 * One sellable combination.
 *
 * Lives on `Product` rather than inside `PhysicalDetails`, because a licence
 * tier and a session length are variants in exactly the same sense that a shirt
 * size is: same option builder, same generated grid, same table. Burying them
 * under the physical detail object is what forced the old single-option stub to
 * be physical-only, and a merchant selling a 30- and a 60-minute consultation
 * had nowhere to put them.
 *
 * The type-specific fields are all optional and only the ones matching the
 * parent's `type` are ever read or written — the same discipline `Product`
 * already uses for its three detail objects. A digital variant has no weight, a
 * service has no stock, and showing those fields empty is how a merchant learns
 * the form is not about their business.
 */
export interface ProductVariant {
  id: string;
  /**
   * One value per option, in option order: `["Medium", "Black"]`.
   *
   * The identity of the variant. Two variants of the same product can never
   * share it — that is what makes regeneration idempotent.
   */
  optionValues: string[];
  /** SKU for physical and digital, service code for a service. */
  sku: string;
  /**
   * What this combination costs. `undefined` inherits the parent's price.
   *
   * Undefined rather than a copy of the parent figure: a variant that stores
   * its own 29 silently stops following the product when the product is
   * repriced, and a merchant who set no variant price never asked for that.
   */
  price?: number;
  /** Shown struck through beside `price`. The "was" number. */
  compareAtPrice?: number;
  costPrice?: number;
  status: VariantStatus;
  /** Falls back to the product's thumbnail when unset. */
  imageUrl?: string;

  /*
   * Whether this combination is counted at all.
   *
   * Per variant rather than per product, because it genuinely varies: a shirt
   * sold in four sizes plus a made-to-order size has three tracked rows and one
   * that is never counted. Defaults to the parent's setting when unset.
   */
  trackInventory?: boolean;
  /**
   * Sell past zero.
   *
   * The difference between "out of stock" and "unavailable". A print-on-demand
   * size has no shelf and should stay buyable at zero; a last-one-in-the-box
   * should not. Without it, `stock: 0` is forced to mean both.
   */
  continueSellingWhenOutOfStock?: boolean;

  /* Physical */
  stock?: number;
  /**
   * Units held by unfulfilled orders, so not sellable.
   *
   * Derived from the order book — see `reservedFor` in the fixtures — never
   * authored and never editable. A hand-typed reserved figure is a second
   * answer to a question the orders already answer, and the two drift apart the
   * first time an order is fulfilled.
   */
  reserved?: number;
  lowStockThreshold?: number;
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  barcode?: string;

  /* Digital */
  fileName?: string;
  fileSizeMb?: number;
  /** `null` for unlimited downloads. */
  downloadLimit?: number | null;
  /** Days after purchase before access lapses. `null` never expires. */
  accessExpiryDays?: number | null;
  licenseType?: string;
  /**
   * Seats left in a finite licence pool.
   *
   * The only quantity a digital variant genuinely has, and it is not stock: it
   * is never picked, packed or reserved, and calling it stock is how a merchant
   * selling forty team licences ends up with a reorder level. `undefined` is
   * the normal case — an unlimited download.
   */
  licensesAvailable?: number;

  /* Service */
  durationMinutes?: number;
  /** Bookings this variant can take per slot. `null` is unlimited. */
  capacityPerSlot?: number | null;
  bookingRequired?: boolean;
  locationType?: ServiceLocationType;

  /** Derived from orders, like `ProductSales`. Never authored. */
  sales?: VariantSales;
  updatedAt: string;
}

/** What one combination has sold. The variant-level cut of `ProductSales`. */
export interface VariantSales {
  unitsSold: number;
  revenue: number;
  orders: number;
  lastSoldAt?: string;
}

/** Lowest and highest sellable price across a product's variants. */
export interface PriceRange {
  min: number;
  max: number;
}
