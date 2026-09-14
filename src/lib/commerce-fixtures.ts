import type {
  Catalog,
  Category,
  Discount,
  InventoryItem,
  Order,
  Product,
  StockAdjustment,
  StockStatus,
  CommerceCustomer,
  CustomerType,
  DigitalDetails,
  FulfillmentStatus,
  OrderLine,
  OrderStatus,
  OrderType,
  PhysicalDetails,
  ProductSales,
  ProductType,
  Sale,
  SaleStatus,
  SalesChannel,
  ServiceDetails,
} from "@/types/commerce";
import {
  CUSTOMER_RULES,
  FULFILLMENT_FLOW,
  ORDER_PROGRESS,
} from "@/constants/commerce";

/**
 * Placeholder commerce data.
 *
 * Every page reads from here so the module is reviewable without a backend.
 * The RTK Query slices in `redux/api/*` are the real seam — swap a page's
 * import for its hook and the shapes already match.
 *
 * The figures line up with the merchant dashboard on purpose: the four
 * packages, the #MF-102xx orders and the Summer Sale campaign are the same
 * ones shown there, so the modules read as one business.
 */

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The instant the commerce fixtures are read against.
 *
 * Same discipline as the other modules: relative figures measured from a fixed
 * point, so "inactive for 120 days" cannot drift as the file ages, and a server
 * render and a client render agree.
 */
export const COMMERCE_NOW = "2026-06-02T10:00:00.000Z";
export const COMMERCE_NOW_MS = new Date(COMMERCE_NOW).getTime();

export const CATEGORIES: Category[] = [
  {
    id: "cat-packages",
    name: "Service Packages",
    slug: "service-packages",
    description: "Bundled retainers sold as a single line item.",
    productCount: 4,
    status: "active",
    updatedAt: "2026-05-28T09:20:00Z",
  },
  {
    id: "cat-addons",
    name: "Add-ons",
    slug: "add-ons",
    description: "Extras attached to an existing package.",
    productCount: 3,
    status: "active",
    updatedAt: "2026-05-26T14:05:00Z",
  },
  {
    id: "cat-templates",
    name: "Templates",
    slug: "templates",
    description: "Downloadable message and campaign templates.",
    productCount: 2,
    status: "active",
    updatedAt: "2026-05-22T11:40:00Z",
  },
  {
    id: "cat-training",
    name: "Training",
    slug: "training",
    description: "Live onboarding and team training sessions.",
    productCount: 2,
    status: "active",
    updatedAt: "2026-05-19T16:30:00Z",
  },
  {
    id: "cat-hardware",
    name: "Hardware",
    slug: "hardware",
    description: "Physical devices shipped to customers.",
    productCount: 1,
    status: "archived",
    updatedAt: "2026-04-30T08:15:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

function product(
  partial: Omit<Product, "images" | "visibility" | "trackInventory" | "slug"> &
    Partial<Pick<Product, "images" | "visibility" | "trackInventory" | "slug">>,
): Product {
  return {
    images: [],
    visibility: "visible",
    trackInventory: true,
    slug: partial.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    ...partial,
  };
}

export const PRODUCTS: Product[] = [
  product({
    id: "prd-premium",
    name: "Premium Package",
    description:
      "The full workspace — WhatsApp automation, campaigns, CRM and analytics.",
    sku: "MF-PREM-01",
    type: "service",
    categoryId: "cat-packages",
    categoryName: "Service Packages",
    status: "active",
    price: 149,
    salePrice: 129,
    costPrice: 48,
    taxRate: 5,
    stock: 184,
    lowStockThreshold: 25,
    featured: true,
    tags: ["bestseller", "whatsapp"],
    seoTitle: "Premium Package — MarketFlow",
    metaDescription: "Everything you need to turn conversations into customers.",
    createdAt: "2025-11-02T10:00:00Z",
    updatedAt: "2026-05-30T08:12:00Z",
  }),
  product({
    id: "prd-starter",
    name: "Starter Package",
    description: "For a first workspace: one channel, one automation.",
    sku: "MF-STAR-01",
    type: "service",
    categoryId: "cat-packages",
    categoryName: "Service Packages",
    status: "active",
    price: 79,
    costPrice: 22,
    taxRate: 5,
    stock: 142,
    lowStockThreshold: 25,
    featured: true,
    tags: ["entry"],
    createdAt: "2025-11-02T10:00:00Z",
    updatedAt: "2026-05-29T15:44:00Z",
  }),
  product({
    id: "prd-business",
    name: "Business Package",
    description: "Multi-seat workspace with roles, approvals and reporting.",
    sku: "MF-BUSI-01",
    type: "service",
    categoryId: "cat-packages",
    categoryName: "Service Packages",
    status: "active",
    price: 249,
    salePrice: 219,
    costPrice: 74,
    taxRate: 5,
    stock: 98,
    lowStockThreshold: 20,
    featured: true,
    tags: ["teams"],
    createdAt: "2025-12-08T10:00:00Z",
    updatedAt: "2026-05-28T12:05:00Z",
  }),
  product({
    id: "prd-growth",
    name: "Growth Package",
    description: "Adds landing pages, forms and conversion reporting.",
    sku: "MF-GROW-01",
    type: "service",
    categoryId: "cat-packages",
    categoryName: "Service Packages",
    status: "active",
    price: 129,
    costPrice: 41,
    taxRate: 5,
    stock: 18,
    lowStockThreshold: 25,
    featured: false,
    tags: ["growth"],
    createdAt: "2026-01-14T10:00:00Z",
    updatedAt: "2026-05-27T09:30:00Z",
  }),
  product({
    id: "prd-wa-seat",
    name: "Extra WhatsApp Seat",
    description: "One additional agent seat on the shared inbox.",
    sku: "MF-ADD-WA",
    type: "digital",
    categoryId: "cat-addons",
    categoryName: "Add-ons",
    status: "active",
    price: 19,
    costPrice: 4,
    stock: 640,
    lowStockThreshold: 50,
    featured: false,
    tags: ["whatsapp", "seat"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-30T07:02:00Z",
  }),
  product({
    id: "prd-sms-credits",
    name: "SMS Credit Pack",
    description: "5,000 outbound SMS credits.",
    sku: "MF-ADD-SMS",
    type: "digital",
    categoryId: "cat-addons",
    categoryName: "Add-ons",
    status: "active",
    price: 39,
    salePrice: 34,
    costPrice: 18,
    stock: 12,
    lowStockThreshold: 40,
    featured: false,
    tags: ["sms"],
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-26T18:20:00Z",
  }),
  product({
    id: "prd-priority",
    name: "Priority Support",
    description: "Four-hour response window, business hours.",
    sku: "MF-ADD-SUP",
    type: "service",
    categoryId: "cat-addons",
    categoryName: "Add-ons",
    status: "draft",
    price: 59,
    costPrice: 20,
    stock: 0,
    lowStockThreshold: 10,
    trackInventory: false,
    featured: false,
    tags: ["support"],
    createdAt: "2026-05-10T10:00:00Z",
    updatedAt: "2026-05-24T10:10:00Z",
  }),
  product({
    id: "prd-wa-templates",
    name: "WhatsApp Template Pack",
    description: "40 approved message templates across 6 industries.",
    sku: "MF-TPL-WA",
    type: "digital",
    categoryId: "cat-templates",
    categoryName: "Templates",
    status: "active",
    price: 29,
    costPrice: 0,
    stock: 0,
    lowStockThreshold: 20,
    featured: false,
    tags: ["whatsapp", "templates"],
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-05-21T13:15:00Z",
  }),
  product({
    id: "prd-email-templates",
    name: "Email Campaign Pack",
    description: "24 responsive email layouts with copy prompts.",
    sku: "MF-TPL-EM",
    type: "digital",
    categoryId: "cat-templates",
    categoryName: "Templates",
    status: "active",
    price: 24,
    costPrice: 0,
    stock: 320,
    lowStockThreshold: 20,
    featured: false,
    tags: ["email", "templates"],
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-05-18T09:00:00Z",
  }),
  product({
    id: "prd-onboarding",
    name: "Onboarding Session",
    description: "Ninety minutes, live, with your workspace set up on the call.",
    sku: "MF-TRN-ONB",
    type: "service",
    categoryId: "cat-training",
    categoryName: "Training",
    status: "active",
    price: 189,
    costPrice: 60,
    stock: 24,
    lowStockThreshold: 10,
    featured: false,
    tags: ["training"],
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-05-25T11:25:00Z",
  }),
  product({
    id: "prd-team-training",
    name: "Team Training Day",
    description: "Full-day workshop for up to twelve people.",
    sku: "MF-TRN-TEAM",
    type: "service",
    categoryId: "cat-training",
    categoryName: "Training",
    status: "draft",
    price: 690,
    costPrice: 240,
    stock: 6,
    lowStockThreshold: 4,
    featured: false,
    tags: ["training", "teams"],
    createdAt: "2026-04-12T10:00:00Z",
    updatedAt: "2026-05-20T14:50:00Z",
  }),
  product({
    id: "prd-qr-stand",
    name: "Catalog QR Stand",
    description: "Counter-top acrylic stand printed with your catalog QR code.",
    sku: "MF-HW-QR",
    type: "physical",
    categoryId: "cat-hardware",
    categoryName: "Hardware",
    status: "archived",
    price: 34,
    costPrice: 11,
    stock: 0,
    lowStockThreshold: 15,
    featured: false,
    tags: ["hardware"],
    createdAt: "2025-09-18T10:00:00Z",
    updatedAt: "2026-04-30T08:15:00Z",
  }),
];

/** Where a product sits against its own threshold. */
export function stockStatusOf(
  stock: number,
  lowStockThreshold: number,
): StockStatus {
  if (stock <= 0) return "out-of-stock";
  if (stock <= lowStockThreshold) return "low-stock";
  return "in-stock";
}

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((item) => item.id === id);
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

/** Fills the timeline up to and including `reached`. */
function timelineTo(
  reached: Order["status"],
  placedAt: string,
): Order["timeline"] {
  const steps: { status: Order["status"]; label: string }[] = [
    { status: "pending", label: "Order Placed" },
    { status: "paid", label: "Payment Confirmed" },
    { status: "processing", label: "Processing" },
    { status: "shipped", label: "Shipped" },
    { status: "delivered", label: "Delivered" },
  ];

  const cutoff = steps.findIndex((step) => step.status === reached);
  const base = new Date(placedAt).getTime();

  return steps.map((step, index) => ({
    ...step,
    at:
      cutoff >= 0 && index <= cutoff
        ? new Date(base + index * 42 * 60 * 1000).toISOString()
        : undefined,
  }));
}

/**
 * What an order contains, from what is in it.
 *
 * Derived rather than stored on each fixture: the type of an order is a fact
 * about its lines, and a hand-set field is a chance for them to disagree. An
 * order spanning two product types is `mixed`, which is a real case — a course
 * plus a printed workbook — and is why fulfilment is chosen per order.
 */
function orderTypeOf(lines: OrderLine[]): OrderType {
  const types = new Set(
    lines
      .map((line) => PRODUCTS.find((item) => item.id === line.productId)?.type)
      .filter((type): type is ProductType => Boolean(type)),
  );

  if (types.size === 0) return "physical";
  if (types.size > 1) return "mixed";
  return [...types][0];
}

/**
 * The fulfilment step that matches an order's commercial status.
 *
 * Each product type has its own vocabulary — see `FULFILLMENT_FLOW` — so the
 * same "paid but not delivered" order reads as *Processing* for a shipped
 * item, *Access pending* for a download and *Scheduled* for a booking. One
 * shared ladder would have to call all three "Processing".
 */
function fulfillmentFor(
  type: OrderType,
  status: OrderStatus,
): FulfillmentStatus {
  if (status === "cancelled" || status === "refunded") return "cancelled";

  const flow = FULFILLMENT_FLOW[type === "mixed" ? "physical" : type];
  const index = Math.min(
    ORDER_PROGRESS.indexOf(status),
    flow.length - 1,
  );

  return flow[Math.max(index, 0)].value;
}

/**
 * Where an order came from, when the fixture does not say.
 *
 * A campaign-attributed order is a campaign sale; the rest are spread across
 * the channels a MarketFlow merchant actually sells through, deterministically
 * by id so the Sales breakdown is stable between renders.
 */
function channelFor(partial: { sourceCampaign?: string; id: string }): SalesChannel {
  if (partial.sourceCampaign) return "campaign";

  const spread: SalesChannel[] = ["whatsapp", "website", "whatsapp", "manual"];
  const seed = partial.id.charCodeAt(partial.id.length - 1);
  return spread[seed % spread.length];
}

function order(
  partial: Omit<
    Order,
    | "subtotal"
    | "tax"
    | "total"
    | "timeline"
    | "orderType"
    | "fulfillmentStatus"
    | "channel"
  > &
    Partial<Pick<Order, "tax" | "orderType" | "fulfillmentStatus" | "channel">>,
): Order {
  const subtotal = partial.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const tax = partial.tax ?? Math.round((subtotal - partial.discount) * 0.05);
  const orderType = partial.orderType ?? orderTypeOf(partial.lines);

  return {
    ...partial,
    orderType,
    channel: partial.channel ?? channelFor(partial),
    fulfillmentStatus:
      partial.fulfillmentStatus ?? fulfillmentFor(orderType, partial.status),
    subtotal,
    tax,
    total: subtotal - partial.discount + tax,
    timeline: timelineTo(partial.status, partial.placedAt),
  };
}

export const ORDERS: Order[] = [
  order({
    id: "ord-10248",
    reference: "#MF-10248",
    customer: {
      id: "cus-sarah",
      name: "Sarah Ahmed",
      email: "sarah@brightretail.co",
      whatsappNumber: "+8801711223344",
    },
    lines: [{ productId: "prd-premium", productName: "Premium Package", quantity: 1, unitPrice: 149 }],
    discount: 0,
    status: "paid",
    paymentStatus: "paid",
    paymentMethod: "Card · Visa 4242",
    sourceCampaign: "Summer Sale",
    placedAt: "2026-05-30T09:58:00Z",
  }),
  order({
    id: "ord-10247",
    reference: "#MF-10247",
    customer: {
      id: "cus-john",
      name: "John Smith",
      email: "john@smithagency.io",
      whatsappNumber: "+447700900123",
    },
    lines: [{ productId: "prd-starter", productName: "Starter Package", quantity: 1, unitPrice: 79 }],
    discount: 0,
    status: "paid",
    paymentStatus: "paid",
    paymentMethod: "Card · Mastercard 8123",
    sourceCampaign: "Product Launch",
    placedAt: "2026-05-30T09:52:00Z",
  }),
  order({
    id: "ord-10246",
    reference: "#MF-10246",
    customer: {
      id: "cus-maria",
      name: "Maria Gomez",
      email: "maria@casaverde.mx",
      whatsappNumber: "+5215512345678",
    },
    lines: [
      { productId: "prd-business", productName: "Business Package", quantity: 1, unitPrice: 249 },
      { productId: "prd-wa-seat", productName: "Extra WhatsApp Seat", quantity: 2, unitPrice: 19 },
    ],
    discount: 28,
    discountCode: "SUMMER20",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "Bank transfer",
    sourceCampaign: "Summer Sale",
    placedAt: "2026-05-30T09:45:00Z",
  }),
  order({
    id: "ord-10245",
    reference: "#MF-10245",
    customer: {
      id: "cus-david",
      name: "David Chen",
      email: "david@chenstudio.com",
      whatsappNumber: "+6591234567",
    },
    lines: [{ productId: "prd-growth", productName: "Growth Package", quantity: 1, unitPrice: 129 }],
    discount: 0,
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "Invoice · Net 14",
    placedAt: "2026-05-30T09:36:00Z",
  }),
  order({
    id: "ord-10244",
    reference: "#MF-10244",
    customer: {
      id: "cus-amina",
      name: "Amina Rahman",
      email: "amina@rahmanfoods.bd",
      whatsappNumber: "+8801812345678",
    },
    lines: [{ productId: "prd-starter", productName: "Starter Package", quantity: 1, unitPrice: 79 }],
    discount: 0,
    status: "cancelled",
    paymentStatus: "failed",
    paymentMethod: "Card · declined",
    placedAt: "2026-05-30T09:22:00Z",
  }),
  order({
    id: "ord-10243",
    reference: "#MF-10243",
    customer: {
      id: "cus-lucas",
      name: "Lucas Meyer",
      email: "lucas@meyerbau.de",
      whatsappNumber: "+4915112345678",
    },
    lines: [
      { productId: "prd-premium", productName: "Premium Package", quantity: 1, unitPrice: 149 },
      { productId: "prd-onboarding", productName: "Onboarding Session", quantity: 1, unitPrice: 189 },
    ],
    discount: 34,
    discountCode: "WELCOME10",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Card · Visa 1188",
    sourceCampaign: "Lead Nurture",
    placedAt: "2026-05-29T14:10:00Z",
  }),
  order({
    id: "ord-10242",
    reference: "#MF-10242",
    customer: {
      id: "cus-priya",
      name: "Priya Nair",
      email: "priya@nairclinics.in",
      whatsappNumber: "+919812345678",
    },
    lines: [{ productId: "prd-wa-templates", productName: "WhatsApp Template Pack", quantity: 1, unitPrice: 29 }],
    discount: 0,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "UPI",
    sourceCampaign: "Re-engagement",
    placedAt: "2026-05-29T11:05:00Z",
  }),
  order({
    id: "ord-10241",
    reference: "#MF-10241",
    customer: {
      id: "cus-omar",
      name: "Omar Haddad",
      email: "omar@haddadtrading.ae",
      whatsappNumber: "+971501234567",
    },
    lines: [{ productId: "prd-business", productName: "Business Package", quantity: 1, unitPrice: 249 }],
    discount: 0,
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "Card · Amex 3005",
    placedAt: "2026-05-28T16:40:00Z",
  }),
  order({
    id: "ord-10240",
    reference: "#MF-10240",
    customer: {
      id: "cus-hannah",
      name: "Hannah Park",
      email: "hannah@parkbeauty.kr",
      whatsappNumber: "+821012345678",
    },
    lines: [{ productId: "prd-sms-credits", productName: "SMS Credit Pack", quantity: 3, unitPrice: 39 }],
    discount: 12,
    discountCode: "SUMMER20",
    status: "refunded",
    paymentStatus: "refunded",
    paymentMethod: "Card · Visa 7742",
    placedAt: "2026-05-28T10:15:00Z",
  }),
  order({
    id: "ord-10239",
    reference: "#MF-10239",
    customer: {
      id: "cus-tomas",
      name: "Tomás Silva",
      email: "tomas@silvamoveis.br",
      whatsappNumber: "+5511987654321",
    },
    lines: [{ productId: "prd-premium", productName: "Premium Package", quantity: 2, unitPrice: 149 }],
    discount: 30,
    discountCode: "SUMMER20",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Card · Visa 9001",
    sourceCampaign: "Summer Sale",
    placedAt: "2026-05-27T09:00:00Z",
  }),
];

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

/** Derived from the products, so stock never disagrees between the two pages. */
/**
 * Warehouse stock: physical products that are tracked, and nothing else.
 *
 * The type check is the addition. `trackInventory` alone let a digital product
 * or a service appear in the warehouse the moment someone ticked the box on the
 * old shared form — which is how a consultation ends up with a reorder level.
 *
 * Finite digital licences and service capacity are real, and they are managed
 * on the product itself (`digital.licensesAvailable`, `service.capacityPerSlot`)
 * rather than here, because they are not stock that gets picked and shipped.
 */
export const INVENTORY: InventoryItem[] = PRODUCTS.filter(
  (item) => item.type === "physical" && item.trackInventory,
).map((item) => ({
  productId: item.id,
  productName: item.name,
  sku: item.sku,
  stock: item.stock,
  reserved:
    item.stock > 40 ? Math.round(item.stock * 0.08) : Math.min(item.stock, 2),
  lowStockThreshold: item.lowStockThreshold,
  unitCost: item.costPrice ?? 0,
  updatedAt: item.updatedAt,
}));

export const STOCK_ACTIVITY: StockAdjustment[] = [
  {
    id: "adj-1",
    productId: "prd-premium",
    productName: "Premium Package",
    delta: 20,
    reason: "stock-received",
    at: "2026-05-30T08:12:00Z",
  },
  {
    id: "adj-2",
    productId: "prd-starter",
    productName: "Starter Package",
    delta: -4,
    reason: "order",
    note: "Order #MF-10248",
    at: "2026-05-30T07:55:00Z",
  },
  {
    id: "adj-3",
    productId: "prd-sms-credits",
    productName: "SMS Credit Pack",
    delta: -18,
    reason: "order",
    note: "Order #MF-10240",
    at: "2026-05-29T18:20:00Z",
  },
  {
    id: "adj-4",
    productId: "prd-growth",
    productName: "Growth Package",
    delta: 2,
    reason: "return",
    note: "Order #MF-10231 returned",
    at: "2026-05-29T12:05:00Z",
  },
  {
    id: "adj-5",
    productId: "prd-business",
    productName: "Business Package",
    delta: -3,
    reason: "damage",
    note: "Damaged in transit",
    at: "2026-05-28T16:44:00Z",
  },
  {
    id: "adj-6",
    productId: "prd-onboarding",
    productName: "Onboarding Session",
    delta: 8,
    reason: "manual",
    note: "June availability opened",
    at: "2026-05-28T09:30:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Catalogs                                                                   */
/* -------------------------------------------------------------------------- */

export const CATALOGS: Catalog[] = [
  {
    id: "cat-summer",
    name: "Summer Collection",
    description: "The packages promoted in the Summer Sale campaign.",
    productIds: ["prd-premium", "prd-business", "prd-growth", "prd-wa-seat"],
    status: "published",
    shareUrl: "https://mf.link/c/summer",
    views: 4820,
    updatedAt: "2026-05-30T08:00:00Z",
  },
  {
    id: "cat-starter",
    name: "New Customer Starter",
    description: "What we send to a first-time enquiry on WhatsApp.",
    productIds: ["prd-starter", "prd-onboarding", "prd-wa-templates"],
    status: "published",
    shareUrl: "https://mf.link/c/starter",
    views: 2140,
    updatedAt: "2026-05-28T13:20:00Z",
  },
  {
    id: "cat-addons",
    name: "Add-ons & Credits",
    description: "Upsells for existing customers.",
    productIds: ["prd-wa-seat", "prd-sms-credits", "prd-priority"],
    status: "draft",
    shareUrl: "https://mf.link/c/addons",
    views: 0,
    updatedAt: "2026-05-24T10:45:00Z",
  },
  {
    id: "cat-spring",
    name: "Spring Promotion",
    description: "Last quarter's offer set.",
    productIds: ["prd-premium", "prd-starter"],
    status: "archived",
    shareUrl: "https://mf.link/c/spring",
    views: 6310,
    updatedAt: "2026-03-31T17:00:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Discounts                                                                  */
/* -------------------------------------------------------------------------- */

export const DISCOUNTS: Discount[] = [
  {
    id: "dsc-summer20",
    code: "SUMMER20",
    name: "Summer Sale 20%",
    type: "percentage",
    value: 20,
    scope: "categories",
    categoryIds: ["cat-packages"],
    minimumPurchase: 100,
    maximumDiscount: 60,
    usageLimit: 500,
    usageCount: 342,
    discountGiven: 6840,
    revenueGenerated: 18240,
    status: "active",
    startsAt: "2026-05-01T00:00:00Z",
    endsAt: "2026-06-30T23:59:00Z",
  },
  {
    id: "dsc-welcome10",
    code: "WELCOME10",
    name: "First order 10%",
    type: "percentage",
    value: 10,
    scope: "all",
    usageLimit: 1000,
    usageCount: 486,
    discountGiven: 4120,
    revenueGenerated: 14820,
    status: "active",
    startsAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "dsc-ship0",
    code: "FREESHIP",
    name: "Free shipping on hardware",
    type: "free-shipping",
    value: 0,
    scope: "categories",
    categoryIds: ["cat-hardware"],
    usageCount: 62,
    discountGiven: 434,
    revenueGenerated: 2108,
    status: "expired",
    startsAt: "2026-03-01T00:00:00Z",
    endsAt: "2026-04-30T23:59:00Z",
  },
  {
    id: "dsc-bundle25",
    code: "BUNDLE25",
    name: "$25 off bundles",
    type: "fixed",
    value: 25,
    scope: "products",
    productIds: ["prd-premium", "prd-business"],
    minimumPurchase: 200,
    usageLimit: 200,
    usageCount: 118,
    discountGiven: 2950,
    revenueGenerated: 9640,
    status: "active",
    startsAt: "2026-05-15T00:00:00Z",
    endsAt: "2026-07-15T23:59:00Z",
  },
  {
    id: "dsc-launch15",
    code: "LAUNCH15",
    name: "Product Launch 15%",
    type: "percentage",
    value: 15,
    scope: "all",
    usageLimit: 300,
    usageCount: 0,
    discountGiven: 0,
    revenueGenerated: 0,
    status: "scheduled",
    startsAt: "2026-06-10T00:00:00Z",
    endsAt: "2026-06-24T23:59:00Z",
  },
  {
    id: "dsc-vip",
    code: "VIP50",
    name: "VIP customers $50 off",
    type: "fixed",
    value: 50,
    scope: "products",
    productIds: ["prd-business"],
    minimumPurchase: 400,
    usageCount: 0,
    discountGiven: 0,
    revenueGenerated: 0,
    status: "draft",
    startsAt: "2026-06-01T00:00:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Type-specific product detail                                               */
/* -------------------------------------------------------------------------- */

/**
 * The detail object each product carries for its own type.
 *
 * Attached here rather than typed into every product literal, so the twelve
 * fixtures stay readable and a product cannot end up with, say, shipping
 * settings on a service. Keyed by product id; anything unlisted gets a sensible
 * default for its type.
 */
const PHYSICAL_DETAIL: Record<string, PhysicalDetails> = {
  "prd-swag": {
    weightGrams: 180,
    dimensionsCm: { length: 30, width: 22, height: 3 },
    shippingRequired: true,
    variants: [
      { id: "var-s", optionName: "Size", optionValue: "Small", sku: "MF-SWAG-S", stock: 18 },
      { id: "var-m", optionName: "Size", optionValue: "Medium", sku: "MF-SWAG-M", stock: 24 },
      { id: "var-l", optionName: "Size", optionValue: "Large", sku: "MF-SWAG-L", stock: 12 },
    ],
  },
};

const DIGITAL_DETAIL: Record<string, DigitalDetails> = {
  "prd-templates": {
    accessType: "download",
    fileName: "marketflow-template-pack.zip",
    fileSizeMb: 48,
    downloadLimit: 5,
    accessExpiryDays: null,
  },
  "prd-guide": {
    accessType: "download",
    fileName: "whatsapp-growth-guide.pdf",
    fileSizeMb: 12,
    downloadLimit: null,
    accessExpiryDays: null,
  },
  "prd-course": {
    accessType: "stream",
    downloadLimit: null,
    accessExpiryDays: 365,
    externalUrl: "https://learn.marketflow.app/course/automation",
  },
  "prd-reports": {
    accessType: "license-key",
    downloadLimit: null,
    accessExpiryDays: 365,
    licensesAvailable: 40,
  },
};

const SERVICE_DETAIL: Record<string, ServiceDetails> = {
  "prd-onboarding": {
    pricingType: "fixed",
    durationMinutes: 90,
    bookingRequired: true,
    locationType: "online",
    capacityPerSlot: 1,
  },
  "prd-audit": {
    pricingType: "fixed",
    durationMinutes: 60,
    bookingRequired: true,
    locationType: "online",
    capacityPerSlot: 1,
  },
  "prd-consult": {
    pricingType: "hourly",
    durationMinutes: 60,
    bookingRequired: true,
    locationType: "online",
    capacityPerSlot: 1,
  },
  "prd-training": {
    pricingType: "starting-from",
    durationMinutes: 180,
    bookingRequired: true,
    locationType: "business-location",
    capacityPerSlot: 12,
  },
};

/** Defaults for anything the tables above do not name. */
function detailFor(item: Product): Partial<Product> {
  switch (item.type) {
    case "physical":
      return {
        physical: PHYSICAL_DETAIL[item.id] ?? { shippingRequired: true },
      };
    case "digital":
      return {
        digital:
          DIGITAL_DETAIL[item.id] ?? {
            accessType: "download",
            downloadLimit: null,
            accessExpiryDays: null,
          },
      };
    case "service":
      return {
        service:
          SERVICE_DETAIL[item.id] ?? {
            pricingType: "fixed",
            bookingRequired: false,
            locationType: "online",
            capacityPerSlot: null,
          },
      };
  }
}

/* -------------------------------------------------------------------------- */
/* Sales, derived from orders                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What each product has sold, computed from the order book.
 *
 * Derived rather than stored, because the alternative is a number on the
 * product that disagrees with the orders behind it. A backend computes this the
 * same way; the shape is what the product list, the detail tabs and the Sales
 * page all read.
 */
export function productSales(productId: string): ProductSales {
  const lines = ORDERS.flatMap((order) =>
    order.lines
      .filter((line) => line.productId === productId)
      .map((line) => ({ order, line })),
  );

  const buyers = new Set(lines.map(({ order }) => order.customer.id));
  const sold = lines.reduce((sum, { line }) => sum + line.quantity, 0);

  return {
    unitsSold: sold,
    revenue: lines.reduce(
      (sum, { line }) => sum + line.unitPrice * line.quantity,
      0,
    ),
    orders: new Set(lines.map(({ order }) => order.id)).size,
    customers: buyers.size,
    lastSoldAt: lines
      .map(({ order }) => order.placedAt)
      .sort()
      .at(-1),
  };
}

/**
 * The product catalogue with its type detail and sales attached.
 *
 * This is what every Commerce surface should read — `PRODUCTS` remains the raw
 * literal list so the derivation stays visible, and nothing has to remember to
 * join sales at the call site.
 */
export const COMMERCE_PRODUCTS: Product[] = PRODUCTS.map((item) => ({
  ...item,
  ...detailFor(item),
  sales: productSales(item.id),
}));

export const commerceProductById = (id: string) =>
  COMMERCE_PRODUCTS.find((item) => item.id === id);

/** Totals for the Products KPI row — counts by type, not stock levels. */
export function productTotals(list: Product[] = COMMERCE_PRODUCTS) {
  const byType = (type: ProductType) =>
    list.filter((item) => item.type === type).length;

  return {
    total: list.length,
    active: list.filter((item) => item.status === "active").length,
    physical: byType("physical"),
    digital: byType("digital"),
    service: byType("service"),
  };
}

/* -------------------------------------------------------------------------- */
/* Sales ledger                                                               */
/* -------------------------------------------------------------------------- */

/** Payment status mapped onto the commercial vocabulary Sales reports in. */
function saleStatusOf(order: Order): SaleStatus {
  if (order.status === "refunded") return "refunded";
  if (order.paymentStatus === "failed") return "failed";
  if (order.paymentStatus === "refunded") return "refunded";
  if (order.paymentStatus === "pending") return "pending";
  return "paid";
}

/**
 * Sales, as a reading of the order book.
 *
 * Not a second ledger — every row points back at the order it came from, and
 * clicking one goes there. Orders answer "what needs processing"; this answers
 * "how much did we sell", and the two must never disagree because only one of
 * them holds data.
 */
export const SALES: Sale[] = ORDERS.map((order) => {
  const headline = order.lines[0];
  const refunded = order.status === "refunded" ? order.total : 0;

  return {
    id: `sale-${order.id}`,
    orderId: order.id,
    orderReference: order.reference,
    customerId: order.customer.id,
    customerName: order.customer.name,
    productName:
      order.lines.length > 1
        ? `${headline?.productName} +${order.lines.length - 1} more`
        : (headline?.productName ?? "—"),
    productId: headline?.productId ?? "",
    type: order.orderType,
    channel: order.channel,
    gross: order.subtotal,
    discount: order.discount,
    refunded,
    net: order.subtotal - order.discount - refunded,
    status: saleStatusOf(order),
    at: order.placedAt,
  };
});

export interface SalesTotals {
  gross: number;
  net: number;
  orders: number;
  averageOrderValue: number;
  refunds: number;
}

export function salesTotals(list: Sale[] = SALES): SalesTotals {
  const counted = list.filter((sale) => sale.status !== "failed");
  const gross = counted.reduce((sum, sale) => sum + sale.gross, 0);
  const net = counted.reduce((sum, sale) => sum + sale.net, 0);

  return {
    gross,
    net,
    orders: counted.length,
    /* Against net, not gross: an average that ignores discounts and refunds
       flatters itself by exactly the amount the business did not receive. */
    averageOrderValue: counted.length === 0 ? 0 : Math.round(net / counted.length),
    refunds: counted.reduce((sum, sale) => sum + sale.refunded, 0),
  };
}

/** Revenue and order counts per day, for the Sales chart. */
export function salesSeries(list: Sale[] = SALES) {
  const byDay = new Map<string, { revenue: number; orders: number }>();

  for (const sale of list) {
    if (sale.status === "failed") continue;
    const day = sale.at.slice(0, 10);
    const current = byDay.get(day) ?? { revenue: 0, orders: 0 };
    byDay.set(day, {
      revenue: current.revenue + sale.net,
      orders: current.orders + 1,
    });
  }

  const days = [...byDay.keys()].sort();

  return {
    labels: days,
    revenue: days.map((day) => byDay.get(day)?.revenue ?? 0),
    orders: days.map((day) => byDay.get(day)?.orders ?? 0),
  };
}

/** The best sellers of one type, for the Sales page's compact top lists. */
export function topSellers(type: ProductType, limit = 3) {
  return COMMERCE_PRODUCTS.filter((item) => item.type === type)
    .filter((item) => (item.sales?.revenue ?? 0) > 0)
    .sort((a, b) => (b.sales?.revenue ?? 0) - (a.sales?.revenue ?? 0))
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Commerce customers                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Buyers, derived from the order book.
 *
 * The single most important rule in this module: there is one customer
 * database, and it is `CONTACTS`. This projects order history onto the contacts
 * who bought something — it does not create a customer record. `contactId` is
 * the CRM id, and "View full profile" opens that record.
 *
 * A contact appears here the moment they have an order, and disappears from
 * nowhere: not buying is not a state this list needs to represent.
 */
export const COMMERCE_CUSTOMERS: CommerceCustomer[] = (() => {
  const byCustomer = new Map<string, Order[]>();

  for (const order of ORDERS) {
    if (order.paymentStatus === "failed") continue;
    byCustomer.set(order.customer.id, [
      ...(byCustomer.get(order.customer.id) ?? []),
      order,
    ]);
  }

  return [...byCustomer.entries()].map(([customerId, orders]) => {
    const sorted = [...orders].sort((a, b) => a.placedAt.localeCompare(b.placedAt));
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const first = sorted[0];
    const last = sorted.at(-1)!;

    /* Revenue per product, so "top product" is what they spent most on rather
       than whatever they happened to buy most recently. */
    const spendByProduct = new Map<string, number>();
    for (const order of orders) {
      for (const line of order.lines) {
        spendByProduct.set(
          line.productName,
          (spendByProduct.get(line.productName) ?? 0) + line.unitPrice * line.quantity,
        );
      }
    }

    const purchasedTypes = [
      ...new Set(
        orders
          .flatMap((order) =>
            order.lines.map(
              (line) => PRODUCTS.find((item) => item.id === line.productId)?.type,
            ),
          )
          .filter((type): type is ProductType => Boolean(type)),
      ),
    ];

    return {
      contactId: customerId,
      name: last.customer.name,
      email: last.customer.email,
      whatsappNumber: last.customer.whatsappNumber,
      orders: orders.length,
      totalSpent,
      averageOrderValue: Math.round(totalSpent / orders.length),
      firstPurchaseAt: first.placedAt,
      lastPurchaseAt: last.placedAt,
      topProductName:
        [...spendByProduct.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      purchasedTypes,
      customerType: classifyCustomer(orders.length, totalSpent, last.placedAt),
    };
  });
})();

/**
 * Which bucket a buyer falls into.
 *
 * Computed, never assigned — see `CUSTOMER_RULES` for the thresholds. VIP wins
 * over Repeat because it is the more useful label, and Inactive wins over both
 * because a lapsed VIP is the one a merchant most wants to see.
 */
function classifyCustomer(
  orders: number,
  totalSpent: number,
  lastPurchaseAt: string,
): CustomerType {
  const daysSince =
    (COMMERCE_NOW_MS - new Date(lastPurchaseAt).getTime()) / 86_400_000;

  if (daysSince > CUSTOMER_RULES.inactiveDays) return "inactive";
  if (totalSpent >= CUSTOMER_RULES.vipSpend || orders >= CUSTOMER_RULES.vipOrders) {
    return "vip";
  }
  return orders > 1 ? "repeat" : "new";
}

export const commerceCustomerById = (contactId: string) =>
  COMMERCE_CUSTOMERS.find((item) => item.contactId === contactId);

/** Every order one buyer placed, newest first — the customer drawer's timeline. */
export const ordersForCustomer = (contactId: string) =>
  ORDERS.filter((order) => order.customer.id === contactId).sort((a, b) =>
    b.placedAt.localeCompare(a.placedAt),
  );

export function customerTotals(list: CommerceCustomer[] = COMMERCE_CUSTOMERS) {
  return {
    total: list.length,
    new: list.filter((item) => item.customerType === "new").length,
    repeat: list.filter(
      (item) => item.customerType === "repeat" || item.customerType === "vip",
    ).length,
    lifetimeRevenue: list.reduce((sum, item) => sum + item.totalSpent, 0),
  };
}
