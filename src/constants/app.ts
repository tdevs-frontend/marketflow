export const APP_ROUTES = {
  home: "/",
  features: "/features",
  pricing: "/pricing",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  products: "/dashboard/products",
  orders: "/dashboard/orders",
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
