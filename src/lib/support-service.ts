"use client";

import { useMemo, useSyncExternalStore } from "react";

import { recordAuditEvent } from "@/components/workspace/workspace-audit-store";
import {
  ACTIVE_STATUSES,
  ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  MESSAGE_MAX,
  MESSAGE_MIN,
  STATUS_TRANSITIONS,
  SUBJECT_MAX,
  SUPPORT_ROUTES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  merchantStatusLabel,
  priorityLabel,
  statusLabel,
} from "@/constants/support";
import {
  CURRENT_AGENT_ID,
  NEXT_TICKET_NUMBER,
  SUPPORT_EVENTS,
  SUPPORT_MESSAGES,
  SUPPORT_TICKETS,
  agentById,
  supportWorkspaceById,
} from "@/lib/support-fixtures";
import type { FeedNotification } from "@/types/notification";
import type {
  AgentTicketView,
  MerchantMessage,
  MerchantTicketView,
  RelatedResourceType,
  SupportAttachment,
  SupportMessage,
  SupportTicket,
  TicketCategory,
  TicketEvent,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

/**
 * The support service - the one door into the help desk's data.
 *
 * Every read and every write goes through a function here that is handed an
 * *actor*, and that function is where the rules live: a merchant only ever
 * receives tickets from their own workspace, a ticket number from another
 * workspace resolves to "not found" rather than "forbidden" (so ids cannot be
 * probed), internal notes are removed before a merchant view is even shaped,
 * input is validated and sanitised, files are checked by their bytes, and
 * abusive submission rates are refused. Components never touch the records.
 *
 * Mock mode, and honestly so. There is no support API yet, so this runs in the
 * browser over session data - the same `useSyncExternalStore` shape as
 * `lib/form-store` and `lib/social-post-store` - and a reload starts from the
 * fixtures. The functions are the API's contract: when the endpoints exist,
 * each one becomes a request and the same checks run on the server, where they
 * are actually enforceable. The UI says so on both sides of the desk.
 */

/* -------------------------------------------------------------------------- */
/* Actors                                                                     */
/* -------------------------------------------------------------------------- */

/** Who is asking. With the API, the server derives this from the session. */
export type SupportActor =
  | {
      kind: "merchant";
      userId: string;
      workspaceId: string;
      name: string;
      email: string;
      planName: string;
    }
  | { kind: "agent"; agentId: string };

export type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * What a write set in motion, for the caller to deliver.
 *
 * Returned rather than dispatched here, because the in-app feed is a Redux
 * slice and this module is not a component. `useSupportActions` hands these
 * to the existing `notify` action - the product's one notification engine.
 */
export type MerchantNotice = Omit<FeedNotification, "id" | "read" | "createdAt">;

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */

interface SupportState {
  tickets: SupportTicket[];
  messages: SupportMessage[];
  events: TicketEvent[];
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
/* Authorisation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Whether the actor may see this ticket at all.
 *
 * Agents see every workspace's tickets - the desk is a platform tool. A
 * merchant sees their own workspace's and nothing else.
 */
function canSee(actor: SupportActor, ticket: SupportTicket) {
  if (actor.kind === "agent") return Boolean(agentById(actor.agentId));
  return ticket.workspaceId === actor.workspaceId;
}

function findTicket(actor: SupportActor, ticketNumber: string) {
  const ticket = snapshot.tickets.find(
    (item) => item.ticketNumber.toLowerCase() === ticketNumber.toLowerCase(),
  );
  /* Another workspace's ticket and a ticket that does not exist answer the
     same way, so a merchant cannot learn which numbers are in use. */
  return ticket && canSee(actor, ticket) ? ticket : null;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Plain text, and only plain text.
 *
 * Messages are stored and rendered as text - React escapes them, and nothing
 * here or in the UI ever sets HTML - so the job is to drop what text should
 * not contain: control characters (keeping newlines and tabs), the bidi
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

/** A file name that is safe to show and to store: no path, no control characters. */
function safeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[\u0000-\u001F\u007F<>:"|?*]/g, "").trim();
  return (cleaned || "file").slice(0, 120);
}

/**
 * The file's real type, read from its first bytes.
 *
 * The extension and the browser's `file.type` are both claims the uploader
 * controls; the signature is not. A file whose bytes do not match an allowed
 * type is refused whatever it is called.
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
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: `${name} is over the 10 MB limit.` };
    }
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

/* -------------------------------------------------------------------------- */
/* Rate limits                                                                */
/* -------------------------------------------------------------------------- */

const LIMITS = {
  create: { max: 3, windowMs: 10 * 60_000, message: "You've opened several tickets in the last few minutes. Please wait a little before opening another - or add to an existing one." },
  reply: { max: 10, windowMs: 2 * 60_000, message: "You're sending replies very quickly. Please wait a minute and try again." },
} as const;

const hits = new Map<string, number[]>();

/** A sliding window per actor and action. The server keeps the real one. */
function rateLimited(actor: SupportActor, action: keyof typeof LIMITS): string | null {
  const key = `${actor.kind === "agent" ? actor.agentId : actor.userId}:${action}`;
  const { max, windowMs, message } = LIMITS[action];
  const cutoff = Date.now() - windowMs;
  const recent = (hits.get(key) ?? []).filter((time) => time > cutoff);
  if (recent.length >= max) return message;
  hits.set(key, [...recent, Date.now()]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Views                                                                      */
/* -------------------------------------------------------------------------- */

function senderOf(ticket: SupportTicket, message: SupportMessage) {
  if (message.senderType === "agent") {
    const agent = agentById(message.senderId);
    return { name: agent?.name ?? "MarketFlow Support", role: "Support Agent" as const };
  }
  if (message.senderType === "system") return { name: "MarketFlow", role: "MarketFlow" as const };
  return { name: ticket.merchantName, role: "Merchant" as const };
}

/**
 * The ticket as a merchant may see it.
 *
 * Internal notes are filtered out *first*, before a single field is copied, so
 * nothing further down - the last-reply time, the attachment list - can be
 * derived from one. The type has no slot for assignment history or agent ids.
 */
function toMerchantView(ticket: SupportTicket, state: SupportState, viewerId: string): MerchantTicketView {
  const visible = state.messages.filter(
    (message) => message.ticketId === ticket.id && !message.isInternalNote,
  );

  const messages: MerchantMessage[] = visible.map((message) => {
    const sender = senderOf(ticket, message);
    return {
      id: message.id,
      senderName: sender.name,
      senderRole:
        message.senderType === "merchant" && message.senderId === viewerId ? "You" : sender.role,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt,
      attachments: message.attachments,
    };
  });

  const last = visible[visible.length - 1];

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    assignedAgentName: agentById(ticket.assignedTo)?.name ?? null,
    relatedResourceType: ticket.relatedResourceType,
    relatedResourceLabel: ticket.relatedResourceLabel,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    lastReplyAt: last?.createdAt ?? ticket.createdAt,
    lastReplyBy: last?.senderType ?? "merchant",
    messages,
  };
}

function toAgentView(ticket: SupportTicket, state: SupportState): AgentTicketView {
  const messages = state.messages
    .filter((message) => message.ticketId === ticket.id)
    .map((message) => {
      const sender = senderOf(ticket, message);
      return { ...message, senderName: sender.name, senderRole: message.isInternalNote ? "Internal note" : sender.role };
    });
  const events = state.events.filter((event) => event.ticketId === ticket.id);

  return {
    ...ticket,
    workspace: supportWorkspaceById(ticket.workspaceId),
    assignee: agentById(ticket.assignedTo),
    lastActivityAt: ticket.updatedAt,
    messages,
    events,
  };
}

const byRecent = <T extends { updatedAt: string }>(a: T, b: T) =>
  b.updatedAt.localeCompare(a.updatedAt);

/** `GET /support/tickets` - this workspace's tickets, newest activity first. */
export function useMerchantTickets(actor: SupportActor & { kind: "merchant" }) {
  const state = useSnapshot();
  return useMemo(
    () =>
      state.tickets
        .filter((ticket) => canSee(actor, ticket))
        .sort(byRecent)
        .map((ticket) => toMerchantView(ticket, state, actor.userId)),
    [state, actor],
  );
}

/** `GET /support/tickets/:number` - `null` when missing *or* not theirs. */
export function useMerchantTicket(actor: SupportActor & { kind: "merchant" }, ticketNumber: string) {
  const state = useSnapshot();
  return useMemo(() => {
    const ticket = state.tickets.find(
      (item) => item.ticketNumber.toLowerCase() === ticketNumber.toLowerCase(),
    );
    return ticket && canSee(actor, ticket) ? toMerchantView(ticket, state, actor.userId) : null;
  }, [state, actor, ticketNumber]);
}

/** `GET /admin/support/tickets`. */
export function useAgentTickets(actor: SupportActor & { kind: "agent" }) {
  const state = useSnapshot();
  return useMemo(
    () => state.tickets.filter((ticket) => canSee(actor, ticket)).sort(byRecent).map((ticket) => toAgentView(ticket, state)),
    [state, actor],
  );
}

export function useAgentTicket(actor: SupportActor & { kind: "agent" }, ticketNumber: string) {
  const state = useSnapshot();
  return useMemo(() => {
    const ticket = state.tickets.find(
      (item) => item.ticketNumber.toLowerCase() === ticketNumber.toLowerCase(),
    );
    return ticket && canSee(actor, ticket) ? toAgentView(ticket, state) : null;
  }, [state, actor, ticketNumber]);
}

/**
 * An attachment's URL, if the actor may open it.
 *
 * Checked against the message it belongs to: a merchant cannot open a file on
 * an internal note even with its id, and nobody opens a file on a ticket they
 * cannot see. Sample attachments have a record but no stored bytes, so they
 * return `null` and the UI says the file is not stored in this build.
 */
export function attachmentUrl(actor: SupportActor, attachment: SupportAttachment): string | null {
  const message = snapshot.messages.find((item) => item.id === attachment.messageId);
  const ticket = snapshot.tickets.find((item) => item.id === message?.ticketId);
  if (!message || !ticket || !canSee(actor, ticket)) return null;
  if (message.isInternalNote && actor.kind !== "agent") return null;
  return attachment.filePath ?? null;
}

/* -------------------------------------------------------------------------- */
/* Side effects                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Into the workspace's own audit trail - only for this workspace's tickets,
 * because that trail belongs to the merchant, and only for the events the
 * Workspace Activity page is for: created, assigned, status and priority.
 */
function audit(ticket: SupportTicket, actor: SupportActor, actionLabel: string, change?: { field: string; before: string; after: string }) {
  const agent = actor.kind === "agent" ? agentById(actor.agentId) : null;
  recordAuditEvent({
    id: mint("aud"),
    workspaceId: ticket.workspaceId,
    actorId: actor.kind === "agent" ? actor.agentId : actor.userId,
    actorName: agent ? `${agent.name} (MarketFlow Support)` : actor.kind === "merchant" ? actor.name : "MarketFlow",
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

const auditable = (ticket: SupportTicket, actor: SupportActor) =>
  actor.kind === "merchant" ? ticket.workspaceId === actor.workspaceId : true;

const merchantNotice = (ticket: SupportTicket, title: string, message: string, tone: FeedNotification["tone"] = "info"): MerchantNotice => ({
  module: "support",
  tone,
  title,
  message,
  context: `${ticket.ticketNumber} · ${ticket.subject}`,
  href: SUPPORT_ROUTES.ticket(ticket.ticketNumber),
});

function event(ticket: SupportTicket, actor: SupportActor, type: TicketEvent["type"], from?: string, to?: string): TicketEvent {
  return {
    id: mint("evt"),
    ticketId: ticket.id,
    type,
    actorId: actor.kind === "agent" ? actor.agentId : actor.userId,
    actorType: actor.kind === "agent" ? "agent" : "merchant",
    from,
    to,
    createdAt: now(),
  };
}

function patchTicket(id: string, patch: Partial<SupportTicket>) {
  return snapshot.tickets.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket));
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
      /* Object storage, for this session: the tab holds the bytes. */
      filePath: URL.createObjectURL(item.file),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Merchant writes                                                            */
/* -------------------------------------------------------------------------- */

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
 * The workspace, the member, their email and the plan are taken from the
 * actor - the session - never from the form, so a merchant cannot open a
 * ticket "as" another workspace by editing a field.
 */
export async function createTicket(
  actor: SupportActor,
  input: NewTicketInput,
): Promise<Result<{ ticketNumber: string }>> {
  if (actor.kind !== "merchant") return { ok: false, error: "Only merchants open tickets." };

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
    workspaceId: actor.workspaceId,
    createdBy: actor.userId,
    merchantName: actor.name,
    merchantEmail: actor.email,
    planName: actor.planName,
    subject,
    category: input.category,
    priority: input.priority,
    status: "open",
    assignedTo: null,
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
      {
        id: messageId,
        ticketId: id,
        senderId: actor.userId,
        senderType: "merchant",
        body: description,
        isInternalNote: false,
        createdAt: at,
        attachments: stored.attachments,
      },
    ],
    events: [...snapshot.events, event(ticket, actor, "created")],
  });

  audit(ticket, actor, "Opened support ticket");
  return { ok: true, ticketNumber: ticket.ticketNumber };
}

/**
 * `POST /support/tickets/:number/messages`, as the merchant.
 *
 * A reply hands the ticket back to support. On a resolved ticket it reopens
 * it - the merchant coming back is exactly what Reopen means. A closed ticket
 * takes no replies: it is finished, and the merchant opens a new one.
 */
export async function merchantReply(
  actor: SupportActor,
  ticketNumber: string,
  rawBody: string,
  files: File[],
): Promise<Result<{ reopened: boolean }>> {
  if (actor.kind !== "merchant") return { ok: false, error: "Not a merchant session." };
  const ticket = findTicket(actor, ticketNumber);
  if (!ticket) return { ok: false, error: "That ticket could not be found." };
  if (ticket.status === "closed") {
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

  const reopened = ticket.status === "resolved";
  const at = now();
  const next: TicketStatus = "waiting_support";
  const events = [...snapshot.events];
  if (reopened) events.push(event(ticket, actor, "reopened", ticket.status, next));
  else if (ticket.status !== next) events.push(event(ticket, actor, "status_changed", ticket.status, next));

  commit({
    tickets: patchTicket(ticket.id, { status: next, updatedAt: at, resolvedAt: reopened ? undefined : ticket.resolvedAt }),
    messages: [
      ...snapshot.messages,
      { id: messageId, ticketId: ticket.id, senderId: actor.userId, senderType: "merchant", body, isInternalNote: false, createdAt: at, attachments: stored.attachments },
    ],
    events,
  });

  if (reopened) audit(ticket, actor, "Reopened support ticket", { field: "Status", before: statusLabel(ticket.status), after: statusLabel(next) });
  return { ok: true, reopened };
}

/* -------------------------------------------------------------------------- */
/* Agent writes                                                               */
/* -------------------------------------------------------------------------- */

function agentTicket(actor: SupportActor, ticketNumber: string) {
  if (actor.kind !== "agent" || !agentById(actor.agentId)) return null;
  return findTicket(actor, ticketNumber);
}

/**
 * `POST /admin/support/tickets/:number/messages`.
 *
 * `internal` writes a note: stored on the same thread, never in any merchant
 * view, and it changes nothing the merchant can observe - not the status, not
 * the last-reply time, not their notifications. A public reply moves the
 * ticket to Waiting for Merchant unless the agent unticks that.
 */
export async function agentReply(
  actor: SupportActor,
  ticketNumber: string,
  rawBody: string,
  files: File[],
  options: { internal: boolean; waitForMerchant: boolean },
): Promise<Result<{ notices: MerchantNotice[] }>> {
  const ticket = agentTicket(actor, ticketNumber);
  if (!ticket || actor.kind !== "agent") return { ok: false, error: "That ticket could not be found." };

  const body = sanitizeText(rawBody);
  if (body.length < 2) return { ok: false, error: "Write a message first." };
  if (body.length > MESSAGE_MAX) return { ok: false, error: `Keep it under ${MESSAGE_MAX.toLocaleString()} characters.` };
  const limited = rateLimited(actor, "reply");
  if (limited) return { ok: false, error: limited };

  const messageId = mint("msg");
  const stored = await storeFiles(files, messageId);
  if (!stored.ok) return stored;

  const at = now();
  const message: SupportMessage = {
    id: messageId,
    ticketId: ticket.id,
    senderId: actor.agentId,
    senderType: "agent",
    body,
    isInternalNote: options.internal,
    createdAt: at,
    attachments: stored.attachments,
  };

  if (options.internal) {
    commit({ messages: [...snapshot.messages, message], tickets: patchTicket(ticket.id, { updatedAt: at }) });
    return { ok: true, notices: [] };
  }

  const reopening = ticket.status === "closed" || ticket.status === "resolved";
  const next: TicketStatus =
    options.waitForMerchant && !reopening ? "waiting_merchant" : ticket.status;
  const events = [...snapshot.events];
  if (next !== ticket.status) events.push(event(ticket, actor, "status_changed", ticket.status, next));

  commit({
    messages: [...snapshot.messages, message],
    tickets: patchTicket(ticket.id, {
      status: next,
      updatedAt: at,
      firstResponseAt: ticket.firstResponseAt ?? at,
      /* Replying to an unassigned ticket takes it. */
      assignedTo: ticket.assignedTo ?? actor.agentId,
    }),
    events: ticket.assignedTo ? events : [...events, event(ticket, actor, "assigned", undefined, actor.agentId)],
  });

  const agent = agentById(actor.agentId);
  return {
    ok: true,
    notices: [
      merchantNotice(
        ticket,
        "Support replied",
        `${agent?.name ?? "MarketFlow Support"} replied to your ticket.`,
      ),
    ],
  };
}

/** `PATCH /admin/support/tickets/:number` - assignment. `null` unassigns. */
export function assignTicket(actor: SupportActor, ticketNumber: string, agentId: string | null): Result<object> {
  const ticket = agentTicket(actor, ticketNumber);
  if (!ticket) return { ok: false, error: "That ticket could not be found." };
  if (agentId && !agentById(agentId)) return { ok: false, error: "That agent does not exist." };
  if (ticket.assignedTo === agentId) return { ok: true };

  commit({
    tickets: patchTicket(ticket.id, { assignedTo: agentId, updatedAt: now() }),
    events: [
      ...snapshot.events,
      event(ticket, actor, agentId ? "assigned" : "unassigned", ticket.assignedTo ?? undefined, agentId ?? undefined),
    ],
  });
  if (auditable(ticket, actor)) {
    audit(ticket, actor, agentId ? "Assigned support agent" : "Unassigned support ticket", {
      field: "Assigned to",
      before: agentById(ticket.assignedTo)?.name ?? "Unassigned",
      after: agentById(agentId)?.name ?? "Unassigned",
    });
  }
  return { ok: true };
}

/** `PATCH /admin/support/tickets/:number` - status, along the allowed transitions. */
export function setTicketStatus(
  actor: SupportActor,
  ticketNumber: string,
  status: TicketStatus,
): Result<{ notices: MerchantNotice[] }> {
  const ticket = agentTicket(actor, ticketNumber);
  if (!ticket) return { ok: false, error: "That ticket could not be found." };
  if (ticket.status === status) return { ok: true, notices: [] };
  if (!STATUS_TRANSITIONS[ticket.status].includes(status)) {
    return { ok: false, error: `A ${statusLabel(ticket.status)} ticket can't move to ${statusLabel(status)}.` };
  }

  const at = now();
  const reopening = ticket.status === "resolved" || ticket.status === "closed";
  const type: TicketEvent["type"] =
    status === "resolved" ? "resolved" : status === "closed" ? "closed" : reopening ? "reopened" : "status_changed";

  commit({
    tickets: patchTicket(ticket.id, {
      status,
      updatedAt: at,
      resolvedAt: status === "resolved" ? at : reopening ? undefined : ticket.resolvedAt,
      closedAt: status === "closed" ? at : reopening ? undefined : ticket.closedAt,
    }),
    events: [...snapshot.events, event(ticket, actor, type, ticket.status, status)],
  });

  const label =
    type === "resolved" ? "Resolved support ticket" : type === "closed" ? "Closed support ticket" : type === "reopened" ? "Reopened support ticket" : "Changed support ticket status";
  if (auditable(ticket, actor)) {
    audit(ticket, actor, label, { field: "Status", before: statusLabel(ticket.status), after: statusLabel(status) });
  }

  const notice =
    type === "resolved"
      ? merchantNotice(ticket, "Ticket resolved", "Support marked your ticket as resolved. Reply if it's still not working.", "success")
      : type === "reopened"
        ? merchantNotice(ticket, "Ticket reopened", "Support reopened your ticket.")
        : merchantNotice(ticket, "Ticket status changed", `Your ticket is now ${merchantStatusLabel(status)}.`);
  return { ok: true, notices: [notice] };
}

/** `PATCH /admin/support/tickets/:number` - priority. */
export function setTicketPriority(actor: SupportActor, ticketNumber: string, priority: TicketPriority): Result<object> {
  const ticket = agentTicket(actor, ticketNumber);
  if (!ticket) return { ok: false, error: "That ticket could not be found." };
  if (!PRIORITY_KEYS.has(priority)) return { ok: false, error: "Unknown priority." };
  if (ticket.priority === priority) return { ok: true };

  commit({
    tickets: patchTicket(ticket.id, { priority, updatedAt: now() }),
    events: [...snapshot.events, event(ticket, actor, "priority_changed", ticket.priority, priority)],
  });
  if (auditable(ticket, actor)) {
    audit(ticket, actor, "Changed support ticket priority", {
      field: "Priority",
      before: priorityLabel(ticket.priority),
      after: priorityLabel(priority),
    });
  }
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Desk figures and alerts                                                    */
/* -------------------------------------------------------------------------- */

export interface DeskAlert {
  id: string;
  ticketNumber: string;
  kind: "new_ticket" | "urgent" | "merchant_replied" | "reopened";
  title: string;
  message: string;
  createdAt: string;
}

/**
 * The desk's in-app alerts: new tickets, urgent tickets, merchant replies and
 * reopenings.
 *
 * Derived from the ticket events and messages rather than stored - the admin
 * area has no notification feed of its own in this repo, and inventing a
 * second notification engine for it is exactly what not to do. Each alert is a
 * reading of something that already happened.
 */
export function useDeskAlerts(actor: SupportActor & { kind: "agent" }) {
  const tickets = useAgentTickets(actor);
  return useMemo(() => {
    const alerts: DeskAlert[] = [];
    for (const ticket of tickets) {
      for (const item of ticket.events) {
        if (item.type === "created") {
          alerts.push({
            id: item.id,
            ticketNumber: ticket.ticketNumber,
            kind: ticket.priority === "urgent" ? "urgent" : "new_ticket",
            title: ticket.priority === "urgent" ? "Urgent ticket created" : "New ticket",
            message: `${ticket.workspace?.name ?? ticket.merchantName} · ${ticket.subject}`,
            createdAt: item.createdAt,
          });
        }
        if (item.type === "reopened") {
          alerts.push({ id: item.id, ticketNumber: ticket.ticketNumber, kind: "reopened", title: "Ticket reopened", message: `${ticket.ticketNumber} · ${ticket.subject}`, createdAt: item.createdAt });
        }
      }
      ticket.messages
        .filter((message) => message.senderType === "merchant")
        .slice(1)
        .forEach((message) =>
          alerts.push({
            id: message.id,
            ticketNumber: ticket.ticketNumber,
            kind: "merchant_replied",
            title: "Merchant replied",
            message: `${ticket.merchantName} on ${ticket.ticketNumber} · ${ticket.subject}`,
            createdAt: message.createdAt,
          }),
        );
    }
    return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tickets]);
}

export const isActive = (status: TicketStatus) => ACTIVE_STATUSES.includes(status);

/** The signed-in agent, for the admin area. */
export const CURRENT_AGENT: SupportActor & { kind: "agent" } = { kind: "agent", agentId: CURRENT_AGENT_ID };

