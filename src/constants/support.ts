import type { BadgeVariant } from "@/components/ui/badge";
import type {
  RelatedResourceType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

/**
 * The Support module's vocabulary, shared by both sides of the desk so a
 * merchant and an agent read the same ticket in the same words.
 */

export const SUPPORT_ROUTES = {
  /* Merchant - inside the dashboard. */
  center: "/dashboard/support",
  create: "/dashboard/support/new",
  ticket: (number: string) => `/dashboard/support/${number}`,
  /* Admin - a separate area, outside `/dashboard` and its sidebar. */
  desk: "/admin/support",
  deskTicket: (number: string) => `/admin/support/${number}`,
} as const;

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_support", label: "Waiting for Support" },
  { value: "waiting_merchant", label: "Waiting for Merchant" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const statusLabel = (status: TicketStatus) =>
  TICKET_STATUSES.find((item) => item.value === status)?.label ?? status;

/**
 * What the merchant reads for the two waiting states - the same fact, said
 * from their side of the desk. "Waiting for Merchant" is how an agent files
 * it; to the merchant it is a ticket waiting on *them*.
 */
export const merchantStatusLabel = (status: TicketStatus) =>
  status === "waiting_merchant"
    ? "Waiting for You"
    : status === "waiting_support"
      ? "Waiting for Support"
      : statusLabel(status);

export const STATUS_TONE: Record<TicketStatus, BadgeVariant> = {
  open: "info",
  in_progress: "primary",
  waiting_support: "warning",
  waiting_merchant: "secondary",
  resolved: "success",
  closed: "neutral",
};

/** Statuses that still need work - what "Open Tickets" counts. */
export const ACTIVE_STATUSES: readonly TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_support",
  "waiting_merchant",
];

/**
 * Where an agent may move a ticket from each status.
 *
 * Closed is terminal except for reopening, and reopening always lands in
 * Waiting for Support - the merchant came back, so the next move is ours.
 */
export const STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ["in_progress", "waiting_merchant", "resolved", "closed"],
  in_progress: ["waiting_merchant", "waiting_support", "resolved", "closed"],
  waiting_support: ["in_progress", "waiting_merchant", "resolved", "closed"],
  waiting_merchant: ["in_progress", "waiting_support", "resolved", "closed"],
  resolved: ["closed", "waiting_support"],
  closed: ["waiting_support"],
};

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const priorityLabel = (priority: TicketPriority) =>
  TICKET_PRIORITIES.find((item) => item.value === priority)?.label ?? priority;

export const PRIORITY_TONE: Record<TicketPriority, BadgeVariant> = {
  low: "neutral",
  normal: "default",
  high: "warning",
  urgent: "error",
};

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "campaigns", label: "Campaigns" },
  { value: "automation", label: "Automation" },
  { value: "integrations", label: "Integrations" },
  { value: "technical", label: "Technical Issue" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (category: TicketCategory) =>
  TICKET_CATEGORIES.find((item) => item.value === category)?.label ?? category;

export const RELATED_RESOURCE_TYPES: { value: RelatedResourceType; label: string }[] = [
  { value: "whatsapp_connection", label: "WhatsApp connection" },
  { value: "campaign", label: "Campaign" },
  { value: "order", label: "Order" },
  { value: "workflow", label: "Automation workflow" },
  { value: "integration", label: "Integration" },
];

export const resourceTypeLabel = (type: RelatedResourceType) =>
  RELATED_RESOURCE_TYPES.find((item) => item.value === type)?.label ?? type;

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */

export const SUBJECT_MAX = 140;
export const MESSAGE_MAX = 5000;
export const MESSAGE_MIN = 10;

/**
 * Attachments: screenshots, PDFs and plain-text logs, nothing executable.
 *
 * SVG is deliberately absent - it is an image that can carry script - and so
 * is HTML. The type is checked against the file's first bytes, not its name,
 * so `invoice.pdf.exe` renamed to `invoice.pdf` is still refused.
 */
export const ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "PNG image",
  "image/jpeg": "JPEG image",
  "image/gif": "GIF image",
  "image/webp": "WebP image",
  "application/pdf": "PDF",
  "text/plain": "Text file",
};

export const ATTACHMENT_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.log,image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
