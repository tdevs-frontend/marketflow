import { APP_ROUTES } from "@/constants/app";
import { INTEGRATION_ROUTES } from "@/constants/integrations";
import {
  PERMISSION_ACTION_LABEL,
  PERMISSION_GROUPS,
  PERMISSION_RESOURCES,
  WORKSPACE_ROUTES,
  isSensitive,
} from "@/constants/workspace";
import {
  WORKSPACE_NOW,
  daysAgo,
  hoursAgo,
  minutesAgo,
} from "@/lib/workspace-clock";
import type {
  MemberStatus,
  PermissionAction,
  PermissionDelta,
  RiskLevel,
  RoleActivityEvent,
  RoleGrants,
  WorkspaceAuditEvent,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSettings,
} from "@/types/workspace";

/**
 * The Workspace module's mock data.
 *
 * One workspace, told consistently: the member who published the campaign in
 * the audit trail is the Marketing Manager in the team table, the role she was
 * moved to is a role that exists in the role list, and the counts on the KPI
 * strip are derived from the rows rather than typed beside them.
 *
 * Replacing this file with the real endpoints should be the only change the
 * components need. Nothing below is imported for its shape alone, and every
 * derived figure is computed here.
 */

export const WORKSPACE_ID = "ws_marketflow";

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

/** Every action on every resource. The Owner's grant, and nobody else's. */
function allGrants(): RoleGrants {
  return Object.fromEntries(
    PERMISSION_RESOURCES.map((resource) => [
      resource.key,
      resource.actions.map((item) => item.action),
    ]),
  );
}

/**
 * Grants built from a list of rules rather than typed out resource by resource.
 *
 * `"*"` means every action the resource supports, which keeps a role's intent
 * readable — "Marketing Manager has everything on campaigns" — and means a
 * resource that gains an action later does not silently leave a system role
 * behind. Anything narrower lists its actions.
 */
function grants(rules: Record<string, PermissionAction[] | "*">): RoleGrants {
  const out: RoleGrants = {};

  for (const [key, value] of Object.entries(rules)) {
    const resource = PERMISSION_RESOURCES.find((item) => item.key === key);
    if (!resource) continue;

    const available = resource.actions.map((item) => item.action);
    out[key] = value === "*" ? available : value.filter((a) => available.includes(a));
  }

  return out;
}

/** Read access to everything a role can see, with no ability to change it. */
function readOnly(keys: string[]): RoleGrants {
  return grants(Object.fromEntries(keys.map((key) => [key, ["view"]])));
}

export const WORKSPACE_ROLES: WorkspaceRole[] = [
  {
    id: "role_owner",
    name: "Owner",
    description: "Full workspace access, including billing and ownership.",
    type: "system",
    merchantRole: "owner",
    grants: allGrants(),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(420),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_admin",
    name: "Workspace Admin",
    description:
      "Manages people, roles, settings and every module. Not a platform administrator.",
    type: "system",
    merchantRole: "admin",
    grants: grants({
      contacts: "*",
      leads: "*",
      segments: "*",
      tags: "*",
      campaigns: "*",
      whatsapp: "*",
      email: "*",
      sms: "*",
      social: "*",
      forms: "*",
      landing_pages: "*",
      workflows: "*",
      automation_templates: "*",
      triggers: "*",
      automation_activity: "*",
      products: "*",
      orders: "*",
      inventory: "*",
      discounts: "*",
      analytics: "*",
      reports: "*",
      funnel: "*",
      integrations: "*",
      api_keys: "*",
      webhooks: "*",
      team: "*",
      roles: "*",
      workspace_activity: "*",
      workspace_settings: "*",
      /* Billing stays with the Owner. An admin can read the plan and cannot
         change the card — that is the one thing ownership still means. */
      billing: ["view"],
      developer: "*",
    }),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(96),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_manager",
    name: "Marketing Manager",
    description: "Runs campaigns, automation and reporting across every channel.",
    type: "system",
    merchantRole: "manager",
    grants: grants({
      contacts: ["view", "create", "edit", "export"],
      leads: ["view", "create", "edit"],
      segments: "*",
      tags: "*",
      campaigns: "*",
      whatsapp: "*",
      email: "*",
      sms: "*",
      social: "*",
      forms: "*",
      landing_pages: "*",
      workflows: "*",
      automation_templates: "*",
      triggers: ["view", "create", "edit"],
      automation_activity: ["view"],
      products: ["view"],
      orders: ["view"],
      discounts: ["view", "create", "edit"],
      analytics: "*",
      reports: "*",
      funnel: "*",
      integrations: ["view"],
      workspace_activity: ["view"],
    }),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(41),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_sales",
    name: "Sales Agent",
    description: "Works the pipeline: leads, contacts and the conversations behind them.",
    type: "system",
    merchantRole: "sales",
    grants: grants({
      contacts: ["view", "create", "edit"],
      leads: ["view", "create", "edit"],
      segments: ["view"],
      tags: ["view", "create"],
      whatsapp: ["view", "create"],
      campaigns: ["view"],
      orders: ["view"],
      products: ["view"],
      analytics: ["view"],
      funnel: ["view"],
    }),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(120),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_support",
    name: "Support Agent",
    description: "Answers the inbox and keeps customer records accurate.",
    type: "system",
    merchantRole: "agent",
    grants: grants({
      contacts: ["view", "edit"],
      leads: ["view"],
      tags: ["view"],
      whatsapp: ["view", "create"],
      orders: ["view"],
      products: ["view"],
    }),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(210),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_analyst",
    name: "Analyst",
    description: "Reads and exports reporting. Changes nothing operational.",
    type: "system",
    merchantRole: "analyst",
    grants: grants({
      contacts: ["view", "export"],
      leads: ["view", "export"],
      segments: ["view"],
      campaigns: ["view"],
      workflows: ["view"],
      automation_activity: ["view", "export"],
      orders: ["view", "export"],
      products: ["view"],
      analytics: ["view", "export"],
      reports: "*",
      funnel: ["view", "export"],
      workspace_activity: ["view", "export"],
    }),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(64),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_viewer",
    name: "Viewer",
    description: "Read-only access to customers, marketing and reporting.",
    type: "system",
    merchantRole: "viewer",
    grants: readOnly([
      "contacts",
      "leads",
      "segments",
      "campaigns",
      "workflows",
      "analytics",
      "reports",
    ]),
    status: "active",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(420),
    createdBy: null,
    updatedBy: null,
  },
  {
    id: "role_custom_junior",
    name: "Junior Marketer",
    description:
      "Marketing Manager without publishing, deletion or contact export.",
    type: "custom",
    grants: grants({
      contacts: ["view", "create", "edit"],
      leads: ["view"],
      segments: ["view", "create", "edit"],
      tags: "*",
      campaigns: ["view", "create", "edit"],
      whatsapp: ["view", "create", "edit"],
      email: ["view", "create", "edit"],
      sms: ["view", "create", "edit"],
      social: ["view", "create", "edit"],
      forms: ["view", "create", "edit"],
      landing_pages: ["view", "create", "edit"],
      workflows: ["view", "create", "edit"],
      automation_templates: ["view", "create"],
      analytics: ["view"],
      reports: ["view"],
    }),
    status: "active",
    createdAt: daysAgo(58),
    updatedAt: daysAgo(12),
    createdBy: "Sagor Khan",
    updatedBy: "Sagor Khan",
  },
];

export function roleById(id: string): WorkspaceRole | undefined {
  return WORKSPACE_ROLES.find((role) => role.id === id);
}

export function roleName(id: string): string {
  return roleById(id)?.name ?? "Unknown role";
}

/** Grant count, for the role list's "23 of 61 permissions" line. */
export function grantCount(grants: RoleGrants): number {
  return Object.values(grants).reduce((total, actions) => total + actions.length, 0);
}

export function hasGrant(
  grants: RoleGrants,
  resource: string,
  action: PermissionAction,
): boolean {
  return grants[resource]?.includes(action) ?? false;
}

/* -------------------------------------------------------------------------- */
/* Members                                                                    */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    id: "mem_nabila",
    name: "Sagor Khan",
    email: "nabila@marketflow.app",
    roleId: "role_owner",
    status: "active",
    lastActiveAt: minutesAgo(3),
    joinedAt: daysAgo(420),
    invitedAt: daysAgo(420),
    invitedById: null,
    ownership: { leads: 18, campaigns: 6, workflows: 4, contacts: 212 },
    isCurrentUser: true,
  },
  {
    id: "mem_tanvir",
    name: "Tanvir Ahmed",
    email: "tanvir@marketflow.app",
    roleId: "role_admin",
    status: "active",
    lastActiveAt: minutesAgo(22),
    joinedAt: daysAgo(388),
    invitedAt: daysAgo(390),
    invitedById: "mem_nabila",
    ownership: { leads: 9, campaigns: 2, workflows: 6, contacts: 96 },
  },
  {
    id: "mem_sarah",
    name: "Sarah Ahmed",
    email: "sarah@marketflow.app",
    roleId: "role_manager",
    status: "active",
    lastActiveAt: minutesAgo(8),
    joinedAt: daysAgo(264),
    invitedAt: daysAgo(266),
    invitedById: "mem_nabila",
    ownership: { leads: 12, campaigns: 3, workflows: 2, contacts: 148 },
  },
  {
    id: "mem_rafi",
    name: "Rafi Hossain",
    email: "rafi@marketflow.app",
    roleId: "role_manager",
    status: "active",
    lastActiveAt: hoursAgo(4),
    joinedAt: daysAgo(196),
    invitedAt: daysAgo(198),
    invitedById: "mem_tanvir",
    ownership: { leads: 6, campaigns: 4, workflows: 3, contacts: 74 },
  },
  {
    id: "mem_priya",
    name: "Priya Das",
    email: "priya@marketflow.app",
    roleId: "role_custom_junior",
    status: "active",
    lastActiveAt: hoursAgo(2),
    joinedAt: daysAgo(52),
    invitedAt: daysAgo(54),
    invitedById: "mem_sarah",
    ownership: { leads: 0, campaigns: 2, workflows: 0, contacts: 31 },
  },
  {
    id: "mem_imran",
    name: "Imran Kabir",
    email: "imran@marketflow.app",
    roleId: "role_custom_junior",
    status: "active",
    lastActiveAt: daysAgo(1),
    joinedAt: daysAgo(44),
    invitedAt: daysAgo(46),
    invitedById: "mem_sarah",
    ownership: { leads: 0, campaigns: 1, workflows: 0, contacts: 12 },
  },
  {
    id: "mem_mehedi",
    name: "Mehedi Hasan",
    email: "mehedi@marketflow.app",
    roleId: "role_sales",
    status: "active",
    lastActiveAt: minutesAgo(41),
    joinedAt: daysAgo(158),
    invitedAt: daysAgo(160),
    invitedById: "mem_tanvir",
    ownership: { leads: 34, campaigns: 0, workflows: 0, contacts: 206 },
  },
  {
    id: "mem_farhana",
    name: "Farhana Islam",
    email: "farhana@marketflow.app",
    roleId: "role_sales",
    status: "active",
    lastActiveAt: hoursAgo(6),
    joinedAt: daysAgo(132),
    invitedAt: daysAgo(134),
    invitedById: "mem_tanvir",
    ownership: { leads: 28, campaigns: 0, workflows: 0, contacts: 174 },
  },
  {
    id: "mem_arif",
    name: "Arif Chowdhury",
    email: "arif@marketflow.app",
    roleId: "role_support",
    status: "active",
    lastActiveAt: minutesAgo(12),
    joinedAt: daysAgo(88),
    invitedAt: daysAgo(90),
    invitedById: "mem_tanvir",
    ownership: { leads: 0, campaigns: 0, workflows: 0, contacts: 58 },
  },
  {
    id: "mem_shirin",
    name: "Shirin Akter",
    email: "shirin@marketflow.app",
    roleId: "role_analyst",
    status: "suspended",
    lastActiveAt: daysAgo(27),
    joinedAt: daysAgo(212),
    invitedAt: daysAgo(214),
    invitedById: "mem_nabila",
    ownership: { leads: 0, campaigns: 0, workflows: 0, contacts: 0 },
  },
  {
    id: "mem_invite_zayed",
    name: "Zayed Karim",
    email: "zayed@marketflow.app",
    roleId: "role_sales",
    status: "invited",
    lastActiveAt: null,
    joinedAt: null,
    invitedAt: daysAgo(2),
    invitedById: "mem_tanvir",
    ownership: { leads: 0, campaigns: 0, workflows: 0, contacts: 0 },
  },
  {
    id: "mem_invite_lamia",
    name: "Lamia Sultana",
    email: "lamia@marketflow.app",
    roleId: "role_viewer",
    status: "invited",
    lastActiveAt: null,
    joinedAt: null,
    invitedAt: hoursAgo(5),
    invitedById: "mem_sarah",
    ownership: { leads: 0, campaigns: 0, workflows: 0, contacts: 0 },
  },
];

export function memberById(id: string): WorkspaceMember | undefined {
  return WORKSPACE_MEMBERS.find((member) => member.id === id);
}

export const CURRENT_MEMBER =
  WORKSPACE_MEMBERS.find((member) => member.isCurrentUser) ?? WORKSPACE_MEMBERS[0];

/** Seats on the plan. Drives the "Seats used" KPI and the invite limit check. */
export const SEAT_LIMIT = 20;

export interface MemberTotals {
  total: number;
  active: number;
  invited: number;
  suspended: number;
  seatsUsed: number;
  seatLimit: number;
}

export function memberTotals(
  members: WorkspaceMember[] = WORKSPACE_MEMBERS,
): MemberTotals {
  const count = (status: MemberStatus) =>
    members.filter((member) => member.status === status).length;

  return {
    total: members.length,
    active: count("active"),
    invited: count("invited"),
    suspended: count("suspended"),
    /* A pending invitation holds a seat — otherwise a workspace at its limit
       could invite indefinitely and only discover the problem on acceptance. */
    seatsUsed: members.filter((member) => member.status !== "suspended").length,
    seatLimit: SEAT_LIMIT,
  };
}

export function membersWithRole(
  roleId: string,
  members: WorkspaceMember[] = WORKSPACE_MEMBERS,
): WorkspaceMember[] {
  return members.filter((member) => member.roleId === roleId);
}

/**
 * What a member would lose by moving to another role.
 *
 * Computed by differencing the two grant maps, not written per role pair —
 * seven roles would be forty-two hand-written warnings, and they would be wrong
 * the first time a permission moved.
 */
export function permissionsLost(fromId: string, toId: string): string[] {
  const from = roleById(fromId)?.grants ?? {};
  const to = roleById(toId)?.grants ?? {};
  const lost: string[] = [];

  for (const group of PERMISSION_GROUPS) {
    for (const resource of group.resources) {
      const had = from[resource.key] ?? [];
      const has = to[resource.key] ?? [];
      const removed = had.filter((action) => !has.includes(action));

      if (removed.length === 0) continue;
      /* One line per resource rather than per action: "Campaigns: publish,
         delete" reads; six separate bullets do not. */
      lost.push(`${resource.label} — ${removed.join(", ")}`);
    }
  }

  return lost;
}

/**
 * Whether editing this role would lock the current user out.
 *
 * Returns the warning, or `null` when the change is safe. The guard is narrow
 * on purpose: it fires only when the signed-in member is editing the role they
 * themselves hold and is turning off a permission that governs permissions. Any
 * broader and it would block legitimate administration.
 */
export function lockoutWarning(
  roleId: string,
  resource: string,
  action: PermissionAction,
  enabled: boolean,
): string | null {
  if (enabled) return null;
  if (CURRENT_MEMBER.roleId !== roleId) return null;
  if (resource !== "roles" && resource !== "team") return null;
  if (action !== "manage") return null;

  return resource === "roles"
    ? "You cannot remove Manage roles from your own role — you would not be able to grant it back."
    : "You cannot remove Manage team members from your own role while it is the role you hold.";
}

/* -------------------------------------------------------------------------- */
/* Audit trail                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The workspace audit trail.
 *
 * Meaningful business and system changes only. Nobody's page views are in here,
 * and neither are automation executions — those are `automation/activity`, and
 * a contact's own history is the customer timeline. This answers exactly one
 * question: who changed what in this workspace.
 *
 * `ipAddress` and `userAgent` are populated only where a real backend would
 * have them. The system rows carry `null`, and the UI renders that as "Not
 * recorded" — inventing a plausible address for a demo is how a reader learns
 * to trust a field that is not trustworthy.
 */
const UA_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0 Safari/537.36";
const UA_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) Safari/18.0";

export const WORKSPACE_AUDIT: WorkspaceAuditEvent[] = [
  {
    id: "aud_1",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_sarah",
    actorName: "Sarah Ahmed",
    action: "campaign.published",
    actionLabel: "Published campaign",
    module: "marketing",
    resourceType: "Campaign",
    resourceId: "cmp_summer_2026",
    resourceName: "Summer Sale 2026",
    resourceHref: APP_ROUTES.marketingCampaigns,
    status: "success",
    severity: "high",
    createdAt: minutesAgo(6),
    ipAddress: "103.108.34.12",
    userAgent: UA_CHROME,
    changes: [{ field: "Status", before: "Draft", after: "Published" }],
    metadata: { audience: "All contacts · 24,580 recipients", channel: "Email" },
  },
  {
    id: "aud_2",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_tanvir",
    actorName: "Tanvir Ahmed",
    action: "member.role_changed",
    actionLabel: "Changed role",
    module: "team",
    resourceType: "Member",
    resourceId: "mem_sarah",
    resourceName: "Sarah Ahmed",
    resourceHref: WORKSPACE_ROUTES.team,
    status: "success",
    severity: "security",
    createdAt: minutesAgo(18),
    ipAddress: "103.108.34.9",
    userAgent: UA_CHROME,
    changes: [{ field: "Role", before: "Viewer", after: "Marketing Manager" }],
    metadata: { reason: "Promoted to run the autumn campaign set" },
  },
  {
    id: "aud_3",
    workspaceId: WORKSPACE_ID,
    actorId: null,
    actorName: "System",
    action: "integration.disconnected",
    actionLabel: "WhatsApp integration disconnected",
    module: "integrations",
    resourceType: "Integration",
    resourceId: "whatsapp",
    resourceName: "Main WhatsApp Account",
    resourceHref: INTEGRATION_ROUTES.whatsapp,
    status: "warning",
    severity: "high",
    createdAt: minutesAgo(44),
    ipAddress: null,
    userAgent: null,
    changes: [{ field: "Connection", before: "Connected", after: "Disconnected" }],
    metadata: { cause: "Provider returned 401 on three consecutive requests" },
  },
  {
    id: "aud_4",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_nabila",
    actorName: "Sagor Khan",
    action: "role.permissions_changed",
    actionLabel: "Updated role permissions",
    module: "roles",
    resourceType: "Role",
    resourceId: "role_custom_junior",
    resourceName: "Junior Marketer",
    resourceHref: WORKSPACE_ROUTES.roles,
    status: "success",
    severity: "security",
    createdAt: hoursAgo(2),
    ipAddress: "103.108.34.12",
    userAgent: UA_SAFARI,
    changes: [
      { field: "Campaigns", before: "view, create, edit, publish", after: "view, create, edit" },
      { field: "Contacts", before: "view, create, edit, export", after: "view, create, edit" },
    ],
  },
  {
    id: "aud_5",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_rafi",
    actorName: "Rafi Hossain",
    action: "workflow.published",
    actionLabel: "Published workflow",
    module: "automation",
    resourceType: "Workflow",
    resourceId: "wf-cart-recovery",
    resourceName: "Cart Recovery",
    resourceHref: "/dashboard/automation/wf-cart-recovery",
    status: "success",
    severity: "high",
    createdAt: hoursAgo(3),
    ipAddress: "103.108.34.41",
    userAgent: UA_CHROME,
    changes: [{ field: "Status", before: "Draft", after: "Active" }],
  },
  {
    id: "aud_6",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_mehedi",
    actorName: "Mehedi Hasan",
    action: "contacts.exported",
    actionLabel: "Exported contacts",
    module: "customers",
    resourceType: "Contact list",
    resourceId: null,
    resourceName: "Active leads · 1,284 rows",
    resourceHref: APP_ROUTES.contacts,
    status: "success",
    severity: "security",
    createdAt: hoursAgo(4),
    ipAddress: "103.108.34.77",
    userAgent: UA_CHROME,
    changes: [],
    metadata: { format: "CSV", filter: "Status is Active, Source is WhatsApp" },
  },
  {
    id: "aud_7",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_arif",
    actorName: "Arif Chowdhury",
    action: "permission.denied",
    actionLabel: "Blocked: delete contact",
    module: "security",
    resourceType: "Contact",
    resourceId: "ct_4410",
    resourceName: "Imtiaz Rahman",
    resourceHref: APP_ROUTES.contacts,
    status: "failed",
    severity: "security",
    createdAt: hoursAgo(5),
    ipAddress: "103.108.34.58",
    userAgent: UA_SAFARI,
    changes: [],
    metadata: {
      required: "Contacts · delete",
      role: "Support Agent",
      outcome: "Request rejected before any change was made",
    },
  },
  {
    id: "aud_8",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_tanvir",
    actorName: "Tanvir Ahmed",
    action: "api_key.created",
    actionLabel: "Created API key",
    module: "integrations",
    resourceType: "API key",
    resourceId: "key_reporting",
    resourceName: "Reporting Sync",
    resourceHref: INTEGRATION_ROUTES.api,
    status: "success",
    severity: "security",
    createdAt: hoursAgo(7),
    ipAddress: "103.108.34.9",
    userAgent: UA_CHROME,
    changes: [],
    /* The key itself is never recorded. Scope and prefix are what an auditor
       needs, and they are all a leak of this record would expose. */
    metadata: { prefix: "mf_live_••••13C9", scopes: "Read only · 4 scopes" },
  },
  {
    id: "aud_9",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_nabila",
    actorName: "Sagor Khan",
    action: "workspace.settings_updated",
    actionLabel: "Updated workspace settings",
    module: "settings",
    resourceType: "Workspace settings",
    resourceId: "general",
    resourceName: "General",
    resourceHref: WORKSPACE_ROUTES.settings,
    status: "success",
    severity: "normal",
    createdAt: hoursAgo(9),
    ipAddress: "103.108.34.12",
    userAgent: UA_SAFARI,
    changes: [
      { field: "Timezone", before: "UTC+6", after: "Asia/Dhaka" },
      { field: "Currency", before: "USD", after: "BDT" },
    ],
  },
  {
    id: "aud_10",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_tanvir",
    actorName: "Tanvir Ahmed",
    action: "member.invited",
    actionLabel: "Invited member",
    module: "team",
    resourceType: "Member",
    resourceId: "mem_invite_zayed",
    resourceName: "zayed@marketflow.app",
    resourceHref: WORKSPACE_ROUTES.team,
    status: "success",
    severity: "normal",
    createdAt: daysAgo(2),
    ipAddress: "103.108.34.9",
    userAgent: UA_CHROME,
    changes: [{ field: "Role", before: null, after: "Sales Agent" }],
  },
  {
    id: "aud_11",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_nabila",
    actorName: "Sagor Khan",
    action: "member.suspended",
    actionLabel: "Suspended member",
    module: "team",
    resourceType: "Member",
    resourceId: "mem_shirin",
    resourceName: "Shirin Akter",
    resourceHref: WORKSPACE_ROUTES.team,
    status: "warning",
    severity: "security",
    createdAt: daysAgo(27),
    ipAddress: "103.108.34.12",
    userAgent: UA_CHROME,
    changes: [{ field: "Status", before: "Active", after: "Suspended" }],
    metadata: { reason: "Extended leave — access paused at the member's request" },
  },
  {
    id: "aud_12",
    workspaceId: WORKSPACE_ID,
    actorId: null,
    actorName: "System",
    action: "auth.new_device",
    actionLabel: "Sign-in from a new device",
    module: "security",
    resourceType: "Member",
    resourceId: "mem_rafi",
    resourceName: "Rafi Hossain",
    resourceHref: WORKSPACE_ROUTES.team,
    status: "info",
    severity: "security",
    createdAt: daysAgo(3),
    ipAddress: "45.114.20.183",
    userAgent: UA_SAFARI,
    changes: [],
    metadata: { location: "Dhaka, Bangladesh", device: "macOS · Safari" },
  },
  {
    id: "aud_13",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_sarah",
    actorName: "Sarah Ahmed",
    action: "campaign.paused",
    actionLabel: "Paused campaign",
    module: "marketing",
    resourceType: "Campaign",
    resourceId: "cmp_flash",
    resourceName: "Flash Friday",
    resourceHref: APP_ROUTES.marketingCampaigns,
    status: "warning",
    severity: "normal",
    createdAt: daysAgo(4),
    ipAddress: "103.108.34.33",
    userAgent: UA_CHROME,
    changes: [{ field: "Status", before: "Sending", after: "Paused" }],
  },
  {
    id: "aud_14",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_nabila",
    actorName: "Sagor Khan",
    action: "role.created",
    actionLabel: "Created custom role",
    module: "roles",
    resourceType: "Role",
    resourceId: "role_custom_junior",
    resourceName: "Junior Marketer",
    resourceHref: WORKSPACE_ROUTES.roles,
    status: "success",
    severity: "security",
    createdAt: daysAgo(58),
    ipAddress: "103.108.34.12",
    userAgent: UA_CHROME,
    changes: [{ field: "Base role", before: null, after: "Marketing Manager" }],
  },
  {
    id: "aud_15",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_tanvir",
    actorName: "Tanvir Ahmed",
    action: "webhook.created",
    actionLabel: "Created webhook",
    module: "integrations",
    resourceType: "Webhook",
    resourceId: "wh_crm_sync",
    resourceName: "CRM Sync",
    resourceHref: INTEGRATION_ROUTES.webhooks,
    status: "success",
    severity: "normal",
    createdAt: daysAgo(6),
    ipAddress: "103.108.34.9",
    userAgent: UA_CHROME,
    changes: [],
    metadata: { events: "4 subscribed events", endpoint: "https://example.com/webhooks/marketflow" },
  },
  {
    id: "aud_16",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_farhana",
    actorName: "Farhana Islam",
    action: "lead.assigned",
    actionLabel: "Reassigned leads",
    module: "customers",
    resourceType: "Leads",
    resourceId: null,
    resourceName: "8 leads → Mehedi Hasan",
    resourceHref: APP_ROUTES.leads,
    status: "success",
    severity: "normal",
    createdAt: daysAgo(8),
    ipAddress: "103.108.34.61",
    userAgent: UA_CHROME,
    changes: [{ field: "Owner", before: "Farhana Islam", after: "Mehedi Hasan" }],
  },
  {
    id: "aud_17",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_rafi",
    actorName: "Rafi Hossain",
    action: "discount.created",
    actionLabel: "Created discount",
    module: "commerce",
    resourceType: "Discount",
    resourceId: "dsc_autumn20",
    resourceName: "AUTUMN20",
    resourceHref: APP_ROUTES.discounts,
    status: "success",
    severity: "normal",
    createdAt: daysAgo(11),
    ipAddress: "103.108.34.41",
    userAgent: UA_CHROME,
    changes: [],
    metadata: { value: "20% off orders over ৳2,000", expires: "31 Oct 2026" },
  },
  {
    id: "aud_18",
    workspaceId: WORKSPACE_ID,
    actorId: "mem_nabila",
    actorName: "Sagor Khan",
    action: "workspace.branding_changed",
    actionLabel: "Changed branding",
    module: "settings",
    resourceType: "Workspace settings",
    resourceId: "branding",
    resourceName: "Branding",
    resourceHref: WORKSPACE_ROUTES.settings,
    status: "success",
    severity: "normal",
    createdAt: daysAgo(19),
    ipAddress: "103.108.34.12",
    userAgent: UA_SAFARI,
    changes: [
      { field: "Sender name", before: "MarketFlow", after: "MarketFlow Store" },
      { field: "Logo", before: "marketflow-old.svg", after: "marketflow-mark.svg" },
    ],
  },
];

export interface AuditTotals {
  today: number;
  activeMembers: number;
  thisWeek: number;
  security: number;
}

export function auditTotals(
  events: WorkspaceAuditEvent[] = WORKSPACE_AUDIT,
): AuditTotals {
  const now = new Date(
    WORKSPACE_AUDIT[0]?.createdAt ?? new Date().toISOString(),
  ).getTime();
  const since = (ms: number) =>
    events.filter((event) => now - new Date(event.createdAt).getTime() <= ms);

  const today = since(86_400_000);

  return {
    today: today.length,
    activeMembers: new Set(
      today.filter((event) => event.actorId).map((event) => event.actorId),
    ).size,
    thisWeek: since(7 * 86_400_000).length,
    security: events.filter((event) => event.severity === "security").length,
  };
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export const WORKSPACE_SETTINGS: WorkspaceSettings = {
  general: {
    name: "MarketFlow Store",
    slug: "marketflow-store",
    timezone: "Asia/Dhaka",
    language: "en",
    dateFormat: "D MMM YYYY",
    timeFormat: "12h",
    currency: "BDT",
  },
  business: {
    legalName: "MarketFlow Commerce Ltd.",
    industry: "Retail & E-commerce",
    website: "https://marketflow.app",
    phone: "+8801712345678",
    supportEmail: "support@marketflow.app",
    country: "Bangladesh",
    address: "House 42, Road 11, Banani, Dhaka 1213",
  },
  branding: {
    logoName: "marketflow-mark.svg",
    brandName: "MarketFlow Store",
    brandColor: "#4f46e5",
    senderName: "MarketFlow Store",
  },
  defaults: {
    leadOwnerId: "mem_mehedi",
    pipeline: "Standard sales pipeline",
    whatsappAccount: "+880 1712 345678",
    emailSender: "hello@marketflow.app",
    smsSender: "MRKTFLOW",
    campaignTimezone: "Asia/Dhaka",
    contactSource: "Website form",
    automationOwnerId: "mem_tanvir",
  },
  data: {
    duplicateHandling: "merge",
    defaultLeadSource: "Website form",
    campaignTracking: true,
    autoArchiveLeads: true,
    autoArchiveDays: 90,
    retentionMonths: 24,
  },
};

/* -------------------------------------------------------------------------- */
/* Derived role facts                                                         */
/* -------------------------------------------------------------------------- */

/**
 * How much damage a role could do, from the sensitive permissions it holds.
 *
 * Counted rather than judged: any role that can grant permissions or move money
 * is `high` regardless of how few other grants it carries, because those are the
 * ones that cannot be undone from inside the product. Everything else scales
 * with how many sensitive grants it holds.
 */
export function riskLevel(grants: RoleGrants): RiskLevel {
  const sensitive = sensitiveGrants(grants);

  const critical = sensitive.some(
    (item) =>
      (item.resource === "roles" && item.action === "manage") ||
      (item.resource === "billing" && item.action === "manage") ||
      (item.resource === "orders" && item.action === "refund"),
  );

  if (critical) return "high";
  if (sensitive.length >= 6) return "elevated";
  return "standard";
}

export function sensitiveGrants(
  grants: RoleGrants,
): { resource: string; action: PermissionAction }[] {
  const out: { resource: string; action: PermissionAction }[] = [];

  for (const [resource, actions] of Object.entries(grants)) {
    for (const action of actions) {
      if (isSensitive(resource, action)) out.push({ resource, action });
    }
  }

  return out;
}

/** Modules the role can reach at all — the "Modules 7 / 8" summary figure. */
export function moduleCoverage(grants: RoleGrants): {
  covered: number;
  total: number;
} {
  const covered = PERMISSION_GROUPS.filter((group) =>
    group.resources.some((resource) => (grants[resource.key]?.length ?? 0) > 0),
  ).length;

  return { covered, total: PERMISSION_GROUPS.length };
}

/** Per-group counts, for the permission summary on the role header. */
export function groupCoverage(
  grants: RoleGrants,
): { key: string; label: string; granted: number; total: number }[] {
  return PERMISSION_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    granted: group.resources.reduce(
      (sum, resource) => sum + (grants[resource.key]?.length ?? 0),
      0,
    ),
    total: group.resources.reduce(
      (sum, resource) => sum + resource.actions.length,
      0,
    ),
  }));
}

/**
 * What a role can reach, in three buckets, for the access preview.
 *
 * Deliberately coarse. The point is a mental model for a merchant who will
 * never read a matrix — "Sales Agent works with contacts and leads, reads
 * analytics, and cannot touch automation or billing" — so a module the role can
 * only look at lands in `limited` rather than being called access.
 */
export function accessPreview(grants: RoleGrants): {
  full: string[];
  limited: string[];
  none: string[];
} {
  const full: string[] = [];
  const limited: string[] = [];
  const none: string[] = [];

  for (const group of PERMISSION_GROUPS) {
    const granted = group.resources.reduce(
      (sum, resource) => sum + (grants[resource.key]?.length ?? 0),
      0,
    );

    if (granted === 0) {
      none.push(group.label);
      continue;
    }

    /* "Can it change anything here?" is the line between full and limited. */
    const canWrite = group.resources.some((resource) =>
      (grants[resource.key] ?? []).some(
        (action) => action !== "view" && action !== "view_activity",
      ),
    );

    if (canWrite) full.push(group.label);
    else limited.push(group.label);
  }

  return { full, limited, none };
}

/**
 * The difference between two grant maps, as a reviewable list.
 *
 * Drives the change summary shown before saving. Removals sort first — taking
 * access away is the half that breaks somebody's day, and it is what a reviewer
 * should read before the additions.
 */
export function permissionDeltas(
  before: RoleGrants,
  after: RoleGrants,
): PermissionDelta[] {
  const deltas: PermissionDelta[] = [];

  for (const group of PERMISSION_GROUPS) {
    for (const resource of group.resources) {
      const had = new Set(before[resource.key] ?? []);
      const has = new Set(after[resource.key] ?? []);

      for (const spec of resource.actions) {
        const wasGranted = had.has(spec.action);
        const isGranted = has.has(spec.action);
        if (wasGranted === isGranted) continue;

        deltas.push({
          resourceKey: resource.key,
          resourceLabel: resource.label,
          action: spec.action,
          actionLabel: PERMISSION_ACTION_LABEL[spec.action],
          granted: isGranted,
          sensitive: Boolean(spec.sensitive),
        });
      }
    }
  }

  return deltas.sort((a, b) => Number(a.granted) - Number(b.granted));
}

/* -------------------------------------------------------------------------- */
/* Role activity                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Per-role change history.
 *
 * The same events reach the workspace audit trail, where they can be correlated
 * with everything else that happened. This is the narrow view — "what has been
 * done to this role" — which is the question asked while looking at it.
 */
export const ROLE_ACTIVITY: RoleActivityEvent[] = [
  {
    id: "ra_1",
    roleId: "role_manager",
    actorName: "Tanvir Ahmed",
    action: "member.assigned",
    summary: "Sarah Ahmed assigned to this role",
    added: [],
    removed: [],
    affectedMembers: 2,
    createdAt: minutesAgo(18),
  },
  {
    id: "ra_2",
    roleId: "role_custom_junior",
    actorName: "Sagor Khan",
    action: "role.permissions_changed",
    summary: "Narrowed campaign and contact access",
    added: [],
    removed: ["campaigns.publish", "contacts.export"],
    affectedMembers: 2,
    createdAt: hoursAgo(2),
  },
  {
    id: "ra_3",
    roleId: "role_manager",
    actorName: "Sagor Khan",
    action: "role.permissions_changed",
    summary: "Granted automation publishing",
    added: ["workflows.publish", "reports.export"],
    removed: ["contacts.export"],
    affectedMembers: 2,
    createdAt: daysAgo(41),
  },
  {
    id: "ra_4",
    roleId: "role_custom_junior",
    actorName: "Sagor Khan",
    action: "role.created",
    summary: "Created from Marketing Manager",
    added: [],
    removed: [],
    affectedMembers: 0,
    createdAt: daysAgo(58),
  },
  {
    id: "ra_5",
    roleId: "role_analyst",
    actorName: "Sagor Khan",
    action: "role.permissions_changed",
    summary: "Granted audit trail export",
    added: ["workspace_activity.export"],
    removed: [],
    affectedMembers: 1,
    createdAt: daysAgo(64),
  },
  {
    id: "ra_6",
    roleId: "role_admin",
    actorName: "Sagor Khan",
    action: "role.permissions_changed",
    summary: "Removed billing management from Workspace Admin",
    added: [],
    removed: ["billing.manage"],
    affectedMembers: 1,
    createdAt: daysAgo(96),
  },
];

export function roleActivity(roleId: string): RoleActivityEvent[] {
  return ROLE_ACTIVITY.filter((event) => event.roleId === roleId);
}

/** A duplicated role, as the API would hand it back. */
export function duplicateRole(role: WorkspaceRole, actor: string): WorkspaceRole {
  return {
    ...role,
    id: `role_custom_${Date.now().toString(36)}`,
    name: `${role.name} Copy`,
    description: `Duplicated from ${role.name}.`,
    type: "custom",
    status: "active",
    merchantRole: undefined,
    /* A deep copy — editing the duplicate must not edit its source. */
    grants: Object.fromEntries(
      Object.entries(role.grants).map(([key, actions]) => [key, [...actions]]),
    ),
    createdAt: WORKSPACE_NOW,
    updatedAt: WORKSPACE_NOW,
    createdBy: actor,
    updatedBy: actor,
  };
}

/* -------------------------------------------------------------------------- */
/* Role changes → audit trail                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A permission edit, as a workspace audit event.
 *
 * The bridge between the role editor and the audit trail. Editing a role is one
 * of the most consequential things a merchant can do in this workspace and it
 * was the one change the trail could not see — every other module writes its
 * events, and roles has to as well or "who granted them that?" has no answer.
 *
 * Each changed permission becomes one `AuditChange` reading `Allowed → Denied`,
 * rather than one event per permission. A single edit is a single decision, and
 * twelve rows in the trail for one click buries everything around it.
 *
 * Severity is always `security`: a permission change is the definition of one,
 * regardless of which permission moved.
 */
export function auditEventForRoleChange(input: {
  role: WorkspaceRole;
  deltas: PermissionDelta[];
  affectedMembers: number;
  actor: WorkspaceMember;
}): WorkspaceAuditEvent {
  const { role, deltas, affectedMembers, actor } = input;
  const added = deltas.filter((delta) => delta.granted).length;
  const removed = deltas.length - added;

  return {
    id: `aud_role_${Date.now().toString(36)}`,
    workspaceId: WORKSPACE_ID,
    actorId: actor.id,
    actorName: actor.name,
    action: "role.permissions_changed",
    actionLabel: "Updated role permissions",
    module: "roles",
    resourceType: "Role",
    resourceId: role.id,
    resourceName: role.name,
    resourceHref: WORKSPACE_ROUTES.roles,
    /* Widening access is the direction worth a second look in a trail: taking
       permissions away cannot let anyone do something new. */
    status: added > 0 ? "warning" : "success",
    severity: "security",
    createdAt: WORKSPACE_NOW,
    ipAddress: null,
    userAgent: null,
    changes: deltas.map((delta) => ({
      field: `${delta.resourceLabel} · ${delta.actionLabel}`,
      before: delta.granted ? "Denied" : "Allowed",
      after: delta.granted ? "Allowed" : "Denied",
    })),
    metadata: {
      added: String(added),
      removed: String(removed),
      affectedMembers: String(affectedMembers),
      sensitive: String(deltas.filter((delta) => delta.sensitive).length),
    },
  };
}

/** The matching per-role history row, so both views stay in step. */
export function roleActivityForChange(input: {
  role: WorkspaceRole;
  deltas: PermissionDelta[];
  affectedMembers: number;
  actor: WorkspaceMember;
}): RoleActivityEvent {
  const { role, deltas, affectedMembers, actor } = input;
  const added = deltas.filter((delta) => delta.granted);
  const removed = deltas.filter((delta) => !delta.granted);

  return {
    id: `ra_${Date.now().toString(36)}`,
    roleId: role.id,
    actorName: actor.name,
    action: "role.permissions_changed",
    summary:
      added.length > 0 && removed.length > 0
        ? `Granted ${added.length} and removed ${removed.length} permissions`
        : added.length > 0
          ? `Granted ${added.length} ${added.length === 1 ? "permission" : "permissions"}`
          : `Removed ${removed.length} ${removed.length === 1 ? "permission" : "permissions"}`,
    added: added.map((delta) => `${delta.resourceKey}.${delta.action}`),
    removed: removed.map((delta) => `${delta.resourceKey}.${delta.action}`),
    affectedMembers,
    createdAt: WORKSPACE_NOW,
  };
}

/** A role being created, duplicated, archived, restored or deleted. */
export function auditEventForRoleLifecycle(input: {
  role: WorkspaceRole;
  action: "created" | "duplicated" | "archived" | "restored" | "deleted";
  actor: WorkspaceMember;
  detail?: string;
}): WorkspaceAuditEvent {
  const { role, action, actor, detail } = input;

  const LABEL: Record<typeof action, string> = {
    created: "Created custom role",
    duplicated: "Duplicated role",
    archived: "Archived role",
    restored: "Restored role",
    deleted: "Deleted role",
  };

  return {
    id: `aud_role_${action}_${Date.now().toString(36)}`,
    workspaceId: WORKSPACE_ID,
    actorId: actor.id,
    actorName: actor.name,
    action: `role.${action}`,
    actionLabel: LABEL[action],
    module: "roles",
    resourceType: "Role",
    resourceId: role.id,
    resourceName: role.name,
    resourceHref: WORKSPACE_ROUTES.roles,
    status: action === "deleted" ? "warning" : "success",
    severity: "security",
    createdAt: WORKSPACE_NOW,
    ipAddress: null,
    userAgent: null,
    changes: [],
    metadata: {
      permissions: String(grantCount(role.grants)),
      ...(detail ? { detail } : {}),
    },
  };
}
