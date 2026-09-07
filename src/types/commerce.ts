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

  /* Inventory */
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;

  images: ProductImage[];

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
  /** Signed: positive receives stock, negative removes it. */
  delta: number;
  reason: StockAdjustmentReason;
  note?: string;
  at: string;
}

export interface CreateStockAdjustmentPayload {
  productId: string;
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
