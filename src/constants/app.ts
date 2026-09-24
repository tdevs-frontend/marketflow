export const APP_ROUTES = {
  home: "/",
  features: "/features",
  solutions: "/solutions",
  pricing: "/pricing",
  blog: "/blog",
  contact: "/contact",
  faq: "/faq",
  legalPrivacy: "/legal/privacy",
  legalTerms: "/legal/terms",
  /* Auth lives under one `/auth` segment, so sign-in, sign-up and password
     reset read as one flow in the URL and in the app directory - and so
     anything that guards them can match a single prefix. */
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  dashboard: "/dashboard",
  products: "/dashboard/products",
  categories: "/dashboard/categories",
  orders: "/dashboard/orders",
  inventory: "/dashboard/inventory",
  catalog: "/dashboard/catalog",
  discounts: "/dashboard/discounts",
  /* Marketing module. The flat /dashboard/campaigns and /dashboard/whatsapp
     paths still resolve â they redirect here. */
  marketing: "/dashboard/marketing",
  marketingCampaigns: "/dashboard/marketing/campaigns",
  marketingCampaignNew: "/dashboard/marketing/campaigns/new",
  whatsappInbox: "/dashboard/marketing/whatsapp/inbox",

  /* WhatsApp module */
  whatsappOverview: "/dashboard/marketing/whatsapp",
  whatsappCampaigns: "/dashboard/marketing/whatsapp/campaigns",
  whatsappTemplates: "/dashboard/marketing/whatsapp/templates",
  whatsappContacts: "/dashboard/marketing/whatsapp/contacts",
  whatsappAutomations: "/dashboard/marketing/whatsapp/automations",
  whatsappAnalytics: "/dashboard/marketing/whatsapp/analytics",

  /* Email module */
  emailOverview: "/dashboard/marketing/email",
  emailCampaigns: "/dashboard/marketing/email/campaigns",
  emailTemplates: "/dashboard/marketing/email/templates",
  emailContacts: "/dashboard/marketing/email/contacts",
  emailAutomations: "/dashboard/marketing/email/automations",
  emailAnalytics: "/dashboard/marketing/email/analytics",
  emailSenders: "/dashboard/marketing/email/senders",

  /* SMS module */
  smsOverview: "/dashboard/marketing/sms",
  smsCampaigns: "/dashboard/marketing/sms/campaigns",
  smsTemplates: "/dashboard/marketing/sms/templates",
  smsContacts: "/dashboard/marketing/sms/contacts",
  smsAutomations: "/dashboard/marketing/sms/automations",
  smsAnalytics: "/dashboard/marketing/sms/analytics",
  smsSenders: "/dashboard/marketing/sms/senders",

  /* Social Planner. Calendar is the module's landing page, not an index. */
  socialCalendar: "/dashboard/marketing/social/calendar",
  socialPosts: "/dashboard/marketing/social/posts",
  socialMedia: "/dashboard/marketing/social/media",
  socialAccounts: "/dashboard/marketing/social/accounts",
  socialAnalytics: "/dashboard/marketing/social/analytics",

  /* Audience segmentation, shared across the channels. */
  segments: "/dashboard/marketing/segments",

  /*
   * The Customers module. Five sibling routes grouped as `(customers)` in the
   * app directory so they can share a loading and error boundary â the group
   * is not part of the URL, so these paths are what they have always been.
   *
   * `customerSegments` is deliberately distinct from `segments` above: the
   * same audience builder is reachable from Marketing (as something to send
   * to) and from Customers (as a way to group people), and the two entries
   * keep the sidebar's active state honest on both.
   */
  contacts: "/dashboard/contacts",
  leads: "/dashboard/leads",
  customerSegments: "/dashboard/segments",
  tags: "/dashboard/tags",
  customerJourney: "/dashboard/customer-journey",
  campaigns: "/dashboard/campaigns",
  whatsapp: "/dashboard/whatsapp",
  automation: "/dashboard/automation",
  email: "/dashboard/email",
  sms: "/dashboard/sms",
  analytics: "/dashboard/analytics",
  templates: "/dashboard/templates",
  integrations: "/dashboard/integrations",
  /*
   * Settings, as six routes.
   *
   * It used to be one page with four tabs, which meant the browser could not
   * tell anyone where they were: no deep link to Security, no back button
   * between Profile and Notifications, and nothing to point somebody at when
   * they ask where two-factor lives. Six sections that each answer a different
   * question are six pages.
   */
  settings: "/dashboard/settings",
  settingsProfile: "/dashboard/settings/profile",
  settingsNotifications: "/dashboard/settings/notifications",
  settingsChangePassword: "/dashboard/settings/change-password",
  settingsSecurity: "/dashboard/settings/security",
  settingsBilling: "/dashboard/settings/billing",
  settingsApi: "/dashboard/settings/api",

  /* The Integrations module's own developer pages. Settings â API & Developer
     is the summary and these are the full surfaces; both render the same
     components over the same store, so there is one set of keys. */
  integrationsApi: "/dashboard/integrations/api",
  integrationsWebhooks: "/dashboard/integrations/webhooks",

  /* Workspace configuration. Named here because Settings links across to it:
     workspace name, timezone, currency and sender identity are owned by that
     module, and General used to offer a second editor for two of them. */
  workspaceSettings: "/dashboard/workspace/settings",
  workspaceTeam: "/dashboard/workspace/team",
} as const;

export const AUTH_TOKEN_KEY = "marketflow.token";

/**
 * How many rows a dashboard table shows, everywhere.
 *
 * One number for the whole product rather than a control on each table. The
 * per-table choice it replaces was offered as a Rows dropdown on four tables
 * and hard-coded at 8, 9, 10, 15 or 20 on the rest â so the same list changed
 * height depending on which page you reached it from, and the setting a
 * merchant picked on Contacts meant nothing on Orders.
 *
 * 15 is the working number: enough rows that a page is worth scanning and few
 * enough that the footer stays on screen at a laptop height, which is what
 * makes the pagination usable rather than something you scroll to find.
 */
export const TABLE_PAGE_SIZE = 15;

export const CHANNELS = ["email", "sms", "whatsapp"] as const;

export const LEAD_STAGES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "paused", label: "Paused" },
  { value: "failed", label: "Failed" },
] as const;
