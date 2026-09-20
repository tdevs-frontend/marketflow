import { minutesAgo } from "@/lib/workspace-clock";
import {
  NOTIFICATION_ROUTES,
  type FeedNotification,
} from "@/types/notification";

/**
 * What the bell has to show, seeded from the workspace the rest of the product
 * already agrees on.
 *
 * Every entity named below is real in this build. `#MF-10255` is an order in
 * `commerce-fixtures` and Maria Gomez is the customer on it; *Summer Sale 2026*
 * and *Customer Re-engagement* are campaigns in `marketing-fixtures`;
 * *Abandoned Checkout Recovery* is a workflow in `workflow-fixtures`; Amara
 * Okafor is a contact in `customer-fixtures`; *Premium T-Shirt* is a product
 * with variants and a stock threshold. That is the difference between a demo
 * and a screenshot: click "New order received" and the order it names is on the
 * page it opens.
 *
 * Invented names would have been faster and would have failed the first time
 * anybody followed one. A notification that references nothing teaches the
 * reader the bell is decorative, which is the one thing a notification feed
 * cannot afford.
 *
 * Timestamps are relative to `WORKSPACE_NOW`, the frozen instant every other
 * fixture measures against — not `Date.now()`. A "2 minutes ago" computed on
 * the server and again on the client is a hydration mismatch waiting for a slow
 * response, and a feed anchored to the real clock drifts further every day
 * nobody touches it.
 *
 * Ordered newest first, which is the order the panel renders and the order the
 * reducer preserves.
 */
export const NOTIFICATION_FEED: FeedNotification[] = [
  {
    id: "ntf-01",
    module: "order",
    tone: "success",
    title: "New order received",
    message: "Maria Gomez placed order #MF-10255 for the Premium Package.",
    createdAt: minutesAgo(2),
    read: false,
    href: NOTIFICATION_ROUTES.orders,
  },
  {
    id: "ntf-02",
    module: "whatsapp",
    tone: "info",
    title: "WhatsApp reply received",
    message:
      "A customer replied to the Abandoned Checkout Recovery conversation.",
    createdAt: minutesAgo(18),
    read: false,
    href: NOTIFICATION_ROUTES.whatsapp,
  },
  {
    id: "ntf-03",
    module: "automation",
    tone: "alert",
    title: "Workflow failed",
    message: "Customer Re-engagement stopped on a send step and did not finish.",
    createdAt: minutesAgo(34),
    read: false,
    href: NOTIFICATION_ROUTES.automation,
  },
  {
    id: "ntf-04",
    module: "marketing",
    tone: "success",
    title: "Campaign completed",
    message: "Summer Sale 2026 finished sending to its full audience.",
    createdAt: minutesAgo(52),
    read: false,
    href: NOTIFICATION_ROUTES.campaigns,
  },
  {
    id: "ntf-05",
    module: "customer",
    tone: "info",
    title: "New lead assigned to you",
    message: "Amara Okafor was assigned to you from the sales pipeline.",
    createdAt: minutesAgo(75),
    read: false,
    href: NOTIFICATION_ROUTES.leads,
  },
  {
    id: "ntf-06",
    module: "inventory",
    tone: "alert",
    title: "Low stock",
    message: "Premium T-Shirt has fallen to 8 units, below its threshold.",
    createdAt: minutesAgo(124),
    read: false,
    href: NOTIFICATION_ROUTES.inventory,
  },
  {
    id: "ntf-07",
    module: "email",
    tone: "info",
    title: "Email campaign sent",
    message: "VIP Early Access was handed to the provider and is going out.",
    createdAt: minutesAgo(168),
    read: false,
    href: NOTIFICATION_ROUTES.email,
  },
  {
    id: "ntf-08",
    module: "integration",
    tone: "alert",
    title: "Integration needs attention",
    message: "The WhatsApp Business connection stopped passing health checks.",
    createdAt: minutesAgo(205),
    read: false,
    href: NOTIFICATION_ROUTES.integrations,
  },
  {
    id: "ntf-09",
    module: "social",
    tone: "success",
    title: "Social post published",
    message: "The Business Package launch post went live on its accounts.",
    createdAt: minutesAgo(260),
    read: true,
    href: NOTIFICATION_ROUTES.social,
  },
  {
    id: "ntf-10",
    module: "billing",
    tone: "success",
    title: "Payment received",
    message: "The Growth subscription renewed and INV-1024 was issued.",
    createdAt: minutesAgo(320),
    read: true,
    href: NOTIFICATION_ROUTES.billing,
  },
  {
    id: "ntf-11",
    module: "sms",
    tone: "alert",
    title: "SMS delivery issue",
    message: "An operator is rejecting traffic from the registered sender ID.",
    createdAt: minutesAgo(410),
    read: true,
    href: NOTIFICATION_ROUTES.sms,
  },
  {
    id: "ntf-12",
    module: "workspace",
    tone: "info",
    title: "Team member added",
    message: "Daniel Reyes accepted their invitation and joined as Sales Agent.",
    createdAt: minutesAgo(505),
    read: true,
    href: NOTIFICATION_ROUTES.team,
  },
  {
    id: "ntf-13",
    module: "order",
    tone: "alert",
    title: "Order payment failed",
    message: "The card on order #MF-10254 was declined and it is unpaid.",
    createdAt: minutesAgo(640),
    read: true,
    href: NOTIFICATION_ROUTES.orders,
  },
  {
    id: "ntf-14",
    module: "customer",
    tone: "info",
    title: "New contact",
    message: "Priya Nair was added to the CRM from the landing page form.",
    createdAt: minutesAgo(790),
    read: true,
    href: NOTIFICATION_ROUTES.contacts,
  },
];
