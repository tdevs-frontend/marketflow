"use client";

import { useMemo, useSyncExternalStore } from "react";

import { recordAuditEvent } from "@/components/workspace/workspace-audit-store";
import {
  ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  MESSAGE_MAX,
  MESSAGE_MIN,
  SUBJECT_MAX,
  SUPPORT_ROUTES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  statusLabel,
} from "@/constants/support";
import {
  NEXT_TICKET_NUMBER,
  SUPPORT_EVENTS,
  SUPPORT_MESSAGES,
  SUPPORT_TICKETS,
} from "@/lib/support-fixtures";
import type {
  RelatedResourceType,
  SupportAttachment,
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketEvent,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

/**
 * The merchant's side of the support API.
 *
 * This project is the merchant dashboard; tickets are managed - assigned,
 * answered, resolved - in MarketFlow's separate Admin dashboard, and its
 * replies reach the merchant through the support API as messages with
 * `senderType: "support"`. So this service does exactly what a merchant can
 * do and nothing more: list and read their workspace's tickets, open one,
 * reply, and reopen a resolved one.
 *
 * Every function takes the merchant *actor* and applies the rules the API will
 * apply: tickets are scoped to the actor's workspace, and one from elsewhere
 * resolves to "not found" (so ticket numbers cannot be probed); text is
 * sanitised and length-checked; files are checked by their bytes; abusive
 * submission rates are refused. Components never touch the records.
 *
 * Mock mode, and honestly so: there is no support API in this repo yet, so it
 * runs over session data with the same `useSyncExternalStore` shape as
 * `lib/form-store`, and a reload starts from the fixtures. Each write below is
 * the request it will become; the checks move to the server with it.
 */

/** Who is asking. With the API, the server derives this from the session. */
export interface MerchantActor {
  userId: string;
  workspaceId: string;
  name: string;
  email: string;
  planName: string;
}

export type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */

interface SupportState {
  tickets: SupportTicket[];
  messages: SupportMessage[];
  events: SupportTicketEvent[];
  nextNumber: number;
}

const INITIAL: SupportState = {
  tickets: SUPPORT_TICKETS,
  messages: SUPPORT_MESSAGES,
  events: SUPPORT_EVENTS,
  nextNumber: NEXT_TICKET_NUMBER,
};

let snapshot: SupportState = INITIAL;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Partial<SupportState>) {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) listener();
}

function useSnapshot() {
  return useSyncExternalStore(subscribe, () => snapshot, () => INITIAL);
}

let sequence = 0;
const mint = (prefix: string) => {
  sequence += 1;
  return `${prefix}-s${Date.now().toString(36)}${sequence}`;
};
const now = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/* Scoping                                                                    */
/* -------------------------------------------------------------------------- */

const canSee = (actor: MerchantActor, ticket: SupportTicket) =>
  ticket.workspaceId === actor.workspaceId;

function findTicket(state: SupportState, actor: MerchantActor, ticketNumber: string) {
  const ticket = state.tickets.find(
    (item) => item.ticketNumber.toLowerCase() === ticketNumber.toLowerCase(),
  );
  /* Another workspace's ticket and a missing one answer the same way. */
  return ticket && canSee(actor, ticket) ? ticket : null;
}

function toDetail(state: SupportState, ticket: SupportTicket): SupportTicketDetail {
  const messages = state.messages.filter((message) => message.ticketId === ticket.id);
  const last = messages[messages.length - 1];
  return {
    ...ticket,
    messages,
    events: state.events.filter((event) => event.ticketId === ticket.id),
    lastReplyAt: last?.createdAt ?? ticket.createdAt,
    lastReplyBy: last?.senderType ?? "merchant",
  };
}

/** `GET /support/tickets` - this workspace's tickets, newest activity first. */
export function useSupportTickets(actor: MerchantActor) {
  const state = useSnapshot();
  return useMemo(
    () =>
      state.tickets
        .filter((ticket) => canSee(actor, ticket))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((ticket) => toDetail(state, ticket)),
    [state, actor],
  );
}

/** `GET /support/tickets/:number` - `null` when missing *or* not theirs. */
export function useSupportTicket(actor: MerchantActor, ticketNumber: string) {
  const state = useSnapshot();
  return useMemo(() => {
    const ticket = findTicket(state, actor, ticketNumber);
    return ticket ? toDetail(state, ticket) : null;
  }, [state, actor, ticketNumber]);
}

/**
 * An attachment's URL, if the actor may open it - checked against the ticket
 * the file belongs to. Sample attachments have a record but no stored bytes,
 * so they return `null` and the UI says so rather than offering a dead link.
 */
export function attachmentUrl(actor: MerchantActor, attachment: SupportAttachment): string | null {
  const message = snapshot.messages.find((item) => item.id === attachment.messageId);
  const ticket = snapshot.tickets.find((item) => item.id === message?.ticketId);
  if (!ticket || !canSee(actor, ticket)) return null;
  return attachment.url ?? null;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Plain text, and only plain text. Messages are rendered as text - React
 * escapes them and nothing ever sets HTML - so the job is to drop what text
 * should not contain: control characters (keeping newlines and tabs), the bidi
 * overrides that can disguise a link, and runs of blank lines.
 */
export function sanitizeText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function validateBody(body: string): string | null {
  if (body.length < MESSAGE_MIN) return `Write at least ${MESSAGE_MIN} characters.`;
  if (body.length > MESSAGE_MAX) return `Keep it under ${MESSAGE_MAX.toLocaleString()} characters.`;
  return null;
}

const EXTENSIONS: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  log: "text/plain",
};

/** A file name that is safe to show and store: no path, no control characters. */
function safeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[\u0000-\u001F\u007F<>:"|?*]/g, "").trim();
  return (cleaned || "file").slice(0, 120);
}

/**
 * The file's real type, read from its first bytes. The extension and the
 * browser's `file.type` are claims the uploader controls; the signature is not.
 */
async function sniff(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...bytes: number[]) => bytes.every((byte, index) => head[index] === byte);
  const ascii = (offset: number, text: string) =>
    [...text].every((char, index) => head[offset + index] === char.charCodeAt(0));

  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (ascii(0, "GIF8")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(0, "%PDF")) return "application/pdf";

  /* Text has no signature: accept it only if the first 8KB decode as UTF-8
     and contain no NUL - which is what separates a log from a binary. */
  try {
    const sample = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
    if (sample.includes(0)) return null;
    new TextDecoder("utf-8", { fatal: true }).decode(sample);
    return "text/plain";
  } catch {
    return null;
  }
}

export async function validateAttachments(
  files: File[],
): Promise<{ ok: true; files: { file: File; type: string; name: string }[] } | { ok: false; error: string }> {
  if (files.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `Attach up to ${MAX_ATTACHMENTS} files.` };
  }

  const accepted: { file: File; type: string; name: string }[] = [];
  for (const file of files) {
    const name = safeFileName(file.name);
    if (file.size === 0) return { ok: false, error: `${name} is empty.` };
    if (file.size > MAX_ATTACHMENT_BYTES) return { ok: false, error: `${name} is over the 10 MB limit.` };
    const extension = name.split(".").pop()?.toLowerCase() ?? "";
    const claimed = EXTENSIONS[extension];
    if (!claimed) {
      return { ok: false, error: `${name}: only images, PDFs and .txt/.log files can be attached.` };
    }
    const actual = await sniff(file);
    if (!actual || actual !== claimed || !ATTACHMENT_TYPES[actual]) {
      return { ok: false, error: `${name} does not look like a ${extension.toUpperCase()} file, so it was not attached.` };
    }
    accepted.push({ file, type: actual, name });
  }
  return { ok: true, files: accepted };
}

async function storeFiles(files: File[], messageId: string): Promise<Result<{ attachments: SupportAttachment[] }>> {
  const checked = await validateAttachments(files);
  if (!checked.ok) return checked;
  return {
    ok: true,
    attachments: checked.files.map((item) => ({
      id: mint("att"),
      messageId,
      fileName: item.name,
      fileType: item.type,
      fileSize: item.file.size,
      /* Held by this tab until the upload endpoint exists. */
      url: URL.createObjectURL(item.file),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Rate limits                                                                */
/* -------------------------------------------------------------------------- */

const LIMITS = {
  create: { max: 3, windowMs: 10 * 60_000, message: "You've opened several tickets in the last few minutes. Please wait a little before opening another - or add to an existing one." },
  reply: { max: 10, windowMs: 2 * 60_000, message: "You're sending replies very quickly. Please wait a minute and try again." },
} as const;

const hits = new Map<string, number[]>();

/** A sliding window per member and action. The server keeps the real one. */
function rateLimited(actor: MerchantActor, action: keyof typeof LIMITS): string | null {
  const key = `${actor.userId}:${action}`;
  const { max, windowMs, message } = LIMITS[action];
  const cutoff = Date.now() - windowMs;
  const recent = (hits.get(key) ?? []).filter((time) => time > cutoff);
  if (recent.length >= max) return message;
  hits.set(key, [...recent, Date.now()]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/** Into the workspace's own audit trail - the merchant's actions on tickets. */
function audit(ticket: SupportTicket, actor: MerchantActor, actionLabel: string, change?: { field: string; before: string; after: string }) {
  recordAuditEvent({
    id: mint("aud"),
    workspaceId: ticket.workspaceId,
    actorId: actor.userId,
    actorName: actor.name,
    action: `support.${actionLabel.toLowerCase().replace(/\s+/g, "_")}`,
    actionLabel,
    module: "support",
    resourceType: "support_ticket",
    resourceId: ticket.id,
    resourceName: `${ticket.ticketNumber} · ${ticket.subject}`,
    resourceHref: SUPPORT_ROUTES.ticket(ticket.ticketNumber),
    status: "success",
    severity: "normal",
    createdAt: now(),
    ipAddress: null,
    userAgent: null,
    changes: change ? [change] : [],
  });
}

const event = (
  ticket: SupportTicket,
  type: SupportTicketEvent["type"],
  from?: TicketStatus,
  to?: TicketStatus,
): SupportTicketEvent => ({ id: mint("evt"), ticketId: ticket.id, type, actor: "merchant", from, to, createdAt: now() });

const patchTicket = (id: string, patch: Partial<SupportTicket>) =>
  snapshot.tickets.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket));

export interface NewTicketInput {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  related?: { type: RelatedResourceType; id: string; label: string };
  files: File[];
}

const CATEGORY_KEYS = new Set(TICKET_CATEGORIES.map((item) => item.value));
const PRIORITY_KEYS = new Set(TICKET_PRIORITIES.map((item) => item.value));

/**
 * `POST /support/tickets`.
 *
 * The member, workspace, email and plan come from the actor - the session -
 * never from the form, so a ticket cannot be opened "as" another workspace.
 */
export async function createTicket(
  actor: MerchantActor,
  input: NewTicketInput,
): Promise<Result<{ ticketNumber: string }>> {
  const subject = sanitizeText(input.subject).replace(/\s+/g, " ");
  const description = sanitizeText(input.description);
  if (subject.length < 5) return { ok: false, error: "Give the ticket a subject of at least 5 characters." };
  if (subject.length > SUBJECT_MAX) return { ok: false, error: `Keep the subject under ${SUBJECT_MAX} characters.` };
  if (!CATEGORY_KEYS.has(input.category)) return { ok: false, error: "Choose a category." };
  if (!PRIORITY_KEYS.has(input.priority)) return { ok: false, error: "Choose a priority." };
  const bodyError = validateBody(description);
  if (bodyError) return { ok: false, error: bodyError };

  const limited = rateLimited(actor, "create");
  if (limited) return { ok: false, error: limited };

  const id = mint("tkt");
  const messageId = mint("msg");
  const stored = await storeFiles(input.files, messageId);
  if (!stored.ok) return stored;

  const at = now();
  const ticket: SupportTicket = {
    id,
    ticketNumber: `MF-${snapshot.nextNumber}`,
    merchantId: actor.userId,
    merchantName: actor.name,
    merchantEmail: actor.email,
    workspaceId: actor.workspaceId,
    planName: actor.planName,
    subject,
    category: input.category,
    priority: input.priority,
    status: "open",
    relatedResourceType: input.related?.type,
    relatedResourceId: input.related?.id,
    relatedResourceLabel: input.related?.label ? sanitizeText(input.related.label) : undefined,
    createdAt: at,
    updatedAt: at,
  };

  commit({
    nextNumber: snapshot.nextNumber + 1,
    tickets: [ticket, ...snapshot.tickets],
    messages: [
      ...snapshot.messages,
      { id: messageId, ticketId: id, senderType: "merchant", senderName: actor.name, message: description, attachments: stored.attachments, createdAt: at },
    ],
    events: [...snapshot.events, event(ticket, "created")],
  });

  audit(ticket, actor, "Opened support ticket");
  return { ok: true, ticketNumber: ticket.ticketNumber };
}

/** Whether the merchant may still write on this ticket. Closed is final. */
export const acceptsReplies = (status: TicketStatus) => status !== "closed";

/**
 * `POST /support/tickets/:number/messages`.
 *
 * A reply hands the ticket back to support - Waiting for Support - and on a
 * resolved ticket it reopens it, because the merchant coming back is exactly
 * what reopening means. A closed ticket takes no replies.
 */
export async function replyToTicket(
  actor: MerchantActor,
  ticketNumber: string,
  rawBody: string,
  files: File[],
): Promise<Result<{ reopened: boolean }>> {
  const ticket = findTicket(snapshot, actor, ticketNumber);
  if (!ticket) return { ok: false, error: "That ticket could not be found." };
  if (!acceptsReplies(ticket.status)) {
    return { ok: false, error: "This ticket is closed. Open a new ticket and mention its number." };
  }

  const body = sanitizeText(rawBody);
  const bodyError = validateBody(body);
  if (bodyError) return { ok: false, error: bodyError };
  const limited = rateLimited(actor, "reply");
  if (limited) return { ok: false, error: limited };

  const messageId = mint("msg");
  const stored = await storeFiles(files, messageId);
  if (!stored.ok) return stored;

  const at = now();
  const next: TicketStatus = "waiting_support";
  const reopened = ticket.status === "resolved";
  const events = [...snapshot.events];
  if (reopened) events.push(event(ticket, "reopened", ticket.status, next));
  else if (ticket.status !== next) events.push(event(ticket, "status_changed", ticket.status, next));

  commit({
    tickets: patchTicket(ticket.id, { status: next, updatedAt: at, resolvedAt: reopened ? undefined : ticket.resolvedAt }),
    messages: [
      ...snapshot.messages,
      { id: messageId, ticketId: ticket.id, senderType: "merchant", senderName: actor.name, message: body, attachments: stored.attachments, createdAt: at },
    ],
    events,
  });

  if (reopened) audit(ticket, actor, "Reopened support ticket", { field: "Status", before: statusLabel(ticket.status), after: statusLabel(next) });
  return { ok: true, reopened };
}

/**
 * `POST /support/tickets/:number/reopen` - a resolved ticket, back to support.
 * The only status a merchant can change, and only from Resolved.
 */
export function reopenTicket(actor: MerchantActor, ticketNumber: string): Result<object> {
  const ticket = findTicket(snapshot, actor, ticketNumber);
  if (!ticket) return { ok: false, error: "That ticket could not be found." };
  if (ticket.status !== "resolved") return { ok: false, error: "Only a resolved ticket can be reopened." };

  const next: TicketStatus = "waiting_support";
  commit({
    tickets: patchTicket(ticket.id, { status: next, updatedAt: now(), resolvedAt: undefined }),
    events: [...snapshot.events, event(ticket, "reopened", ticket.status, next)],
  });
  audit(ticket, actor, "Reopened support ticket", { field: "Status", before: statusLabel(ticket.status), after: statusLabel(next) });
  return { ok: true };
}
