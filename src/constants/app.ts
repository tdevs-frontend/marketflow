export const APP_ROUTES = {
  home: "/",
  features: "/features",
  pricing: "/pricing",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  products: "/dashboard/products",
  categories: "/dashboard/categories",
  orders: "/dashboard/orders",
  inventory: "/dashboard/inventory",
  catalog: "/dashboard/catalog",
  discounts: "/dashboard/discounts",
  /* Marketing module. The flat /dashboard/campaigns and /dashboard/whatsapp
     paths still resolve — they redirect here. */
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

  /* SMS module */
  smsOverview: "/dashboard/marketing/sms",
  smsCampaigns: "/dashboard/marketing/sms/campaigns",
  smsTemplates: "/dashboard/marketing/sms/templates",
  smsContacts: "/dashboard/marketing/sms/contacts",
  smsAutomations: "/dashboard/marketing/sms/automations",
  smsAnalytics: "/dashboard/marketing/sms/analytics",

  /* Social Planner. Calendar is the module's landing page, not an index. */
  socialCalendar: "/dashboard/marketing/social/calendar",
  socialPosts: "/dashboard/marketing/social/posts",
  socialMedia: "/dashboard/marketing/social/media",
  socialAccounts: "/dashboard/marketing/social/accounts",
  socialAnalytics: "/dashboard/marketing/social/analytics",

  /* Audience segmentation, shared across the channels. */
  segments: "/dashboard/marketing/segments",
  contacts: "/dashboard/contacts",
  leads: "/dashboard/leads",
  campaigns: "/dashboard/campaigns",
  whatsapp: "/dashboard/whatsapp",
  automation: "/dashboard/automation",
  email: "/dashboard/email",
  sms: "/dashboard/sms",
  analytics: "/dashboard/analytics",
  templates: "/dashboard/templates",
  integrations: "/dashboard/integrations",
  settings: "/dashboard/settings",
} as const;

export const AUTH_TOKEN_KEY = "marketflow.token";

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

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
