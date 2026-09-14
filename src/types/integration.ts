/**
 * The Integrations module's vocabulary.
 *
 * Every external service MarketFlow talks to is described by the same record,
 * whatever it happens to be: a messaging provider, an SMTP host, an outbound
 * webhook fleet or the merchant's own API keys. That is deliberate — the hub
 * renders a grid of these without knowing what any of them is, and the day a
 * backend adapter appears behind one of them nothing above has to change.
 *
 * The shape is the contract a provider adapter has to satisfy: who it is
 * (`provider`), whether it is usable (`status`), what it was configured with
 * (`credentials`), whether it is working right now (`health`), what breaks if
 * it stops (`usage`), and when it last did anything (`activity`).
 */

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

/** The five integrations that have a page of their own. */
export type IntegrationSlug =
  | "whatsapp"
  | "email"
  | "sms"
  | "social"
  | "webhooks"
  | "api";

/**
 * The filter axis on the hub.
 *
 * Named after what the integration *does* for the merchant rather than after
 * the vendor's own product category — a merchant looking for Twilio is looking
 * for "SMS", not for "CPaaS".
 */
export type IntegrationCategory =
  | "messaging"
  | "email"
  | "sms"
  | "social"
  | "developer"
  | "analytics"
  | "commerce";

/**
 * Connection state, as the merchant experiences it.
 *
 * `needs_setup` and `issue` are kept apart because the fix is different: one
 * has never been configured, the other was working and stopped. Collapsing
 * them into "not working" is how a merchant ends up re-entering credentials
 * that were never wrong.
 */
export type IntegrationStatus = "connected" | "needs_setup" | "issue" | "disabled";

/**
 * The health vocabulary, shared by every integration.
 *
 * Four states, one set of colours, used by WhatsApp, Email, SMS, Webhooks and
 * API alike — a "Warning" has to mean the same thing on all five pages or the
 * indicator stops carrying information.
 */
export type HealthStatus = "healthy" | "warning" | "error" | "disconnected";

/* -------------------------------------------------------------------------- */
/* Providers                                                                  */
/* -------------------------------------------------------------------------- */

/** How a credential is entered, and how it is shown back afterwards. */
export type CredentialKind = "text" | "secret" | "number" | "select" | "url";

export interface CredentialSpec {
  key: string;
  label: string;
  kind: CredentialKind;
  placeholder?: string;
  hint?: string;
  /** Options for `select`. */
  options?: { value: string; label: string }[];
  optional?: boolean;
}

/**
 * A provider adapter, as the UI needs to know it.
 *
 * The field list is the whole point: Twilio wants an Account SID and an Auth
 * Token, Mailgun wants a domain and a region, and a connect form that
 * hard-codes either one cannot hold the other. Every form in this module is
 * generated from `fields`, so adding a provider is adding an entry here.
 */
export interface IntegrationProvider {
  id: string;
  name: string;
  /** One line, shown under the name in the provider picker. */
  description: string;
  /** The `Integration.id` this adapter can serve. */
  integration: string;
  fields: CredentialSpec[];
  /** Where the merchant gets the credentials from. */
  docsLabel?: string;
  /** Marked in the picker — the one most merchants pick. */
  recommended?: boolean;
}

/**
 * A saved credential.
 *
 * `value` is what the API returns after saving, which for a secret is already
 * masked at the source — the raw token never comes back, and this module is
 * built on the assumption that it cannot. `preview` carries the tail so a
 * merchant can tell two keys apart without either being revealed.
 */
export interface CredentialValue {
  key: string;
  label: string;
  kind: CredentialKind;
  /** Display value. Already masked when `kind` is `secret`. */
  value: string;
  hint?: string;
  /** Set on secrets: the four characters the mask ends with. */
  preview?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Health, usage, activity                                                    */
/* -------------------------------------------------------------------------- */

export interface HealthCheck {
  id: string;
  label: string;
  status: HealthStatus;
  /** What the state means, in one line. Shown under the label. */
  detail: string;
  checkedAt: string;
  /** Present on a failing check: the action that resolves it. */
  fixLabel?: string;
}

/**
 * A MarketFlow feature that depends on this connection.
 *
 * Rendered on the detail page and again inside the disconnect confirmation,
 * which is the moment it actually matters: "12 active workflows" is the
 * difference between an informed decision and a support ticket.
 */
export interface IntegrationUsage {
  label: string;
  /** Omitted where the dependency is not countable — an inbox is one inbox. */
  count?: number;
  href: string;
  icon: string;
}

/** The debugging strip: four timestamps that between them explain a failure. */
export interface ConnectionActivity {
  connectedAt: string | null;
  lastSuccessAt: string | null;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  /** The error itself, in the provider's words. */
  lastError: string | null;
}

/** A headline figure on a detail page — messages today, delivery rate, balance. */
export interface IntegrationMetric {
  label: string;
  value: string;
  hint?: string;
  /** Colours the figure. Only ever set where the number is genuinely bad. */
  tone?: "default" | "success" | "warning" | "danger";
}

/* -------------------------------------------------------------------------- */
/* The record itself                                                          */
/* -------------------------------------------------------------------------- */

export interface Integration {
  id: string;
  /**
   * Set on the five integrations deep enough to have a page of their own.
   * A catalogue entry that is only ever connected and monitored from the hub
   * leaves this `null` rather than getting a page with nothing on it.
   */
  slug: IntegrationSlug | null;
  /** The detail route, where `slug` is set. */
  href: string | null;
  name: string;
  description: string;
  category: IntegrationCategory;
  /** Key into `components/ui/icon`. */
  icon: string;
  status: IntegrationStatus;
  /** The selected adapter. `null` until the integration is connected. */
  provider: IntegrationProvider | null;
  /** What the merchant recognises the connection by — a number, a sender, a count. */
  account: string | null;
  /** Events, messages or requests handled today. Summed into the hub's KPI row. */
  eventsToday: number;
  credentials: CredentialValue[];
  health: HealthCheck[];
  usage: IntegrationUsage[];
  activity: ConnectionActivity;
  metrics: IntegrationMetric[];
}

/* -------------------------------------------------------------------------- */
/* Webhooks                                                                   */
/* -------------------------------------------------------------------------- */

export type WebhookStatus = "active" | "paused" | "failing";

export interface WebhookEvent {
  key: string;
  label: string;
  description: string;
}

export interface WebhookEventGroup {
  label: string;
  icon: string;
  events: WebhookEvent[];
}

export interface WebhookDelivery {
  id: string;
  sentAt: string;
  event: string;
  status: "success" | "failed" | "retrying";
  /** `null` where the request timed out with no response at all. */
  httpCode: number | null;
  durationMs: number;
  attempt: number;
  error?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  status: WebhookStatus;
  /** Event keys from `WEBHOOK_EVENT_GROUPS`. */
  events: string[];
  /** Masked at the source, like every other secret in this module. */
  secret: string;
  secretPreview: string;
  /**
   * The signing secret in full.
   *
   * The one secret in the module that is legitimately re-readable: verifying a
   * MarketFlow signature requires having it, so an owner who lost it needs to
   * read it back rather than rotate every consumer. Provider access tokens get
   * no such field — they are rotated, not revealed.
   */
  secretReveal: string;
  createdAt: string;
  lastDeliveryAt: string | null;
  deliveries24h: number;
  failures24h: number;
  successRate: number;
  timeoutSeconds: number;
  retryAttempts: number;
  recentDeliveries: WebhookDelivery[];
}

/* -------------------------------------------------------------------------- */
/* API access                                                                 */
/* -------------------------------------------------------------------------- */

export type ApiEnvironment = "production" | "development";
export type ApiKeyStatus = "active" | "revoked";

/**
 * One permission the merchant can grant a key.
 *
 * Scopes are read and write per resource rather than a single "full access"
 * switch, so the create form can default to the narrowest thing that works.
 */
export interface ApiScope {
  key: string;
  label: string;
  group: string;
  description: string;
  write: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  environment: ApiEnvironment;
  /** `mf_live_••••8F2A` — the only form the key takes after creation. */
  masked: string;
  createdAt: string;
  lastUsedAt: string | null;
  scopes: string[];
  status: ApiKeyStatus;
  requests24h: number;
}

export interface ApiLogEntry {
  id: string;
  at: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;
  status: number;
  durationMs: number;
  keyName: string;
}

export interface ApiUsage {
  requests24h: number;
  successRate: number;
  failed24h: number;
  rateLimit: number;
  rateLimitUsed: number;
  /** 24 hourly buckets, oldest first — the bars on the usage card. */
  hourly: number[];
}
