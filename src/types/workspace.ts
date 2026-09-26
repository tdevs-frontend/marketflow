import type { MerchantRole } from "@/constants/roles";

/**
 * The Workspace module's vocabulary.
 *
 * Four questions, four entities, and no overlap between them - which is the
 * whole design constraint of this module:
 *
 *   WorkspaceMember      who works here
 *   WorkspaceRole        what they can reach
 *   WorkspaceAuditEvent  what they changed
 *   WorkspaceSettings    how this workspace is configured
 *
 * All of it is *merchant* workspace governance. Nothing here reaches the Admin
 * Dashboard: the widest role in this file still only sees one merchant's own
 * business, and "Workspace Admin" is a member of this workspace, not a platform
 * operator.
 */

/* -------------------------------------------------------------------------- */
/* Members                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Where a person is in the join/leave lifecycle.
 *
 * Kept apart from their role on purpose. A suspended Marketing Manager is still
 * a Marketing Manager - folding "suspended" into the role union would lose the
 * role you have to restore them to.
 */
export type MemberStatus = "active" | "invited" | "suspended";

/**
 * What a member owns, counted.
 *
 * Read before removing them, which is the only reason it exists: a member who
 * owns twelve leads and three campaigns cannot be deleted without deciding
 * where those go, and a UI that cannot see the count cannot ask.
 */
export interface MemberOwnership {
  leads: number;
  campaigns: number;
  workflows: number;
  contacts: number;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  /** Role id from `WORKSPACE_ROLES`, not a label - roles are renameable. */
  roleId: string;
  status: MemberStatus;
  /** ISO. `null` for someone who has never signed in - an open invitation. */
  lastActiveAt: string | null;
  /** ISO. When they accepted; `null` while still invited. */
  joinedAt: string | null;
  invitedAt: string;
  /** Member id of whoever sent the invitation. */
  invitedById: string | null;
  ownership: MemberOwnership;
  /** Marks the signed-in user, so the UI can refuse self-destructive actions. */
  isCurrentUser?: boolean;
}

/**
 * An invitation in flight.
 *
 * Modelled separately from the member row it will become because the two carry
 * different facts - an invitation has an expiry and a resend count, a member
 * has a join date and a last-active - but it is *listed* in the members table
 * as `status: "invited"`. One table, because "who is in this workspace"
 * includes the people who have been asked.
 */
export interface WorkspaceInvitation {
  id: string;
  email: string;
  roleId: string;
  message?: string;
  invitedById: string;
  sentAt: string;
  expiresAt: string;
  resentCount: number;
}

/* -------------------------------------------------------------------------- */
/* Roles and permissions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What can be done to a resource.
 *
 * Deliberately not applied uniformly. A campaign can be published and a contact
 * cannot; a report can be exported and a webhook cannot. Each resource declares
 * the actions that mean something for it, so the matrix never renders a column
 * whose cell would be permanently meaningless.
 */
export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "pause"
  | "export"
  | "manage"
  | "assign"
  | "refund"
  | "retry"
  | "approve"
  | "bulk_edit"
  | "view_activity";

/**
 * One action on one resource, with everything the editor needs to govern it.
 *
 * Three things ride along with the action name, and each exists to answer a
 * question a merchant asks while editing a 100-permission role:
 *
 *   `advanced`  - "do I need to care about this one right now?" Rare and
 *                 destructive actions sit behind a disclosure so the default
 *                 view is the handful most roles actually differ on.
 *   `sensitive` - "what happens if I grant this?" The string is the impact,
 *                 shown in a tooltip. Presence is what flags the badge.
 *   `requires`  - "is this combination even coherent?" Publish without Edit is
 *                 a permission that cannot be exercised, and the editor
 *                 resolves it rather than letting it be saved.
 */
export interface ResourceAction {
  action: PermissionAction;
  /** Hidden behind "Show advanced" in the matrix. */
  advanced?: boolean;
  /** The impact, in one sentence. Its presence marks the action sensitive. */
  sensitive?: string;
  /**
   * Other actions on the same resource this one depends on.
   *
   * `view` is an implicit prerequisite for everything and is not repeated
   * here - see `requiredFor` in `constants/workspace`.
   */
  requires?: PermissionAction[];
}

export interface PermissionResource {
  key: string;
  label: string;
  /** Only the actions that make sense here, each with its own governance. */
  actions: ResourceAction[];
  /** One line in the matrix row, for actions whose meaning is not obvious. */
  hint?: string;
  /**
   * Where this resource lives in the product. Turns a permission row into a
   * link rather than a dead end.
   */
  href?: string;
}

/** Permissions grouped by the MarketFlow module they belong to. */
export interface PermissionGroup {
  key: string;
  label: string;
  /** Key into `components/ui/icon`. */
  icon: string;
  description: string;
  resources: PermissionResource[];
}

/**
 * A role's grants: resource key → the actions it allows.
 *
 * A map rather than a flat list of `"contacts.edit"` strings, because every
 * question the UI asks is "what can this role do to contacts" - and the flat
 * form answers it only by scanning. Absent key means no access at all, which is
 * also the safe default for a resource added after the role was created.
 */
export type RoleGrants = Record<string, PermissionAction[]>;

export type RoleType = "system" | "custom";

/**
 * Archived roles keep their configuration but cannot be assigned.
 *
 * The safer half of deletion: a custom role that fell out of use is usually
 * something a merchant wants back in three months, and forcing the choice
 * between "keep clutter" and "lose the permission set" is how roles get
 * deleted and rebuilt from memory.
 */
export type RoleStatus = "active" | "archived";

/** How much damage this role could do, derived from its sensitive grants. */
export type RiskLevel = "standard" | "elevated" | "high";

export interface WorkspaceRole {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  status: RoleStatus;
  /**
   * The `MerchantRole` this maps onto, for system roles.
   *
   * The product already had a role union driving `ROLE_LABEL` and the sidebar;
   * this is the join between that architecture and the richer record the
   * Workspace module needs, rather than a second source of truth for identity.
   */
  merchantRole?: MerchantRole;
  grants: RoleGrants;
  createdAt: string;
  updatedAt: string;
  /** `null` on system roles - nobody created them. */
  createdBy: string | null;
  /** Who last changed the permissions. `null` if never edited. */
  updatedBy: string | null;
}

/**
 * A starting point for a new custom role.
 *
 * Building a permission set from a hundred empty checkboxes is a job nobody
 * finishes correctly. Presets are the shapes merchants actually ask for -
 * "someone who runs marketing", "someone who only reads" - expressed as grants
 * so the create flow can hand over a working role in one click.
 */
export interface PermissionPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  grants: RoleGrants;
}

/**
 * One change to a role, for its own history tab.
 *
 * Kept alongside the workspace audit trail rather than instead of it: this is
 * the narrow view scoped to one role, and the same events also appear in
 * Workspace Activity where they can be correlated with everything else.
 */
export interface RoleActivityEvent {
  id: string;
  roleId: string;
  actorName: string;
  action:
    | "role.created"
    | "role.renamed"
    | "role.duplicated"
    | "role.archived"
    | "role.restored"
    | "role.permissions_changed"
    | "member.assigned"
    | "member.unassigned";
  summary: string;
  /** Permission keys added and removed, as `resource.action`. */
  added: string[];
  removed: string[];
  /** How many members held the role when it changed. */
  affectedMembers: number;
  createdAt: string;
}

/** One pending permission edit, for the change summary shown before saving. */
export interface PermissionDelta {
  resourceKey: string;
  resourceLabel: string;
  action: PermissionAction;
  actionLabel: string;
  granted: boolean;
  sensitive: boolean;
}

/* -------------------------------------------------------------------------- */
/* Audit trail                                                                */
/* -------------------------------------------------------------------------- */

export type AuditStatus = "success" | "warning" | "failed" | "info";

/**
 * How much an event matters.
 *
 * `security` is what the "Security events only" filter selects, and `high` is
 * what "High impact only" selects. Two flags rather than one scale because they
 * are different questions: deleting every contact is high impact and not a
 * security event; a failed permission check is a security event and changed
 * nothing.
 */
export type AuditSeverity = "normal" | "high" | "security";

export type AuditModule =
  | "team"
  | "roles"
  | "marketing"
  | "automation"
  | "integrations"
  | "customers"
  | "commerce"
  | "settings"
  | "security"
  /* Help-desk tickets this workspace opened: created, assigned, status. */
  | "support";

/**
 * One field that changed, as before and after.
 *
 * Strings, not `unknown`. The audit trail renders a human diff - "Viewer →
 * Marketing Manager" - and anything that needs a shape richer than that belongs
 * in `metadata`, behind the Advanced disclosure, where a reader has opted in to
 * seeing raw values.
 */
export interface AuditChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface WorkspaceAuditEvent {
  id: string;
  workspaceId: string;
  /** `null` for actions the system took on its own. */
  actorId: string | null;
  actorName: string;
  action: string;
  /** Past tense, as a sentence fragment: "Published campaign". */
  actionLabel: string;
  module: AuditModule;
  resourceType: string;
  resourceId: string | null;
  resourceName: string;
  /** Deep link into the module that owns the resource. */
  resourceHref?: string;
  status: AuditStatus;
  severity: AuditSeverity;
  createdAt: string;
  /**
   * Request metadata.
   *
   * Optional and nullable on purpose: the frontend is ready for a backend that
   * supplies them and must not invent them when it does not. A `null` renders
   * as "Not recorded", never as a plausible-looking address.
   */
  ipAddress: string | null;
  userAgent: string | null;
  changes: AuditChange[];
  /** Extra context, shown only under Advanced details. Never secrets. */
  metadata?: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export type DuplicateHandling = "merge" | "duplicate" | "ask";

/**
 * Workspace configuration, grouped the way the tabs present it.
 *
 * Nested rather than flat so the save bar can diff one section against its
 * saved copy without listing thirty field names, and so "which tab has unsaved
 * changes" is answerable by comparing objects.
 *
 * Nothing personal lives here. Profile, notifications and password belong to
 * whoever is signed in and already have a home in Settings.
 */
export interface WorkspaceSettings {
  general: {
    name: string;
    slug: string;
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
    currency: string;
  };
  business: {
    legalName: string;
    industry: string;
    website: string;
    phone: string;
    supportEmail: string;
    country: string;
    address: string;
  };
  branding: {
    /** `null` until a logo is uploaded. */
    logoName: string | null;
    brandName: string;
    brandColor: string;
    senderName: string;
  };
  defaults: {
    leadOwnerId: string;
    pipeline: string;
    whatsappAccount: string;
    emailSender: string;
    smsSender: string;
    campaignTimezone: string;
    contactSource: string;
    automationOwnerId: string;
  };
  data: {
    duplicateHandling: DuplicateHandling;
    defaultLeadSource: string;
    campaignTracking: boolean;
    autoArchiveLeads: boolean;
    autoArchiveDays: number;
    retentionMonths: number;
  };
}

export type SettingsSection = keyof WorkspaceSettings;
