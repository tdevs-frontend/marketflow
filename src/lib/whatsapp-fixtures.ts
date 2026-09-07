import type { Option } from "@/constants/commerce";
import type {
  Campaign,
  TemplateCategory,
  TemplateStatus,
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
    id: "tpl-order-confirmation",
    name: "order_confirmation",
    category: "utility",
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
    status: "inactive",
    lastActivityAt: "2026-04-30T09:10:00Z",
    createdAt: "2026-03-25T10:40:00Z",
  },
];

export const contactName = (contact: WhatsAppContact) =>
  `${contact.firstName} ${contact.lastName}`.trim();
