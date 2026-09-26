/**
 * The merchant Support Center's data model.
 *
 * This project is the merchant dashboard. Tickets are *managed* in MarketFlow's
 * separate Admin dashboard; here they are created, read and replied to. So the
 * shapes below are exactly what the support API returns to a merchant - no
 * internal notes, no assignment, no agent records, no admin-only fields - and
 * a support reply is simply a message whose `senderType` is `"support"`.
 * There is nowhere in these types for admin data to arrive, which is the point.
 *
 * Kept compatible with the Admin side's records: the same ticket number, the
 * same status and priority vocabulary, `merchantId` and `workspaceId` on every
 * ticket so the other dashboard can route and scope it.
 */

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_merchant"
  | "waiting_support"
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

export interface SupportAttachment {
  id: string;
  messageId: string;
  fileName: string;
  /** The validated MIME type - checked against the file's bytes, not its name. */
  fileType: string;
  fileSize: number;
  /**
   * Where to open it. A `blob:` URL for a file attached this session; absent
   * for sample attachments, which have a record but no stored file.
   */
  url?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderType: "merchant" | "support";
  /** "MarketFlow Support", or the replying agent's name as the API sends it. */
  senderName: string;
  /** Plain text. Never rendered as HTML. */
  message: string;
  attachments: SupportAttachment[];
  createdAt: string;
}

/** What the merchant can see happened to their ticket. */
export type TicketEventType = "created" | "status_changed" | "resolved" | "closed" | "reopened";

export interface SupportTicketEvent {
  id: string;
  ticketId: string;
  type: TicketEventType;
  /** Who did it, from the merchant's point of view. */
  actor: "merchant" | "support";
  from?: TicketStatus;
  to?: TicketStatus;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  /** Human-facing, as merchants quote it: `MF-1024`. */
  ticketNumber: string;
  /** The member who opened it - attached from the session, never typed. */
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  workspaceId: string;
  planName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  relatedResourceType?: RelatedResourceType;
  relatedResourceId?: string;
  relatedResourceLabel?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

/** A ticket with its thread and history, as the detail page reads it. */
export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
  events: SupportTicketEvent[];
  /** The last message's time and side - for the list's Last Reply column. */
  lastReplyAt: string;
  lastReplyBy: SupportMessage["senderType"];
}
