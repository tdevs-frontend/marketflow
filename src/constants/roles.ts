/**
 * Who a person is inside one merchant workspace.
 *
 * These are *workspace* roles, not platform roles. MarketFlow's Admin
 * Dashboard - merchant management, plans, system health - is a separate
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
  /** Owns the pipeline: leads, contacts, the deals in flight. */
  | "sales"
  /** Front line: the people they talk to, and the inbox they answer in. */
  | "agent"
  /** Reads the numbers and builds the reports. Changes nothing else. */
  | "analyst"
  /** Reads the numbers, changes nothing. */
  | "viewer";

/**
 * `admin` is labelled "Workspace Admin", not "Admin".
 *
 * The distinction is load-bearing. MarketFlow's Admin Dashboard is a separate
 * application, and a row in the team table reading "Admin" invites a merchant
 * to believe they have just granted platform access. Spelling it out means the
 * label says which admin it is everywhere it is rendered.
 */
export const ROLE_LABEL: Record<MerchantRole, string> = {
  owner: "Owner",
  admin: "Workspace Admin",
  manager: "Marketing Manager",
  sales: "Sales Agent",
  agent: "Support Agent",
  analyst: "Analyst",
  viewer: "Viewer",
};

/** Everyone. The default for anything without its own rule. */
export const ALL_ROLES: readonly MerchantRole[] = [
  "owner",
  "admin",
  "manager",
  "sales",
  "agent",
  "analyst",
  "viewer",
];

/** Runs the business: owns billing, integrations, team and commerce. */
export const OPERATORS: readonly MerchantRole[] = ["owner", "admin"];

/** Anyone who *does* marketing work, as opposed to reading about it. */
export const MARKETERS: readonly MerchantRole[] = ["owner", "admin", "manager"];

/** Marketers plus the front line - everyone who touches a customer record. */
export const CUSTOMER_FACING: readonly MerchantRole[] = [
  "owner",
  "admin",
  "manager",
  "sales",
  "agent",
];

/** Everyone who is allowed to read reporting. */
export const ANALYSTS: readonly MerchantRole[] = [
  "owner",
  "admin",
  "manager",
  "analyst",
  "viewer",
];

export const hasRole = (
  allowed: readonly MerchantRole[] | undefined,
  role: MerchantRole,
) => !allowed || allowed.includes(role);
