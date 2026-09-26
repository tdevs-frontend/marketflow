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
  {
    number: 1032,
    subject: "SMS sender ID rejected for Bangladesh numbers",
    category: "sms",
    priority: "high",
    status: "waiting_support",
    related: { type: "integration", id: "sms", label: "SMS" },
    messages: [
      { at: 3 * H, from: "merchant", text: "Our order-ready SMS to Bangladeshi numbers fail with 'sender ID not registered'. Messages to other countries go out fine." },
      { at: 2 * H + 20, from: "support", name: "Ravi Menon", text: "Bangladesh requires alphanumeric sender IDs to be pre-registered with the carriers. Could you send us your trade licence so we can file the registration for 'MFSTORE'?" },
      { at: 40, from: "merchant", text: "Trade licence attached. Please let us know how long the registration takes.", files: [{ name: "trade-licence.pdf", type: "application/pdf", size: 412_300 }] },
    ],
    events: [
      { at: 3 * H, type: "created", actor: "merchant" },
      { at: 2 * H + 20, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 40, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
    ],
  },
  {
    number: 1030,
    subject: "Shopify orders arriving without customer phone numbers",
    category: "integrations",
    priority: "normal",
    status: "in_progress",
    related: { type: "integration", id: "shopify", label: "Shopify" },
    messages: [
      { at: D, from: "merchant", text: "Orders synced from Shopify since yesterday have no phone number, so the WhatsApp order confirmation can't be sent. The phone is filled in on Shopify." },
      { at: D - 70, from: "support", text: "Thanks - we can reproduce it. Shopify moved the phone number to the shipping address for guest checkouts, and our sync still reads the customer record. A fix is being tested now." },
    ],
    events: [
      { at: D, type: "created", actor: "merchant" },
      { at: D - 70, type: "status_changed", actor: "support", from: "open", to: "in_progress" },
    ],
  },
  {
    number: 1028,
    subject: "Abandoned cart messages sending twice",
    category: "automation",
    priority: "high",
    status: "resolved",
    related: { type: "workflow", id: "wf-cart-recovery", label: "Abandoned Checkout Recovery" },
    messages: [
      { at: 2.5 * D, from: "merchant", text: "Some customers got the abandoned cart reminder twice within a minute. It's embarrassing - can you check the workflow?", files: [{ name: "duplicate-messages.png", type: "image/png", size: 143_700 }] },
      { at: 2.5 * D - 60, from: "support", name: "Ravi Menon", text: "Found it: those customers started checkout on two devices, so the trigger fired once per checkout. We've added a 30-minute de-duplication window to your workflow's entry rules." },
      { at: 2 * D - 200, from: "merchant", text: "No duplicates since yesterday. Thanks!" },
      { at: 2 * D - 230, from: "support", name: "Ravi Menon", text: "Great to hear. Marking this as resolved - reply here if you see it again." },
    ],
    events: [
      { at: 2.5 * D, type: "created", actor: "merchant" },
      { at: 2.5 * D - 60, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 2 * D - 200, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 2 * D - 230, type: "resolved", actor: "support", from: "waiting_support", to: "resolved" },
    ],
  },
  {
    number: 1026,
    subject: "How do I add a second WhatsApp number?",
    category: "whatsapp",
    priority: "low",
    status: "waiting_merchant",
    messages: [
      { at: 5 * D, from: "merchant", text: "We opened a second branch and want its own WhatsApp number in the same workspace. Is that possible on the Growth plan?" },
      { at: 5 * D - 90, from: "support", text: "Yes - Growth includes up to three numbers. Go to Integrations → WhatsApp → Add number and verify it with the code Meta sends. Would you like us to walk you through it on a call?" },
    ],
    events: [
      { at: 5 * D, type: "created", actor: "merchant" },
      { at: 5 * D - 90, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
    ],
  },
  {
    number: 1025,
    subject: "Refund for accidental plan upgrade",
    category: "billing",
    priority: "normal",
    status: "closed",
    messages: [
      { at: 7 * D, from: "merchant", text: "A teammate upgraded us to the Business plan by mistake this morning. Can we switch back to Growth and get a refund for the difference?" },
      { at: 7 * D - 45, from: "support", name: "Grace Okoye", text: "Done - you're back on Growth and the difference has been refunded to your card. It can take 5 to 10 working days to appear." },
      { at: 7 * D - 100, from: "merchant", text: "Perfect, thank you for the quick help." },
    ],
    events: [
      { at: 7 * D, type: "created", actor: "merchant" },
      { at: 7 * D - 45, type: "resolved", actor: "support", from: "open", to: "resolved" },
      { at: 6 * D, type: "closed", actor: "support", from: "resolved", to: "closed" },
    ],
  },
  {
    number: 1023,
    subject: "Campaign open rate shows 0% after sending",
    category: "email",
    priority: "normal",
    status: "resolved",
    related: { type: "campaign", id: "cmp-product-launch", label: "New Product Launch" },
    messages: [
      { at: 11 * D, from: "merchant", text: "The New Product Launch email went out yesterday but the report still shows 0% opens. Is tracking broken?" },
      { at: 11 * D - 80, from: "support", text: "Open tracking was switched off in that campaign's settings, so no opens were recorded - clicks were still tracked. We've turned open tracking on by default for your future campaigns." },
    ],
    events: [
      { at: 11 * D, type: "created", actor: "merchant" },
      { at: 11 * D - 80, type: "resolved", actor: "support", from: "open", to: "resolved" },
    ],
  },
  {
    number: 1022,
    subject: "Can't export contacts to CSV",
    category: "technical",
    priority: "normal",
    status: "closed",
    messages: [
      { at: 13 * D, from: "merchant", text: "Clicking Export on the Customers page does nothing. We need the list for an event this week." },
      { at: 13 * D - 120, from: "support", name: "Leo Martins", text: "Your browser is blocking the download. Allow downloads from MarketFlow in the address bar and try again - let us know if it still doesn't start." },
      { at: 12 * D, from: "merchant", text: "Export works after allowing downloads. Thanks!" },
    ],
    events: [
      { at: 13 * D, type: "created", actor: "merchant" },
      { at: 13 * D - 120, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 12 * D, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 12 * D - 30, type: "resolved", actor: "support", from: "waiting_support", to: "resolved" },
      { at: 11 * D + 60, type: "closed", actor: "support", from: "resolved", to: "closed" },
    ],
  },
  {
    number: 1021,
    subject: "Order confirmation sent with the wrong total",
    category: "whatsapp",
    priority: "urgent",
    status: "resolved",
    related: { type: "order", id: "ord-10253", label: "Order #MF-10253 · Sarah Ahmed" },
    messages: [
      { at: 15 * D, from: "merchant", text: "A customer's WhatsApp order confirmation showed the total before the discount code was applied. The order itself is correct.", files: [{ name: "confirmation-screenshot.jpg", type: "image/jpeg", size: 96_400 }] },
      { at: 15 * D - 25, from: "support", name: "Leo Martins", text: "The template used the subtotal variable instead of the total. We've corrected the mapping on your order confirmation template, so every confirmation from now on shows the discounted total." },
    ],
    events: [
      { at: 15 * D, type: "created", actor: "merchant" },
      { at: 15 * D - 25, type: "resolved", actor: "support", from: "open", to: "resolved" },
    ],
  },
  {
    number: 1020,
    subject: "Add Bangla language to email templates",
    category: "feature_request",
    priority: "low",
    status: "closed",
    messages: [
      { at: 17 * D, from: "merchant", text: "Most of our customers read Bangla. Could the email template builder support Bangla fonts?" },
      { at: 17 * D - 240, from: "support", text: "Thank you for the suggestion - we've passed it to the product team. We'll announce it in the product updates if it ships." },
    ],
    events: [
      { at: 17 * D, type: "created", actor: "merchant" },
      { at: 17 * D - 240, type: "closed", actor: "support", from: "open", to: "closed" },
    ],
  },
  {
    number: 1019,
    subject: "Two-factor code not accepted",
    category: "account",
    priority: "high",
    status: "resolved",
    messages: [
      { at: 19 * D, from: "merchant", text: "My authenticator app codes are rejected every time I try to sign in, and I can't get into the dashboard from my laptop." },
      { at: 19 * D - 30, from: "support", name: "Grace Okoye", text: "This usually means the phone's clock has drifted. Turn on automatic date and time on your phone and try a fresh code - or use one of your recovery codes to get in straight away." },
      { at: 19 * D - 50, from: "merchant", text: "That was it - the clock was 3 minutes off. I'm back in." },
    ],
    events: [
      { at: 19 * D, type: "created", actor: "merchant" },
      { at: 19 * D - 30, type: "status_changed", actor: "support", from: "open", to: "waiting_merchant" },
      { at: 19 * D - 50, type: "status_changed", actor: "merchant", from: "waiting_merchant", to: "waiting_support" },
      { at: 19 * D - 60, type: "resolved", actor: "support", from: "waiting_support", to: "resolved" },
    ],
  },
  {
    number: 1016,
    subject: "Birthday Offer workflow sent on the wrong day",
    category: "automation",
    priority: "normal",
    status: "closed",
    related: { type: "workflow", id: "wf-birthday", label: "Birthday Offer" },
    messages: [
      { at: 26 * D, from: "merchant", text: "Several customers got their birthday message a day early. Is the workflow using the wrong timezone?" },
      { at: 26 * D - 100, from: "support", text: "Yes - the workflow was set to UTC rather than your workspace timezone (Asia/Dhaka), so messages scheduled for 09:00 went out the evening before. We've switched it to the workspace timezone." },
    ],
    events: [
      { at: 26 * D, type: "created", actor: "merchant" },
      { at: 26 * D - 100, type: "resolved", actor: "support", from: "open", to: "resolved" },
      { at: 24 * D, type: "closed", actor: "support", from: "resolved", to: "closed" },
    ],
  },
  {
    number: 1012,
    subject: "Invoice needs our VAT number",
    category: "billing",
    priority: "low",
    status: "closed",
    messages: [
      { at: 40 * D, from: "merchant", text: "Our accountant needs our VAT registration number on the invoices. Where can we add it?" },
      { at: 40 * D - 60, from: "support", name: "Grace Okoye", text: "You can add it under Settings → Billing & Subscription → Billing details. It appears on every invoice issued after you save it." },
    ],
    events: [
      { at: 40 * D, type: "created", actor: "merchant" },
      { at: 40 * D - 60, type: "resolved", actor: "support", from: "open", to: "resolved" },
      { at: 38 * D, type: "closed", actor: "support", from: "resolved", to: "closed" },
    ],
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
