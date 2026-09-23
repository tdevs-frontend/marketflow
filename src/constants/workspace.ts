import { APP_ROUTES } from "./app";
import { INTEGRATION_ROUTES } from "./integrations";
import type {
  AuditModule,
  AuditSeverity,
  AuditStatus,
  MemberStatus,
  PermissionAction,
  PermissionGroup,
  PermissionPreset,
  ResourceAction,
  RoleGrants,
} from "@/types/workspace";

/**
 * The Workspace module's registry.
 *
 * Two tables and a vocabulary: what can be permitted, and what can be audited.
 * The components read these - the permission matrix has no knowledge of what a
 * "campaign" is, and the audit filters have no list of modules of their own -
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
  pause: "Pause",
  export: "Export",
  manage: "Manage",
  assign: "Assign",
  refund: "Refund",
  retry: "Retry",
  approve: "Approve",
  bulk_edit: "Bulk edit",
  view_activity: "View activity",
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
  "view_activity",
  "create",
  "edit",
  "assign",
  "approve",
  "publish",
  "pause",
  "retry",
  "bulk_edit",
  "refund",
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
 * never a dead end - "what does Campaigns: Publish actually control" is one
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
        href: APP_ROUTES.contacts,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "delete",
            advanced: true,
            requires: ["edit"],
            sensitive:
              "Deleted contacts are removed from every segment, campaign and report that referenced them.",
          },
          {
            action: "export",
            advanced: true,
            sensitive:
              "Downloads personal data. Exports are recorded in the audit trail with the filter that produced them.",
          },
          {
            action: "bulk_edit",
            advanced: true,
            requires: ["edit"],
            sensitive: "Changes thousands of records in one action, with no per-record review.",
          },
        ],
      },
      {
        key: "leads",
        label: "Leads",
        href: APP_ROUTES.leads,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "assign", requires: ["edit"] },
          {
            action: "delete",
            advanced: true,
            requires: ["edit"],
            sensitive: "Removes the lead and its pipeline history permanently.",
          },
          {
            action: "export",
            advanced: true,
            sensitive: "Downloads pipeline data including contact details.",
          },
        ],
      },
      {
        key: "segments",
        label: "Segments",
        href: APP_ROUTES.customerSegments,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
      },
      {
        key: "tags",
        label: "Tags",
        href: APP_ROUTES.tags,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
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
        href: APP_ROUTES.marketingCampaigns,
        hint: "Publish is what actually sends. Edit alone cannot.",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive:
              "Sends to real customers. A published campaign cannot be recalled once delivery starts.",
          },
          { action: "pause", advanced: true, requires: ["edit"] },
          {
            action: "approve",
            advanced: true,
            requires: ["edit"],
            sensitive: "Signs off someone else's campaign for sending.",
          },
          {
            action: "delete",
            advanced: true,
            requires: ["edit"],
            sensitive: "Removes the campaign and its performance history.",
          },
        ],
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        href: APP_ROUTES.whatsappOverview,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive: "Sends WhatsApp messages, which are billed per conversation.",
          },
        ],
      },
      {
        key: "email",
        label: "Email",
        href: APP_ROUTES.emailOverview,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive: "Sends email to real inboxes and counts against your sending reputation.",
          },
        ],
      },
      {
        key: "sms",
        label: "SMS",
        href: APP_ROUTES.smsOverview,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive: "Sends SMS, which is billed per message.",
          },
        ],
      },
      {
        key: "social",
        label: "Social",
        href: APP_ROUTES.socialCalendar,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive: "Posts publicly to your connected social accounts.",
          },
        ],
      },
      {
        key: "forms",
        label: "Forms",
        href: "/dashboard/forms",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
      },
      {
        key: "landing_pages",
        label: "Landing Pages",
        href: "/dashboard/landing-pages",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive: "Makes the page publicly reachable on your domain.",
          },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
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
        href: APP_ROUTES.automation,
        hint: "Publish activates a workflow against live contacts.",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "publish",
            advanced: true,
            requires: ["edit"],
            sensitive:
              "Activates the workflow against live contacts. It starts sending immediately.",
          },
          { action: "pause", advanced: true, requires: ["edit"] },
          {
            action: "delete",
            advanced: true,
            requires: ["edit"],
            sensitive: "Removes the workflow and its run history.",
          },
        ],
      },
      {
        key: "automation_templates",
        label: "Templates",
        href: "/dashboard/automation/templates",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
      },
      {
        key: "triggers",
        label: "Triggers",
        href: "/dashboard/automation/triggers",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
      },
      {
        key: "automation_activity",
        label: "Activity Logs",
        href: "/dashboard/automation/activity",
        actions: [
          { action: "view_activity" },
          {
            action: "retry",
            advanced: true,
            requires: ["view_activity"],
            sensitive: "Re-runs failed steps, which can re-send messages a contact already received.",
          },
          { action: "export", advanced: true },
        ],
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
        href: APP_ROUTES.products,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
      },
      {
        key: "orders",
        label: "Orders",
        href: APP_ROUTES.orders,
        hint: "Orders arrive from a store - they are never created by hand.",
        actions: [
          { action: "view" },
          { action: "edit", requires: ["view"] },
          {
            action: "refund",
            advanced: true,
            requires: ["edit"],
            sensitive: "Moves real money back to the customer. Refunds cannot be reversed.",
          },
          {
            action: "export",
            advanced: true,
            sensitive: "Downloads order and customer data.",
          },
        ],
      },
      {
        key: "inventory",
        label: "Inventory",
        href: APP_ROUTES.inventory,
        actions: [
          { action: "view" },
          { action: "edit", requires: ["view"] },
          {
            action: "bulk_edit",
            advanced: true,
            requires: ["edit"],
            sensitive: "Adjusts stock across many products at once.",
          },
        ],
      },
      {
        key: "discounts",
        label: "Discounts",
        href: APP_ROUTES.discounts,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          {
            action: "delete",
            advanced: true,
            requires: ["edit"],
            sensitive: "Invalidates codes customers may already be holding.",
          },
        ],
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
        href: APP_ROUTES.analytics,
        actions: [
          { action: "view" },
          { action: "export", advanced: true },
        ],
      },
      {
        key: "reports",
        label: "Reports",
        href: "/dashboard/reports",
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "export", advanced: true },
        ],
      },
      {
        key: "funnel",
        label: "Conversion Funnel",
        href: "/dashboard/conversion-funnel",
        actions: [{ action: "view" }, { action: "export", advanced: true }],
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
        href: INTEGRATION_ROUTES.hub,
        actions: [
          { action: "view" },
          {
            action: "manage",
            advanced: true,
            requires: ["view"],
            sensitive:
              "Connecting or disconnecting an integration can stop every campaign and workflow that depends on it.",
          },
        ],
      },
      {
        key: "api_keys",
        label: "API Keys",
        href: INTEGRATION_ROUTES.api,
        actions: [
          { action: "view" },
          {
            action: "create",
            advanced: true,
            sensitive:
              "A new key can be granted any scope the creator holds, and works outside this dashboard.",
          },
          {
            action: "manage",
            advanced: true,
            requires: ["view"],
            sensitive: "Revoking a key breaks every application still using it.",
          },
        ],
      },
      {
        key: "webhooks",
        label: "Webhooks",
        href: INTEGRATION_ROUTES.webhooks,
        actions: [
          { action: "view" },
          { action: "create" },
          { action: "edit", requires: ["view"] },
          { action: "delete", advanced: true, requires: ["edit"] },
        ],
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
        href: WORKSPACE_ROUTES.team,
        actions: [
          { action: "view" },
          {
            action: "manage",
            advanced: true,
            requires: ["view"],
            sensitive:
              "Covers inviting, suspending and removing people, and consumes seats on your plan.",
          },
        ],
      },
      {
        key: "roles",
        label: "Roles & Permissions",
        href: WORKSPACE_ROUTES.roles,
        hint: "The permission that grants permissions. Treat it as the keys.",
        actions: [
          { action: "view" },
          {
            action: "manage",
            advanced: true,
            requires: ["view"],
            sensitive:
              "Anyone with this can grant themselves every other permission in the workspace.",
          },
        ],
      },
      {
        key: "workspace_activity",
        label: "Workspace Activity",
        href: WORKSPACE_ROUTES.activity,
        actions: [
          { action: "view" },
          {
            action: "export",
            advanced: true,
            sensitive: "Downloads the audit trail, including who accessed what.",
          },
        ],
      },
      {
        key: "workspace_settings",
        label: "Workspace Settings",
        href: WORKSPACE_ROUTES.settings,
        actions: [
          { action: "view" },
          {
            action: "edit",
            advanced: true,
            requires: ["view"],
            sensitive: "Changes defaults that apply to everyone in the workspace.",
          },
        ],
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
        href: "/dashboard/settings/billing",
        actions: [
          { action: "view" },
          {
            action: "manage",
            advanced: true,
            requires: ["view"],
            sensitive: "Covers the plan, the payment card and the invoices.",
          },
        ],
      },
      {
        key: "developer",
        label: "Developer",
        href: "/dashboard/settings/api",
        actions: [
          { action: "view" },
          { action: "manage", advanced: true, requires: ["view"] },
        ],
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

/* -------------------------------------------------------------------------- */
/* Action lookup, tiers and dependencies                                      */
/* -------------------------------------------------------------------------- */

export function actionSpec(
  resourceKey: string,
  action: PermissionAction,
): ResourceAction | undefined {
  return resourceByKey(resourceKey)?.actions.find((item) => item.action === action);
}

export function isSensitive(resourceKey: string, action: PermissionAction): boolean {
  return Boolean(actionSpec(resourceKey, action)?.sensitive);
}

export function isAdvanced(resourceKey: string, action: PermissionAction): boolean {
  return Boolean(actionSpec(resourceKey, action)?.advanced);
}

/**
 * Everything that must also be granted for `action` to be exercisable.
 *
 * `view` is folded in here rather than repeated on forty entries in the
 * catalogue: nothing can be done to a resource that cannot be seen, and writing
 * that out per action is forty chances to forget it.
 *
 * The result is transitive - Publish requires Edit, and Edit requires View, so
 * enabling Publish turns on all three in one action rather than making the
 * merchant discover the chain a checkbox at a time.
 */
export function requiredFor(
  resourceKey: string,
  action: PermissionAction,
): PermissionAction[] {
  const seen = new Set<PermissionAction>();

  const walk = (current: PermissionAction) => {
    const direct = actionSpec(resourceKey, current)?.requires ?? [];
    const all = current === "view" ? direct : [...direct, "view" as PermissionAction];

    for (const requirement of all) {
      if (requirement === action || seen.has(requirement)) continue;
      seen.add(requirement);
      walk(requirement);
    }
  };

  walk(action);
  return [...seen];
}

/**
 * Everything that stops making sense once `action` is revoked.
 *
 * The mirror of `requiredFor`: turning off View on Contacts has to take Create,
 * Edit, Delete and Export with it, because a role that can edit what it cannot
 * see is a role that will fail at the first request.
 */
export function dependentsOf(
  resourceKey: string,
  action: PermissionAction,
): PermissionAction[] {
  const resource = resourceByKey(resourceKey);
  if (!resource) return [];

  return resource.actions
    .filter(
      (item) =>
        item.action !== action &&
        requiredFor(resourceKey, item.action).includes(action),
    )
    .map((item) => item.action);
}

/**
 * A grant map with dependencies resolved.
 *
 * Every toggle goes through here, so an incoherent combination is never held in
 * state - not caught at save time, not rejected by the server, simply not
 * reachable. Enabling pulls prerequisites up with it; disabling pushes
 * dependents down.
 *
 * Returns the new map plus the actions it changed on the caller's behalf, so
 * the UI can say what else it did rather than silently ticking three more boxes.
 */
export function applyDependencies(
  grants: Record<string, PermissionAction[]>,
  resourceKey: string,
  action: PermissionAction,
  next: boolean,
): {
  grants: Record<string, PermissionAction[]>;
  cascaded: PermissionAction[];
} {
  const current = new Set(grants[resourceKey] ?? []);
  const cascaded: PermissionAction[] = [];

  if (next) {
    current.add(action);
    for (const requirement of requiredFor(resourceKey, action)) {
      if (current.has(requirement)) continue;
      current.add(requirement);
      cascaded.push(requirement);
    }
  } else {
    current.delete(action);
    for (const dependent of dependentsOf(resourceKey, action)) {
      if (!current.has(dependent)) continue;
      current.delete(dependent);
      cascaded.push(dependent);
    }
  }

  return {
    grants: { ...grants, [resourceKey]: [...current] },
    cascaded,
  };
}

/** Reads `resource.action` as the pair it encodes. Used by the audit trail. */
export const permissionKey = (resource: string, action: PermissionAction) =>
  `${resource}.${action}`;

export function permissionLabel(resource: string, action: PermissionAction): string {
  return `${RESOURCE_LABEL[resource] ?? resource} · ${PERMISSION_ACTION_LABEL[action]}`;
}

/**
 * The two permissions that can lock a person out of their own workspace.
 *
 * `roles.manage` is the one that matters most: a member who removes it from
 * their own active role can no longer restore it, and on a workspace with one
 * admin that is unrecoverable without support. The role editor refuses it - see
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
  { value: "BDT", label: "BDT - Bangladeshi Taka" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Pound Sterling" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AED", label: "AED - UAE Dirham" },
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
    hint: "Recommended - updates the existing contact in place.",
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

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

/** Grants for a set of resources, using each resource's own action list. */
function preset(rules: Record<string, PermissionAction[] | "*" | "read">): RoleGrants {
  const out: RoleGrants = {};

  for (const [key, value] of Object.entries(rules)) {
    const resource = resourceByKey(key);
    if (!resource) continue;

    const available = resource.actions.map((item) => item.action);
    out[key] =
      value === "*"
        ? available
        : value === "read"
          ? available.filter(
              (action) => action === "view" || action === "view_activity",
            )
          : value.filter((action) => available.includes(action));
  }

  return out;
}

/**
 * Starting points for a custom role.
 *
 * These are the shapes merchants ask for in their own words - "someone who runs
 * marketing", "someone who only reads" - so the create flow can hand over a
 * working permission set in one click. Building one from a hundred empty
 * checkboxes is a job nobody finishes correctly, and the result is usually
 * either too wide or missing a prerequisite.
 *
 * Deliberately fewer than the system roles: a preset is a starting point to be
 * edited, not a role in its own right. Anything that should be assignable
 * as-is belongs in `WORKSPACE_ROLES`.
 */
export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: "preset_empty",
    label: "Start from scratch",
    description: "No permissions. Build the role up from nothing.",
    icon: "list-checks",
    grants: {},
  },
  {
    id: "preset_marketing",
    label: "Marketing",
    description: "Campaigns and channels, without publishing or deletion.",
    icon: "megaphone",
    grants: preset({
      contacts: ["view", "create", "edit"],
      segments: ["view", "create", "edit"],
      tags: "*",
      campaigns: ["view", "create", "edit"],
      whatsapp: ["view", "create", "edit"],
      email: ["view", "create", "edit"],
      sms: ["view", "create", "edit"],
      social: ["view", "create", "edit"],
      forms: ["view", "create", "edit"],
      landing_pages: ["view", "create", "edit"],
      analytics: ["view"],
      reports: ["view"],
    }),
  },
  {
    id: "preset_sales",
    label: "Sales",
    description: "The pipeline: leads, contacts and the conversations behind them.",
    icon: "target",
    grants: preset({
      contacts: ["view", "create", "edit"],
      leads: ["view", "create", "edit", "assign"],
      segments: ["view"],
      tags: ["view", "create"],
      whatsapp: ["view", "create"],
      campaigns: ["view"],
      orders: ["view"],
      products: ["view"],
      analytics: ["view"],
      funnel: ["view"],
    }),
  },
  {
    id: "preset_support",
    label: "Support",
    description: "The inbox and the customer records behind it.",
    icon: "inbox",
    grants: preset({
      contacts: ["view", "edit"],
      leads: ["view"],
      tags: ["view"],
      whatsapp: ["view", "create"],
      orders: ["view"],
      products: ["view"],
    }),
  },
  {
    id: "preset_analytics",
    label: "Analytics",
    description: "Read and export reporting. Changes nothing operational.",
    icon: "bar-chart",
    grants: preset({
      contacts: ["view", "export"],
      leads: ["view", "export"],
      campaigns: ["view"],
      workflows: ["view"],
      automation_activity: ["view_activity", "export"],
      orders: ["view", "export"],
      analytics: "*",
      reports: "*",
      funnel: "*",
      workspace_activity: ["view", "export"],
    }),
  },
  {
    id: "preset_readonly",
    label: "Read Only",
    description: "View access across every module. No changes anywhere.",
    icon: "eye",
    grants: preset(
      Object.fromEntries(
        PERMISSION_RESOURCES.map((resource) => [resource.key, "read" as const]),
      ),
    ),
  },
  {
    id: "preset_full",
    label: "Full Workspace Management",
    description: "Everything except billing. Treat it as a second administrator.",
    icon: "shield-check",
    grants: preset({
      ...Object.fromEntries(
        PERMISSION_RESOURCES.filter((resource) => resource.key !== "billing").map(
          (resource) => [resource.key, "*" as const],
        ),
      ),
      billing: ["view"],
    }),
  },
];

export function presetById(id: string): PermissionPreset | undefined {
  return PERMISSION_PRESETS.find((item) => item.id === id);
}
