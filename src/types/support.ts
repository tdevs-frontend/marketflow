/**
 * The Support / Help Desk data model.
 *
 * Two audiences read the same tickets, and the types are split along that
 * line on purpose. `SupportTicket` and `SupportMessage` are the *stored*
 * records - the `support_tickets`, `support_messages`, `support_attachments`
 * and `support_ticket_events` tables - and only the support service ever holds
 * them. What leaves it is a *view*: `AgentTicketView` for the Admin Support
 * Desk, `MerchantTicketView` for the merchant's Support Center. The merchant
 * view has no field that can carry an internal note or an assignment history,
 * so a note cannot leak into it by a component forgetting to filter - there is
 * nowhere in the type for it to go.
 *
 * Shaped like the API responses it will become: ids, ISO timestamps, and the
 * workspace/merchant context the server attaches rather than the client.
 */

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_support"
  | "waiting_merchant"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketCategory =
  | "account"
  | "billing"
  | "whatsapp"
  | "email"
  | "sms"
  | "campaigns"
  | "automation"
  | "integrations"
  | "technical"
  | "feature_request"
  | "other";

/** The kinds of workspace record a ticket can point at. */
export type RelatedResourceType =
  | "campaign"
  | "workflow"
  | "integration"
  | "order"
  | "whatsapp_connection";

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

/** A MarketFlow staff member. Platform-side - not a workspace role. */
export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  /** Leads can see every queue; agents work the tickets assigned to them. */
  role: "agent" | "lead";
  title: string;
}

/**
 * A merchant workspace as the support desk sees it.
 *
 * The desk reads across workspaces, which the merchant dashboard never does,
 * so this is its own shape rather than the merchant app's workspace settings.
 */
export interface SupportWorkspace {
  id: string;
  name: string;
  planName: string;
  ownerName: string;
  ownerEmail: string;
  country: string;
  memberCount: number;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Stored records                                                             */
/* -------------------------------------------------------------------------- */

/** `support_attachments`. The file itself lives in object storage. */
export interface SupportAttachment {
  id: string;
  messageId: string;
  fileName: string;
  /** The validated MIME type - checked against the file's bytes, not its name. */
  fileType: string;
  fileSize: number;
  /**
   * Where the bytes are. A `blob:` URL for a file attached this session; absent
   * for sample attachments, which have a record but no stored file.
   */
  filePath?: string;
}

/** `support_messages`. */
export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: "merchant" | "agent" | "system";
  /** Plain text, sanitised on write. Never rendered as HTML. */
  body: string;
  /** Agent-only. The merchant view drops these before anything else happens. */
  isInternalNote: boolean;
  createdAt: string;
  attachments: SupportAttachment[];
}

export type TicketEventType =
  | "created"
  | "assigned"
  | "unassigned"
  | "status_changed"
  | "priority_changed"
  | "resolved"
  | "closed"
  | "reopened";

/** `support_ticket_events` - the ticket's own history, assignment included. */
export interface TicketEvent {
  id: string;
  ticketId: string;
  type: TicketEventType;
  actorId: string;
  actorType: "merchant" | "agent" | "system";
  from?: string;
  to?: string;
  createdAt: string;
}

/** `support_tickets`. */
export interface SupportTicket {
  id: string;
  /** Human-facing, as merchants quote it: `MF-1024`. */
  ticketNumber: string;
  workspaceId: string;
  /** The member who opened it. */
  createdBy: string;
  /** Captured at creation from the session - never typed by the merchant. */
  merchantName: string;
  merchantEmail: string;
  planName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  relatedResourceType?: RelatedResourceType;
  relatedResourceId?: string;
  /** Resolved for display at write time, so the desk can read it without the merchant's data. */
  relatedResourceLabel?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  /** When an agent first replied - the basis of the response-time KPI. */
  firstResponseAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Views                                                                      */
/* -------------------------------------------------------------------------- */

/** A message as the merchant may see it: never a note, never a note's files. */
export interface MerchantMessage {
  id: string;
  senderName: string;
  senderRole: "You" | "Merchant" | "Support Agent" | "MarketFlow";
  senderType: "merchant" | "agent" | "system";
  body: string;
  createdAt: string;
  attachments: SupportAttachment[];
}

export interface MerchantTicketView {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  /** The agent's display name only - no id, no email, no workload. */
  assignedAgentName: string | null;
  relatedResourceType?: RelatedResourceType;
  relatedResourceLabel?: string;
  createdAt: string;
  updatedAt: string;
  /** The last *visible* message - an internal note never moves this. */
  lastReplyAt: string;
  lastReplyBy: "merchant" | "agent" | "system";
  messages: MerchantMessage[];
}

export interface AgentMessage extends SupportMessage {
  senderName: string;
  senderRole: string;
}

export interface AgentTicketView extends SupportTicket {
  workspace: SupportWorkspace | null;
  assignee: SupportAgent | null;
  lastActivityAt: string;
  messages: AgentMessage[];
  events: TicketEvent[];
}
