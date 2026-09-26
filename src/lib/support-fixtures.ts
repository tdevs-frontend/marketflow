import { CURRENT_ACCOUNT, SUBSCRIPTION } from "@/lib/account-fixtures";
import { PLANS } from "@/constants/pricing";
import { WORKSPACE_ID, WORKSPACE_MEMBERS } from "@/lib/workspace-fixtures";
import { minutesAgo } from "@/lib/workspace-clock";
import type {
  SupportAgent,
  SupportAttachment,
  SupportMessage,
  SupportTicket,
  SupportWorkspace,
  TicketEvent,
  TicketStatus,
} from "@/types/support";

/**
 * The help desk's sample data.
 *
 * Two sides of one queue. The first six tickets belong to this workspace -
 * `WORKSPACE_ID`, opened by the signed-in member - and are what the merchant's
 * Support Center shows. The rest come from other merchants and are only ever
 * visible from the Admin Support Desk, which is what makes the workspace
 * scoping in `lib/support-service` observable rather than theoretical.
 *
 * Agents are MarketFlow staff, not workspace members, so their names are
 * deliberately not any contact or member already in the product.
 *
 * `GET /admin/support/tickets` and `GET /support/tickets`, when the API exists.
 */

/* -------------------------------------------------------------------------- */
/* Agents and workspaces                                                      */
/* -------------------------------------------------------------------------- */

export const SUPPORT_AGENTS: SupportAgent[] = [
  { id: "ag-nadia", name: "Nadia Karim", email: "nadia@support.marketflow.app", role: "lead", title: "Support Lead" },
  { id: "ag-leo", name: "Leo Martins", email: "leo@support.marketflow.app", role: "agent", title: "Messaging Specialist" },
  { id: "ag-grace", name: "Grace Okoye", email: "grace@support.marketflow.app", role: "agent", title: "Billing & Accounts" },
  { id: "ag-ravi", name: "Ravi Menon", email: "ravi@support.marketflow.app", role: "agent", title: "Automation & Integrations" },
];

/** Who is signed in to the Admin Support Desk in this build. */
export const CURRENT_AGENT_ID = "ag-nadia";

export const agentById = (id?: string | null) =>
  id ? SUPPORT_AGENTS.find((agent) => agent.id === id) ?? null : null;

const planName = PLANS.find((plan) => plan.id === SUBSCRIPTION.planId)?.name ?? "Growth";

export const SUPPORT_WORKSPACES: SupportWorkspace[] = [
  {
    id: WORKSPACE_ID,
    name: CURRENT_ACCOUNT.workspaceName,
    planName,
    ownerName: `${CURRENT_ACCOUNT.firstName} ${CURRENT_ACCOUNT.lastName}`.trim(),
    ownerEmail: CURRENT_ACCOUNT.email,
    country: "Bangladesh",
    memberCount: WORKSPACE_MEMBERS.length,
    createdAt: minutesAgo(420 * 1440),
  },
  { id: "ws_lumen", name: "Lumen Coffee Co.", planName: "Starter", ownerName: "Imran Chowdhury", ownerEmail: "imran@lumencoffee.co", country: "Bangladesh", memberCount: 3, createdAt: minutesAgo(210 * 1440) },
  { id: "ws_kora", name: "Kora Skincare", planName: "Growth", ownerName: "Adaeze Nwosu", ownerEmail: "adaeze@koraskin.ng", country: "Nigeria", memberCount: 7, createdAt: minutesAgo(305 * 1440) },
  { id: "ws_atlas", name: "Atlas Fitness", planName: "Business", ownerName: "Karim Haddad", ownerEmail: "karim@atlasfit.ae", country: "United Arab Emirates", memberCount: 14, createdAt: minutesAgo(520 * 1440) },
  { id: "ws_northwind", name: "Northwind Books", planName: "Starter", ownerName: "Emma Clarke", ownerEmail: "emma@northwindbooks.co.uk", country: "United Kingdom", memberCount: 2, createdAt: minutesAgo(95 * 1440) },
  { id: "ws_sahara", name: "Sahara Home", planName: "Growth", ownerName: "Youssef Amrani", ownerEmail: "youssef@saharahome.ma", country: "Morocco", memberCount: 5, createdAt: minutesAgo(160 * 1440) },
];

export const supportWorkspaceById = (id: string) =>
  SUPPORT_WORKSPACES.find((workspace) => workspace.id === id) ?? null;

/* -------------------------------------------------------------------------- */
/* Tickets                                                                    */
/* -------------------------------------------------------------------------- */

const H = 60;
const D = 1440;

interface MessageSeed {
  /** Minutes before the workspace clock. */
  at: number;
  from: "merchant" | "agent" | "system";
  /** The agent's id, for agent messages. */
  agent?: string;
  body: string;
  note?: boolean;
  files?: { name: string; type: string; size: number }[];
}

interface EventSeed {
  at: number;
  type: TicketEvent["type"];
  actor: "merchant" | "agent" | "system";
  agent?: string;
  from?: string;
  to?: string;
}

interface TicketSeed {
  number: number;
  workspaceId: string;
  subject: string;
  category: SupportTicket["category"];
  priority: SupportTicket["priority"];
  status: TicketStatus;
  assignedTo: string | null;
  related?: { type: SupportTicket["relatedResourceType"] & string; id: string; label: string };
  messages: MessageSeed[];
  events: EventSeed[];
}

/** The member who opened a ticket - the signed-in member for this workspace. */
function openerOf(workspaceId: string) {
  if (workspaceId === WORKSPACE_ID) {
    return {
      id: CURRENT_ACCOUNT.id,
      name: `${CURRENT_ACCOUNT.firstName} ${CURRENT_ACCOUNT.lastName}`.trim(),
      email: CURRENT_ACCOUNT.email,
    };
  }
  const workspace = supportWorkspaceById(workspaceId);
  return {
    id: `usr_${workspaceId}_owner`,
    name: workspace?.ownerName ?? "Merchant",
    email: workspace?.ownerEmail ?? "",
  };
}

const SEEDS: TicketSeed[] = [
  /* ------------------------------------------------ This workspace */
  {
    number: 1031,
    workspaceId: WORKSPACE_ID,
    subject: "WhatsApp messages are not sending",
    category: "whatsapp",
    priority: "urgent",
    status: "waiting_merchant",
    assignedTo: "ag-leo",
    related: { type: "whatsapp_connection", id: "wa-main", label: "MarketFlow Business (Cloud API)" },
    messages: [
      { at: 5 * H, from: "merchant", body: "Since this morning none of our WhatsApp campaign messages are going out. The campaign says 'sending' but customers are not receiving anything. The inbox also stopped showing new replies.", files: [{ name: "whatsapp-send-errors.png", type: "image/png", size: 284_112 }] },
      { at: 4 * H + 30, from: "agent", agent: "ag-leo", body: "Thanks for the screenshot - I can see the 131047 errors on our side too. I'm checking the connection for your Cloud API number now." },
      { at: 4 * H + 20, from: "agent", agent: "ag-leo", note: true, body: "Merchant's WhatsApp access token appears expired - Meta returned OAuthException 190 at 06:12. Nothing wrong on our side; they need to reconnect in Integrations → WhatsApp." },
      { at: 4 * H, from: "agent", agent: "ag-leo", body: "Found it: the access token for your WhatsApp Business connection expired, so Meta is rejecting every send. Could you open Integrations → WhatsApp and choose Reconnect? Queued messages will go out as soon as it is back. Let me know once that's done." },
    ],
    events: [
      { at: 5 * H, type: "created", actor: "merchant" },
      { at: 4 * H + 40, type: "assigned", actor: "agent", agent: "ag-nadia", to: "ag-leo" },
      { at: 4 * H + 30, type: "status_changed", actor: "agent", agent: "ag-leo", from: "open", to: "in_progress" },
      { at: 4 * H, type: "status_changed", actor: "agent", agent: "ag-leo", from: "in_progress", to: "waiting_merchant" },
    ],
  },
  {
    number: 1029,
    workspaceId: WORKSPACE_ID,
    subject: "Campaign stuck in scheduled state",
    category: "campaigns",
    priority: "high",
    status: "in_progress",
    assignedTo: "ag-leo",
    related: { type: "campaign", id: "cmp-summer-2026", label: "Summer Sale 2026" },
    messages: [
      { at: 2 * D, from: "merchant", body: "Our Summer Sale campaign was scheduled for 10:00 yesterday and it still shows 'Scheduled'. Nothing was sent. Can you check what is holding it?" },
      { at: 2 * D - 50, from: "agent", agent: "ag-leo", body: "Looking into it now. The schedule is set to your workspace timezone - can you confirm the audience segment hasn't been edited since you scheduled it?" },
      { at: 2 * D - 90, from: "merchant", body: "Yes, we added 40 contacts to the VIP segment about an hour before it was due." },
      { at: 2 * D - 120, from: "agent", agent: "ag-leo", note: true, body: "Segment edit re-queued the audience snapshot and the job never picked it back up. Raised ENG-2291 with the scheduler team." },
      { at: 2 * D - 130, from: "agent", agent: "ag-leo", body: "That's what caught it - editing the segment re-built the audience and the scheduled job didn't pick the new list up. Our engineers are fixing the job now; I'll update you here as soon as it has sent." },
    ],
    events: [
      { at: 2 * D, type: "created", actor: "merchant" },
      { at: 2 * D - 55, type: "assigned", actor: "agent", agent: "ag-leo", to: "ag-leo" },
      { at: 2 * D - 50, type: "status_changed", actor: "agent", agent: "ag-leo", from: "open", to: "waiting_merchant" },
      { at: 2 * D - 90, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 2 * D - 125, type: "status_changed", actor: "agent", agent: "ag-leo", from: "waiting_support", to: "in_progress" },
      { at: 2 * D - 126, type: "priority_changed", actor: "agent", agent: "ag-leo", from: "normal", to: "high" },
    ],
  },
  {
    number: 1027,
    workspaceId: WORKSPACE_ID,
    subject: "Automation workflow failed at the email step",
    category: "automation",
    priority: "high",
    status: "waiting_support",
    assignedTo: "ag-ravi",
    related: { type: "workflow", id: "wf-reengagement", label: "90-Day Re-engagement" },
    messages: [
      { at: 3 * D, from: "merchant", body: "The 90-Day Re-engagement workflow shows an error and has stopped. The activity log says the email step failed for most contacts.", files: [{ name: "workflow-error.png", type: "image/png", size: 198_430 }, { name: "run-export.txt", type: "text/plain", size: 12_880 }] },
      { at: 3 * D - 180, from: "agent", agent: "ag-ravi", body: "Thanks - the log shows the email template the step uses was deleted after the workflow was published. Could you pick a new template on that step and publish again?" },
      { at: 30, from: "merchant", body: "I picked the 'We miss you' template and published, but the step still fails. Screenshot attached.", files: [{ name: "still-failing.png", type: "image/png", size: 156_020 }] },
    ],
    events: [
      { at: 3 * D, type: "created", actor: "merchant" },
      { at: 3 * D - 170, type: "assigned", actor: "agent", agent: "ag-nadia", to: "ag-ravi" },
      { at: 3 * D - 180, type: "status_changed", actor: "agent", agent: "ag-ravi", from: "open", to: "waiting_merchant" },
      { at: 30, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
    ],
  },
  {
    number: 1024,
    workspaceId: WORKSPACE_ID,
    subject: "Billing invoice question",
    category: "billing",
    priority: "normal",
    status: "resolved",
    assignedTo: "ag-grace",
    messages: [
      { at: 9 * D, from: "merchant", body: "Our August invoice shows two charges for the Growth plan. Were we billed twice?", files: [{ name: "invoice-2026-08.pdf", type: "application/pdf", size: 88_200 }] },
      { at: 9 * D - 120, from: "agent", agent: "ag-grace", body: "You weren't billed twice - the second line is the proration for the two seats you added on 14 August. The total matches your card statement. I've added a clearer breakdown to next month's invoice." },
      { at: 8 * D, from: "merchant", body: "That makes sense, thank you!" },
      { at: 8 * D - 30, from: "agent", agent: "ag-grace", body: "Glad that helped. I'll mark this as resolved - reply here any time if anything else looks off." },
    ],
    events: [
      { at: 9 * D, type: "created", actor: "merchant" },
      { at: 9 * D - 100, type: "assigned", actor: "agent", agent: "ag-grace", to: "ag-grace" },
      { at: 9 * D - 120, type: "status_changed", actor: "agent", agent: "ag-grace", from: "open", to: "waiting_merchant" },
      { at: 8 * D, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 8 * D - 30, type: "resolved", actor: "agent", agent: "ag-grace", from: "waiting_support", to: "resolved" },
    ],
  },
  {
    number: 1018,
    workspaceId: WORKSPACE_ID,
    subject: "Email sender verification issue",
    category: "email",
    priority: "normal",
    status: "closed",
    assignedTo: "ag-leo",
    related: { type: "integration", id: "email", label: "Email" },
    messages: [
      { at: 21 * D, from: "merchant", body: "The verification email for hello@marketflow.app never arrives, so we can't add it as a sender." },
      { at: 21 * D - 60, from: "agent", agent: "ag-leo", body: "Your domain's DNS is missing the DKIM record, and some mail servers drop verification emails without it. Add the CNAME shown in Email → Senders, then press Resend." },
      { at: 20 * D, from: "merchant", body: "Added the record and the email arrived. All verified now." },
      { at: 20 * D - 20, from: "agent", agent: "ag-leo", body: "Great - closing this one. Happy sending!" },
    ],
    events: [
      { at: 21 * D, type: "created", actor: "merchant" },
      { at: 21 * D - 55, type: "assigned", actor: "agent", agent: "ag-leo", to: "ag-leo" },
      { at: 21 * D - 60, type: "status_changed", actor: "agent", agent: "ag-leo", from: "open", to: "waiting_merchant" },
      { at: 20 * D, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 20 * D - 25, type: "resolved", actor: "agent", agent: "ag-leo", from: "waiting_support", to: "resolved" },
      { at: 20 * D - 20, type: "closed", actor: "agent", agent: "ag-leo", from: "resolved", to: "closed" },
    ],
  },
  {
    number: 1033,
    workspaceId: WORKSPACE_ID,
    subject: "Bulk-edit tags from the leads board",
    category: "feature_request",
    priority: "low",
    status: "open",
    assignedTo: null,
    messages: [
      { at: 50, from: "merchant", body: "It would save us a lot of time to select several lead cards and add a tag to all of them at once, the way the Customers table already allows." },
    ],
    events: [{ at: 50, type: "created", actor: "merchant" }],
  },

  /* ------------------------------------------------ Other merchants */
  {
    number: 1032,
    workspaceId: "ws_atlas",
    subject: "Order sync from Shopify stopped",
    category: "integrations",
    priority: "urgent",
    status: "open",
    assignedTo: null,
    related: { type: "integration", id: "shopify", label: "Shopify" },
    messages: [
      { at: 95, from: "merchant", body: "No Shopify orders have come into MarketFlow since last night, so our order confirmations on WhatsApp stopped. We have a sale running today - please help urgently." },
    ],
    events: [{ at: 95, type: "created", actor: "merchant" }],
  },
  {
    number: 1030,
    workspaceId: "ws_kora",
    subject: "Can't invite a new team member",
    category: "account",
    priority: "normal",
    status: "waiting_support",
    assignedTo: "ag-grace",
    messages: [
      { at: 26 * H, from: "merchant", body: "When I invite our new marketer I get 'Seat limit reached', but we only have 7 of 10 seats in use." },
      { at: 25 * H, from: "agent", agent: "ag-grace", body: "Pending invitations count toward the seat limit. Could you check Team Members → Invitations for any old invites you can revoke?" },
      { at: 3 * H, from: "merchant", body: "There are no pending invitations, and it still fails." },
    ],
    events: [
      { at: 26 * H, type: "created", actor: "merchant" },
      { at: 25 * H + 10, type: "assigned", actor: "agent", agent: "ag-nadia", to: "ag-grace" },
      { at: 25 * H, type: "status_changed", actor: "agent", agent: "ag-grace", from: "open", to: "waiting_merchant" },
      { at: 3 * H, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
    ],
  },
  {
    number: 1028,
    workspaceId: "ws_northwind",
    subject: "SMS delivery delayed to UK numbers",
    category: "sms",
    priority: "high",
    status: "in_progress",
    assignedTo: "ag-ravi",
    messages: [
      { at: 30 * H, from: "merchant", body: "Our order-ready SMS are arriving 40 to 60 minutes late for UK customers." },
      { at: 29 * H, from: "agent", agent: "ag-ravi", body: "We're seeing carrier delays on one of our UK routes. I've moved your traffic to the secondary route and I'm watching delivery times." },
      { at: 29 * H - 10, from: "agent", agent: "ag-ravi", note: true, body: "Route UK-2 latency p95 at 41 min since 02:00. Failover applied for this sender ID only - check again after the carrier's 18:00 update." },
    ],
    events: [
      { at: 30 * H, type: "created", actor: "merchant" },
      { at: 29 * H + 20, type: "assigned", actor: "agent", agent: "ag-nadia", to: "ag-ravi" },
      { at: 29 * H, type: "status_changed", actor: "agent", agent: "ag-ravi", from: "open", to: "in_progress" },
    ],
  },
  {
    number: 1026,
    workspaceId: "ws_sahara",
    subject: "Switch our plan to annual billing",
    category: "billing",
    priority: "low",
    status: "resolved",
    assignedTo: "ag-grace",
    messages: [
      { at: 7 * H, from: "merchant", body: "We'd like to move to annual billing from next month. Is the discount applied automatically?" },
      { at: 2 * H, from: "agent", agent: "ag-grace", body: "Yes - the 20% annual discount applies automatically. I've scheduled the switch for your next renewal date, so nothing changes until then." },
    ],
    events: [
      { at: 7 * H, type: "created", actor: "merchant" },
      { at: 3 * H, type: "assigned", actor: "agent", agent: "ag-grace", to: "ag-grace" },
      { at: 2 * H, type: "resolved", actor: "agent", agent: "ag-grace", from: "open", to: "resolved" },
    ],
  },
  {
    number: 1025,
    workspaceId: "ws_lumen",
    subject: "WhatsApp template rejected",
    category: "whatsapp",
    priority: "normal",
    status: "waiting_merchant",
    assignedTo: "ag-leo",
    messages: [
      { at: 4 * D, from: "merchant", body: "Meta rejected our 'loyalty_reward' template with no reason given. What should we change?" },
      { at: 4 * D - 90, from: "agent", agent: "ag-leo", body: "Marketing templates can't start with a variable. Move {{1}} after the greeting and resubmit - that usually clears it within an hour." },
    ],
    events: [
      { at: 4 * D, type: "created", actor: "merchant" },
      { at: 4 * D - 80, type: "assigned", actor: "agent", agent: "ag-leo", to: "ag-leo" },
      { at: 4 * D - 90, type: "status_changed", actor: "agent", agent: "ag-leo", from: "open", to: "waiting_merchant" },
    ],
  },
  {
    number: 1022,
    workspaceId: "ws_atlas",
    subject: "API returning 429 rate limit errors",
    category: "technical",
    priority: "high",
    status: "closed",
    assignedTo: "ag-ravi",
    messages: [
      { at: 12 * D, from: "merchant", body: "Our member app gets 429 responses from the contacts API during our morning sync." },
      { at: 12 * D - 60, from: "agent", agent: "ag-ravi", body: "Your sync sends about 40 requests a second, and the Business plan allows 20. Batching the updates with the bulk endpoint will fix it - there's an example in the API docs." },
      { at: 11 * D, from: "merchant", body: "Switched to the bulk endpoint, no more 429s. Thanks!" },
    ],
    events: [
      { at: 12 * D, type: "created", actor: "merchant" },
      { at: 12 * D - 50, type: "assigned", actor: "agent", agent: "ag-ravi", to: "ag-ravi" },
      { at: 12 * D - 60, type: "status_changed", actor: "agent", agent: "ag-ravi", from: "open", to: "waiting_merchant" },
      { at: 11 * D - 10, type: "resolved", actor: "agent", agent: "ag-ravi", from: "waiting_merchant", to: "resolved" },
      { at: 11 * D - 5, type: "closed", actor: "system", from: "resolved", to: "closed" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Built records                                                              */
/* -------------------------------------------------------------------------- */

export const SUPPORT_TICKETS: SupportTicket[] = [];
export const SUPPORT_MESSAGES: SupportMessage[] = [];
export const SUPPORT_EVENTS: TicketEvent[] = [];

for (const seed of SEEDS) {
  const id = `tkt-${seed.number}`;
  const opener = openerOf(seed.workspaceId);
  const workspace = supportWorkspaceById(seed.workspaceId);

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
      senderId: message.from === "agent" ? (message.agent ?? CURRENT_AGENT_ID) : opener.id,
      senderType: message.from,
      body: message.body,
      isInternalNote: Boolean(message.note),
      createdAt: minutesAgo(message.at),
      attachments,
    });
  });

  seed.events.forEach((event, index) => {
    SUPPORT_EVENTS.push({
      id: `${id}-evt-${index + 1}`,
      ticketId: id,
      type: event.type,
      actorId:
        event.actor === "agent"
          ? (event.agent ?? CURRENT_AGENT_ID)
          : event.actor === "merchant"
            ? opener.id
            : "system",
      actorType: event.actor,
      from: event.from,
      to: event.to,
      createdAt: minutesAgo(event.at),
    });
  });

  const times = [
    ...seed.messages.map((message) => message.at),
    ...seed.events.map((event) => event.at),
  ];
  const firstAgent = seed.messages
    .filter((message) => message.from === "agent" && !message.note)
    .reduce<number | undefined>((max, message) => (max === undefined || message.at > max ? message.at : max), undefined);
  const resolved = seed.events.find((event) => event.type === "resolved");
  const closed = seed.events.find((event) => event.type === "closed");

  SUPPORT_TICKETS.push({
    id,
    ticketNumber: `MF-${seed.number}`,
    workspaceId: seed.workspaceId,
    createdBy: opener.id,
    merchantName: opener.name,
    merchantEmail: opener.email,
    planName: workspace?.planName ?? "Starter",
    subject: seed.subject,
    category: seed.category,
    priority: seed.priority,
    status: seed.status,
    assignedTo: seed.assignedTo,
    relatedResourceType: seed.related?.type,
    relatedResourceId: seed.related?.id,
    relatedResourceLabel: seed.related?.label,
    createdAt: minutesAgo(Math.max(...times)),
    updatedAt: minutesAgo(Math.min(...times)),
    resolvedAt: resolved ? minutesAgo(resolved.at) : undefined,
    closedAt: closed ? minutesAgo(closed.at) : undefined,
    firstResponseAt: firstAgent === undefined ? undefined : minutesAgo(firstAgent),
  });
}

/** The next number a new ticket takes. */
export const NEXT_TICKET_NUMBER = Math.max(...SEEDS.map((seed) => seed.number)) + 1;
