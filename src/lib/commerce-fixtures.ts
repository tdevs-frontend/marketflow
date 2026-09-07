import type {
  Catalog,
  Category,
  Discount,
  InventoryItem,
  Order,
  Product,
  StockAdjustment,
  StockStatus,
} from "@/types/commerce";

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

function order(
  partial: Omit<Order, "subtotal" | "tax" | "total" | "timeline"> &
    Partial<Pick<Order, "tax">>,
): Order {
  const subtotal = partial.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const tax = partial.tax ?? Math.round((subtotal - partial.discount) * 0.05);

  return {
    ...partial,
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
export const INVENTORY: InventoryItem[] = PRODUCTS.filter(
  (item) => item.trackInventory,
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
