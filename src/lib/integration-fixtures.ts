import { APP_ROUTES } from "@/constants/app";
import { INTEGRATION_ROUTES, providerById } from "@/constants/integrations";
import {
  SOCIAL_ACCOUNTS,
  analyticsAccounts,
  socialConnectionTotals,
} from "@/lib/social-fixtures";
import {
  WORKSPACE_NOW,
  WORKSPACE_NOW_MS,
  daysAgo,
  hoursAgo,
  minutesAgo,
} from "@/lib/workspace-clock";
import type {
  ApiKey,
  ApiLogEntry,
  ApiUsage,
  CredentialValue,
  HealthStatus,
  Integration,
  IntegrationEvent,
  IntegrationProvider,
  IntegrationStatus,
  Webhook,
  WebhookDelivery,
} from "@/types/integration";

/**
 * The Integrations module's mock data.
 *
 * One workspace, told consistently: the WhatsApp number that appears on the hub
 * card is the number on the WhatsApp page, the SMS provider that is failing
 * there is the reason the hub shows one issue, and the webhook that keeps
 * timing out is the one whose delivery log has the 504s in it. A fixture where
 * those disagree is worse than no fixture — it teaches the reader that the
 * numbers are decoration.
 *
 * Replacing this file with `GET /integrations` should be the only change the
 * components need. Nothing below is imported for its shape alone, and every
 * derived figure — the KPI counts, the worst-health rollup, the usage totals —
 * is computed here rather than in a component.
 */

/**
 * The clock every relative timestamp in this module is measured against.
 *
 * Re-exported under the module's own name from `lib/workspace-clock`, which is
 * where the workspace's frozen instant now lives so that these fixtures and the
 * Social Planner's can share it without importing each other.
 */
export const INTEGRATIONS_NOW = WORKSPACE_NOW;
export const INTEGRATIONS_NOW_MS = WORKSPACE_NOW_MS;

/**
 * A secret as the API hands it back.
 *
 * The raw value is never returned once saved, so the fixture does not hold one
 * either — the mask *is* the stored value, and there is nothing in this file a
 * leak could expose. `tail` is what lets a merchant tell two keys apart.
 */
const masked = (tail: string, dots = 10) => `${"•".repeat(dots)}${tail}`;

/**
 * An activity feed, written as tuples.
 *
 * The object form is six lines per event for three fields that matter, and a
 * feed written that way stops getting edited the first time it is wrong.
 * Minutes-ago leads because it is the element that has to stay ordered — the
 * feed is rendered newest-first with no sort, so a row out of order here is
 * visible immediately rather than silently re-sorted away.
 *
 * Every timestamp below is reconciled with the same integration's
 * `activity` block: the SMS feed's failure is the minute its `lastErrorAt`
 * names, and its last success is the one nine hours back. A feed that
 * disagrees with the timeline above it is how a merchant learns the page is
 * decoration.
 */
function feed(
  prefix: string,
  specs: [
    minutes: number,
    label: string,
    outcome: IntegrationEvent["outcome"],
    detail?: string,
  ][],
): IntegrationEvent[] {
  return specs.map(([minutes, label, outcome, detail], index) => ({
    id: `${prefix}_evt_${index}`,
    label,
    at: minutesAgo(minutes),
    outcome,
    detail,
  }));
}

/* -------------------------------------------------------------------------- */
/* Integrations                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The hub catalogue.
 *
 * Five of these have a page; three are connected and monitored from the hub
 * alone. They share one record type so the grid does not care which is which.
 */


/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The Social integration's hub record, derived from the connected accounts.
 *
 * Nothing here is typed out. The account list in `social-fixtures` is the single
 * source of truth for who is connected — the Planner's composer reads the same
 * array — so this card's status, its account line and its health checks are all
 * computed from it. Hand-writing "3 accounts" here is how a hub card ends up
 * claiming a connection the Planner cannot actually publish through.
 */
function socialIntegration(): Integration {
  const totals = socialConnectionTotals();
  const platforms = new Set(SOCIAL_ACCOUNTS.map((account) => account.platform));
  const broken = SOCIAL_ACCOUNTS.filter((account) => account.status !== "connected");
  const expiring = SOCIAL_ACCOUNTS.filter(
    (account) => account.auth.status === "expiring_soon",
  );
  const withAnalytics = analyticsAccounts().length;

  /* The freshest sync across every account — the hub card shows one figure. */
  const lastSync = SOCIAL_ACCOUNTS.reduce<string | null>(
    (latest, account) =>
      !latest || account.lastSyncedAt > latest ? account.lastSyncedAt : latest,
    null,
  );

  return {
    id: "social",
    slug: "social",
    href: INTEGRATION_ROUTES.social,
    name: "Social Media",
    description: "Connect social accounts for publishing, scheduling and analytics.",
    category: "social",
    icon: "share-2",
    /* One expired token is an issue, not a healthy connection — even while the
       other three accounts publish perfectly well. */
    status:
      totals.accounts === 0
        ? "needs_setup"
        : broken.length > 0
          ? "issue"
          : "connected",
    provider: null,
    account:
      totals.accounts === 0
        ? null
        : totals.accounts + " account" + (totals.accounts === 1 ? "" : "s"),
    eventsToday: totals.postsToday,
    credentials: [],
    health: [
      {
        id: "api",
        label: "API Connection",
        status: "healthy",
        detail:
          "Reachable on " + totals.activePlatforms + " of " + platforms.size + " connected platforms.",
        checkedAt: minutesAgo(2),
      },
      {
        id: "auth",
        label: "Authentication",
        status:
          broken.length > 0 ? "error" : expiring.length > 0 ? "warning" : "healthy",
        detail:
          broken.length > 0
            ? broken.map((account) => account.name).join(", ") + " needs re-authorising."
            : expiring.length > 0
              ? expiring.length + " token expires within the next 30 days."
              : "Every token is valid.",
        checkedAt: minutesAgo(2),
        fixLabel: broken.length > 0 ? "Reconnect" : undefined,
      },
      {
        id: "publishing",
        label: "Publishing Permission",
        status: totals.activePlatforms > 0 ? "healthy" : "error",
        detail:
          totals.activePlatforms +
          " platform" +
          (totals.activePlatforms === 1 ? "" : "s") +
          " can publish right now.",
        checkedAt: minutesAgo(4),
      },
      {
        id: "analytics",
        label: "Analytics Permission",
        status: withAnalytics === SOCIAL_ACCOUNTS.length ? "healthy" : "warning",
        detail: "Insights granted on " + withAnalytics + " of " + SOCIAL_ACCOUNTS.length + " accounts.",
        checkedAt: minutesAgo(4),
      },
    ],
    usage: [
      {
        label: "Social Planner",
        count: 12,
        href: APP_ROUTES.socialCalendar,
        icon: "calendar-days",
      },
      {
        label: "Campaigns",
        count: 3,
        href: APP_ROUTES.marketingCampaigns,
        icon: "megaphone",
      },
      { label: "Automation", count: 2, href: APP_ROUTES.automation, icon: "workflow" },
    ],
    activity: {
      connectedAt: daysAgo(142),
      lastSuccessAt: minutesAgo(2),
      lastSyncAt: lastSync,
      lastErrorAt: hoursAgo(9),
      lastError:
        "X / Twitter returned 401 Unauthorized — the access token expired on 12 Sep.",
    },
    events: feed("social", [
      [2, "Post published", "success", "Instagram — MarketFlow Studio."],
      [24, "Insights synced", "success", "Reach and engagement pulled for 4 accounts."],
      [47, "Comment received", "success", "Facebook — MarketFlow Bangladesh."],
      [
        540,
        "Authorisation expired",
        "failure",
        "X / Twitter stopped accepting the access token.",
      ],
    ]),
    metrics: [],
  };
}

export const INTEGRATIONS: Integration[] = [
  {
    id: "whatsapp",
    slug: "whatsapp",
    href: INTEGRATION_ROUTES.whatsapp,
    name: "WhatsApp Business",
    description: "Send campaigns, receive messages and power automation.",
    category: "messaging",
    icon: "message-circle",
    status: "connected",
    provider: providerById("meta-cloud") ?? null,
    account: "+880 1712 345678",
    eventsToday: 1284,
    credentials: [
      {
        key: "phoneNumberId",
        label: "Phone Number ID",
        kind: "text",
        value: "109371892043177",
        updatedAt: daysAgo(86),
      },
      {
        key: "businessAccountId",
        label: "Business Account ID",
        kind: "text",
        value: "284910337712004",
        updatedAt: daysAgo(86),
      },
      {
        key: "accessToken",
        label: "Access Token",
        kind: "secret",
        value: masked("92AX"),
        preview: "92AX",
        hint: "Permanent System User token. Rotated every 90 days.",
        updatedAt: daysAgo(21),
      },
      {
        key: "appSecret",
        label: "App Secret",
        kind: "secret",
        value: masked("4C7D"),
        preview: "4C7D",
        hint: "Verifies the signature on every inbound webhook.",
        updatedAt: daysAgo(86),
      },
    ],
    health: [
      {
        id: "api",
        label: "API Connection",
        status: "healthy",
        detail: "Meta Cloud API responded in 184 ms.",
        checkedAt: minutesAgo(2),
      },
      {
        id: "webhook",
        label: "Webhook",
        status: "healthy",
        detail: "Receiving inbound events and delivery receipts.",
        checkedAt: minutesAgo(2),
      },
      {
        id: "templates",
        label: "Template Sync",
        status: "healthy",
        detail: "24 approved templates in sync with Meta.",
        checkedAt: minutesAgo(38),
      },
      {
        id: "queue",
        label: "Message Queue",
        status: "healthy",
        detail: "No backlog. 12 messages in flight.",
        checkedAt: minutesAgo(1),
      },
    ],
    usage: [
      { label: "Workflows", count: 12, href: APP_ROUTES.automation, icon: "workflow" },
      { label: "Campaigns", count: 4, href: APP_ROUTES.whatsappCampaigns, icon: "megaphone" },
      { label: "WhatsApp Inbox", href: APP_ROUTES.whatsappInbox, icon: "inbox" },
      { label: "Templates", count: 24, href: APP_ROUTES.whatsappTemplates, icon: "layout-template" },
    ],
    activity: {
      connectedAt: daysAgo(86),
      lastSuccessAt: minutesAgo(1),
      lastSyncAt: minutesAgo(2),
      lastErrorAt: daysAgo(6),
      lastError: "Template 'order_shipped_v2' rejected by Meta: missing sample values.",
    },
    events: feed("whatsapp", [
      [2, "Message received", "success", "Inbound message routed to the Inbox."],
      [8, "Campaign sent", "success", "Eid Collection Launch — 840 recipients."],
      [14, "Delivery receipts processed", "success", "812 delivered, 6 pending."],
      [38, "Templates synced", "success", "24 approved templates in sync with Meta."],
      [186, "Access token verified", "success", "Next rotation due in 69 days."],
    ]),
    metrics: [
      { label: "Messages Today", value: "1,284", hint: "Sent and received" },
      { label: "Delivery Rate", value: "97.8%", hint: "Last 24 hours", tone: "success" },
      { label: "Read Rate", value: "82.1%", hint: "Of delivered messages" },
      { label: "Failed", value: "28", hint: "Mostly invalid numbers" },
    ],
  },

  {
    id: "email",
    slug: "email",
    href: INTEGRATION_ROUTES.email,
    name: "Email",
    description: "Send campaign and automation emails from your own domain.",
    category: "messaging",
    icon: "mail",
    status: "connected",
    provider: providerById("smtp") ?? null,
    account: "hello@marketflow.app",
    eventsToday: 2480,
    credentials: [
      { key: "host", label: "SMTP Host", kind: "text", value: "smtp.mailhost.io", updatedAt: daysAgo(54) },
      { key: "port", label: "Port", kind: "number", value: "587", updatedAt: daysAgo(54) },
      { key: "encryption", label: "Encryption", kind: "select", value: "STARTTLS", updatedAt: daysAgo(54) },
      {
        key: "username",
        label: "Username",
        kind: "text",
        value: "postmaster@marketflow.app",
        updatedAt: daysAgo(54),
      },
      {
        key: "password",
        label: "Password",
        kind: "secret",
        value: masked("7K2Q"),
        preview: "7K2Q",
        updatedAt: daysAgo(54),
      },
    ],
    health: [
      {
        id: "api",
        label: "SMTP Connection",
        status: "healthy",
        detail: "Authenticated on smtp.mailhost.io:587.",
        checkedAt: minutesAgo(6),
      },
      {
        id: "sender",
        label: "Sender Verification",
        status: "warning",
        detail: "DMARC is set to p=none. Move to quarantine to protect the domain.",
        checkedAt: hoursAgo(3),
        fixLabel: "Review DNS",
      },
      {
        id: "reputation",
        label: "Deliverability",
        status: "healthy",
        detail: "Bounce rate 1.2%, complaints 0.02%.",
        checkedAt: hoursAgo(1),
      },
      {
        id: "quota",
        label: "Daily Quota",
        status: "healthy",
        detail: "2,480 of 20,000 sent today.",
        checkedAt: minutesAgo(4),
      },
    ],
    usage: [
      { label: "Workflows", count: 7, href: APP_ROUTES.automation, icon: "workflow" },
      { label: "Campaigns", count: 5, href: APP_ROUTES.emailCampaigns, icon: "megaphone" },
      { label: "Templates", count: 18, href: APP_ROUTES.emailTemplates, icon: "mail-open" },
    ],
    activity: {
      connectedAt: daysAgo(54),
      lastSuccessAt: minutesAgo(4),
      lastSyncAt: minutesAgo(4),
      lastErrorAt: daysAgo(2),
      lastError: "451 Temporary failure from receiving server — 3 messages requeued.",
    },
    events: feed("email", [
      [4, "Campaign email sent", "success", "September Newsletter — 1,240 recipients."],
      [26, "Bounce recorded", "warning", "4 hard bounces suppressed automatically."],
      [41, "Automation email sent", "success", "Abandoned cart, step 2."],
      [
        180,
        "Sender policy checked",
        "warning",
        "DMARC is still p=none on marketflow.app.",
      ],
    ]),
    metrics: [
      { label: "Emails Today", value: "2,480", hint: "Campaign and automated" },
      { label: "Delivery Rate", value: "98.4%", hint: "Last 24 hours", tone: "success" },
      { label: "Bounce Rate", value: "1.2%", hint: "Hard and soft" },
      { label: "Complaint Rate", value: "0.02%", hint: "Spam reports" },
    ],
  },

  {
    id: "sms",
    slug: "sms",
    href: INTEGRATION_ROUTES.sms,
    name: "SMS",
    description: "Deliver transactional and marketing SMS worldwide.",
    category: "messaging",
    icon: "smartphone",
    status: "issue",
    provider: providerById("twilio") ?? null,
    account: "MRKTFLOW",
    eventsToday: 612,
    credentials: [
      {
        key: "accountSid",
        label: "Account SID",
        kind: "text",
        value: "AC7f3d9b2c48e1a05f6d",
        updatedAt: daysAgo(31),
      },
      {
        key: "authToken",
        label: "Auth Token",
        kind: "secret",
        value: masked("1F8E"),
        preview: "1F8E",
        hint: "Rejected on the last 14 requests. Rotate it in Twilio and re-enter.",
        updatedAt: daysAgo(31),
      },
      { key: "senderId", label: "Sender ID", kind: "text", value: "MRKTFLOW", updatedAt: daysAgo(31) },
    ],
    health: [
      {
        id: "api",
        label: "API Connection",
        status: "error",
        detail: "Twilio returned 401 Unauthorized. The auth token is no longer valid.",
        checkedAt: minutesAgo(9),
        fixLabel: "Update token",
      },
      {
        id: "sender",
        label: "Sender ID",
        status: "healthy",
        detail: "MRKTFLOW registered for Bangladesh and India.",
        checkedAt: hoursAgo(5),
      },
      {
        id: "balance",
        label: "Account Balance",
        status: "warning",
        detail: "$148.20 left — roughly 4 days at the current send rate.",
        checkedAt: hoursAgo(1),
        fixLabel: "Top up",
      },
      {
        id: "queue",
        label: "Message Queue",
        status: "warning",
        detail: "214 messages held pending a working connection.",
        checkedAt: minutesAgo(9),
      },
    ],
    usage: [
      { label: "Workflows", count: 5, href: APP_ROUTES.automation, icon: "workflow" },
      { label: "Campaigns", count: 2, href: APP_ROUTES.smsCampaigns, icon: "megaphone" },
    ],
    activity: {
      connectedAt: daysAgo(31),
      lastSuccessAt: hoursAgo(9),
      lastSyncAt: hoursAgo(9),
      lastErrorAt: minutesAgo(9),
      lastError: "Authentication failed. Please verify your API token.",
    },
    events: feed("sms", [
      [
        9,
        "Authentication failed",
        "failure",
        "Twilio returned 401 Unauthorized on the last 14 requests.",
      ],
      [12, "Messages held", "warning", "214 messages queued pending a working connection."],
      [60, "Balance checked", "warning", "$148.20 left — roughly 4 days of sending."],
      [540, "Message delivered", "success", "The last message to clear the gateway."],
    ]),
    metrics: [
      { label: "Messages Today", value: "612", hint: "Before the outage" },
      { label: "Delivery Rate", value: "94.2%", hint: "Last 24 hours" },
      { label: "Balance", value: "$148.20", hint: "≈ 4 days remaining", tone: "warning" },
      { label: "Queued", value: "214", hint: "Waiting on the connection", tone: "warning" },
    ],
  },

  socialIntegration(),

  {
    id: "webhooks",
    slug: "webhooks",
    href: INTEGRATION_ROUTES.webhooks,
    name: "Webhooks",
    description: "Send MarketFlow events to external systems in real time.",
    category: "developer",
    icon: "webhook",
    status: "connected",
    provider: null,
    account: "3 active endpoints",
    eventsToday: 1842,
    credentials: [],
    health: [
      {
        id: "delivery",
        label: "Delivery",
        status: "warning",
        detail: "One endpoint is timing out. 27 deliveries failed today.",
        checkedAt: minutesAgo(1),
        fixLabel: "Inspect endpoint",
      },
      {
        id: "signing",
        label: "Signing",
        status: "healthy",
        detail: "Every request signed with the endpoint secret.",
        checkedAt: minutesAgo(1),
      },
    ],
    usage: [
      { label: "Workflows", count: 3, href: APP_ROUTES.automation, icon: "workflow" },
      { label: "Forms", count: 2, href: "/dashboard/forms", icon: "list-checks" },
    ],
    activity: {
      connectedAt: daysAgo(120),
      lastSuccessAt: minutesAgo(1),
      lastSyncAt: minutesAgo(1),
      lastErrorAt: minutesAgo(12),
      lastError: "POST https://hooks.warehouse.internal/marketflow timed out after 10s.",
    },
    events: feed("webhooks", [
      [1, "Webhook delivered", "success", "order.paid → CRM Sync, 200 in 180 ms."],
      [
        12,
        "Delivery timed out",
        "failure",
        "contact.created → Warehouse Sync, no response after 10s.",
      ],
      [18, "Webhook delivered", "success", "contact.updated → Order Bridge, 200."],
      [96, "Delivery retried", "warning", "Succeeded on the second attempt."],
    ]),
    metrics: [
      { label: "Active Endpoints", value: "3" },
      { label: "Events Today", value: "1,842" },
      { label: "Success Rate", value: "98.5%", tone: "success" },
      { label: "Failed Deliveries", value: "27", tone: "warning" },
    ],
  },

  {
    id: "api",
    slug: "api",
    href: INTEGRATION_ROUTES.api,
    name: "API Access",
    description: "Connect your own applications to MarketFlow securely.",
    category: "developer",
    icon: "code",
    status: "connected",
    provider: null,
    account: "3 active keys",
    eventsToday: 9318,
    credentials: [],
    health: [
      {
        id: "api",
        label: "API Availability",
        status: "healthy",
        detail: "All endpoints responding. p95 at 142 ms.",
        checkedAt: minutesAgo(1),
      },
      {
        id: "rate",
        label: "Rate Limit",
        status: "healthy",
        detail: "6,840 of 20,000 requests used this hour.",
        checkedAt: minutesAgo(1),
      },
    ],
    usage: [{ label: "Webhooks", count: 3, href: INTEGRATION_ROUTES.webhooks, icon: "webhook" }],
    activity: {
      connectedAt: daysAgo(210),
      lastSuccessAt: minutesAgo(1),
      lastSyncAt: minutesAgo(1),
      lastErrorAt: hoursAgo(4),
      lastError: "429 Too Many Requests on /api/v1/contacts — Reporting Sync key throttled.",
    },
    events: feed("api", [
      [1, "Contacts read", "success", "GET /v1/contacts — Production Server key."],
      [6, "Orders read", "success", "GET /v1/orders — Reporting Sync key."],
      [
        240,
        "Rate limit reached",
        "warning",
        "Reporting Sync throttled for 40 seconds on /v1/contacts.",
      ],
      [12960, "API key created", "success", "Staging Integration, development."],
    ]),
    metrics: [
      { label: "Requests Today", value: "9,318" },
      { label: "Success Rate", value: "99.1%", tone: "success" },
      { label: "Failed Requests", value: "84" },
      { label: "Rate Limit Used", value: "34%", hint: "6,840 of 20,000 per hour" },
    ],
  },

  {
    id: "ga4",
    slug: null,
    href: null,
    name: "Google Analytics 4",
    description: "Attribute campaign traffic and conversions in GA4.",
    category: "analytics",
    icon: "bar-chart",
    status: "needs_setup",
    provider: null,
    account: null,
    eventsToday: 0,
    credentials: [],
    health: [
      {
        id: "connection",
        label: "Connection",
        status: "disconnected",
        detail: "Not connected yet.",
        checkedAt: INTEGRATIONS_NOW,
      },
    ],
    /*
     * What it would feed, not what it feeds.
     *
     * An unconnected integration still has a place in the workspace, and the
     * card that cannot say what that place is leaves a merchant to guess why
     * GA4 is on this page at all. The list is rendered under "Connects to"
     * rather than "Used by" while the status is not connected — see
     * `IntegrationManageDrawer` — so it never claims a dependency that does
     * not exist yet.
     */
    usage: [
      { label: "Marketing Analytics", href: APP_ROUTES.analytics, icon: "bar-chart" },
      { label: "Campaigns", href: APP_ROUTES.marketingCampaigns, icon: "megaphone" },
    ],
    activity: {
      connectedAt: null,
      lastSuccessAt: null,
      lastSyncAt: null,
      lastErrorAt: null,
      lastError: null,
    },
    events: [],
    metrics: [],
  },

  {
    id: "shopify",
    slug: null,
    href: null,
    name: "Shopify",
    description: "Sync orders, products and customers from your store.",
    category: "commerce",
    icon: "shopping-cart",
    status: "needs_setup",
    provider: null,
    account: null,
    eventsToday: 0,
    credentials: [],
    health: [
      {
        id: "connection",
        label: "Connection",
        status: "disconnected",
        detail: "Not connected yet.",
        checkedAt: INTEGRATIONS_NOW,
      },
    ],
    usage: [
      { label: "Products", href: APP_ROUTES.products, icon: "package" },
      { label: "Orders", href: APP_ROUTES.orders, icon: "shopping-cart" },
      { label: "Contacts", href: APP_ROUTES.contacts, icon: "users" },
    ],
    activity: {
      connectedAt: null,
      lastSuccessAt: null,
      lastSyncAt: null,
      lastErrorAt: null,
      lastError: null,
    },
    events: [],
    metrics: [],
  },

  {
    id: "meta-pixel",
    slug: null,
    href: null,
    name: "Meta Pixel",
    description: "Send conversion events to Meta Ads.",
    category: "analytics",
    icon: "target",
    status: "disabled",
    provider: providerById("meta-pixel") ?? null,
    account: "Pixel 1029384756102938",
    eventsToday: 0,
    credentials: [
      { key: "pixelId", label: "Pixel ID", kind: "text", value: "1029384756102938", updatedAt: daysAgo(160) },
      {
        key: "accessToken",
        label: "Conversions API Token",
        kind: "secret",
        value: masked("5B31"),
        preview: "5B31",
        updatedAt: daysAgo(160),
      },
    ],
    health: [
      {
        id: "connection",
        label: "Connection",
        status: "disconnected",
        detail: "Paused by an admin on 12 Jun. Credentials are kept.",
        checkedAt: daysAgo(94),
      },
    ],
    usage: [
      { label: "Marketing Analytics", href: APP_ROUTES.analytics, icon: "bar-chart" },
      { label: "Campaigns", href: APP_ROUTES.marketingCampaigns, icon: "megaphone" },
    ],
    activity: {
      connectedAt: daysAgo(160),
      lastSuccessAt: daysAgo(94),
      lastSyncAt: daysAgo(94),
      lastErrorAt: null,
      lastError: null,
    },
    events: feed("meta-pixel", [
      [
        94 * 24 * 60,
        "Integration paused",
        "warning",
        "Paused by an admin. Credentials were kept.",
      ],
      [
        94 * 24 * 60 + 12,
        "Conversion event sent",
        "success",
        "Purchase — the last event before it was paused.",
      ],
    ]),
    metrics: [],
  },
];

export function integrationById(id: string): Integration | undefined {
  return INTEGRATIONS.find((integration) => integration.id === id);
}

/** Throws rather than returning `undefined`: the five routed pages each own one. */
export function requireIntegration(id: string): Integration {
  const integration = integrationById(id);
  if (!integration) throw new Error(`Unknown integration: ${id}`);
  return integration;
}

/* -------------------------------------------------------------------------- */
/* Derived figures                                                            */
/* -------------------------------------------------------------------------- */

export interface IntegrationTotals {
  connected: number;
  needsSetup: number;
  issues: number;
  disabled: number;
  eventsToday: number;
}

export function integrationTotals(
  list: Integration[] = INTEGRATIONS,
): IntegrationTotals {
  const count = (status: IntegrationStatus) =>
    list.filter((item) => item.status === status).length;

  return {
    connected: count("connected"),
    needsSetup: count("needs_setup"),
    issues: count("issue"),
    disabled: count("disabled"),
    eventsToday: list.reduce((total, item) => total + item.eventsToday, 0),
  };
}

/** Worst wins, so one failing check cannot hide behind three healthy ones. */
const HEALTH_RANK: Record<HealthStatus, number> = {
  healthy: 0,
  warning: 1,
  disconnected: 2,
  error: 3,
};

export function worstHealth(checks: { status: HealthStatus }[]): HealthStatus {
  return checks.reduce<HealthStatus>(
    (worst, check) =>
      HEALTH_RANK[check.status] > HEALTH_RANK[worst] ? check.status : worst,
    "healthy",
  );
}

/* -------------------------------------------------------------------------- */
/* Transitions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The record as the API would hand it back after each connection action.
 *
 * Status is never the only thing that changes. A page that updates the badge
 * alone produces a card reading "Connected · Disconnected" over a last activity
 * of "No activity yet" — which is not a cosmetic bug, it is the page lying
 * about the thing it exists to report. These three functions are the whole
 * patch for each action, so a caller cannot apply half of one.
 *
 * They live here rather than in a component because they are the response
 * shape: when `POST /integrations/:id/connection` exists, its body replaces
 * the return value and every caller stays as it is.
 */

/** A single healthy check, for a connection that has just proved itself. */
function verifiedHealth(detail: string) {
  return [
    {
      id: "connection",
      label: "Connection",
      status: "healthy" as HealthStatus,
      detail,
      checkedAt: INTEGRATIONS_NOW,
    },
  ];
}

export function connectedRecord(
  integration: Integration,
  provider: IntegrationProvider,
  credentials: CredentialValue[],
): Integration {
  return {
    ...integration,
    status: "connected",
    provider,
    credentials,
    /* The identity line — whatever the merchant recognises this connection by.
       The first credential that is not a secret is exactly that, by
       construction: a measurement ID, a shop domain, a sender, a host. */
    account:
      integration.account ??
      credentials.find((value) => value.kind !== "secret" && value.value !== "—")
        ?.value ??
      provider.name,
    health: verifiedHealth(`${provider.name} accepted the credentials.`),
    activity: {
      connectedAt: integration.activity.connectedAt ?? INTEGRATIONS_NOW,
      lastSuccessAt: INTEGRATIONS_NOW,
      lastSyncAt: INTEGRATIONS_NOW,
      /* The failure that prompted the reconnect is resolved, not history to
         keep showing under a healthy badge. */
      lastErrorAt: null,
      lastError: null,
    },
    events: [
      {
        id: `${integration.id}_evt_connected`,
        label: "Connection established",
        at: INTEGRATIONS_NOW,
        outcome: "success",
        detail: `Connected through ${provider.name}.`,
      },
      ...integration.events,
    ],
  };
}

/** A paused integration resumed on its saved credentials. */
export function enabledRecord(integration: Integration): Integration {
  return {
    ...integration,
    status: "connected",
    health: verifiedHealth(
      `${integration.provider?.name ?? integration.name} accepted the saved credentials.`,
    ),
    activity: {
      ...integration.activity,
      lastSuccessAt: INTEGRATIONS_NOW,
      lastSyncAt: INTEGRATIONS_NOW,
    },
    events: [
      {
        id: `${integration.id}_evt_enabled`,
        label: "Integration enabled",
        at: INTEGRATIONS_NOW,
        outcome: "success",
        detail: "Resumed on the saved credentials.",
      },
      ...integration.events,
    ],
  };
}

/**
 * Disconnected, with the configuration kept.
 *
 * `credentials` is deliberately untouched: the disconnect confirmation promises
 * that reconnecting will not mean typing the token again, and a transition that
 * quietly cleared them would make that copy false.
 */
export function disconnectedRecord(integration: Integration): Integration {
  return {
    ...integration,
    status: "disabled",
    health: [
      {
        id: "connection",
        label: "Connection",
        status: "disconnected",
        detail: "Disconnected from this workspace. Credentials are kept.",
        checkedAt: INTEGRATIONS_NOW,
      },
    ],
    events: [
      {
        id: `${integration.id}_evt_disconnected`,
        label: "Connection ended",
        at: INTEGRATIONS_NOW,
        outcome: "warning",
        detail: "Disconnected from this workspace.",
      },
      ...integration.events,
    ],
  };
}

/**
 * One integration's event, carrying the integration it came from.
 *
 * The merged feed is read across connections, where "Delivery timed out" means
 * something different depending on whether a webhook or a campaign produced it.
 * Dropping the source is what turns a useful feed into a wall of verbs.
 */
export interface WorkspaceEvent extends IntegrationEvent {
  integrationId: string;
  integrationName: string;
  icon: string;
}

/**
 * Every feed, merged newest-first — what the Events Today tile opens onto.
 *
 * Sorted on the ISO string rather than a parsed date because the fixtures are
 * all UTC with the same precision, which makes a lexicographic compare both
 * correct and free. A real API returns this already ordered.
 */
export function recentEvents(
  list: Integration[] = INTEGRATIONS,
  limit = 14,
): WorkspaceEvent[] {
  return list
    .flatMap((integration) =>
      integration.events.map((event) => ({
        ...event,
        integrationId: integration.id,
        integrationName: integration.name,
        icon: integration.icon,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

/**
 * The sentence the disconnect confirmation opens with.
 *
 * Built from `usage` rather than written per integration, so an integration
 * that gains a dependent feature warns about it without anyone remembering to
 * update a string.
 */
export function usageSummary(integration: Integration): string[] {
  return integration.usage.map((item) =>
    item.count === undefined
      ? item.label
      : `${item.count} ${item.count === 1 ? singular(item.label) : item.label.toLowerCase()}`,
  );
}

function singular(label: string): string {
  const lower = label.toLowerCase();
  return lower.endsWith("s") ? lower.slice(0, -1) : lower;
}

/* -------------------------------------------------------------------------- */
/* Webhooks                                                                   */
/* -------------------------------------------------------------------------- */

function deliveries(
  specs: [minutes: number, event: string, status: WebhookDelivery["status"], code: number | null, ms: number, error?: string][],
): WebhookDelivery[] {
  return specs.map(([minutes, event, status, httpCode, durationMs, error], index) => ({
    id: `dlv_${index}_${minutes}`,
    sentAt: minutesAgo(minutes),
    event,
    status,
    httpCode,
    durationMs,
    attempt: status === "retrying" ? 2 : 1,
    error,
  }));
}

export const WEBHOOKS: Webhook[] = [
  {
    id: "wh_crm_sync",
    name: "CRM Sync",
    url: "https://example.com/webhooks/marketflow",
    status: "active",
    events: ["contact.created", "contact.updated", "lead.created", "lead.stage_changed"],
    secret: masked("A41C", 24),
    secretPreview: "A41C",
    secretReveal: "whsec_7Qd2Kp9LmVx3Rt6Yb1Zn8Hf4Ws0Ea41C",
    createdAt: daysAgo(118),
    lastDeliveryAt: minutesAgo(2),
    deliveries24h: 946,
    failures24h: 6,
    successRate: 99.4,
    timeoutSeconds: 10,
    retryAttempts: 3,
    recentDeliveries: deliveries([
      [2, "contact.created", "success", 200, 124],
      [7, "lead.stage_changed", "success", 200, 98],
      [14, "contact.updated", "success", 201, 143],
      [26, "lead.created", "retrying", 502, 4120, "Bad gateway — retrying in 60s."],
      [27, "lead.created", "failed", 502, 4088, "Bad gateway from upstream proxy."],
      [41, "contact.updated", "success", 200, 111],
      [58, "contact.created", "success", 200, 132],
      [76, "lead.stage_changed", "success", 200, 105],
    ]),
  },
  {
    id: "wh_order_bridge",
    name: "Order Bridge",
    url: "https://api.fulfilment.co/marketflow/orders",
    status: "active",
    events: ["order.created", "order.paid", "form.submitted"],
    secret: masked("9DE2", 24),
    secretPreview: "9DE2",
    secretReveal: "whsec_3Mv8Nc5Tq2Xz7Ld4Gh9Jr6Bk1Pw9DE2",
    createdAt: daysAgo(64),
    lastDeliveryAt: minutesAgo(6),
    deliveries24h: 612,
    failures24h: 2,
    successRate: 99.7,
    timeoutSeconds: 15,
    retryAttempts: 5,
    recentDeliveries: deliveries([
      [6, "order.paid", "success", 200, 208],
      [19, "order.created", "success", 200, 187],
      [33, "form.submitted", "success", 204, 92],
      [61, "order.created", "success", 200, 174],
      [88, "order.paid", "success", 200, 163],
    ]),
  },
  {
    id: "wh_warehouse",
    name: "Warehouse Notifier",
    url: "https://hooks.warehouse.internal/marketflow",
    status: "failing",
    events: ["order.created", "campaign.completed", "workflow.failed"],
    secret: masked("6F70", 24),
    secretPreview: "6F70",
    secretReveal: "whsec_5Yb3Hn7Kd1Qs9Vt2Xm8Lf4Rc0Zp6F70",
    createdAt: daysAgo(22),
    lastDeliveryAt: minutesAgo(12),
    deliveries24h: 284,
    failures24h: 19,
    successRate: 93.3,
    timeoutSeconds: 10,
    retryAttempts: 3,
    recentDeliveries: deliveries([
      [12, "order.created", "failed", null, 10_000, "Connection timed out after 10s. No response received."],
      [24, "order.created", "failed", 504, 10_000, "Gateway timeout."],
      [37, "workflow.failed", "retrying", 504, 10_000, "Gateway timeout — retrying in 5m."],
      [52, "campaign.completed", "success", 200, 862],
      [94, "order.created", "success", 200, 744],
      [131, "order.created", "success", 200, 691],
    ]),
  },
  {
    id: "wh_analytics",
    name: "Analytics Relay",
    url: "https://collect.analytics.io/v2/marketflow",
    status: "paused",
    events: ["campaign.sent", "campaign.completed", "message.delivered", "message.read"],
    secret: masked("2B18", 24),
    secretPreview: "2B18",
    secretReveal: "whsec_9Tf6Rw2Bn5Kq8Ld3Hv7Xc1Ms4Gz2B18",
    createdAt: daysAgo(45),
    lastDeliveryAt: daysAgo(3),
    deliveries24h: 0,
    failures24h: 0,
    successRate: 100,
    timeoutSeconds: 10,
    retryAttempts: 3,
    recentDeliveries: deliveries([
      [4320, "campaign.completed", "success", 200, 221],
      [4402, "message.read", "success", 200, 118],
    ]),
  },
];

export function webhookById(id: string): Webhook | undefined {
  return WEBHOOKS.find((webhook) => webhook.id === id);
}

export interface WebhookTotals {
  active: number;
  eventsToday: number;
  successRate: number;
  failures: number;
}

export function webhookTotals(list: Webhook[] = WEBHOOKS): WebhookTotals {
  const deliveries24h = list.reduce((total, item) => total + item.deliveries24h, 0);
  const failures = list.reduce((total, item) => total + item.failures24h, 0);

  return {
    active: list.filter((item) => item.status !== "paused").length,
    eventsToday: deliveries24h,
    /* Weighted by volume, not an average of the rates: an idle endpoint at
       100% would otherwise drag the fleet's number up for free. */
    successRate:
      deliveries24h === 0 ? 100 : ((deliveries24h - failures) / deliveries24h) * 100,
    failures,
  };
}

/** A fresh endpoint, as the create dialog would receive it back from the API. */
export function createWebhook(input: {
  name: string;
  url: string;
  events: string[];
  timeoutSeconds: number;
  retryAttempts: number;
}): Webhook {
  const tail = Math.random().toString(16).slice(2, 6).toUpperCase();

  return {
    id: `wh_${Date.now().toString(36)}`,
    name: input.name,
    url: input.url,
    status: "active",
    events: input.events,
    secret: masked(tail, 24),
    secretPreview: tail,
    secretReveal: `whsec_${Array.from({ length: 28 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 62))).join("")}${tail}`,
    createdAt: INTEGRATIONS_NOW,
    lastDeliveryAt: null,
    deliveries24h: 0,
    failures24h: 0,
    successRate: 100,
    timeoutSeconds: input.timeoutSeconds,
    retryAttempts: input.retryAttempts,
    recentDeliveries: [],
  };
}

/* -------------------------------------------------------------------------- */
/* API access                                                                 */
/* -------------------------------------------------------------------------- */

export const API_KEYS: ApiKey[] = [
  {
    id: "key_prod",
    name: "Production API",
    environment: "production",
    masked: "mf_live_••••8F2A",
    createdAt: daysAgo(2),
    lastUsedAt: minutesAgo(5),
    scopes: ["contacts.read", "contacts.write", "leads.read", "leads.write", "orders.read"],
    status: "active",
    requests24h: 7412,
  },
  {
    id: "key_reporting",
    name: "Reporting Sync",
    environment: "production",
    masked: "mf_live_••••13C9",
    createdAt: daysAgo(48),
    lastUsedAt: hoursAgo(4),
    scopes: ["contacts.read", "campaigns.read", "automation.read", "orders.read"],
    status: "active",
    requests24h: 1642,
  },
  {
    id: "key_staging",
    name: "Staging Sandbox",
    environment: "development",
    masked: "mf_test_••••6B04",
    createdAt: daysAgo(19),
    lastUsedAt: daysAgo(1),
    scopes: ["contacts.read", "contacts.write"],
    status: "active",
    requests24h: 264,
  },
  {
    id: "key_legacy",
    name: "Legacy Importer",
    environment: "production",
    masked: "mf_live_••••4A77",
    createdAt: daysAgo(214),
    lastUsedAt: daysAgo(96),
    scopes: ["contacts.read", "contacts.write"],
    status: "revoked",
    requests24h: 0,
  },
];

export const API_USAGE: ApiUsage = {
  requests24h: 9318,
  successRate: 99.1,
  failed24h: 84,
  rateLimit: 20_000,
  rateLimitUsed: 6840,
  hourly: [
    142, 118, 96, 84, 71, 88, 164, 296, 438, 612, 731, 806, 884, 792, 704, 668,
    612, 540, 486, 402, 318, 262, 198, 156,
  ],
};

const LOG_SPECS: [
  minutes: number,
  method: ApiLogEntry["method"],
  endpoint: string,
  status: number,
  ms: number,
  key: string,
][] = [
  [0, "POST", "/api/v1/contacts", 201, 124, "Production API"],
  [1, "GET", "/api/v1/contacts?page=3", 200, 88, "Production API"],
  [3, "PATCH", "/api/v1/leads/ld_8821", 200, 146, "Production API"],
  [4, "GET", "/api/v1/campaigns", 200, 212, "Reporting Sync"],
  [6, "POST", "/api/v1/contacts/bulk", 202, 618, "Production API"],
  [8, "GET", "/api/v1/orders?status=paid", 200, 174, "Reporting Sync"],
  [11, "DELETE", "/api/v1/contacts/ct_4410", 204, 96, "Production API"],
  [13, "GET", "/api/v1/contacts/ct_9902", 404, 42, "Staging Sandbox"],
  [17, "POST", "/api/v1/leads", 201, 158, "Production API"],
  [21, "GET", "/api/v1/automation/runs", 200, 264, "Reporting Sync"],
  [24, "POST", "/api/v1/contacts", 422, 61, "Staging Sandbox"],
  [29, "GET", "/api/v1/contacts", 429, 18, "Reporting Sync"],
  [34, "PUT", "/api/v1/contacts/ct_7781", 200, 133, "Production API"],
  [41, "GET", "/api/v1/orders/or_3312", 200, 109, "Reporting Sync"],
  [47, "POST", "/api/v1/leads/ld_8102/stage", 200, 127, "Production API"],
];

export const API_LOGS: ApiLogEntry[] = LOG_SPECS.map(
  ([minutes, method, endpoint, status, durationMs, keyName], index) => ({
    id: `log_${index}`,
    at: minutesAgo(minutes),
    method,
    endpoint,
    status,
    durationMs,
    keyName,
  }),
);

/**
 * Creates a key and returns the plaintext once.
 *
 * The secret is generated here and handed back exactly once — the caller shows
 * it, the merchant copies it, and from then on only `key.masked` exists. That
 * is the same contract a real API has, and building the UI against anything
 * looser is how a "reveal key" button ends up shipping.
 */
export function createApiKey(input: {
  name: string;
  environment: ApiKey["environment"];
  scopes: string[];
}): { key: ApiKey; secret: string } {
  const prefix = input.environment === "production" ? "mf_live" : "mf_test";
  const body = Array.from({ length: 32 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36)),
  ).join("");
  const tail = body.slice(-4).toUpperCase();

  return {
    secret: `${prefix}_${body}`,
    key: {
      id: `key_${Date.now().toString(36)}`,
      name: input.name,
      environment: input.environment,
      masked: `${prefix}_••••${tail}`,
      createdAt: INTEGRATIONS_NOW,
      lastUsedAt: null,
      scopes: input.scopes,
      status: "active",
      requests24h: 0,
    },
  };
}
