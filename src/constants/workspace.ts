import { APP_ROUTES } from "./app";
import { INTEGRATION_ROUTES } from "./integrations";
import type {
  AuditModule,
  AuditSeverity,
  AuditStatus,
  MemberStatus,
  PermissionAction,
  PermissionGroup,
} from "@/types/workspace";

/**
 * The Workspace module's registry.
 *
 * Two tables and a vocabulary: what can be permitted, and what can be audited.
 * The components read these — the permission matrix has no knowledge of what a
 * "campaign" is, and the audit filters have no list of modules of their own —
 * which is what keeps adding a module a data change.
 */

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_ROUTES = {
  team: "/dashboard/workspace/team",
  roles: "/dashboard/workspace/roles",
  activity: "/dashboard/workspace/activity",
  settings: "/dashboard/workspace/settings",
} as const;

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                 */
/* -------------------------------------------------------------------------- */

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

export const AUDIT_STATUS_LABEL: Record<AuditStatus, string> = {
  success: "Success",
  warning: "Warning",
  failed: "Failed",
  info: "Info",
};

export const PERMISSION_ACTION_LABEL: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  publish: "Publish",
  export: "Export",
  manage: "Manage",
};

/**
 * The order actions are rendered in, widest-reaching last.
 *
 * A merchant scanning a row reads left to right and the danger increases as
 * they go; `manage` sits at the end because it is the one that implies the
 * others plus configuration.
 */
export const PERMISSION_ACTION_ORDER: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "publish",
  "export",
  "delete",
  "manage",
];

export const AUDIT_MODULE_LABEL: Record<AuditModule, string> = {
  team: "Team",
  roles: "Roles",
  marketing: "Marketing",
  automation: "Automation",
  integrations: "Integrations",
  customers: "Customers",
  commerce: "Commerce",
  settings: "Settings",
  security: "Security",
};

export const AUDIT_SEVERITY_LABEL: Record<AuditSeverity, string> = {
  normal: "Normal",
  high: "High impact",
  security: "Security",
};

/* -------------------------------------------------------------------------- */
/* Permission catalogue                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every permission a workspace role can grant, grouped by MarketFlow module.
 *
 * Each resource declares only the actions that mean something for it. That is
 * the reason this is a table rather than a matrix of every resource against
 * every action: a contact cannot be published, a report cannot be created by
 * hand, and a webhook cannot be exported. Rendering those cells as permanently
 * empty teaches a merchant to stop reading the grid.
 *
 * `href` turns each row into a link to the module it governs, so a role page is
 * never a dead end — "what does Campaigns: Publish actually control" is one
 * click away.
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "customers",
    label: "Customers",
    icon: "users",
    description: "Contact records, the pipeline, and how they are grouped.",
    resources: [
      {
        key: "contacts",
        label: "Contacts",
        actions: ["view", "create", "edit", "delete", "export"],
        href: APP_ROUTES.contacts,
        hint: "Export covers CSV download and API reads of the full list.",
      },
      {
        key: "leads",
        label: "Leads",
        actions: ["view", "create", "edit", "delete", "export"],
        href: APP_ROUTES.leads,
      },
      {
        key: "segments",
        label: "Segments",
        actions: ["view", "create", "edit", "delete"],
        href: APP_ROUTES.customerSegments,
      },
      {
        key: "tags",
        label: "Tags",
        actions: ["view", "create", "edit", "delete"],
        href: APP_ROUTES.tags,
      },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: "megaphone",
    description: "Everything that reaches a customer.",
    resources: [
      {
        key: "campaigns",
        label: "Campaigns",
        actions: ["view", "create", "edit", "publish", "delete"],
        href: APP_ROUTES.marketingCampaigns,
        hint: "Publish is what actually sends. Edit alone cannot.",
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        actions: ["view", "create", "edit", "publish"],
        href: APP_ROUTES.whatsappOverview,
      },
      {
        key: "email",
        label: "Email",
        actions: ["view", "create", "edit", "publish"],
        href: APP_ROUTES.emailOverview,
      },
      {
        key: "sms",
        label: "SMS",
        actions: ["view", "create", "edit", "publish"],
        href: APP_ROUTES.smsOverview,
      },
      {
        key: "social",
        label: "Social",
        actions: ["view", "create", "edit", "publish"],
        href: APP_ROUTES.socialCalendar,
      },
      {
        key: "forms",
        label: "Forms",
        actions: ["view", "create", "edit", "delete"],
        href: "/dashboard/forms",
      },
      {
        key: "landing_pages",
        label: "Landing Pages",
        actions: ["view", "create", "edit", "publish", "delete"],
        href: "/dashboard/landing-pages",
      },
    ],
  },
  {
    key: "automation",
    label: "Automation",
    icon: "workflow",
    description: "Workflows and the events that start them.",
    resources: [
      {
        key: "workflows",
        label: "Workflows",
        actions: ["view", "create", "edit", "publish", "delete"],
        href: APP_ROUTES.automation,
        hint: "Publish activates a workflow against live contacts.",
      },
      {
        key: "automation_templates",
        label: "Templates",
        actions: ["view", "create", "edit", "delete"],
        href: "/dashboard/automation/templates",
      },
      {
        key: "triggers",
        label: "Triggers",
        actions: ["view", "create", "edit", "delete"],
        href: "/dashboard/automation/triggers",
      },
      {
        key: "automation_activity",
        label: "Activity Logs",
        actions: ["view", "export"],
        href: "/dashboard/automation/activity",
      },
    ],
  },
  {
    key: "commerce",
    label: "Commerce",
    icon: "shopping-cart",
    description: "The catalogue and what is sold from it.",
    resources: [
      {
        key: "products",
        label: "Products",
        actions: ["view", "create", "edit", "delete"],
        href: APP_ROUTES.products,
      },
      {
        key: "orders",
        label: "Orders",
        actions: ["view", "edit", "export"],
        href: APP_ROUTES.orders,
        hint: "Orders are never created by hand — they arrive from a store.",
      },
      {
        key: "inventory",
        label: "Inventory",
        actions: ["view", "edit"],
        href: APP_ROUTES.inventory,
      },
      {
        key: "discounts",
        label: "Discounts",
        actions: ["view", "create", "edit", "delete"],
        href: APP_ROUTES.discounts,
      },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: "bar-chart",
    description: "Reporting across every module.",
    resources: [
      {
        key: "analytics",
        label: "Analytics",
        actions: ["view", "export"],
        href: APP_ROUTES.analytics,
      },
      {
        key: "reports",
        label: "Reports",
        actions: ["view", "create", "edit", "export"],
        href: "/dashboard/reports",
      },
      {
        key: "funnel",
        label: "Conversion Funnel",
        actions: ["view", "export"],
        href: "/dashboard/conversion-funnel",
      },
    ],
  },
  {
    key: "integrations",
    label: "Integrations",
    icon: "plug",
    description: "External services, API access and outbound events.",
    resources: [
      {
        key: "integrations",
        label: "Integrations",
        actions: ["view", "manage"],
        href: INTEGRATION_ROUTES.hub,
        hint: "Manage covers connecting, reconnecting and disconnecting.",
      },
      {
        key: "api_keys",
        label: "API Keys",
        actions: ["view", "create", "manage"],
        href: INTEGRATION_ROUTES.api,
        hint: "Creating a key grants whatever scopes the creator picks.",
      },
      {
        key: "webhooks",
        label: "Webhooks",
        actions: ["view", "create", "edit", "delete"],
        href: INTEGRATION_ROUTES.webhooks,
      },
    ],
  },
  {
    key: "workspace",
    label: "Workspace",
    icon: "building",
    description: "Who works here, and what they may reach.",
    resources: [
      {
        key: "team",
        label: "Team Members",
        actions: ["view", "manage"],
        href: WORKSPACE_ROUTES.team,
        hint: "Manage covers inviting, suspending and removing people.",
      },
      {
        key: "roles",
        label: "Roles & Permissions",
        actions: ["view", "manage"],
        href: WORKSPACE_ROUTES.roles,
        hint: "The permission that grants permissions. Treat it as the keys.",
      },
      {
        key: "workspace_activity",
        label: "Workspace Activity",
        actions: ["view", "export"],
        href: WORKSPACE_ROUTES.activity,
      },
      {
        key: "workspace_settings",
        label: "Workspace Settings",
        actions: ["view", "edit"],
        href: WORKSPACE_ROUTES.settings,
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: "settings",
    description: "Money and developer configuration.",
    resources: [
      {
        key: "billing",
        label: "Billing",
        actions: ["view", "manage"],
        href: "/dashboard/settings/billing",
        hint: "Manage covers the plan, the card and the invoices.",
      },
      {
        key: "developer",
        label: "Developer",
        actions: ["view", "manage"],
        href: "/dashboard/settings/api",
      },
    ],
  },
];

/** Flat lookup, for rendering a grant whose group is not in hand. */
export const PERMISSION_RESOURCES = PERMISSION_GROUPS.flatMap(
  (group) => group.resources,
);

export const RESOURCE_LABEL: Record<string, string> = Object.fromEntries(
  PERMISSION_RESOURCES.map((resource) => [resource.key, resource.label]),
);

export function resourceByKey(key: string) {
  return PERMISSION_RESOURCES.find((resource) => resource.key === key);
}

export const TOTAL_PERMISSIONS = PERMISSION_RESOURCES.reduce(
  (total, resource) => total + resource.actions.length,
  0,
);

/**
 * The two permissions that can lock a person out of their own workspace.
 *
 * `roles.manage` is the one that matters most: a member who removes it from
 * their own active role can no longer restore it, and on a workspace with one
 * admin that is unrecoverable without support. The role editor refuses it — see
 * `lockoutWarning` in `lib/workspace-fixtures`.
 */
export const SELF_LOCKOUT_GUARDS = [
  { resource: "roles", action: "manage" as PermissionAction },
  { resource: "team", action: "manage" as PermissionAction },
];

/* -------------------------------------------------------------------------- */
/* Settings options                                                           */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_TIMEZONES = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export const WORKSPACE_CURRENCIES = [
  { value: "BDT", label: "BDT — Bangladeshi Taka" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Pound Sterling" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
];

export const WORKSPACE_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
];

export const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", hint: "14/09/2026" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", hint: "09/14/2026" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", hint: "2026-09-14" },
  { value: "D MMM YYYY", label: "D MMM YYYY", hint: "14 Sep 2026" },
];

export const INDUSTRIES = [
  "Retail & E-commerce",
  "Fashion & Apparel",
  "Health & Beauty",
  "Food & Beverage",
  "Electronics",
  "Education",
  "Professional Services",
  "Other",
];

export const COUNTRIES = [
  "Bangladesh",
  "India",
  "United Arab Emirates",
  "Singapore",
  "United Kingdom",
  "United States",
];

export const DUPLICATE_HANDLING_OPTIONS = [
  {
    value: "merge",
    label: "Merge with existing",
    hint: "Recommended — updates the existing contact in place.",
  },
  {
    value: "duplicate",
    label: "Create a duplicate",
    hint: "Keeps both records. Leaves cleanup to you.",
  },
  { value: "ask", label: "Ask before importing", hint: "Prompts on every clash." },
];

export const LEAD_SOURCES = [
  "Website form",
  "WhatsApp",
  "Manual entry",
  "CSV import",
  "API",
  "Social",
];

/** Logo upload constraints, shown next to the field and enforced on select. */
export const LOGO_RULES = {
  maxBytes: 2 * 1024 * 1024,
  types: ["image/png", "image/jpeg", "image/svg+xml"],
  label: "PNG, JPG or SVG · up to 2 MB · at least 256×256",
};
