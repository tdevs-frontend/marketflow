/**
 * Who a person is inside one merchant workspace.
 *
 * These are *workspace* roles, not platform roles. MarketFlow's Admin
 * Dashboard — merchant management, plans, system health — is a separate
 * application, and nothing in this union grants access to it. The widest role
 * here still only reaches one merchant's own business.
 *
 * Defined in `constants/` rather than in the auth slice so the navigation can
 * read it without importing from Redux: the sidebar decides what to render
 * from these, and two copies of the union would drift the first time a role is
 * added.
 */
export type MerchantRole =
  /** The person who owns the workspace and its billing. */
  | "owner"
  /** Full operational access, short of ownership transfer. */
  | "admin"
  /** Runs marketing: customers, campaigns, automation, reporting. */
  | "manager"
  /** Front line: the people they talk to, and the inbox they answer in. */
  | "agent"
  /** Reads the numbers, changes nothing. */
  | "viewer";

export const ROLE_LABEL: Record<MerchantRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Marketing Manager",
  agent: "Support Agent",
  viewer: "Viewer",
};

/** Everyone. The default for anything without its own rule. */
export const ALL_ROLES: readonly MerchantRole[] = [
  "owner",
  "admin",
  "manager",
  "agent",
  "viewer",
];

/** Runs the business: owns billing, integrations, team and commerce. */
export const OPERATORS: readonly MerchantRole[] = ["owner", "admin"];

/** Anyone who *does* marketing work, as opposed to reading about it. */
export const MARKETERS: readonly MerchantRole[] = ["owner", "admin", "manager"];

/** Marketers plus the front line — everyone who touches a customer record. */
export const CUSTOMER_FACING: readonly MerchantRole[] = [
  "owner",
  "admin",
  "manager",
  "agent",
];

/** Everyone who is allowed to read reporting. */
export const ANALYSTS: readonly MerchantRole[] = [
  "owner",
  "admin",
  "manager",
  "viewer",
];

export const hasRole = (
  allowed: readonly MerchantRole[] | undefined,
  role: MerchantRole,
) => !allowed || allowed.includes(role);
