import type { Option } from "@/constants/commerce";
import type {
  SmsCampaign,
  SmsContact,
  SmsContactStatus,
  SmsSenderId,
  SmsSenderType,
  SmsTemplate,
  SmsTemplateCategory,
  SmsTrendPeriod,
  SmsTrendSeries,
} from "@/types/sms";

/**
 * SMS module data.
 *
 * Costs are stored rather than derived: the rate varies by destination
 * country, so `cost` cannot be recomputed from `sent × segments` without a
 * rate table this fixture set has no reason to model.
 */

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export const SMS_TEMPLATE_CATEGORIES: Option<SmsTemplateCategory>[] = [
  { value: "promotion", label: "Promotion" },
  { value: "reminder", label: "Reminder" },
  { value: "alert", label: "Alert" },
  { value: "otp", label: "One-time Code" },
  { value: "follow-up", label: "Follow-up" },
  { value: "order", label: "Order" },
];

export const SMS_CONTACT_STATUSES: Option<SmsContactStatus>[] = [
  { value: "subscribed", label: "Subscribed" },
  { value: "opted-out", label: "Opted out" },
  { value: "invalid", label: "Invalid number" },
];

export const SMS_SENDER_TYPES: Option<SmsSenderType>[] = [
  { value: "alphanumeric", label: "Alphanumeric" },
  { value: "long-code", label: "Long code" },
  { value: "short-code", label: "Short code" },
];

/**
 * The sender IDs this workspace is allowed to present.
 *
 * A list rather than the single field the gateway integration holds, because
 * which sender a campaign goes out on is a marketing decision with a
 * consequence — an alphanumeric ID carries the brand and silently discards
 * every reply, so a campaign that asks a question has to leave it. The gateway
 * page still owns the credentials; this owns the choice.
 */
export const SMS_SENDERS: SmsSenderId[] = [
  {
    id: "sid-marketflow",
    value: "MARKETFLOW",
    type: "alphanumeric",
    status: "active",
    countries: ["Bangladesh", "United Arab Emirates", "United Kingdom", "India"],
    sent30d: 9_038,
    isDefault: true,
  },
  {
    id: "sid-shortcode",
    value: "24680",
    type: "short-code",
    status: "active",
    countries: ["Bangladesh"],
    sent30d: 11_828,
    isDefault: false,
  },
  {
    id: "sid-longcode",
    value: "+8801700000000",
    type: "long-code",
    status: "active",
    countries: ["Bangladesh"],
    sent30d: 12,
    isDefault: false,
  },
  {
    id: "sid-mf-uk",
    value: "MFLOWUK",
    type: "alphanumeric",
    status: "pending",
    countries: ["United Kingdom"],
    sent30d: 0,
    isDefault: false,
    note: "Awaiting UK sender ID registration — 3 to 5 working days.",
  },
];

export const smsSenderLabel = (sender: SmsSenderId) =>
  `${sender.value} (${
    SMS_SENDER_TYPES.find((item) => item.value === sender.type)?.label ??
    sender.type
  })`;

/**
 * The composer's dropdown, derived rather than restated.
 *
 * Pending and blocked senders are left out: offering one would let a campaign
 * be scheduled against an ID the carriers will refuse at send time.
 */
export const SMS_SENDER_IDS = SMS_SENDERS.filter(
  (sender) => sender.status === "active",
).map((sender) => ({ value: sender.value, label: smsSenderLabel(sender) }));

/**
 * The blended per-segment rate the cost projections are built on.
 *
 * A single number rather than the per-destination table, because a draft has
 * no destination yet: an audience spans countries and the real bill is only
 * known once the routing is. The projection says "about this much" honestly;
 * `SMS_COST_BY_COUNTRY` says what it actually came to.
 */
export const SMS_RATE_PER_SEGMENT = 0.045;

export const SMS_COUNTRIES = [
  "Bangladesh",
  "United Kingdom",
  "United States",
  "United Arab Emirates",
  "India",
  "Singapore",
  "Germany",
  "Brazil",
];

export const SMS_TAGS = ["Customer", "VIP", "Lead", "Appointment", "Wholesale", "Trial"];

/**
 * Placeholders the composer offers, with the longest realistic substitution.
 *
 * The sample is what the character counter measures — counting the literal
 * `{{first_name}}` would under-report by four characters and quietly push a
 * one-segment message into two.
 */
export const SMS_VARIABLES: { name: string; sample: string }[] = [
  { name: "first_name", sample: "Christopher" },
  { name: "last_name", sample: "Featherstone" },
  { name: "appointment_date", sample: "Wednesday 16 September" },
  { name: "appointment_time", sample: "3:30 PM" },
  { name: "order_id", sample: "MF-104829" },
  { name: "amount", sample: "$1,249.00" },
  { name: "code", sample: "482915" },
  { name: "company", sample: "MarketFlow" },
];

export const SMS_SUBSTITUTIONS: Record<string, string> = Object.fromEntries(
  SMS_VARIABLES.map((item) => [item.name, item.sample]),
);

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export const SMS_CAMPAIGNS: SmsCampaign[] = [
  {
    id: "sms-appointment-reminders",
    name: "Appointment Reminders",
    message:
      "Hi {{first_name}}, your appointment is scheduled for {{appointment_date}} at {{appointment_time}}. Reply R to reschedule.",
    senderId: "MARKETFLOW",
    status: "scheduled",
    segment: "custom",
    audienceLabel: "Upcoming Appointments",
    audienceSize: 684,
    sent: 0,
    delivered: 0,
    failed: 0,
    replies: 0,
    optOuts: 0,
    clicks: 0,
    segments: 1,
    cost: 0,
    createdAt: "2026-09-07T12:40:00Z",
    scheduledAt: "2026-09-09T03:00:00Z",
  },
  {
    id: "sms-flash-weekend",
    name: "Weekend Flash Sale",
    message:
      "{{first_name}}, 30% off this weekend only. Shop now: mf.link/wknd. Reply STOP to opt out.",
    senderId: "MARKETFLOW",
    status: "running",
    segment: "all",
    audienceLabel: "All Contacts",
    audienceSize: 9_840,
    sent: 6_420,
    delivered: 6_216,
    failed: 204,
    replies: 148,
    optOuts: 34,
    clicks: 842,
    segments: 1,
    cost: 288.9,
    createdAt: "2026-09-05T09:15:00Z",
    scheduledAt: "2026-09-05T12:00:00Z",
  },
  {
    id: "sms-order-dispatch",
    name: "Order Dispatch Alerts",
    message:
      "Order {{order_id}} is on its way. Track it here: mf.link/t/{{order_id}}",
    senderId: "24680",
    status: "running",
    segment: "customers",
    audienceLabel: "Customers",
    audienceSize: 4_280,
    sent: 3_186,
    delivered: 3_142,
    failed: 44,
    replies: 62,
    optOuts: 4,
    clicks: 1_284,
    segments: 1,
    cost: 143.4,
    createdAt: "2026-08-30T07:00:00Z",
  },
  {
    id: "sms-payment-due",
    name: "Payment Due Notice",
    message:
      "Hi {{first_name}}, invoice {{order_id}} for {{amount}} is due tomorrow. Pay here: mf.link/p/{{order_id}}. Questions? Reply to this message.",
    senderId: "MARKETFLOW",
    status: "completed",
    segment: "customers",
    audienceLabel: "Customers with Open Invoices",
    audienceSize: 412,
    sent: 412,
    delivered: 404,
    failed: 8,
    replies: 86,
    optOuts: 2,
    clicks: 218,
    segments: 2,
    cost: 37.08,
    createdAt: "2026-08-26T10:30:00Z",
    scheduledAt: "2026-08-27T04:00:00Z",
  },
  {
    id: "sms-back-in-stock",
    name: "Back in Stock",
    message: "Good news — the item on your waitlist is back. mf.link/stock",
    senderId: "MARKETFLOW",
    status: "completed",
    segment: "custom",
    audienceLabel: "Stock Waitlist",
    audienceSize: 1_248,
    sent: 1_248,
    delivered: 1_218,
    failed: 30,
    replies: 44,
    optOuts: 12,
    clicks: 486,
    segments: 1,
    cost: 56.16,
    createdAt: "2026-08-20T14:20:00Z",
    scheduledAt: "2026-08-21T09:00:00Z",
  },
  {
    id: "sms-vip-early",
    name: "VIP Early Access",
    message:
      "{{first_name}}, VIP early access opens at 9am tomorrow. Your link: mf.link/vip",
    senderId: "MARKETFLOW",
    status: "completed",
    segment: "vip",
    audienceLabel: "VIP Customers",
    audienceSize: 318,
    sent: 318,
    delivered: 316,
    failed: 2,
    replies: 38,
    optOuts: 0,
    clicks: 184,
    segments: 1,
    cost: 14.31,
    createdAt: "2026-08-16T11:00:00Z",
    scheduledAt: "2026-08-17T06:00:00Z",
  },
  {
    id: "sms-verification",
    name: "Login Verification",
    message: "{{code}} is your {{company}} verification code. It expires in 10 minutes.",
    senderId: "24680",
    status: "running",
    segment: "all",
    audienceLabel: "Transactional",
    audienceSize: 0,
    sent: 8_642,
    delivered: 8_596,
    failed: 46,
    replies: 0,
    optOuts: 0,
    clicks: 0,
    segments: 1,
    cost: 388.89,
    createdAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "sms-winback",
    name: "Win-back Offer",
    message:
      "{{first_name}}, here is 25% off to come back. Use WELCOME25 at checkout: mf.link/back",
    senderId: "MARKETFLOW",
    status: "paused",
    segment: "custom",
    audienceLabel: "Inactive 90 days",
    audienceSize: 2_140,
    sent: 640,
    delivered: 618,
    failed: 22,
    replies: 18,
    optOuts: 26,
    clicks: 74,
    segments: 1,
    cost: 28.8,
    createdAt: "2026-08-11T15:45:00Z",
  },
  {
    id: "sms-feedback",
    name: "Post-visit Feedback",
    message:
      "Thanks for visiting, {{first_name}}. How did we do? Rate us 1-5 by replying to this message.",
    senderId: "MARKETFLOW",
    status: "draft",
    segment: "new-customers",
    audienceLabel: "New Customers",
    audienceSize: 1_248,
    sent: 0,
    delivered: 0,
    failed: 0,
    replies: 0,
    optOuts: 0,
    clicks: 0,
    segments: 1,
    cost: 0,
    createdAt: "2026-09-08T08:20:00Z",
  },
  {
    id: "sms-event-invite",
    name: "Store Opening Invite",
    message:
      "You are invited: our Gulshan store opens Saturday 10am. First 50 guests get a gift. mf.link/open",
    senderId: "MARKETFLOW",
    status: "draft",
    segment: "custom",
    audienceLabel: "Dhaka Contacts",
    audienceSize: 3_180,
    sent: 0,
    delivered: 0,
    failed: 0,
    replies: 0,
    optOuts: 0,
    clicks: 0,
    segments: 1,
    cost: 0,
    createdAt: "2026-09-06T13:10:00Z",
  },
  {
    id: "sms-shortcode-test",
    name: "Sender ID Migration Test",
    message: "Test message from the new sender ID. Please ignore.",
    senderId: "24680",
    status: "failed",
    segment: "custom",
    audienceLabel: "Internal Test Group",
    audienceSize: 12,
    sent: 12,
    delivered: 0,
    failed: 12,
    replies: 0,
    optOuts: 0,
    clicks: 0,
    segments: 1,
    cost: 0.54,
    createdAt: "2026-08-29T16:40:00Z",
    scheduledAt: "2026-08-29T17:00:00Z",
  },
];

export function smsTotals(campaigns: SmsCampaign[]) {
  return campaigns.reduce(
    (totals, campaign) => ({
      sent: totals.sent + campaign.sent,
      delivered: totals.delivered + campaign.delivered,
      failed: totals.failed + campaign.failed,
      replies: totals.replies + campaign.replies,
      optOuts: totals.optOuts + campaign.optOuts,
      clicks: totals.clicks + campaign.clicks,
      cost: totals.cost + campaign.cost,
    }),
    { sent: 0, delivered: 0, failed: 0, replies: 0, optOuts: 0, clicks: 0, cost: 0 },
  );
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Delivery and reply rate are both averages over every send of the template.
 *
 * They diverge hard, and the divergence is the point: the verification code
 * delivers better than anything else on the list and is answered by nobody,
 * while the feedback request is among the worst deliverers and the best earner
 * of replies. A library ranked on delivery alone puts those two in exactly the
 * wrong order.
 */
export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: "st-appointment",
    name: "Appointment Reminder",
    category: "reminder",
    body: "Hi {{first_name}}, your appointment is scheduled for {{appointment_date}} at {{appointment_time}}. Reply R to reschedule.",
    variables: ["first_name", "appointment_date", "appointment_time"],
    usageCount: 42,
    deliveryRate: 98.6,
    replyRate: 11.4,
    updatedAt: "2026-09-07T12:40:00Z",
  },
  {
    id: "st-order-dispatch",
    name: "Order Dispatched",
    category: "order",
    body: "Order {{order_id}} is on its way. Track it here: mf.link/t/{{order_id}}",
    variables: ["order_id"],
    usageCount: 128,
    deliveryRate: 98.6,
    replyRate: 1.8,
    updatedAt: "2026-08-30T07:00:00Z",
  },
  {
    id: "st-otp",
    name: "Verification Code",
    category: "otp",
    body: "{{code}} is your {{company}} verification code. It expires in 10 minutes.",
    variables: ["code", "company"],
    usageCount: 341,
    deliveryRate: 99.5,
    replyRate: 0.1,
    updatedAt: "2026-06-02T08:00:00Z",
  },
  {
    id: "st-flash-sale",
    name: "Flash Sale",
    category: "promotion",
    body: "{{first_name}}, 30% off this weekend only. Shop now: mf.link/wknd. Reply STOP to opt out.",
    variables: ["first_name"],
    usageCount: 24,
    deliveryRate: 96.8,
    replyRate: 2.4,
    updatedAt: "2026-09-05T09:15:00Z",
  },
  {
    id: "st-payment-due",
    name: "Payment Due",
    category: "reminder",
    body: "Hi {{first_name}}, invoice {{order_id}} for {{amount}} is due tomorrow. Pay here: mf.link/p/{{order_id}}. Questions? Reply to this message.",
    variables: ["first_name", "order_id", "amount"],
    usageCount: 18,
    deliveryRate: 98.1,
    replyRate: 21.3,
    updatedAt: "2026-08-26T10:30:00Z",
  },
  {
    id: "st-back-in-stock",
    name: "Back in Stock",
    category: "alert",
    body: "Good news — the item on your waitlist is back. mf.link/stock",
    variables: [],
    usageCount: 12,
    deliveryRate: 97.6,
    replyRate: 3.6,
    updatedAt: "2026-08-20T14:20:00Z",
  },
  {
    id: "st-feedback",
    name: "Feedback Request",
    category: "follow-up",
    body: "Thanks for visiting, {{first_name}}. How did we do? Rate us 1-5 by replying to this message.",
    variables: ["first_name"],
    usageCount: 9,
    deliveryRate: 98.2,
    replyRate: 24.8,
    updatedAt: "2026-09-08T08:20:00Z",
  },
  {
    id: "st-winback",
    name: "Win-back Discount",
    category: "promotion",
    body: "{{first_name}}, here is 25% off to come back. Use WELCOME25 at checkout: mf.link/back",
    variables: ["first_name"],
    usageCount: 6,
    deliveryRate: 96.6,
    replyRate: 2.8,
    updatedAt: "2026-08-11T15:45:00Z",
  },
  {
    id: "st-delivery-window",
    name: "Delivery Window",
    category: "order",
    body: "Your order arrives {{appointment_date}} between {{appointment_time}} and two hours later. Reply C to change.",
    variables: ["appointment_date", "appointment_time"],
    usageCount: 31,
    deliveryRate: 98.4,
    replyRate: 9.2,
    updatedAt: "2026-08-14T09:25:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

export const SMS_CONTACTS: SmsContact[] = [
  {
    id: "sc-sarah",
    firstName: "Sarah",
    lastName: "Ahmed",
    phone: "+880 1711 223344",
    country: "Bangladesh",
    tags: ["Customer", "VIP"],
    status: "subscribed",
    leadStatus: "Customer",
    messages: 62,
    replies: 18,
    lastActivityAt: "2026-09-08T09:12:00Z",
    createdAt: "2025-11-14T09:00:00Z",
  },
  {
    id: "sc-john",
    firstName: "John",
    lastName: "Smith",
    phone: "+44 7700 900123",
    country: "United Kingdom",
    tags: ["Lead"],
    status: "subscribed",
    leadStatus: "Qualified",
    messages: 14,
    replies: 3,
    lastActivityAt: "2026-09-07T14:40:00Z",
    createdAt: "2026-05-12T15:20:00Z",
  },
  {
    id: "sc-omar",
    firstName: "Omar",
    lastName: "Haddad",
    phone: "+971 50 123 4567",
    country: "United Arab Emirates",
    tags: ["Customer", "VIP", "Wholesale"],
    status: "subscribed",
    leadStatus: "Customer",
    messages: 84,
    replies: 26,
    lastActivityAt: "2026-09-06T17:12:00Z",
    createdAt: "2025-08-22T08:30:00Z",
  },
  {
    id: "sc-priya",
    firstName: "Priya",
    lastName: "Nair",
    phone: "+91 98123 45678",
    country: "India",
    tags: ["Customer", "Appointment"],
    status: "subscribed",
    leadStatus: "Customer",
    messages: 48,
    replies: 22,
    lastActivityAt: "2026-09-04T11:20:00Z",
    createdAt: "2026-01-19T13:10:00Z",
  },
  {
    id: "sc-david",
    firstName: "David",
    lastName: "Chen",
    phone: "+65 9123 4567",
    country: "Singapore",
    tags: ["Trial"],
    status: "subscribed",
    leadStatus: "New",
    messages: 2,
    replies: 0,
    lastActivityAt: "2026-09-08T07:36:00Z",
    createdAt: "2026-09-08T07:30:00Z",
  },
  {
    id: "sc-amina",
    firstName: "Amina",
    lastName: "Rahman",
    phone: "+880 1812 345678",
    country: "Bangladesh",
    tags: ["Lead"],
    status: "opted-out",
    leadStatus: "Lost",
    messages: 21,
    replies: 1,
    lastActivityAt: "2026-08-08T14:00:00Z",
    createdAt: "2026-04-02T09:15:00Z",
  },
  {
    id: "sc-lucas",
    firstName: "Lucas",
    lastName: "Meyer",
    phone: "+49 151 1234 5678",
    country: "Germany",
    tags: ["Customer"],
    status: "subscribed",
    leadStatus: "Customer",
    messages: 36,
    replies: 8,
    lastActivityAt: "2026-09-05T14:10:00Z",
    createdAt: "2025-12-11T16:40:00Z",
  },
  {
    id: "sc-hannah",
    firstName: "Hannah",
    lastName: "Park",
    phone: "+82 10 1234 5678",
    country: "United States",
    tags: ["Customer"],
    status: "invalid",
    leadStatus: "Customer",
    messages: 4,
    replies: 0,
    lastActivityAt: "2026-08-28T10:15:00Z",
    createdAt: "2026-03-07T12:20:00Z",
  },
  {
    id: "sc-tomas",
    firstName: "Tomás",
    lastName: "Silva",
    phone: "+55 11 98765 4321",
    country: "Brazil",
    tags: ["Customer", "Wholesale"],
    status: "subscribed",
    leadStatus: "Customer",
    messages: 58,
    replies: 14,
    lastActivityAt: "2026-09-07T09:00:00Z",
    createdAt: "2025-10-30T07:50:00Z",
  },
  {
    id: "sc-noah",
    firstName: "Noah",
    lastName: "Bennett",
    phone: "+61 412 345 678",
    country: "United States",
    tags: ["Trial"],
    status: "subscribed",
    leadStatus: "Contacted",
    messages: 8,
    replies: 2,
    lastActivityAt: "2026-09-06T16:05:00Z",
    createdAt: "2026-08-21T14:25:00Z",
  },
  {
    id: "sc-fatima",
    firstName: "Fatima",
    lastName: "Zahra",
    phone: "+212 661 234567",
    country: "United Kingdom",
    tags: ["Lead", "Wholesale"],
    status: "subscribed",
    leadStatus: "Proposal",
    messages: 12,
    replies: 4,
    lastActivityAt: "2026-08-26T11:30:00Z",
    createdAt: "2026-05-19T08:00:00Z",
  },
  {
    id: "sc-elena",
    firstName: "Elena",
    lastName: "Rossi",
    phone: "+39 340 123 4567",
    country: "Germany",
    tags: ["Customer", "VIP", "Appointment"],
    status: "subscribed",
    leadStatus: "Customer",
    messages: 71,
    replies: 24,
    lastActivityAt: "2026-09-08T06:48:00Z",
    createdAt: "2025-09-18T10:20:00Z",
  },
  {
    id: "sc-marcus",
    firstName: "Marcus",
    lastName: "Obi",
    phone: "+234 802 123 4567",
    country: "United Kingdom",
    tags: ["Lead"],
    status: "subscribed",
    leadStatus: "Negotiation",
    messages: 18,
    replies: 6,
    lastActivityAt: "2026-09-03T13:15:00Z",
    createdAt: "2026-06-11T09:35:00Z",
  },
  {
    id: "sc-yuki",
    firstName: "Yuki",
    lastName: "Tanaka",
    phone: "+81 90 1234 5678",
    country: "Singapore",
    tags: ["Lead"],
    status: "opted-out",
    leadStatus: "Lost",
    messages: 9,
    replies: 0,
    lastActivityAt: "2026-06-30T09:10:00Z",
    createdAt: "2026-03-25T10:40:00Z",
  },
];

export const smsContactName = (contact: SmsContact) =>
  `${contact.firstName} ${contact.lastName}`.trim();

/* -------------------------------------------------------------------------- */
/* Analytics series                                                           */
/* -------------------------------------------------------------------------- */

export const SMS_DAY_LABELS = [
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

export const SMS_SERIES = {
  sent: [1_240, 1_848, 1_420, 2_186, 1_684, 1_920, 2_460, 2_840, 6_420, 3_186],
  delivered: [1_212, 1_818, 1_396, 2_142, 1_648, 1_884, 2_412, 2_784, 6_216, 3_142],
  failed: [28, 30, 24, 44, 36, 36, 48, 56, 204, 44],
  replies: [28, 44, 32, 58, 41, 48, 62, 74, 148, 62],
};

/**
 * The one trend on SMS Analytics, at three windows.
 *
 * Four series in one chart rather than one chart per metric: sent, delivered,
 * failed and replies are four readings of the same send, and the only
 * questions worth asking of them — is the gap between sent and delivered
 * widening, do replies track volume — can only be answered with all four on
 * the same axis.
 */
export const SMS_TRENDS: Record<SmsTrendPeriod, SmsTrendSeries> = {
  "7d": {
    labels: ["Sep 2", "Sep 3", "Sep 4", "Sep 5", "Sep 6", "Sep 7", "Sep 8"],
    sent: [2_840, 1_920, 2_260, 6_420, 2_480, 1_740, 3_186],
    delivered: [2_784, 1_884, 2_214, 6_216, 2_432, 1_706, 3_142],
    failed: [56, 36, 46, 204, 48, 34, 44],
    replies: [74, 48, 56, 148, 62, 41, 62],
  },
  "30d": {
    labels: SMS_DAY_LABELS,
    sent: SMS_SERIES.sent,
    delivered: SMS_SERIES.delivered,
    failed: SMS_SERIES.failed,
    replies: SMS_SERIES.replies,
  },
  "90d": {
    labels: [
      "Jun 12",
      "Jun 22",
      "Jul 2",
      "Jul 12",
      "Jul 22",
      "Aug 1",
      "Aug 11",
      "Aug 21",
      "Aug 31",
      "Sep 8",
    ],
    sent: [
      14_820, 12_460, 16_240, 13_980, 18_620, 12_840, 17_460, 15_280, 21_640,
      19_820,
    ],
    delivered: [
      14_502, 12_214, 15_924, 13_702, 18_212, 12_586, 17_108, 14_968, 21_016,
      19_446,
    ],
    failed: [318, 246, 316, 278, 408, 254, 352, 312, 624, 374],
    replies: [352, 298, 402, 336, 468, 314, 436, 382, 564, 496],
  },
};

export const SMS_TREND_PERIODS: { value: SmsTrendPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

/**
 * Spend by destination, with the volume that earned it.
 *
 * Both numbers, because neither is the reading on its own: per-segment rates
 * differ by an order of magnitude between destinations, so the country at the
 * top of the spend list is not necessarily the one being messaged most. The
 * rows sum to `smsTotals(SMS_CAMPAIGNS).sent` and `.cost` — the cost panel
 * divides one by the other and the two have to agree.
 */
export const SMS_COST_BY_COUNTRY: {
  label: string;
  spend: number;
  messages: number;
}[] = [
  { label: "Bangladesh", spend: 372.6, messages: 8_280 },
  { label: "India", spend: 206.4, messages: 3_440 },
  { label: "United Kingdom", spend: 161.04, messages: 2_684 },
  { label: "United Arab Emirates", spend: 92.4, messages: 1_320 },
  { label: "Other", spend: 125.64, messages: 5_154 },
];
