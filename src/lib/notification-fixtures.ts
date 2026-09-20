import { minutesAgo } from "@/lib/workspace-clock";
import {
  NOTIFICATION_ROUTES as R,
  type FeedNotification,
} from "@/types/notification";

/**
 * What the bell and the notifications page show, seeded from the workspace the
 * rest of the product already agrees on.
 *
 * Every entity named below is real in this build. `#MF-10255` is an order in
 * `commerce-fixtures` and Maria Gomez is the customer on it; *Summer Sale 2026*
 * and *Customer Re-engagement* are campaigns in `marketing-fixtures`;
 * *Abandoned Checkout Recovery* and *New Lead Nurture* are workflows;
 * *Premium Package* and *Premium T-Shirt* are products with variants and stock
 * thresholds; Sarah Ahmed, Maria Gomez and John Smith are contacts. That is the
 * difference between a demo and a screenshot: open "New order received" and the
 * order it names is on the page it opens.
 *
 * Invented names would have been faster and would have failed the first time
 * anybody followed one. A notification that references nothing teaches the
 * reader the bell is decorative, which is the one thing a feed cannot afford.
 *
 * `minutes` rather than a timestamp, resolved through `minutesAgo` against
 * `WORKSPACE_NOW` — the frozen instant every other fixture measures from. A
 * "2 minutes ago" computed on the server and again on the client is a
 * hydration mismatch waiting for a slow response, and a feed anchored to the
 * real clock drifts further every day nobody touches it.
 *
 * The first eight are unread, which is the number the bell's badge shows.
 * Ordered newest first — the order both surfaces render and the reducer keeps.
 */

interface Seed extends Omit<FeedNotification, "createdAt"> {
  /** Minutes before `WORKSPACE_NOW`. */
  minutes: number;
}

const SEED: Seed[] = [
  /* -- Unread ------------------------------------------------------------ */
  {
    id: "ntf-01", module: "order", tone: "success", minutes: 2, read: false,
    title: "New order received",
    message: "Maria Gomez placed order #MF-10255.",
    context: "Premium Package · $249.00",
    href: R.orders,
  },
  {
    id: "ntf-02", module: "whatsapp", tone: "info", minutes: 18, read: false,
    title: "WhatsApp reply received",
    message: "Sarah Ahmed replied to the Abandoned Checkout Recovery thread.",
    context: "“Is the Premium Package still available?”",
    href: R.whatsapp,
  },
  {
    id: "ntf-03", module: "automation", tone: "alert", minutes: 34, read: false,
    title: "Workflow failed",
    message: "Customer Re-engagement stopped during execution.",
    context: "Failed on the WhatsApp send step",
    href: R.automation,
  },
  {
    id: "ntf-04", module: "marketing", tone: "success", minutes: 52, read: false,
    title: "Campaign completed",
    message: "Summer Sale 2026 finished sending to its full audience.",
    context: "12,480 delivered · 38% opened",
    href: R.campaigns,
  },
  {
    id: "ntf-05", module: "customer", tone: "info", minutes: 75, read: false,
    title: "New lead assigned",
    message: "Rahul Verma was assigned to you from the sales pipeline.",
    context: "Source: Landing Page Lead Capture",
    href: R.leads,
  },
  {
    id: "ntf-06", module: "inventory", tone: "alert", minutes: 124, read: false,
    title: "Low inventory",
    message: "Premium T-Shirt has fallen to 8 units.",
    context: "Below its low-stock threshold of 12",
    href: R.inventory,
  },
  {
    id: "ntf-07", module: "email", tone: "info", minutes: 168, read: false,
    title: "Email campaign completed",
    message: "VIP Early Access finished sending.",
    context: "7,820 recipients",
    href: R.email,
  },
  {
    id: "ntf-08", module: "integration", tone: "alert", minutes: 205, read: false,
    title: "Integration needs attention",
    message: "The WhatsApp Business connection stopped passing health checks.",
    context: "Last successful check 4 hours ago",
    href: R.integrations,
  },

  /* -- Read -------------------------------------------------------------- */
  {
    id: "ntf-09", module: "order", tone: "success", minutes: 240, read: true,
    title: "Order payment successful",
    message: "Payment for order #MF-10254 was completed.",
    context: "John Smith · $99.00",
    href: R.orders,
  },
  {
    id: "ntf-10", module: "social", tone: "success", minutes: 260, read: true,
    title: "Social post published",
    message: "The Business Package launch post went live.",
    context: "LinkedIn · Facebook",
    href: R.social,
  },
  {
    id: "ntf-11", module: "billing", tone: "success", minutes: 320, read: true,
    title: "Payment successful",
    message: "The Growth subscription renewed.",
    context: "INV-1024 · $49.00",
    href: R.billing,
  },
  {
    id: "ntf-12", module: "sms", tone: "alert", minutes: 410, read: true,
    title: "SMS delivery failed",
    message: "An operator is rejecting traffic from the registered sender ID.",
    context: "Weekend Flash Sale · 214 undelivered",
    href: R.sms,
  },
  {
    id: "ntf-13", module: "workspace", tone: "info", minutes: 505, read: true,
    title: "Team member added",
    message: "Daniel Reyes accepted their invitation.",
    context: "Joined as Sales Agent",
    href: R.team,
  },
  {
    id: "ntf-14", module: "order", tone: "alert", minutes: 640, read: true,
    title: "Order payment failed",
    message: "The card on order #MF-10253 was declined.",
    context: "David Chen · retry pending",
    href: R.orders,
  },
  {
    id: "ntf-15", module: "customer", tone: "info", minutes: 790, read: true,
    title: "New contact",
    message: "Priya Nair was added to the CRM.",
    context: "Source: Landing page form",
    href: R.contacts,
  },
  {
    id: "ntf-16", module: "automation", tone: "success", minutes: 860, read: true,
    title: "Workflow completed",
    message: "New Lead Nurture finished its run.",
    context: "142 contacts entered",
    href: R.automation,
  },
  {
    id: "ntf-17", module: "email", tone: "alert", minutes: 940, read: true,
    title: "Email bounce detected",
    message: "Hard bounces on Welcome Campaign crossed the safe level.",
    context: "3.4% of 5,200 sent",
    href: R.email,
  },
  {
    id: "ntf-18", module: "security", tone: "info", minutes: 1010, read: true,
    title: "New login detected",
    message: "A sign-in from a device you have not used before.",
    context: "Chrome on Windows · Dhaka",
    href: R.security,
  },
  {
    id: "ntf-19", module: "whatsapp", tone: "info", minutes: 1120, read: true,
    title: "New WhatsApp conversation",
    message: "Aisha Bello messaged the business number for the first time.",
    context: "Opened from the Summer Sale 2026 campaign",
    href: R.whatsapp,
  },
  {
    id: "ntf-20", module: "inventory", tone: "alert", minutes: 1250, read: true,
    title: "Out of stock",
    message: "Premium T-Shirt in black can no longer be sold.",
    context: "0 units on hand · 2 reserved",
    href: R.inventory,
  },
  {
    id: "ntf-21", module: "marketing", tone: "info", minutes: 1380, read: true,
    title: "Campaign scheduled",
    message: "Weekend Flash Sale is queued to send.",
    context: "Goes out Saturday at 09:00",
    href: R.campaigns,
  },
  {
    id: "ntf-22", module: "integration", tone: "success", minutes: 1490, read: true,
    title: "Integration connected",
    message: "The Email provider was linked to this workspace.",
    context: "Connected by Nabila Rahman",
    href: R.integrations,
  },
  {
    id: "ntf-23", module: "order", tone: "info", minutes: 1610, read: true,
    title: "Order cancelled",
    message: "Order #MF-10252 was cancelled before dispatch.",
    context: "Omar Haddad · refunded in full",
    href: R.orders,
  },
  {
    id: "ntf-24", module: "customer", tone: "info", minutes: 1740, read: true,
    title: "Lead stage changed",
    message: "Aisha Bello moved to the qualified stage.",
    context: "Owner: you",
    href: R.leads,
  },
  {
    id: "ntf-25", module: "sms", tone: "success", minutes: 1880, read: true,
    title: "SMS campaign completed",
    message: "Weekend Flash Sale finished sending.",
    context: "4,310 delivered · 186 failed",
    href: R.sms,
  },
  {
    id: "ntf-26", module: "social", tone: "alert", minutes: 2010, read: true,
    title: "Social post failed",
    message: "A scheduled post did not publish.",
    context: "Instagram rejected the media dimensions",
    href: R.social,
  },
  {
    id: "ntf-27", module: "billing", tone: "info", minutes: 2150, read: true,
    title: "Invoice generated",
    message: "INV-1023 was issued for the current period.",
    context: "Growth · $49.00",
    href: R.billing,
  },
  {
    id: "ntf-28", module: "automation", tone: "info", minutes: 2290, read: true,
    title: "Workflow paused",
    message: "Order Journey was paused by an administrator.",
    context: "Paused by Daniel Reyes",
    href: R.automation,
  },
  {
    id: "ntf-29", module: "email", tone: "success", minutes: 2440, read: true,
    title: "Sender verified",
    message: "The sending domain passed verification.",
    context: "SPF and DKIM both aligned",
    href: R.email,
  },
  {
    id: "ntf-30", module: "whatsapp", tone: "success", minutes: 2600, read: true,
    title: "WhatsApp campaign completed",
    message: "New Product Launch finished sending.",
    context: "9,140 delivered · 6,802 read",
    href: R.whatsapp,
  },
  {
    id: "ntf-31", module: "order", tone: "success", minutes: 2760, read: true,
    title: "New order received",
    message: "David Chen placed order #MF-10251.",
    context: "Business Package · $499.00",
    href: R.orders,
  },
  {
    id: "ntf-32", module: "security", tone: "info", minutes: 2930, read: true,
    title: "Two-factor authentication enabled",
    message: "An authenticator app was enrolled on your account.",
    context: "Recovery codes issued",
    href: R.security,
  },
  {
    id: "ntf-33", module: "integration", tone: "alert", minutes: 3100, read: true,
    title: "Webhook delivery failed",
    message: "An endpoint stopped accepting events.",
    context: "12 deliveries dropped · 500 responses",
    href: R.integrations,
  },
  {
    id: "ntf-34", module: "customer", tone: "info", minutes: 3280, read: true,
    title: "New lead captured",
    message: "Omar Haddad entered the workspace.",
    context: "Source: WhatsApp Inquiry Follow-up",
    href: R.leads,
  },
  {
    id: "ntf-35", module: "marketing", tone: "alert", minutes: 3460, read: true,
    title: "Campaign failed",
    message: "Customer Re-engagement stopped part way.",
    context: "Reached 2,140 of 8,900",
    href: R.campaigns,
  },
  {
    id: "ntf-36", module: "inventory", tone: "info", minutes: 3650, read: true,
    title: "Product published",
    message: "Growth Package moved out of draft.",
    context: "Now on sale in the catalogue",
    href: R.inventory,
  },
  {
    id: "ntf-37", module: "whatsapp", tone: "alert", minutes: 3840, read: true,
    title: "WhatsApp delivery failed",
    message: "A template message could not be delivered.",
    context: "Outside the 24-hour service window",
    href: R.whatsapp,
  },
  {
    id: "ntf-38", module: "billing", tone: "alert", minutes: 4040, read: true,
    title: "Payment failed",
    message: "A charge for the Growth subscription was declined.",
    context: "Retry scheduled in 3 days",
    href: R.billing,
  },
  {
    id: "ntf-39", module: "social", tone: "info", minutes: 4250, read: true,
    title: "Scheduled post published",
    message: "The autumn pricing post went live as scheduled.",
    context: "Facebook · X",
    href: R.social,
  },
  {
    id: "ntf-40", module: "automation", tone: "info", minutes: 4470, read: true,
    title: "New workflow execution",
    message: "Abandoned Checkout Recovery started a run.",
    context: "Triggered by order #MF-10250",
    href: R.automation,
  },
  {
    id: "ntf-41", module: "email", tone: "alert", minutes: 4700, read: true,
    title: "Email delivery issue",
    message: "The provider is throttling mail from this domain.",
    context: "Welcome Campaign delayed",
    href: R.email,
  },
  {
    id: "ntf-42", module: "customer", tone: "info", minutes: 4940, read: true,
    title: "Customer updated",
    message: "Maria Gomez changed their contact details.",
    context: "New WhatsApp number on file",
    href: R.contacts,
  },
  {
    id: "ntf-43", module: "workspace", tone: "info", minutes: 5190, read: true,
    title: "Role changed",
    message: "Priya Nair was moved to a different role.",
    context: "Support Agent → Marketing Manager",
    href: R.team,
  },
  {
    id: "ntf-44", module: "sms", tone: "alert", minutes: 5450, read: true,
    title: "SMS sender issue",
    message: "A sender ID was rejected by the operator.",
    context: "Registration required for this country",
    href: R.sms,
  },
  {
    id: "ntf-45", module: "order", tone: "success", minutes: 5720, read: true,
    title: "Order payment successful",
    message: "Payment for order #MF-10249 was completed.",
    context: "Sarah Ahmed · $149.00",
    href: R.orders,
  },
  {
    id: "ntf-46", module: "integration", tone: "alert", minutes: 6000, read: true,
    title: "Sync failed",
    message: "The catalogue sync did not finish.",
    context: "42 of 316 products updated",
    href: R.integrations,
  },
  {
    id: "ntf-47", module: "security", tone: "info", minutes: 6290, read: true,
    title: "Password changed",
    message: "Your account password was updated.",
    context: "Changed from this browser",
    href: R.security,
  },
  {
    id: "ntf-48", module: "billing", tone: "info", minutes: 6590, read: true,
    title: "Subscription updated",
    message: "The workspace moved from Starter to Growth.",
    context: "Monthly billing · $49.00",
    href: R.billing,
  },
];

export const NOTIFICATION_FEED: FeedNotification[] = SEED.map(
  ({ minutes, ...rest }) => ({ ...rest, createdAt: minutesAgo(minutes) }),
);
