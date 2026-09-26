import { CURRENT_ACCOUNT, SUBSCRIPTION } from "@/lib/account-fixtures";
import { PLANS } from "@/constants/pricing";
import { SUPPORT_TEAM_NAME } from "@/constants/support";
import { WORKSPACE_ID } from "@/lib/workspace-fixtures";
import { minutesAgo } from "@/lib/workspace-clock";
import type {
  SupportAttachment,
  SupportMessage,
  SupportTicket,
  SupportTicketEvent,
  TicketStatus,
} from "@/types/support";

/**
 * This workspace's support tickets, as the support API would return them.
 *
 * The replies are real two-way threads - support answers written by the
 * MarketFlow team in their separate Admin dashboard - so the Support Center
 * can show a conversation without this project containing any of the admin
 * side. What the API never returns to a merchant is not here either: no
 * internal notes, no assignment, no other workspace's tickets.
 *
 * `GET /support/tickets`, when the API exists.
 */

const H = 60;
const D = 1440;

interface MessageSeed {
  /** Minutes before the workspace clock. */
  at: number;
  from: "merchant" | "support";
  /** The replying agent, when the API names one. Otherwise the team. */
  name?: string;
  text: string;
  files?: { name: string; type: string; size: number }[];
}

interface EventSeed {
  at: number;
  type: SupportTicketEvent["type"];
  actor: "merchant" | "support";
  from?: TicketStatus;
  to?: TicketStatus;
}

interface TicketSeed {
  number: number;
  subject: string;
  category: SupportTicket["category"];
  priority: SupportTicket["priority"];
  status: TicketStatus;
  related?: { type: NonNullable<SupportTicket["relatedResourceType"]>; id: string; label: string };
  messages: MessageSeed[];
  events: EventSeed[];
}

const SEEDS: TicketSeed[] = [
  {
    number: 1031,
    subject: "WhatsApp messages are not sending",
    category: "whatsapp",
    priority: "urgent",
    status: "in_progress",
    related: { type: "whatsapp_connection", id: "wa-main", label: "MarketFlow Business (Cloud API)" },
    messages: [
      { at: 6 * H, from: "merchant", text: "WhatsApp messages are not sending. Since this morning none of our campaign messages are going out - the campaign says 'sending' but customers receive nothing.", files: [{ name: "whatsapp-send-errors.png", type: "image/png", size: 284_112 }] },
      { at: 5 * H, from: "support", name: "Leo Martins", text: "We checked your connection and found an authentication issue - the access token for your WhatsApp Business account has expired. Please reconnect the WhatsApp account in Integrations → WhatsApp." },
      { at: 3 * H, from: "merchant", text: "I reconnected it but still have the issue. The integration now says Connected, but messages are still stuck." },
      { at: 2 * H, from: "support", name: "Leo Martins", text: "Thanks for trying that. We have escalated this to our technical team - your number is being re-registered with Meta. We'll update you here as soon as messages are flowing." },
    ],
    events: [
      { at: 6 * H, type: "created", actor: "merchant" },
      { at: 5 * H, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 3 * H, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 2 * H, type: "status_changed", actor: "support", from: "waiting_support", to: "in_progress" },
    ],
  },
  {
    number: 1029,
    subject: "Campaign stuck in scheduled state",
    category: "campaigns",
    priority: "high",
    status: "in_progress",
    related: { type: "campaign", id: "cmp-summer-2026", label: "Summer Sale 2026" },
    messages: [
      { at: 2 * D, from: "merchant", text: "Our Summer Sale campaign was scheduled for 10:00 yesterday and it still shows 'Scheduled'. Nothing was sent. Can you check what is holding it?" },
      { at: 2 * D - 50, from: "support", text: "We're looking into it. Can you confirm whether the audience segment was edited after you scheduled the campaign?" },
      { at: 2 * D - 90, from: "merchant", text: "Yes, we added 40 contacts to the VIP segment about an hour before it was due." },
      { at: 2 * D - 130, from: "support", name: "Leo Martins", text: "That's what caught it - editing the segment rebuilt the audience and the scheduled job didn't pick up the new list. Our engineers are fixing the job now, and I'll confirm here once it has sent." },
    ],
    events: [
      { at: 2 * D, type: "created", actor: "merchant" },
      { at: 2 * D - 50, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 2 * D - 90, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 2 * D - 125, type: "status_changed", actor: "support", from: "waiting_support", to: "in_progress" },
    ],
  },
  {
    number: 1027,
    subject: "Automation workflow failed at the email step",
    category: "automation",
    priority: "high",
    status: "waiting_merchant",
    related: { type: "workflow", id: "wf-reengagement", label: "90-Day Re-engagement" },
    messages: [
      { at: 3 * D, from: "merchant", text: "The 90-Day Re-engagement workflow shows an error and has stopped. The activity log says the email step failed for most contacts.", files: [{ name: "workflow-error.png", type: "image/png", size: 198_430 }, { name: "run-export.txt", type: "text/plain", size: 12_880 }] },
      { at: 3 * D - 180, from: "support", name: "Ravi Menon", text: "Thanks for the export. The email template that step uses was deleted after the workflow was published. Could you choose a new template on that step and publish the workflow again?" },
    ],
    events: [
      { at: 3 * D, type: "created", actor: "merchant" },
      { at: 3 * D - 180, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
    ],
  },
  {
    number: 1024,
    subject: "Billing invoice question",
    category: "billing",
    priority: "normal",
    status: "resolved",
    messages: [
      { at: 9 * D, from: "merchant", text: "Our August invoice shows two charges for the Growth plan. Were we billed twice?", files: [{ name: "invoice-2026-08.pdf", type: "application/pdf", size: 88_200 }] },
      { at: 9 * D - 120, from: "support", name: "Grace Okoye", text: "You weren't billed twice - the second line is the proration for the two seats you added on 14 August. The total matches your card statement." },
      { at: 8 * D, from: "merchant", text: "That makes sense, thank you!" },
      { at: 8 * D - 30, from: "support", name: "Grace Okoye", text: "Glad that helped. I'll mark this as resolved - reply here any time if anything else looks off." },
    ],
    events: [
      { at: 9 * D, type: "created", actor: "merchant" },
      { at: 9 * D - 120, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 8 * D, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 8 * D - 30, type: "resolved", actor: "support", from: "waiting_support", to: "resolved" },
    ],
  },
  {
    number: 1018,
    subject: "Email sender verification issue",
    category: "email",
    priority: "normal",
    status: "closed",
    related: { type: "integration", id: "email", label: "Email" },
    messages: [
      { at: 21 * D, from: "merchant", text: "The verification email for hello@marketflow.app never arrives, so we can't add it as a sender." },
      { at: 21 * D - 60, from: "support", text: "Your domain's DNS is missing its DKIM record, and some mail servers drop verification emails without one. Add the CNAME shown in Email → Senders, then choose Resend." },
      { at: 20 * D, from: "merchant", text: "Added the record and the email arrived. All verified now." },
      { at: 20 * D - 20, from: "support", text: "Great - we're closing this one. Happy sending!" },
    ],
    events: [
      { at: 21 * D, type: "created", actor: "merchant" },
      { at: 21 * D - 60, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 20 * D, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 20 * D - 25, type: "resolved", actor: "support", from: "waiting_support", to: "resolved" },
      { at: 20 * D - 20, type: "closed", actor: "support", from: "resolved", to: "closed" },
    ],
  },
  {
    number: 1033,
    subject: "Bulk-edit tags from the leads board",
    category: "feature_request",
    priority: "low",
    status: "open",
    messages: [
      { at: 50, from: "merchant", text: "It would save us a lot of time to select several lead cards and add a tag to all of them at once, the way the Customers table already allows." },
    ],
    events: [{ at: 50, type: "created", actor: "merchant" }],
  },
];

/* -------------------------------------------------------------------------- */
/* Built records                                                              */
/* -------------------------------------------------------------------------- */

const planName = PLANS.find((plan) => plan.id === SUBSCRIPTION.planId)?.name ?? "Growth";
const merchantName = `${CURRENT_ACCOUNT.firstName} ${CURRENT_ACCOUNT.lastName}`.trim();

export const SUPPORT_TICKETS: SupportTicket[] = [];
export const SUPPORT_MESSAGES: SupportMessage[] = [];
export const SUPPORT_EVENTS: SupportTicketEvent[] = [];

for (const seed of SEEDS) {
  const id = `tkt-${seed.number}`;

  seed.messages.forEach((message, index) => {
    const messageId = `${id}-msg-${index + 1}`;
    const attachments: SupportAttachment[] = (message.files ?? []).map((file, order) => ({
      id: `${messageId}-att-${order + 1}`,
      messageId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }));
    SUPPORT_MESSAGES.push({
      id: messageId,
      ticketId: id,
      senderType: message.from,
      senderName: message.from === "merchant" ? merchantName : (message.name ?? SUPPORT_TEAM_NAME),
      message: message.text,
      attachments,
      createdAt: minutesAgo(message.at),
    });
  });

  seed.events.forEach((event, index) => {
    SUPPORT_EVENTS.push({
      id: `${id}-evt-${index + 1}`,
      ticketId: id,
      type: event.type,
      actor: event.actor,
      from: event.from,
      to: event.to,
      createdAt: minutesAgo(event.at),
    });
  });

  const times = [...seed.messages.map((item) => item.at), ...seed.events.map((item) => item.at)];
  const resolved = seed.events.find((event) => event.type === "resolved");
  const closed = seed.events.find((event) => event.type === "closed");

  SUPPORT_TICKETS.push({
    id,
    ticketNumber: `MF-${seed.number}`,
    merchantId: CURRENT_ACCOUNT.id,
    merchantName,
    merchantEmail: CURRENT_ACCOUNT.email,
    workspaceId: WORKSPACE_ID,
    planName,
    subject: seed.subject,
    category: seed.category,
    priority: seed.priority,
    status: seed.status,
    relatedResourceType: seed.related?.type,
    relatedResourceId: seed.related?.id,
    relatedResourceLabel: seed.related?.label,
    createdAt: minutesAgo(Math.max(...times)),
    updatedAt: minutesAgo(Math.min(...times)),
    resolvedAt: resolved ? minutesAgo(resolved.at) : undefined,
    closedAt: closed ? minutesAgo(closed.at) : undefined,
  });
}

/** The next number a new ticket takes, until the API assigns them. */
export const NEXT_TICKET_NUMBER = Math.max(...SEEDS.map((seed) => seed.number)) + 1;
