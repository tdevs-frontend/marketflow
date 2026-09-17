import type { Option } from "@/constants/commerce";
import { WHATSAPP_CONNECTIONS } from "@/lib/campaign-fixtures";
import type { ActivityEntry } from "@/lib/overview-fixtures";
import type {
  Campaign,
  TemplateCategory,
  TemplateStatus,
  TemplateUseCase,
  WhatsAppContact,
  WhatsAppContactStatus,
  WhatsAppTemplate,
} from "@/types/marketing";

/**
 * WhatsApp module data. Campaigns come from `marketing-fixtures` filtered to
 * the channel, so the WhatsApp page and the unified Campaigns page can never
 * disagree; templates and contacts live here because nothing else uses them.
 */

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export const TEMPLATE_CATEGORIES: Option<TemplateCategory>[] = [
  { value: "marketing", label: "Marketing" },
  { value: "utility", label: "Utility" },
  { value: "authentication", label: "Authentication" },
];

export const TEMPLATE_STATUSES: Option<TemplateStatus>[] = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];


/**
 * The library shelves. Separate from `TEMPLATE_CATEGORIES`, which is Meta's
 * own three-value classification and drives review and pricing.
 */
export const TEMPLATE_USE_CASES: Option<TemplateUseCase>[] = [
  { value: "welcome", label: "Welcome" },
  { value: "promotion", label: "Promotion" },
  { value: "order", label: "Order" },
  { value: "reminder", label: "Reminder" },
  { value: "follow-up", label: "Follow-up" },
  { value: "verification", label: "Authentication" },
];
export const TEMPLATE_LANGUAGES: Option<string>[] = [
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "bn_BD", label: "Bengali" },
  { value: "es_MX", label: "Spanish (Mexico)" },
];

export const CONTACT_STATUSES: Option<WhatsAppContactStatus>[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
];

export const CONTACT_TAGS = [
  "Customer",
  "VIP",
  "Lead",
  "New Customer",
  "Wholesale",
  "Support",
];

/** Placeholders offered by the template editor, with the sample used in preview. */
export const TEMPLATE_VARIABLES: { name: string; sample: string }[] = [
  { name: "name", sample: "Sarah" },
  { name: "order_id", sample: "MF-10248" },
  { name: "company", sample: "MarketFlow" },
  { name: "amount", sample: "$149.00" },
  { name: "product", sample: "Premium Package" },
  { name: "date", sample: "6 June" },
];

/* -------------------------------------------------------------------------- */
/* Campaign stats                                                             */
/* -------------------------------------------------------------------------- */

/** Totals across the WhatsApp campaigns, for the stat row. */
export function whatsappTotals(campaigns: Campaign[]) {
  return campaigns.reduce(
    (totals, campaign) => ({
      sent: totals.sent + campaign.sent,
      delivered: totals.delivered + campaign.delivered,
      read: totals.read + campaign.opened,
      replies: totals.replies + campaign.replies,
      failed: totals.failed + campaign.failed,
    }),
    { sent: 0, delivered: 0, read: 0, replies: 0, failed: 0 },
  );
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

export const TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl-welcome",
    name: "welcome_message",
    category: "marketing",
    useCase: "welcome",
    status: "approved",
    language: "en_US",
    body: "Welcome to {{company}}, {{name}}! You are on the list. Reply with a question any time — a real person answers.",
    variables: ["company", "name"],
    buttons: [
      { label: "Browse Catalog", type: "url" },
      { label: "Talk to us", type: "quick-reply" },
    ],
    footer: "Reply STOP to opt out",
    updatedAt: "2026-09-04T09:15:00Z",
  },
  {
    id: "tpl-order-confirmation",
    name: "order_confirmation",
    category: "utility",
    useCase: "order",
    status: "approved",
    language: "en_US",
    body: "Hi {{name}}, your order {{order_id}} has been confirmed. We will let you know as soon as it ships.",
    variables: ["name", "order_id"],
    buttons: [{ label: "View Order", type: "url" }],
    footer: "Reply STOP to opt out",
    updatedAt: "2026-05-28T10:20:00Z",
  },
  {
    id: "tpl-seasonal-offer",
    name: "seasonal_offer_v3",
    category: "marketing",
    useCase: "promotion",
    status: "approved",
    language: "en_US",
    body: "Hi {{name}}, our Summer Sale is live — 20% off every package until {{date}}. Use your code at checkout.",
    variables: ["name", "date"],
    buttons: [
      { label: "Shop Now", type: "url" },
      { label: "Not interested", type: "quick-reply" },
    ],
    footer: "Reply STOP to opt out",
    updatedAt: "2026-05-26T14:05:00Z",
  },
  {
    id: "tpl-shipping-update",
    name: "shipping_update",
    category: "utility",
    useCase: "order",
    status: "approved",
    language: "en_US",
    body: "Good news {{name}} — order {{order_id}} is on its way and should arrive by {{date}}.",
    variables: ["name", "order_id", "date"],
    buttons: [{ label: "Track Order", type: "url" }],
    updatedAt: "2026-05-24T09:40:00Z",
  },
  {
    id: "tpl-abandoned-cart",
    name: "abandoned_checkout",
    category: "marketing",
    useCase: "reminder",
    status: "pending",
    language: "en_US",
    body: "Hi {{name}}, you left {{product}} in your basket. It is still available — shall we hold it for you?",
    variables: ["name", "product"],
    buttons: [
      { label: "Complete Order", type: "url" },
      { label: "No thanks", type: "quick-reply" },
    ],
    updatedAt: "2026-05-30T08:15:00Z",
  },
  {
    id: "tpl-otp",
    name: "login_verification",
    category: "authentication",
    useCase: "verification",
    status: "approved",
    language: "en_US",
    body: "{{code}} is your {{company}} verification code. It expires in 10 minutes.",
    variables: ["code", "company"],
    buttons: [{ label: "Copy Code", type: "quick-reply" }],
    updatedAt: "2026-05-12T11:00:00Z",
  },
  {
    id: "tpl-payment-reminder",
    name: "payment_reminder",
    category: "utility",
    useCase: "reminder",
    status: "approved",
    language: "en_GB",
    body: "Hi {{name}}, invoice {{order_id}} for {{amount}} is due on {{date}}. Let us know if you need anything.",
    variables: ["name", "order_id", "amount", "date"],
    buttons: [
      { label: "Pay Invoice", type: "url" },
      { label: "Contact Us", type: "phone" },
    ],
    updatedAt: "2026-05-20T16:30:00Z",
  },
  {
    id: "tpl-vip-preview",
    name: "vip_early_access",
    category: "marketing",
    useCase: "promotion",
    status: "rejected",
    language: "en_US",
    body: "{{name}}, you get first look at our autumn range. Claim your VIP discount before anyone else — limited spots, act fast!!!",
    variables: ["name"],
    buttons: [{ label: "Claim Offer", type: "url" }],
    rejectionReason: "Excessive urgency and punctuation in a marketing template.",
    updatedAt: "2026-05-29T13:45:00Z",
  },
  {
    id: "tpl-feedback",
    name: "post_purchase_feedback",
    category: "utility",
    useCase: "follow-up",
    status: "approved",
    language: "en_US",
    body: "Thanks for your order, {{name}}. How did we do? Your feedback helps us improve {{company}}.",
    variables: ["name", "company"],
    buttons: [
      { label: "Leave Feedback", type: "url" },
      { label: "Maybe later", type: "quick-reply" },
    ],
    updatedAt: "2026-05-18T10:10:00Z",
  },
  {
    id: "tpl-restock",
    name: "back_in_stock_v1",
    category: "marketing",
    useCase: "promotion",
    status: "pending",
    language: "bn_BD",
    body: "{{name}}, {{product}} আবার স্টকে এসেছে। শেষ হওয়ার আগেই অর্ডার করুন।",
    variables: ["name", "product"],
    buttons: [{ label: "Shop Now", type: "url" }],
    updatedAt: "2026-05-30T07:25:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

export const WHATSAPP_CONTACTS: WhatsAppContact[] = [
  {
    id: "wc-sarah",
    firstName: "Sarah",
    lastName: "Ahmed",
    phone: "+880 1711 223344",
    email: "sarah@brightretail.co",
    tags: ["Customer", "VIP"],
    status: "active",
    assignedAgent: "Nadia Karim",
    lastActivityAt: "2026-05-30T09:58:00Z",
    createdAt: "2025-11-14T09:00:00Z",
    notes: "Prefers WhatsApp over email. Asked about invoicing in BDT.",
    conversationId: "conv-sarah",
  },
  {
    id: "wc-john",
    firstName: "John",
    lastName: "Smith",
    phone: "+44 7700 900123",
    email: "john@smithagency.io",
    tags: ["Lead"],
    status: "active",
    assignedAgent: "Imran Hossain",
    lastActivityAt: "2026-05-30T09:46:00Z",
    createdAt: "2026-05-12T15:20:00Z",
    notes: "Comparing us against two other tools.",
    conversationId: "conv-john",
  },
  {
    id: "wc-maria",
    firstName: "Maria",
    lastName: "Gomez",
    phone: "+52 155 1234 5678",
    email: "maria@casaverde.mx",
    tags: ["Customer"],
    status: "active",
    assignedAgent: "Nadia Karim",
    lastActivityAt: "2026-05-30T09:39:00Z",
    createdAt: "2026-02-03T11:45:00Z",
    conversationId: "conv-maria",
  },
  {
    id: "wc-omar",
    firstName: "Omar",
    lastName: "Haddad",
    phone: "+971 50 123 4567",
    email: "omar@haddadtrading.ae",
    tags: ["Customer", "VIP", "Wholesale"],
    status: "active",
    assignedAgent: "Imran Hossain",
    lastActivityAt: "2026-05-29T17:12:00Z",
    createdAt: "2025-08-22T08:30:00Z",
    notes: "Renewal due 12 July.",
    conversationId: "conv-omar",
  },
  {
    id: "wc-priya",
    firstName: "Priya",
    lastName: "Nair",
    phone: "+91 98123 45678",
    email: "priya@nairclinics.in",
    tags: ["Customer", "Support"],
    status: "active",
    lastActivityAt: "2026-05-29T11:20:00Z",
    createdAt: "2026-01-19T13:10:00Z",
    notes: "Wants Hindi templates.",
    conversationId: "conv-priya",
  },
  {
    id: "wc-david",
    firstName: "David",
    lastName: "Chen",
    phone: "+65 9123 4567",
    email: "david@chenstudio.com",
    tags: ["New Customer"],
    status: "active",
    assignedAgent: "Tanvir Alam",
    lastActivityAt: "2026-05-30T09:36:00Z",
    createdAt: "2026-05-24T10:05:00Z",
  },
  {
    id: "wc-amina",
    firstName: "Amina",
    lastName: "Rahman",
    phone: "+880 1812 345678",
    email: "amina@rahmanfoods.bd",
    tags: ["Lead"],
    status: "inactive",
    lastActivityAt: "2026-05-08T14:00:00Z",
    createdAt: "2026-04-02T09:15:00Z",
    notes: "Card declined on last attempt.",
  },
  {
    id: "wc-lucas",
    firstName: "Lucas",
    lastName: "Meyer",
    phone: "+49 151 1234 5678",
    email: "lucas@meyerbau.de",
    tags: ["Customer"],
    status: "active",
    assignedAgent: "Nadia Karim",
    lastActivityAt: "2026-05-29T14:10:00Z",
    createdAt: "2025-12-11T16:40:00Z",
  },
  {
    id: "wc-hannah",
    firstName: "Hannah",
    lastName: "Park",
    phone: "+82 10 1234 5678",
    email: "hannah@parkbeauty.kr",
    tags: ["Customer"],
    status: "blocked",
    optOut: {
      at: "2026-05-28T10:15:00Z",
      reason: "Reported the message as spam",
    },
    lastActivityAt: "2026-05-28T10:15:00Z",
    createdAt: "2026-03-07T12:20:00Z",
    notes: "Reported our messages as spam. Do not contact.",
  },
  {
    id: "wc-tomas",
    firstName: "Tomás",
    lastName: "Silva",
    phone: "+55 11 98765 4321",
    email: "tomas@silvamoveis.br",
    tags: ["Customer", "Wholesale"],
    status: "active",
    assignedAgent: "Tanvir Alam",
    lastActivityAt: "2026-05-27T09:00:00Z",
    createdAt: "2025-10-30T07:50:00Z",
  },
  {
    id: "wc-fatima",
    firstName: "Fatima",
    lastName: "Zahra",
    phone: "+212 661 234567",
    email: "fatima@zahratextiles.ma",
    tags: ["Lead", "Wholesale"],
    status: "active",
    lastActivityAt: "2026-05-26T11:30:00Z",
    createdAt: "2026-05-19T08:00:00Z",
  },
  {
    id: "wc-noah",
    firstName: "Noah",
    lastName: "Bennett",
    phone: "+61 412 345 678",
    email: "noah@bennettco.au",
    tags: ["New Customer"],
    status: "active",
    assignedAgent: "Imran Hossain",
    lastActivityAt: "2026-05-25T16:05:00Z",
    createdAt: "2026-05-21T14:25:00Z",
  },
  {
    id: "wc-yuki",
    firstName: "Yuki",
    lastName: "Tanaka",
    phone: "+81 90 1234 5678",
    tags: ["Lead"],
    /* The canonical path: a STOP reply. Blocked rather than inactive — going
       quiet and asking to be left alone are not the same state. */
    status: "blocked",
    optOut: {
      at: "2026-04-30T09:10:00Z",
      reason: "Replied STOP",
    },
    lastActivityAt: "2026-04-30T09:10:00Z",
    createdAt: "2026-03-25T10:40:00Z",
  },
];

export const contactName = (contact: WhatsAppContact) =>
  `${contact.firstName} ${contact.lastName}`.trim();

/* -------------------------------------------------------------------------- */
/* Analytics series                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Ten sample points across four weeks. Labels rather than dates because the
 * axis is read, not computed — and a chart that recomputes its own labels from
 * `Date.now()` shifts every time this file is opened in a different month.
 */
export const WA_DAY_LABELS = [
  "Aug 12",
  "Aug 15",
  "Aug 18",
  "Aug 21",
  "Aug 24",
  "Aug 27",
  "Aug 30",
  "Sep 2",
  "Sep 5",
  "Sep 8",
];

/**
 * Counts only. The delivery, read and reply *rates* are derived from these by
 * `rateSeries` below rather than stored alongside them — two fields that must
 * agree is one field too many, and a hand-edited fixture is exactly where they
 * stop agreeing.
 */
export const WA_SERIES = {
  sent: [
    18_420, 21_860, 19_640, 24_180, 22_460, 26_840, 28_120, 31_460, 34_280,
    35_200,
  ],
  delivered: [
    17_904, 21_422, 19_168, 23_769, 21_988, 26_331, 27_670, 30_831, 33_524,
    34_708,
  ],
  read: [
    14_037, 17_138, 15_180, 19_349, 17_327, 21_222, 22_717, 24_665, 26_684,
    28_388,
  ],
  replied: [
    2_650, 3_428, 2_913, 4_064, 3_430, 4_318, 4_925, 4_933, 5_163, 5_970,
  ],
  failed: [516, 438, 472, 411, 472, 509, 450, 629, 756, 492],
  optOuts: [42, 51, 46, 58, 54, 62, 68, 74, 86, 82],
};

/** A rate series as percentages, for the charts that plot one. */
export const rateSeries = (part: number[], total: number[]) =>
  part.map((value, index) => (total[index] === 0 ? 0 : (value / total[index]) * 100));

/** Inbound and outbound threads per day, for the conversation-volume card. */
export const WA_CONVERSATION_VOLUME = {
  inbound: [842, 964, 886, 1_048, 986, 1_142, 1_206, 1_318, 1_442, 1_486],
  outbound: [1_284, 1_486, 1_342, 1_628, 1_512, 1_784, 1_886, 2_048, 2_246, 2_312],
};

/**
 * Audience insight rows, one per segment.
 *
 * Counts where a count is the fact and rates where the rate is: the analytics
 * table ranks by read and reply rate, and opt-out rate is the column that says
 * a segment is being over-messaged. Ordered best reply rate first, which is
 * also smallest-list first — the finding the panel exists to make.
 */
export const WA_AUDIENCE_INSIGHTS = [
  { label: "VIP Customers", contacts: 318, delivered: 3_120, readRate: 91.4, replyRate: 28.4, optOutRate: 0.4 },
  { label: "Recent Purchasers", contacts: 1_248, delivered: 11_860, readRate: 86.2, replyRate: 22.1, optOutRate: 0.8 },
  { label: "New Leads", contacts: 2_148, delivered: 19_240, readRate: 82.6, replyRate: 18.6, optOutRate: 1.6 },
  { label: "All Contacts", contacts: 12_480, delivered: 118_460, readRate: 79.8, replyRate: 15.8, optOutRate: 2.1 },
  { label: "Inactive Customers", contacts: 3_460, delivered: 24_180, readRate: 61.2, replyRate: 6.2, optOutRate: 4.8 },
];

/**
 * Per-template outcomes, as counts.
 *
 * Counts, not rates: the table shows a read rate and a reply rate for the same
 * template, and two stored percentages that must agree with each other and
 * with the send count is two fields too many. The id matches TEMPLATES above,
 * so a row can be traced back to the library.
 *
 * login_verification is in the list deliberately — an authentication template
 * nobody replies to is not a failing template, and a list that quietly drops
 * it teaches the wrong lesson about the reply-rate column.
 */
export const WA_TEMPLATE_PERFORMANCE = [
  { id: "tpl-order-confirmation", name: "order_confirmation", category: "utility", sent: 12_480, delivered: 12_284, read: 10_692, replies: 4_201, conversions: 892 },
  { id: "tpl-feedback", name: "post_purchase_feedback", category: "utility", sent: 11_842, delivered: 11_608, read: 9_204, replies: 3_111, conversions: 214 },
  { id: "tpl-abandoned-cart", name: "abandoned_checkout", category: "marketing", sent: 6_842, delivered: 6_704, read: 5_216, replies: 1_435, conversions: 806 },
  { id: "tpl-welcome", name: "welcome_message", category: "marketing", sent: 8_640, delivered: 8_468, read: 6_910, replies: 1_432, conversions: 341 },
  { id: "tpl-payment-reminder", name: "payment_reminder", category: "utility", sent: 5_240, delivered: 5_146, read: 4_262, replies: 812, conversions: 468 },
  { id: "tpl-seasonal-offer", name: "seasonal_offer_v3", category: "marketing", sent: 18_420, delivered: 18_052, read: 14_260, replies: 2_636, conversions: 1_642 },
  { id: "tpl-shipping-update", name: "shipping_update", category: "utility", sent: 12_186, delivered: 11_990, read: 9_830, replies: 1_103, conversions: 126 },
  { id: "tpl-otp", name: "login_verification", category: "authentication", sent: 9_180, delivered: 9_062, read: 8_340, replies: 128, conversions: 0 },
];

/* -------------------------------------------------------------------------- */
/* Response time                                                              */
/* -------------------------------------------------------------------------- */

/**
 * How long a contact waits for the first human reply.
 *
 * Median and p90 rather than a mean: one thread left overnight drags an average
 * past every number a team would recognise, and the gap between the two lines
 * is the actual finding — a median of 8 minutes with a p90 of 23 is a queue
 * that is fine until it is not.
 *
 * The buckets sum to 49,831, the Replied stage of WA_FUNNEL. Same population
 * counted two ways, so the funnel and the distribution cannot drift apart.
 */
export const WA_RESPONSE_TIME = {
  /** Minutes, one point per WA_DAY_LABELS entry. */
  median: [12, 11, 13, 10, 11, 10, 9, 9, 8, 8],
  p90: [38, 35, 41, 32, 34, 29, 28, 26, 25, 23],
  buckets: [
    { label: "Under 1 min", count: 6_420 },
    { label: "1-5 min", count: 14_860 },
    { label: "5-15 min", count: 12_240 },
    { label: "15-60 min", count: 9_480 },
    { label: "1-4 hours", count: 4_860 },
    { label: "Over 4 hours", count: 1_971 },
  ],
  medianMinutes: 8,
  p90Minutes: 23,
  /** The first three buckets sit inside it — the panel derives that, not this. */
  targetMinutes: 15,
} as const;

/**
 * The WhatsApp-only funnel, from a message sent through to an order.
 *
 * Read used to sit between Delivered and Replies. It came out with the read
 * rate: a blue tick is a *delivery* fact rather than an engagement one, and at
 * 249,155 it sat so close to Delivered that the funnel's first real drop —
 * 311,444 down to 49,831 — was split across two steps and read as two small
 * losses instead of the one large one it is.
 *
 * Qualified Leads takes its place, between a reply and an order: a contact who
 * asked about a product or a price rather than one who only answered. That is
 * the step a marketer can act on, and nothing else on the page reported it.
 */
export const WA_FUNNEL = [
  { label: "Messages", count: 317_800, hint: "Handed to Meta" },
  { label: "Delivered", count: 311_444, hint: "Reached the handset" },
  { label: "Replies", count: 49_831, hint: "Wrote back at least once" },
  { label: "Qualified Leads", count: 12_460, hint: "Asked about a product" },
  { label: "Conversions", count: 4_980, hint: "Placed an order" },
];

/* -------------------------------------------------------------------------- */
/* Customer engagement                                                        */
/* -------------------------------------------------------------------------- */

/**
 * When customers actually message, in two-hour buckets across the day.
 *
 * Local time, summed over the period. The shape is the finding: a morning rise,
 * a lunch dip and a long evening peak, which is when a broadcast should be
 * scheduled and when the inbox needs to be staffed. Twelve buckets rather than
 * twenty-four because an hourly axis at card width is unreadable and the
 * two-hour shape is the same shape.
 */
export const WA_ACTIVE_HOURS = {
  labels: [
    "12a", "2a", "4a", "6a", "8a", "10a",
    "12p", "2p", "4p", "6p", "8p", "10p",
  ],
  messages: [
    420, 180, 140, 640, 2_480, 4_120,
    5_260, 4_480, 5_180, 6_940, 7_320, 3_260,
  ],
  /** The bucket the panel names as the peak. Derived by the panel, not stored. */
} as const;

/**
 * How customers behave once a thread is open.
 *
 * Four readings that are properties of the *conversation*, not of the sending:
 * nothing here is derivable from `WA_SERIES`, which counts messages leaving.
 */
export const WA_ENGAGEMENT_BEHAVIOUR = [
  {
    label: "Replies within 5 min",
    value: 62.4,
    kind: "rate" as const,
    hint: "of customers who answer at all",
  },
  {
    label: "Messages per conversation",
    value: 4.8,
    kind: "count" as const,
    hint: "median, both directions",
  },
  {
    label: "Return within 30 days",
    value: 38.2,
    kind: "rate" as const,
    hint: "opened a second conversation",
  },
  {
    label: "Started by the customer",
    value: 44.6,
    kind: "rate" as const,
    hint: "rather than by a campaign",
  },
];

/** Contact and automation counts the overview reports but campaigns do not. */
export const WA_OVERVIEW_TOTALS = {
  contacts: 12_480,
  contactsChange: 18.4,
  /* Five since Win-back joined them; see `AUTOMATION_FLOWS`. */
  activeAutomations: 5,
  automationsChange: 25.0,
  optInRate: 94.2,
  avgResponseMinutes: 8,
  /** Down is the good direction, so the stat carries invertTrend. */
  responseChange: -22.4,
} as const;

/* -------------------------------------------------------------------------- */
/* Operational state                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Can this account send at all, and how much headroom is left.
 *
 * The identity is read from WHATSAPP_CONNECTIONS rather than restated: the
 * campaign wizard's sender picker is driven by that list, and an Overview that
 * names a different number than the one a campaign will send from is worse
 * than an Overview that names none.
 *
 * What is added here is the health Meta reports and nothing else stores — the
 * quality rating, the rolling 24-hour send limit, and whether the inbound
 * webhook is delivering. Those three are the reasons a WhatsApp account stops
 * working, and none of them is visible anywhere else in the product.
 */
const PRIMARY_CONNECTION = WHATSAPP_CONNECTIONS[0];
const PRIMARY_NUMBER = PRIMARY_CONNECTION.numbers[0];

export const WA_CONNECTION = {
  businessName: PRIMARY_CONNECTION.label,
  /** The list stores "+880 1700 000000 — Primary"; the label is not the number. */
  phone: PRIMARY_NUMBER.label.split(" — ")[0],
  quality: PRIMARY_NUMBER.quality,
  verified: PRIMARY_CONNECTION.verified,
  /** Messages allowed in a rolling 24 hours at the current tier. */
  tierLimit: 100_000,
  windowUsed: 42_180,
  webhookHealthy: true,
};

/**
 * One agent on the WhatsApp queue.
 *
 * Typed rather than inferred from the literal below, because `avatarUrl` is
 * present on some rows and absent on others and `as const` would then hand the
 * panel a union it cannot read the property off at all.
 */
export type WaInboxAgent = {
  name: string;
  /** Threads they are currently carrying. */
  open: number;
  avgResponseMinutes: number;
  /** Their profile photo. Absent means the avatar falls back to initials. */
  avatarUrl?: string;
  /** Signed into the inbox right now. */
  online: boolean;
  /**
   * Threads closed over the reporting period.
   *
   * A period total, where `open` is a snapshot of this moment — the Overview
   * asks who is carrying the queue right now, Analytics asks who carried it.
   * Both read the same roster so the two pages cannot name different agents.
   */
  handled: number;
  /** Share of `handled` that ended resolved rather than abandoned or reopened. */
  resolutionRate: number;
};

/**
 * The seven agents on the queue.
 *
 * Unordered here on purpose — the panel sorts by open threads, so adding an
 * eighth agent anywhere in this list still renders busiest-first.
 *
 * Four of the seven carry a photo and three do not, which is the real shape of
 * a support roster: a workspace has whatever its agents uploaded. A fixture
 * where everyone has a picture hides the initials fallback until production
 * finds it.
 */
const INBOX_AGENTS: WaInboxAgent[] = [
  {
    name: "Nadia Karim",
    open: 18,
    avgResponseMinutes: 6,
    avatarUrl: "/customer-avatar-1.jpg",
    online: true,
    handled: 1_284,
    resolutionRate: 96.2,
  },
  {
    name: "Imran Hossain",
    open: 14,
    avgResponseMinutes: 9,
    avatarUrl: "/customer-avatar-2.jpg",
    online: true,
    handled: 1_046,
    resolutionRate: 94.8,
  },
  {
    name: "Tanvir Alam",
    open: 7,
    avgResponseMinutes: 12,
    online: false,
    handled: 612,
    resolutionRate: 91.4,
  },
  {
    name: "Sarah Ahmed",
    open: 12,
    avgResponseMinutes: 8,
    avatarUrl: "/customer-avatar-3.jpg",
    online: true,
    handled: 908,
    resolutionRate: 95.1,
  },
  {
    name: "Maria Gomez",
    open: 9,
    avgResponseMinutes: 10,
    online: true,
    handled: 734,
    resolutionRate: 92.6,
  },
  {
    name: "John Smith",
    open: 6,
    avgResponseMinutes: 14,
    avatarUrl: "/customer-avatar-4.jpg",
    online: false,
    handled: 486,
    resolutionRate: 89.8,
  },
  {
    name: "Priya Nair",
    open: 4,
    avgResponseMinutes: 18,
    online: false,
    handled: 352,
    resolutionRate: 88.4,
  },
];

/**
 * The inbox as it stands right now — the overview's subject.
 *
 * Deliberately none of this is a rate over a period. It is the queue: how many
 * threads are open, how many nobody owns, how many are sitting on an inbound
 * message with no answer. The analytics page reports how the channel
 * performed; this reports what is waiting.
 *
 * The agent rows sum to open minus unassigned, so the roster and the headline
 * count describe the same 48 threads.
 */
export const WA_INBOX_SNAPSHOT = {
  open: 48,
  openChange: 12.5,
  pending: 17,
  resolvedToday: 34,
  unassigned: 9,
  /** Last message is inbound and nobody has answered it yet. */
  awaitingReply: 23,
  awaitingChange: -14.8,
  unreadMessages: 61,
  /** The roster, unordered — the panel sorts it busiest-first. */
  agents: INBOX_AGENTS,
  /**
   * Open threads one agent is expected to carry.
   *
   * The load bar used to be drawn against the *busiest colleague*, which made
   * the top agent 100% by definition however light the day was, and meant every
   * agent's bar moved when someone else picked up a thread. Against a capacity
   * the reading is absolute: 18 of 20 is 90% whoever else is working.
   */
  agentCapacity: 20,
} as const;

/**
 * What the WhatsApp module did, most recent first.
 *
 * Module-scoped rather than a filter over RECENT_ACTIVITY: that feed is the
 * cross-channel one on the Marketing workspace and carries three WhatsApp rows
 * out of eight, which is a feed with holes in it rather than a channel's own
 * history. Same ActivityEntry shape, so one component renders both.
 */
export const WA_ACTIVITY: ActivityEntry[] = [
  {
    id: "wa-act-1",
    kind: "campaign",
    title: "Autumn Collection Launch started sending",
    detail: "8,420 of 12,480 delivered",
    channel: "whatsapp",
    actor: "Nadia Karim",
    at: "2026-09-08T09:42:00Z",
  },
  {
    id: "wa-act-2",
    kind: "automation",
    title: "Abandoned Cart Recovery processed 46 contacts",
    detail: "38 completed the flow, 8 still waiting",
    channel: "whatsapp",
    actor: "System",
    at: "2026-09-08T08:30:00Z",
  },
  {
    id: "wa-act-3",
    kind: "alert",
    title: "vip_early_access rejected by Meta",
    detail: "Excessive urgency and punctuation in a marketing template",
    channel: "whatsapp",
    actor: "Meta review",
    at: "2026-09-08T07:05:00Z",
  },
  {
    id: "wa-act-4",
    kind: "template",
    title: "autumn_promo_v2 approved",
    detail: "Marketing template, English (US)",
    channel: "whatsapp",
    actor: "Meta review",
    at: "2026-09-07T18:20:00Z",
  },
  {
    id: "wa-act-5",
    kind: "conversion",
    title: "18 orders attributed to WhatsApp",
    detail: "$4,260 from Summer Sale replies in the last day",
    channel: "whatsapp",
    actor: "System",
    at: "2026-09-07T16:45:00Z",
  },
  {
    id: "wa-act-6",
    kind: "contact",
    title: "486 contacts opted in",
    detail: "From the storefront widget, taking the list to 94.2% opted in",
    channel: "whatsapp",
    actor: "System",
    at: "2026-09-07T11:15:00Z",
  },
];
