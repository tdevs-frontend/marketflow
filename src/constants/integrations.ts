import type {
  ApiScope,
  HealthStatus,
  IntegrationCategory,
  IntegrationProvider,
  IntegrationStatus,
  WebhookEventGroup,
  WebhookStatus,
} from "@/types/integration";

/**
 * The Integrations module's registry.
 *
 * Three tables and nothing else: what the states are called, which provider
 * adapters exist, and which events and scopes a merchant can pick from. The
 * components read these — none of them carries a `switch` over a provider name,
 * which is what keeps "add Postmark" a data change rather than a UI change.
 */

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

export const INTEGRATION_ROUTES = {
  hub: "/dashboard/integrations",
  whatsapp: "/dashboard/integrations/whatsapp",
  email: "/dashboard/integrations/email",
  sms: "/dashboard/integrations/sms",
  webhooks: "/dashboard/integrations/webhooks",
  api: "/dashboard/integrations/api",
} as const;

/** The strip under the page header, in the order the sidebar lists them. */
export const INTEGRATION_PAGES = [
  { title: "All Integrations", href: INTEGRATION_ROUTES.hub },
  { title: "WhatsApp", href: INTEGRATION_ROUTES.whatsapp },
  { title: "Email", href: INTEGRATION_ROUTES.email },
  { title: "SMS", href: INTEGRATION_ROUTES.sms },
  { title: "Webhooks", href: INTEGRATION_ROUTES.webhooks },
  { title: "API", href: INTEGRATION_ROUTES.api },
] as const;

/** External, and the only outbound link the module has. */
export const INTEGRATION_DOCS_URL = "https://docs.marketflow.app/integrations";

/* -------------------------------------------------------------------------- */
/* Status vocabulary                                                          */
/* -------------------------------------------------------------------------- */

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "Connected",
  needs_setup: "Needs Setup",
  issue: "Issue",
  disabled: "Disabled",
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  warning: "Warning",
  error: "Error",
  disconnected: "Disconnected",
};

export const WEBHOOK_STATUS_LABEL: Record<WebhookStatus, string> = {
  active: "Active",
  paused: "Paused",
  failing: "Failing",
};

export const INTEGRATION_CATEGORIES: {
  value: IntegrationCategory;
  label: string;
}[] = [
  { value: "messaging", label: "Messaging" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "developer", label: "Developer" },
  { value: "analytics", label: "Analytics" },
  { value: "commerce", label: "Commerce" },
];

export function categoryLabel(value: IntegrationCategory): string {
  return (
    INTEGRATION_CATEGORIES.find((item) => item.value === value)?.label ?? value
  );
}

/* -------------------------------------------------------------------------- */
/* Provider catalogue                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Every adapter the connect flow can configure, filtered by `integration` at
 * the call site.
 *
 * Each entry owns its own field list, which is what makes the connect drawer,
 * the settings form and the credential panel generic. A provider whose form
 * cannot be expressed as these five field kinds is a signal that the kind
 * belongs in `CredentialKind`, not that the form belongs in a component.
 */
export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  /* ------------------------------------------------------------ WhatsApp */
  {
    id: "meta-cloud",
    integration: "whatsapp",
    name: "Meta Cloud API",
    description: "Official WhatsApp Business Platform, hosted by Meta.",
    docsLabel: "Meta for Developers → WhatsApp → API Setup",
    recommended: true,
    fields: [
      {
        key: "phoneNumberId",
        label: "Phone Number ID",
        kind: "text",
        placeholder: "109371892043177",
        hint: "Found under WhatsApp → API Setup in your Meta app.",
      },
      {
        key: "businessAccountId",
        label: "Business Account ID",
        kind: "text",
        placeholder: "284910337712004",
      },
      {
        key: "accessToken",
        label: "Access Token",
        kind: "secret",
        placeholder: "EAAG…",
        hint: "Use a permanent System User token, not a temporary one.",
      },
      {
        key: "appSecret",
        label: "App Secret",
        kind: "secret",
        placeholder: "••••••••••••",
        hint: "Signs inbound webhooks so MarketFlow can verify them.",
      },
    ],
  },
  {
    id: "twilio-whatsapp",
    integration: "whatsapp",
    name: "Twilio for WhatsApp",
    description: "Route WhatsApp through an existing Twilio account.",
    fields: [
      { key: "accountSid", label: "Account SID", kind: "text", placeholder: "AC…" },
      { key: "authToken", label: "Auth Token", kind: "secret" },
      {
        key: "sender",
        label: "WhatsApp Sender",
        kind: "text",
        placeholder: "whatsapp:+8801XXXXXXXXX",
      },
    ],
  },
  {
    id: "360dialog",
    integration: "whatsapp",
    name: "360dialog",
    description: "WhatsApp Business Solution Provider with hosted numbers.",
    fields: [
      { key: "apiKey", label: "API Key", kind: "secret" },
      { key: "channelId", label: "Channel ID", kind: "text" },
    ],
  },

  /* --------------------------------------------------------------- Email */
  {
    id: "smtp",
    integration: "email",
    name: "SMTP",
    description: "Any standards-compliant mail server.",
    recommended: true,
    fields: [
      { key: "host", label: "SMTP Host", kind: "text", placeholder: "smtp.company.com" },
      { key: "port", label: "Port", kind: "number", placeholder: "587" },
      {
        key: "encryption",
        label: "Encryption",
        kind: "select",
        options: [
          { value: "tls", label: "STARTTLS" },
          { value: "ssl", label: "SSL/TLS" },
          { value: "none", label: "None" },
        ],
      },
      { key: "username", label: "Username", kind: "text", placeholder: "postmaster@company.com" },
      { key: "password", label: "Password", kind: "secret" },
    ],
  },
  {
    id: "ses",
    integration: "email",
    name: "Amazon SES",
    description: "High-volume sending on AWS, billed per message.",
    fields: [
      { key: "accessKeyId", label: "Access Key ID", kind: "text", placeholder: "AKIA…" },
      { key: "secretAccessKey", label: "Secret Access Key", kind: "secret" },
      {
        key: "region",
        label: "Region",
        kind: "select",
        options: [
          { value: "us-east-1", label: "us-east-1" },
          { value: "eu-west-1", label: "eu-west-1" },
          { value: "ap-south-1", label: "ap-south-1" },
          { value: "ap-southeast-1", label: "ap-southeast-1" },
        ],
      },
    ],
  },
  {
    id: "mailgun",
    integration: "email",
    name: "Mailgun",
    description: "Transactional and bulk email with deliverability tooling.",
    fields: [
      { key: "apiKey", label: "API Key", kind: "secret", placeholder: "key-…" },
      { key: "domain", label: "Sending Domain", kind: "text", placeholder: "mg.company.com" },
      {
        key: "region",
        label: "Region",
        kind: "select",
        options: [
          { value: "us", label: "US" },
          { value: "eu", label: "EU" },
        ],
      },
    ],
  },
  {
    id: "sendgrid",
    integration: "email",
    name: "SendGrid",
    description: "Twilio SendGrid, with a single API key.",
    fields: [
      { key: "apiKey", label: "API Key", kind: "secret", placeholder: "SG.…" },
    ],
  },
  {
    id: "postmark",
    integration: "email",
    name: "Postmark",
    description: "Transactional-first sending with fast delivery.",
    fields: [
      { key: "serverToken", label: "Server Token", kind: "secret" },
      {
        key: "messageStream",
        label: "Message Stream",
        kind: "text",
        placeholder: "broadcast",
        optional: true,
      },
    ],
  },

  /* ----------------------------------------------------------------- SMS */
  {
    id: "twilio",
    integration: "sms",
    name: "Twilio",
    description: "Global SMS coverage with per-country routing.",
    recommended: true,
    fields: [
      { key: "accountSid", label: "Account SID", kind: "text", placeholder: "AC…" },
      { key: "authToken", label: "Auth Token", kind: "secret" },
      { key: "senderId", label: "Sender ID", kind: "text", placeholder: "MRKTFLOW" },
    ],
  },
  {
    id: "vonage",
    integration: "sms",
    name: "Vonage",
    description: "Formerly Nexmo. Strong coverage in South Asia.",
    fields: [
      { key: "apiKey", label: "API Key", kind: "text" },
      { key: "apiSecret", label: "API Secret", kind: "secret" },
      { key: "senderId", label: "Sender ID", kind: "text", placeholder: "MRKTFLOW" },
    ],
  },
  {
    id: "custom-sms",
    integration: "sms",
    name: "Custom Provider",
    description: "Any HTTP gateway that accepts a POST per message.",
    fields: [
      {
        key: "endpoint",
        label: "Gateway Endpoint",
        kind: "url",
        placeholder: "https://sms.provider.com/send",
      },
      { key: "apiKey", label: "API Key", kind: "secret" },
      { key: "senderId", label: "Sender ID", kind: "text" },
    ],
  },

  /* ----------------------------------------------- Analytics & Commerce */
  /*
   * The hub-only integrations. They have no page of their own — there is
   * nothing to monitor beyond "is it connected" — but they go through exactly
   * the same connect flow, which is the point of generating it from `fields`.
   */
  {
    id: "ga4",
    integration: "ga4",
    name: "Google Analytics 4",
    description: "Attribute campaign traffic and conversions in GA4.",
    recommended: true,
    fields: [
      { key: "measurementId", label: "Measurement ID", kind: "text", placeholder: "G-XXXXXXXXXX" },
      {
        key: "apiSecret",
        label: "Measurement Protocol Secret",
        kind: "secret",
        hint: "Admin → Data Streams → Measurement Protocol API secrets.",
      },
    ],
  },
  {
    id: "meta-pixel",
    integration: "meta-pixel",
    name: "Meta Pixel",
    description: "Send conversion events to Meta Ads.",
    fields: [
      { key: "pixelId", label: "Pixel ID", kind: "text", placeholder: "1029384756102938" },
      { key: "accessToken", label: "Conversions API Token", kind: "secret" },
    ],
  },
  {
    id: "shopify",
    integration: "shopify",
    name: "Shopify",
    description: "Sync orders, products and customers from your store.",
    recommended: true,
    fields: [
      { key: "shopDomain", label: "Shop Domain", kind: "text", placeholder: "company.myshopify.com" },
      { key: "adminToken", label: "Admin API Token", kind: "secret", placeholder: "shpat_…" },
    ],
  },
  {
    id: "woocommerce",
    integration: "shopify",
    name: "WooCommerce",
    description: "Sync a WordPress storefront over the REST API.",
    fields: [
      { key: "storeUrl", label: "Store URL", kind: "url", placeholder: "https://company.com" },
      { key: "consumerKey", label: "Consumer Key", kind: "text", placeholder: "ck_…" },
      { key: "consumerSecret", label: "Consumer Secret", kind: "secret" },
    ],
  },
];

export function providersFor(integrationId: string): IntegrationProvider[] {
  return INTEGRATION_PROVIDERS.filter(
    (provider) => provider.integration === integrationId,
  );
}

export function providerById(id: string): IntegrationProvider | undefined {
  return INTEGRATION_PROVIDERS.find((provider) => provider.id === id);
}

/* -------------------------------------------------------------------------- */
/* Webhook events                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Everything MarketFlow can emit, grouped by the module it comes from.
 *
 * Grouped rather than flat because the picker is the only place a merchant
 * sees the whole list, and thirty checkboxes in one column is not a choice, it
 * is a wall.
 */
export const WEBHOOK_EVENT_GROUPS: WebhookEventGroup[] = [
  {
    label: "Contacts",
    icon: "users",
    events: [
      { key: "contact.created", label: "Contact created", description: "A new contact enters the CRM." },
      { key: "contact.updated", label: "Contact updated", description: "Any field on a contact changes." },
      { key: "contact.deleted", label: "Contact deleted", description: "A contact is removed permanently." },
    ],
  },
  {
    label: "Leads",
    icon: "target",
    events: [
      { key: "lead.created", label: "Lead created", description: "A lead is captured from any source." },
      { key: "lead.stage_changed", label: "Lead stage changed", description: "A lead moves along the pipeline." },
    ],
  },
  {
    label: "WhatsApp",
    icon: "message-circle",
    events: [
      { key: "message.received", label: "Message received", description: "An inbound message reaches the inbox." },
      { key: "message.delivered", label: "Message delivered", description: "The provider confirms delivery." },
      { key: "message.read", label: "Message read", description: "The recipient opened the message." },
    ],
  },
  {
    label: "Campaigns",
    icon: "megaphone",
    events: [
      { key: "campaign.sent", label: "Campaign sent", description: "A campaign starts sending." },
      { key: "campaign.completed", label: "Campaign completed", description: "Every message has been dispatched." },
    ],
  },
  {
    label: "Automation",
    icon: "workflow",
    events: [
      { key: "workflow.started", label: "Workflow started", description: "A contact enters a workflow." },
      { key: "workflow.completed", label: "Workflow completed", description: "A contact reaches the end." },
      { key: "workflow.failed", label: "Workflow failed", description: "A step errored and the run stopped." },
    ],
  },
  {
    label: "Commerce",
    icon: "shopping-cart",
    events: [
      { key: "order.created", label: "Order created", description: "A new order is placed." },
      { key: "order.paid", label: "Order paid", description: "Payment for an order clears." },
    ],
  },
  {
    label: "Forms",
    icon: "list-checks",
    events: [
      { key: "form.submitted", label: "Form submitted", description: "A hosted form receives a submission." },
    ],
  },
];

/** Flat lookup, for rendering an event key that arrived on a delivery row. */
export const WEBHOOK_EVENT_LABEL: Record<string, string> = Object.fromEntries(
  WEBHOOK_EVENT_GROUPS.flatMap((group) =>
    group.events.map((event) => [event.key, event.label]),
  ),
);

export const WEBHOOK_EVENT_COUNT = WEBHOOK_EVENT_GROUPS.reduce(
  (total, group) => total + group.events.length,
  0,
);

/* -------------------------------------------------------------------------- */
/* API scopes                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a key can be granted.
 *
 * Nothing here is checked by default in the create form. A key that arrives
 * pre-authorised for everything is the fastest way to hand a reporting script
 * permission to delete contacts.
 */
export const API_SCOPES: ApiScope[] = [
  {
    key: "contacts.read",
    group: "Contacts",
    label: "Contacts Read",
    description: "List and fetch contacts, tags and segments.",
    write: false,
  },
  {
    key: "contacts.write",
    group: "Contacts",
    label: "Contacts Write",
    description: "Create, update and delete contacts.",
    write: true,
  },
  {
    key: "leads.read",
    group: "Leads",
    label: "Leads Read",
    description: "Read the pipeline and lead records.",
    write: false,
  },
  {
    key: "leads.write",
    group: "Leads",
    label: "Leads Write",
    description: "Create leads and move them between stages.",
    write: true,
  },
  {
    key: "campaigns.read",
    group: "Campaigns",
    label: "Campaigns Read",
    description: "Read campaigns and their delivery stats.",
    write: false,
  },
  {
    key: "automation.read",
    group: "Automation",
    label: "Automation Read",
    description: "Read workflows, triggers and run history.",
    write: false,
  },
  {
    key: "orders.read",
    group: "Commerce",
    label: "Orders Read",
    description: "Read orders, line items and payment state.",
    write: false,
  },
];

export const API_SCOPE_LABEL: Record<string, string> = Object.fromEntries(
  API_SCOPES.map((scope) => [scope.key, scope.label]),
);

/**
 * The permission column in the key table.
 *
 * A key with seven scopes cannot list them in a cell, and the thing the reader
 * actually wants to know is whether this key can change anything.
 */
export function scopeSummary(scopes: string[]): string {
  if (scopes.length === 0) return "No access";
  const writes = scopes.some((key) => API_SCOPES.find((s) => s.key === key)?.write);
  return writes ? "Read / Write" : "Read only";
}
