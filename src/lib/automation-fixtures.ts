import type { Option } from "@/constants/commerce";
import type { AutomationFlow, AutomationStatus, FlowStep } from "@/types/automation";
import type { MarketingChannel } from "@/types/marketing";

/**
 * Automation flows, per channel.
 *
 * Written as sequential steps with named branches rather than a node graph
 * with coordinates: these are follow-up sequences, and a list is what the
 * builder can render, reorder and read out. The `{x, y}` graph in
 * `types/automation` stays for anything genuinely authored on a canvas.
 */

export const AUTOMATION_STATUSES: Option<AutomationStatus>[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

/* -------------------------------------------------------------------------- */
/* Step builders                                                              */
/* -------------------------------------------------------------------------- */

/*
 * Small constructors instead of literal objects. Twelve flows written by hand
 * would drift on the icon keys alone, and the icon is what makes a node
 * readable at a glance.
 */

const send = (
  id: string,
  channel: MarketingChannel,
  detail: string,
  entered: number,
): FlowStep => ({
  id,
  type: "action",
  title: channel === "whatsapp" ? "Send WhatsApp" : channel === "email" ? "Send Email" : "Send SMS",
  detail,
  icon: channel === "whatsapp" ? "message-circle" : channel === "email" ? "mail" : "smartphone",
  channel,
  entered,
});

const wait = (id: string, detail: string, entered: number): FlowStep => ({
  id,
  type: "delay",
  title: "Wait",
  detail,
  icon: "clock",
  entered,
});

const condition = (
  id: string,
  detail: string,
  entered: number,
  branches: { label: string; steps: FlowStep[] }[],
): FlowStep => ({
  id,
  type: "condition",
  title: "Condition",
  detail,
  icon: "git-branch",
  entered,
  branches,
});

const act = (
  id: string,
  title: string,
  detail: string,
  icon: string,
  entered: number,
): FlowStep => ({ id, type: "action", title, detail, icon, entered });

const goal = (id: string, detail: string, entered: number): FlowStep => ({
  id,
  type: "goal",
  title: "Goal reached",
  detail,
  icon: "target",
  entered,
});

/* -------------------------------------------------------------------------- */
/* Flows                                                                      */
/* -------------------------------------------------------------------------- */

export const AUTOMATION_FLOWS: AutomationFlow[] = [
  {
    id: "af-welcome-sequence",
    name: "Welcome Sequence",
    description: "Three touches over four days for every new opted-in contact.",
    channel: "whatsapp",
    status: "active",
    triggerLabel: "Contact opts in",
    triggerIcon: "user-plus",
    contactsProcessed: 4_286,
    successRate: 78.4,
    lastActivityAt: "2026-09-08T09:38:00Z",
    createdAt: "2026-04-12T09:00:00Z",
    steps: [
      send("s1", "whatsapp", "Template: welcome_message", 4_286),
      wait("s2", "1 day", 4_182),
      send("s3", "whatsapp", "Template: product_information", 4_182),
      wait("s4", "2 days", 3_964),
      condition("s5", "Replied to either message", 3_964, [
        {
          label: "Replied",
          steps: [
            act("s5a", "Assign agent", "Round-robin across 3 agents", "user-check", 1_284),
            act("s5b", "Add tag", "engaged-lead", "tag", 1_284),
            goal("s5c", "Handed to a human", 1_284),
          ],
        },
        {
          label: "No reply",
          steps: [
            send("s5d", "whatsapp", "Template: gentle_follow_up", 2_680),
            act("s5e", "Add tag", "cold-lead", "tag", 2_680),
          ],
        },
      ]),
    ],
  },
  {
    id: "af-new-lead-followup",
    name: "New Lead Follow-up",
    description: "Qualifies a form submission before it reaches a salesperson.",
    channel: "whatsapp",
    status: "active",
    triggerLabel: "Lead form submitted",
    triggerIcon: "list-checks",
    contactsProcessed: 2_148,
    successRate: 64.2,
    lastActivityAt: "2026-09-08T08:52:00Z",
    createdAt: "2026-05-20T14:30:00Z",
    steps: [
      wait("s1", "5 minutes", 2_148),
      send("s2", "whatsapp", "Template: lead_greeting", 2_148),
      condition("s3", "Lead source is paid ads", 2_148, [
        {
          label: "Paid",
          steps: [
            act("s3a", "Assign owner", "Sales — Imran Hossain", "user-check", 842),
            send("s3b", "whatsapp", "Template: paid_offer", 842),
          ],
        },
        {
          label: "Organic",
          steps: [
            wait("s3c", "1 day", 1_306),
            send("s3d", "email", "Template: Welcome Series — Day 1", 1_306),
          ],
        },
      ]),
      wait("s4", "3 days", 2_014),
      send("s5", "whatsapp", "Template: qualification_question", 2_014),
      goal("s6", "Lead marked qualified", 1_380),
    ],
  },
  {
    id: "af-abandoned-cart",
    name: "Abandoned Cart",
    description: "Two reminders and a discount, then it stops asking.",
    channel: "whatsapp",
    status: "active",
    triggerLabel: "Checkout abandoned",
    triggerIcon: "shopping-cart",
    contactsProcessed: 6_842,
    successRate: 31.6,
    lastActivityAt: "2026-09-08T09:44:00Z",
    createdAt: "2026-03-08T11:15:00Z",
    steps: [
      wait("s1", "2 hours", 6_842),
      send("s2", "whatsapp", "Template: abandoned_checkout", 6_842),
      wait("s3", "1 day", 5_186),
      condition("s4", "Order completed", 5_186, [
        {
          label: "Completed",
          steps: [goal("s4a", "Order recovered", 1_486)],
        },
        {
          label: "Still open",
          steps: [
            send("s4b", "whatsapp", "Template: cart_discount_10", 3_700),
            wait("s4c", "2 days", 3_412),
            send("s4d", "email", "Template: Abandoned Basket", 3_412),
            act("s4e", "Exit flow", "No further reminders", "log-out", 3_412),
          ],
        },
      ]),
    ],
  },
  {
    id: "af-order-confirmation",
    name: "Order Confirmation",
    description: "Transactional. Confirmation, dispatch and a feedback request.",
    channel: "whatsapp",
    status: "active",
    triggerLabel: "Order placed",
    triggerIcon: "package",
    contactsProcessed: 12_480,
    successRate: 96.8,
    lastActivityAt: "2026-09-08T09:46:00Z",
    createdAt: "2026-02-14T08:00:00Z",
    steps: [
      send("s1", "whatsapp", "Template: order_confirmation", 12_480),
      wait("s2", "Until order ships", 12_480),
      send("s3", "whatsapp", "Template: shipping_update", 12_186),
      wait("s4", "3 days after delivery", 11_842),
      send("s5", "whatsapp", "Template: post_purchase_feedback", 11_842),
      goal("s6", "Feedback received", 4_286),
    ],
  },
  {
    id: "af-reengagement",
    name: "Re-engagement",
    description: "Reaches contacts with no activity for 60 days, then cleans the list.",
    channel: "email",
    status: "active",
    triggerLabel: "No activity for 60 days",
    triggerIcon: "clock",
    contactsProcessed: 3_460,
    successRate: 22.4,
    lastActivityAt: "2026-09-07T21:10:00Z",
    createdAt: "2026-06-02T10:20:00Z",
    steps: [
      send("s1", "email", "Template: Win-back", 3_460),
      wait("s2", "5 days", 3_284),
      condition("s3", "Opened the email", 3_284, [
        {
          label: "Opened",
          steps: [
            act("s3a", "Add tag", "reactivated", "tag", 986),
            send("s3b", "email", "Template: Seasonal Promotion", 986),
            goal("s3c", "Contact reactivated", 774),
          ],
        },
        {
          label: "Ignored",
          steps: [
            send("s3d", "sms", "Template: Win-back Discount", 2_298),
            wait("s3e", "7 days", 2_186),
            act("s3f", "Update field", "engagement = none", "pencil", 2_186),
            act("s3g", "Add tag", "sunset-candidate", "tag", 2_186),
          ],
        },
      ]),
    ],
  },
  {
    id: "af-appointment-reminders",
    name: "Appointment Reminders",
    description: "A day-before and a two-hour-before reminder, with reschedule handling.",
    channel: "sms",
    status: "active",
    triggerLabel: "Appointment booked",
    triggerIcon: "calendar-days",
    contactsProcessed: 8_642,
    successRate: 91.2,
    lastActivityAt: "2026-09-08T06:00:00Z",
    createdAt: "2026-05-08T09:40:00Z",
    steps: [
      wait("s1", "Until 1 day before", 8_642),
      send("s2", "sms", "Template: Appointment Reminder", 8_642),
      condition("s3", "Replied R to reschedule", 8_642, [
        {
          label: "Reschedule",
          steps: [
            act("s3a", "Assign agent", "Front desk queue", "user-check", 684),
            act("s3b", "Exit flow", "Handled by an agent", "log-out", 684),
          ],
        },
        {
          label: "No change",
          steps: [
            wait("s3c", "Until 2 hours before", 7_958),
            send("s3d", "sms", "Template: Appointment Reminder", 7_958),
            goal("s3e", "Appointment attended", 7_286),
          ],
        },
      ]),
    ],
  },
  {
    id: "af-onboarding-email",
    name: "Onboarding Series",
    description: "Five emails over two weeks, gated on whether the channel is connected.",
    channel: "email",
    status: "paused",
    triggerLabel: "Workspace created",
    triggerIcon: "building",
    contactsProcessed: 1_248,
    successRate: 58.6,
    lastActivityAt: "2026-08-30T11:10:00Z",
    createdAt: "2026-04-28T13:00:00Z",
    steps: [
      send("s1", "email", "Template: Welcome Series — Day 1", 1_248),
      wait("s2", "2 days", 1_236),
      condition("s3", "WhatsApp connected", 1_236, [
        {
          label: "Connected",
          steps: [
            send("s3a", "email", "Template: Your first campaign", 892),
            wait("s3b", "3 days", 884),
            send("s3c", "email", "Template: Automations 101", 884),
          ],
        },
        {
          label: "Not connected",
          steps: [
            send("s3d", "email", "Template: Connect your first channel", 344),
            wait("s3e", "2 days", 340),
            send("s3f", "sms", "Template: Feedback Request", 340),
          ],
        },
      ]),
      goal("s4", "First campaign sent", 732),
    ],
  },
  {
    id: "af-vip-upgrade",
    name: "VIP Upgrade Nudge",
    description: "Offers the Business plan once a customer crosses a spend threshold.",
    channel: "email",
    status: "draft",
    triggerLabel: "Lifetime value above $5,000",
    triggerIcon: "badge-percent",
    contactsProcessed: 0,
    successRate: 0,
    lastActivityAt: "2026-09-06T09:40:00Z",
    createdAt: "2026-09-06T09:40:00Z",
    steps: [
      act("s1", "Add tag", "vip-candidate", "tag", 0),
      send("s2", "email", "Template: VIP Autumn Preview", 0),
      wait("s3", "4 days", 0),
      send("s4", "whatsapp", "Template: vip_early_access", 0),
      goal("s5", "Upgraded to Business", 0),
    ],
  },
  {
    id: "af-birthday",
    name: "Birthday Offer",
    description: "One message on the day, with a seven-day discount window.",
    channel: "sms",
    status: "paused",
    triggerLabel: "Contact birthday",
    triggerIcon: "calendar-days",
    contactsProcessed: 2_186,
    successRate: 42.8,
    lastActivityAt: "2026-08-19T06:00:00Z",
    createdAt: "2026-01-22T15:30:00Z",
    steps: [
      send("s1", "sms", "Template: Birthday Discount", 2_186),
      wait("s2", "3 days", 2_142),
      condition("s3", "Discount redeemed", 2_142, [
        { label: "Redeemed", steps: [goal("s3a", "Offer redeemed", 916)] },
        {
          label: "Not yet",
          steps: [send("s3b", "sms", "Template: Birthday Reminder", 1_226)],
        },
      ]),
    ],
  },
];

/** The flows for one channel, newest activity first. */
export const flowsForChannel = (channel: MarketingChannel) =>
  AUTOMATION_FLOWS.filter((flow) => flow.channel === channel);

/** Total steps in a flow, following every branch. */
export function countSteps(steps: FlowStep[]): number {
  return steps.reduce(
    (total, step) =>
      total +
      1 +
      (step.branches?.reduce((sum, branch) => sum + countSteps(branch.steps), 0) ?? 0),
    0,
  );
}

/* -------------------------------------------------------------------------- */
/* Builder palette                                                            */
/* -------------------------------------------------------------------------- */

/** What the builder offers when adding a step, grouped the way it renders. */
export const STEP_PALETTE: {
  group: string;
  items: { title: string; detail: string; icon: string; type: FlowStep["type"] }[];
}[] = [
  {
    group: "Messages",
    items: [
      {
        title: "Send WhatsApp",
        detail: "From an approved template",
        icon: "message-circle",
        type: "action",
      },
      { title: "Send Email", detail: "From a saved template", icon: "mail", type: "action" },
      { title: "Send SMS", detail: "Plain text, 160 characters", icon: "smartphone", type: "action" },
    ],
  },
  {
    group: "Flow",
    items: [
      { title: "Wait", detail: "A fixed delay, or until a date", icon: "clock", type: "delay" },
      {
        title: "Condition",
        detail: "Split the flow on a contact property",
        icon: "git-branch",
        type: "condition",
      },
      { title: "Goal reached", detail: "Ends the flow as a success", icon: "target", type: "goal" },
    ],
  },
  {
    group: "Contact",
    items: [
      { title: "Add tag", detail: "Label the contact", icon: "tag", type: "action" },
      { title: "Remove tag", detail: "Clear a label", icon: "tag", type: "action" },
      { title: "Update field", detail: "Set a custom field", icon: "pencil", type: "action" },
      { title: "Assign agent", detail: "Hand to a person or queue", icon: "user-check", type: "action" },
      { title: "Exit flow", detail: "Stop without a goal", icon: "log-out", type: "action" },
    ],
  },
];
