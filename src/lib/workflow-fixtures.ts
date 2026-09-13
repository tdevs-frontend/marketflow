import { NODE_META } from "@/constants/automation";
import type {
  ActivityRow,
  AutomationTemplate,
  AutomationTrigger,
  ExecutionStatus,
  NodeKind,
  TemplateStep,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowRun,
  WorkflowSettings,
  WorkflowStatus,
} from "@/types/workflow";
import type { MarketingChannel } from "@/types/marketing";

/**
 * The Automation module's mock data.
 *
 * Written as specs plus a layout pass rather than as hand-placed nodes: a
 * seventeen-workflow fixture with literal `{x, y}` on every node drifts the
 * first time a node's height changes, and nothing here is interesting enough
 * to be worth positioning by hand. The specs read as the journey does —
 * trigger, then steps, with a fork where the journey forks — and the layout
 * function turns that into the graph the canvas renders.
 *
 * Replacing this file with `GET /automation/workflows` should be the only
 * change the components need: nothing below is imported for its shape alone,
 * and every derived figure is computed here rather than in a component.
 */

/** The clock every relative timestamp in this module is measured against. */
export const AUTOMATION_NOW = "2026-09-13T09:45:00Z";

/**
 * `AUTOMATION_NOW` as a number, and the clock every relative filter measures
 * against.
 *
 * Components read this rather than `Date.now()`: a fixture whose newest run is
 * timestamped yesterday would vanish from a "last hour" filter driven by the
 * real clock, and calling `Date.now()` while rendering is impure — it can
 * return a different answer on the server than on the client and produce a
 * hydration mismatch. One fixed instant keeps both honest.
 */
export const AUTOMATION_NOW_MS = new Date(AUTOMATION_NOW).getTime();

const NOW_MS = AUTOMATION_NOW_MS;

/**
 * Ids for objects created in the browser — a duplicated workflow, a draft from
 * a template.
 *
 * A counter rather than a timestamp, because `Date.now()` is impure and these
 * are minted inside handlers that React may re-run. With a real API the server
 * owns the id and nothing downstream reads meaning out of the string.
 */
let localSequence = 0;

export function localId(prefix: string): string {
  localSequence += 1;
  return `${prefix}-local-${localSequence}`;
}

/** Minutes before `AUTOMATION_NOW`, as an ISO string. */
const minutesAgo = (minutes: number) =>
  new Date(NOW_MS - minutes * 60_000).toISOString();

const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => minutesAgo(days * 60 * 24);
const inMinutes = (minutes: number) =>
  new Date(NOW_MS + minutes * 60_000).toISOString();

/**
 * A stable pseudo-random in [0, 1) from a string.
 *
 * The fixtures need figures that look measured rather than rounded — 11,940
 * out of 12,480, not 12,000 out of 12,000 — and they have to be identical on
 * the server and the client or hydration fails. Seeding off the node id gives
 * both.
 */
function seeded(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

/* -------------------------------------------------------------------------- */
/* Graph builder                                                              */
/* -------------------------------------------------------------------------- */

/** A step, as the journey reads: kind, title, configured summary. */
type StepSpec = [NodeKind, string, string];

interface ForkSpec {
  fork: StepSpec;
  branches: { label: string; steps: StepSpec[] }[];
}

type Spec = StepSpec | ForkSpec;

const isFork = (spec: Spec): spec is ForkSpec =>
  typeof spec === "object" && !Array.isArray(spec);

/** Canvas geometry. Node width is 240 in `workflow-node`; keep these in step. */
const COLUMN = 300;
const ROW = 150;

/**
 * Walks a spec list into positioned nodes and the edges between them.
 *
 * One fork deep on purpose: the branch of a branch is a genuinely different
 * layout problem (it needs a real tree algorithm to stop columns colliding),
 * and no journey in this fixture set needs one. A node graph from the API can
 * be arbitrarily deep — the canvas reads positions, it does not compute them.
 */
function build(
  id: string,
  specs: Spec[],
  entered: number,
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  let y = 0;
  let previous: string | null = null;
  let reaching = entered;
  let index = 0;

  const push = (
    spec: StepSpec,
    position: { x: number; y: number },
    count: number,
    branches?: string[],
  ) => {
    const [kind, title, summary] = spec;
    const nodeId = `${id}-n${index}`;
    index += 1;

    const node: WorkflowNode = {
      id: nodeId,
      kind,
      title,
      summary,
      config: {},
      position,
      entered: Math.round(count),
    };

    if (branches?.length) {
      node.branches = branches.map((label, order) => ({
        id: `${nodeId}-b${order}`,
        label,
      }));

      /* Shares are seeded off the node id and normalised, so a fork's branches
         always add up to the contacts that reached it. */
      const weights = node.branches.map(
        (branch) => 0.2 + seeded(branch.id) * 0.8,
      );
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      node.branchShare = Object.fromEntries(
        node.branches.map((branch, order) => [
          branch.id,
          Math.round((weights[order] / total) * 1000) / 10,
        ]),
      );
    }

    nodes.push(node);
    return node;
  };

  /** Drop-off per step: messaging loses a little, waiting loses almost none. */
  const decay = (kind: NodeKind, nodeId: string) => {
    const base =
      kind === "send_whatsapp" || kind === "send_email" || kind === "send_sms"
        ? 0.94
        : kind === "wait" || kind === "wait_until"
          ? 0.97
          : 0.995;
    return base - seeded(nodeId) * 0.03;
  };

  for (const spec of specs) {
    if (isFork(spec)) {
      const node = push(spec.fork, { x: 0, y }, reaching, spec.branches.map((branch) => branch.label));
      if (previous) {
        edges.push({ id: `${previous}->${node.id}`, from: previous, to: node.id });
      }

      const forkY = y;
      let deepest = forkY;

      spec.branches.forEach((branch, order) => {
        const offset = (order - (spec.branches.length - 1) / 2) * COLUMN;
        const share = node.branchShare?.[node.branches![order].id] ?? 50;
        let branchCount = (reaching * share) / 100;
        let branchPrevious = node.id;
        let branchY = forkY + ROW;

        branch.steps.forEach((step) => {
          const child = push(step, { x: offset, y: branchY }, branchCount);
          edges.push({
            id: `${branchPrevious}->${child.id}`,
            from: branchPrevious,
            to: child.id,
            branchId:
              branchPrevious === node.id
                ? node.branches![order].id
                : undefined,
          });
          branchCount *= decay(step[0], child.id);
          branchPrevious = child.id;
          branchY += ROW;
        });

        deepest = Math.max(deepest, branchY);
      });

      /* A fork ends the trunk — everything after it belongs to a branch. */
      previous = null;
      y = deepest;
      continue;
    }

    const node = push(spec, { x: 0, y }, reaching);
    if (previous) {
      edges.push({ id: `${previous}->${node.id}`, from: previous, to: node.id });
    }
    reaching *= decay(spec[0], node.id);
    previous = node.id;
    y += ROW;
  }

  return { nodes, edges };
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

const defaultSettings = (
  overrides: Partial<WorkflowSettings> = {},
): WorkflowSettings => ({
  entry: { mode: "once", maxEntries: 1, cooldownHours: 24 },
  exit: {
    goalReached: true,
    leavesSegment: false,
    unsubscribes: true,
    manualStop: true,
  },
  timing: {
    timezone: "Workspace timezone (GMT+4)",
    quietHours: { enabled: true, from: "21:00", to: "08:00" },
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  failure: {
    retry: true,
    maxRetries: 3,
    continueOnNonCritical: true,
    stopOnCritical: true,
  },
  ...overrides,
});

/* -------------------------------------------------------------------------- */
/* Workflows                                                                  */
/* -------------------------------------------------------------------------- */

interface WorkflowSeed {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerKey: string;
  triggerLabel: string;
  channels: MarketingChannel[];
  ownerId: string;
  entered: number;
  /** Share of `entered` that finished, and share of those that converted. */
  completion: number;
  conversion: number;
  updatedAt: string;
  createdAt: string;
  templateId?: string;
  failed?: number;
  specs: Spec[];
  settings?: Partial<WorkflowSettings>;
}

const SEEDS: WorkflowSeed[] = [
  {
    id: "wf-lead-nurture",
    name: "New Lead Nurture",
    description:
      "Greet every new lead on WhatsApp, then route repliers to an agent and non-repliers to an email follow-up.",
    status: "active",
    triggerKey: "lead.created",
    triggerLabel: "New Lead Created",
    channels: ["whatsapp", "email"],
    ownerId: "own-1",
    entered: 12480,
    completion: 86.9,
    conversion: 17.5,
    updatedAt: hoursAgo(2),
    createdAt: daysAgo(96),
    templateId: "tpl-new-lead-welcome",
    specs: [
      ["trigger", "New Lead Created", "Any lead source"],
      ["add_tag", "Add Tag", "New Lead"],
      ["send_whatsapp", "Send WhatsApp Welcome", "welcome_new_lead"],
      ["wait", "Wait", "1 day"],
      {
        fork: ["condition", "Did customer reply?", "Inbound message received"],
        branches: [
          {
            label: "Yes",
            steps: [
              ["assign_owner", "Assign Agent", "Round robin — Sales team"],
              ["update_stage", "Update Lead Stage", "Contacted"],
            ],
          },
          {
            label: "No",
            steps: [
              ["send_email", "Send Follow-up", "lead_nurture_day2"],
              ["wait", "Wait", "3 days"],
              ["add_segment", "Add to Segment", "Cold Leads"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "wf-cart-recovery",
    name: "Abandoned Checkout Recovery",
    description:
      "Recover abandoned carts using automated WhatsApp and Email follow-ups.",
    status: "active",
    triggerKey: "checkout.abandoned",
    triggerLabel: "Checkout Abandoned",
    channels: ["whatsapp", "email"],
    ownerId: "own-2",
    entered: 8940,
    completion: 78.4,
    conversion: 25,
    updatedAt: hoursAgo(6),
    createdAt: daysAgo(140),
    templateId: "tpl-abandoned-cart",
    specs: [
      ["trigger", "Checkout Abandoned", "Cart value over $20"],
      ["wait", "Wait", "1 hour"],
      ["send_whatsapp", "Send WhatsApp", "cart_recovery_reminder"],
      ["wait", "Wait", "23 hours"],
      {
        fork: ["condition", "Purchase completed?", "Order created since entry"],
        branches: [
          {
            label: "Yes",
            steps: [
              ["add_tag", "Add Tag", "Recovered Cart"],
              ["end", "End Workflow", "Goal reached"],
            ],
          },
          {
            label: "No",
            steps: [
              ["send_email", "Send Email", "cart_recovery_last_call"],
              ["wait", "Wait", "2 days"],
              ["end", "End Workflow", "Contact exits here"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "wf-order-journey",
    name: "Order Journey",
    description:
      "Confirm, fulfil and follow up on every order across WhatsApp, then ask for a review.",
    status: "active",
    triggerKey: "order.created",
    triggerLabel: "Order Created",
    channels: ["whatsapp", "email"],
    ownerId: "own-2",
    entered: 18420,
    completion: 94.2,
    conversion: 31.8,
    updatedAt: hoursAgo(20),
    createdAt: daysAgo(180),
    templateId: "tpl-order-confirmation",
    specs: [
      ["trigger", "Order Created", "Any sales channel"],
      ["send_whatsapp", "WhatsApp Confirmation", "order_confirmation"],
      ["wait_until", "Wait Until", "Order fulfilled"],
      ["send_whatsapp", "Delivery Message", "order_delivery_update"],
      ["wait", "Wait", "3 days"],
      ["send_email", "Review Request", "post_purchase_review"],
      ["add_tag", "Add Tag", "Review Requested"],
    ],
  },
  {
    id: "wf-landing-lead",
    name: "Landing Page Lead Capture",
    description:
      "Tag, segment and nurture every lead that arrives from a landing page form.",
    status: "active",
    triggerKey: "form.submitted",
    triggerLabel: "Form Submitted",
    channels: ["whatsapp", "email"],
    ownerId: "own-3",
    entered: 6210,
    completion: 81.2,
    conversion: 14.6,
    updatedAt: daysAgo(1),
    createdAt: daysAgo(64),
    specs: [
      ["trigger", "Form Submitted", "Pricing page — Request a demo"],
      ["add_tag", "Add Tag", "Landing Page Lead"],
      ["add_segment", "Add to Segment", "New Leads"],
      ["send_whatsapp", "Send WhatsApp", "demo_request_ack"],
      ["send_email", "Email Nurture", "demo_nurture_series"],
      ["update_stage", "Update Lead Stage", "Qualified"],
    ],
  },
  {
    id: "wf-whatsapp-inquiry",
    name: "WhatsApp Inquiry Follow-up",
    description:
      "Answer inbound WhatsApp enquiries instantly, then hand warm conversations to an agent.",
    status: "active",
    triggerKey: "whatsapp.message_received",
    triggerLabel: "Message Received",
    channels: ["whatsapp"],
    ownerId: "own-1",
    entered: 9860,
    completion: 92.5,
    conversion: 22.4,
    updatedAt: hoursAgo(9),
    createdAt: daysAgo(72),
    templateId: "tpl-whatsapp-inquiry",
    specs: [
      ["trigger", "Message Received", "Keyword: price, pricing, cost"],
      ["send_whatsapp", "Send Price List", "price_list_reply"],
      ["wait", "Wait", "30 minutes"],
      {
        fork: ["condition", "Still in conversation?", "Replied after price list"],
        branches: [
          {
            label: "Yes",
            steps: [
              ["assign_owner", "Assign Agent", "Sales — available agent"],
              ["notify", "Internal Notification", "Notify #sales channel"],
            ],
          },
          {
            label: "No",
            steps: [["add_tag", "Add Tag", "Price Enquiry — No Reply"]],
          },
        ],
      },
    ],
  },
  {
    id: "wf-review-request",
    name: "Review Request",
    description:
      "Ask happy customers for a review three days after delivery, and route unhappy ones to support.",
    status: "active",
    triggerKey: "order.fulfilled",
    triggerLabel: "Order Fulfilled",
    channels: ["whatsapp", "email"],
    ownerId: "own-4",
    entered: 7420,
    completion: 88.1,
    conversion: 19.2,
    updatedAt: daysAgo(2),
    createdAt: daysAgo(120),
    templateId: "tpl-review-request",
    specs: [
      ["trigger", "Order Fulfilled", "Delivered orders only"],
      ["wait", "Wait", "3 days"],
      ["send_whatsapp", "Ask For Rating", "review_request_rating"],
      {
        fork: ["if_else", "Rating 4 or higher?", "Reply matches 4 or 5"],
        branches: [
          {
            label: "If",
            steps: [
              ["send_email", "Send Review Link", "review_public_link"],
              ["add_tag", "Add Tag", "Promoter"],
            ],
          },
          {
            label: "Else",
            steps: [
              ["notify", "Internal Notification", "Alert support team"],
              ["assign_owner", "Assign Owner", "Support — escalations"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "wf-vip-journey",
    name: "VIP Customer Journey",
    description:
      "Give top spenders early access, a named account manager and a quarterly thank-you.",
    status: "active",
    triggerKey: "segment.entered",
    triggerLabel: "Segment Entered",
    channels: ["whatsapp", "email"],
    ownerId: "own-1",
    entered: 1840,
    completion: 91.4,
    conversion: 44.2,
    updatedAt: daysAgo(3),
    createdAt: daysAgo(210),
    templateId: "tpl-vip-journey",
    failed: 12,
    specs: [
      ["trigger", "Segment Entered", "VIP Customers"],
      ["assign_owner", "Assign Account Manager", "Amara Okafor"],
      ["send_whatsapp", "VIP Welcome", "vip_welcome"],
      ["wait", "Wait", "7 days"],
      ["send_email", "Early Access Invite", "vip_early_access"],
      ["wait", "Wait", "30 days"],
      ["send_whatsapp", "Quarterly Thank You", "vip_thank_you"],
    ],
  },
  {
    id: "wf-appointment",
    name: "Appointment Reminder",
    description:
      "Remind customers a day and an hour before their appointment, and catch no-shows.",
    status: "active",
    triggerKey: "date.appointment",
    triggerLabel: "Appointment Date",
    channels: ["whatsapp", "sms"],
    ownerId: "own-3",
    entered: 4260,
    completion: 96.1,
    conversion: 72.4,
    updatedAt: daysAgo(4),
    createdAt: daysAgo(88),
    templateId: "tpl-appointment-reminder",
    specs: [
      ["trigger", "Appointment Date", "24 hours before appointment"],
      ["send_whatsapp", "Day-before Reminder", "appointment_reminder_24h"],
      ["wait_until", "Wait Until", "1 hour before appointment"],
      ["send_sms", "Final Reminder", "See you in an hour"],
      {
        fork: ["condition", "Did customer attend?", "Appointment marked complete"],
        branches: [
          {
            label: "Yes",
            steps: [["add_tag", "Add Tag", "Attended"]],
          },
          {
            label: "No",
            steps: [
              ["send_whatsapp", "Rebooking Offer", "appointment_rebook"],
              ["add_tag", "Add Tag", "No Show"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "wf-lead-qualification",
    name: "Lead Qualification Routing",
    description:
      "Score inbound leads and route enterprise enquiries straight to a named rep.",
    status: "active",
    triggerKey: "lead.created",
    triggerLabel: "New Lead Created",
    channels: ["whatsapp", "email"],
    ownerId: "own-4",
    entered: 5320,
    completion: 84.6,
    conversion: 27.9,
    updatedAt: daysAgo(5),
    createdAt: daysAgo(56),
    templateId: "tpl-lead-qualification",
    specs: [
      ["trigger", "New Lead Created", "Source: website, campaign"],
      ["send_whatsapp", "Qualifying Questions", "lead_qualify_questions"],
      ["wait", "Wait", "2 hours"],
      {
        fork: ["multi_branch", "Company size", "Answer to question 2"],
        branches: [
          {
            label: "Enterprise",
            steps: [
              ["assign_owner", "Assign Owner", "Daniel Reyes"],
              ["update_stage", "Update Lead Stage", "Proposal"],
            ],
          },
          {
            label: "Mid-market",
            steps: [["send_email", "Send Case Studies", "midmarket_proof"]],
          },
          {
            label: "Small business",
            steps: [["add_segment", "Add to Segment", "Self-serve"]],
          },
        ],
      },
    ],
  },
  {
    id: "wf-delivery-updates",
    name: "Delivery Update Notifications",
    description:
      "Keep customers posted at every fulfilment milestone without an agent touching it.",
    status: "active",
    triggerKey: "order.fulfilled",
    triggerLabel: "Order Fulfilled",
    channels: ["whatsapp", "sms"],
    ownerId: "own-2",
    entered: 16240,
    completion: 97.8,
    conversion: 8.4,
    updatedAt: daysAgo(6),
    createdAt: daysAgo(150),
    templateId: "tpl-delivery-update",
    specs: [
      ["trigger", "Order Fulfilled", "All warehouses"],
      ["send_whatsapp", "Shipped Notification", "order_shipped"],
      ["wait_until", "Wait Until", "Carrier marks out for delivery"],
      ["send_sms", "Out For Delivery", "Your order arrives today"],
      ["wait_until", "Wait Until", "Delivered"],
      ["send_whatsapp", "Delivered Confirmation", "order_delivered"],
    ],
  },
  {
    id: "wf-post-purchase",
    name: "Post-Purchase Follow-up",
    description:
      "Check in a week after delivery, offer help, and cross-sell the natural next product.",
    status: "active",
    triggerKey: "product.purchased",
    triggerLabel: "Product Purchased",
    channels: ["whatsapp", "email"],
    ownerId: "own-3",
    entered: 11260,
    completion: 89.7,
    conversion: 12.8,
    updatedAt: daysAgo(8),
    createdAt: daysAgo(102),
    templateId: "tpl-post-purchase",
    specs: [
      ["trigger", "Product Purchased", "Any product"],
      ["wait", "Wait", "7 days"],
      ["send_whatsapp", "How is it going?", "post_purchase_checkin"],
      ["wait", "Wait", "2 days"],
      ["send_email", "Recommended For You", "cross_sell_recommendations"],
      ["update_field", "Update Contact Field", "Lifecycle = Repeat"],
    ],
  },
  {
    id: "wf-birthday",
    name: "Birthday Offer",
    description:
      "Send a personal birthday message with a time-limited discount code.",
    status: "active",
    triggerKey: "date.birthday",
    triggerLabel: "Birthday",
    channels: ["whatsapp"],
    ownerId: "own-1",
    entered: 2180,
    completion: 98.2,
    conversion: 21.6,
    updatedAt: daysAgo(11),
    createdAt: daysAgo(240),
    specs: [
      ["trigger", "Birthday", "On the day, 09:00 local"],
      ["send_whatsapp", "Birthday Message", "birthday_offer"],
      ["wait", "Wait", "5 days"],
      {
        fork: ["condition", "Offer redeemed?", "Discount code used"],
        branches: [
          { label: "Yes", steps: [["add_tag", "Add Tag", "Birthday Redeemer"]] },
          {
            label: "No",
            steps: [["send_whatsapp", "Last Chance", "birthday_offer_reminder"]],
          },
        ],
      },
    ],
  },
  {
    id: "wf-winback",
    name: "Inactive Customer Win-back",
    description:
      "Reach customers who have not ordered in 90 days with a staged win-back offer.",
    status: "paused",
    triggerKey: "lead.inactive",
    triggerLabel: "Lead Inactive",
    channels: ["email", "sms"],
    ownerId: "own-4",
    entered: 3480,
    completion: 62.4,
    conversion: 9.1,
    updatedAt: daysAgo(14),
    createdAt: daysAgo(190),
    templateId: "tpl-winback",
    specs: [
      ["trigger", "Lead Inactive", "No order in 90 days"],
      ["send_email", "We miss you", "winback_step1"],
      ["wait", "Wait", "5 days"],
      ["send_sms", "Offer Reminder", "15% off, expires Sunday"],
      ["wait", "Wait", "5 days"],
      ["add_segment", "Add to Segment", "Dormant"],
    ],
  },
  {
    id: "wf-webinar",
    name: "Webinar Follow-up",
    description:
      "Thank attendees, send the recording to no-shows, and route hot leads to sales.",
    status: "draft",
    triggerKey: "campaign.clicked",
    triggerLabel: "Campaign Clicked",
    channels: ["email", "whatsapp"],
    ownerId: "own-3",
    entered: 0,
    completion: 0,
    conversion: 0,
    updatedAt: daysAgo(1),
    createdAt: daysAgo(9),
    templateId: "tpl-webinar",
    specs: [
      ["trigger", "Campaign Clicked", "Webinar registration campaign"],
      ["wait_until", "Wait Until", "Webinar end time"],
      {
        fork: ["condition", "Did they attend?", "Attendance recorded"],
        branches: [
          {
            label: "Yes",
            steps: [
              ["send_email", "Thank You & Slides", "webinar_thanks"],
              ["assign_owner", "Assign Owner", "Priya Nair"],
            ],
          },
          {
            label: "No",
            steps: [["send_email", "Watch The Recording", "webinar_recording"]],
          },
        ],
      },
    ],
  },
  {
    id: "wf-referral",
    name: "Referral Invitation",
    description:
      "Invite promoters to refer a friend once they have left a five-star review.",
    status: "draft",
    triggerKey: "tag.added",
    triggerLabel: "Tag Added",
    channels: ["whatsapp"],
    ownerId: "own-2",
    entered: 0,
    completion: 0,
    conversion: 0,
    updatedAt: daysAgo(3),
    createdAt: daysAgo(3),
    specs: [
      ["trigger", "Tag Added", "Promoter"],
      ["wait", "Wait", "2 days"],
      ["send_whatsapp", "Referral Invite", ""],
    ],
  },
  {
    id: "wf-reengagement",
    name: "90-Day Re-engagement",
    description:
      "Wake up contacts who have stopped opening, and clear out the ones who never do.",
    status: "error",
    triggerKey: "date.custom_field",
    triggerLabel: "Custom Date Field",
    channels: ["email", "whatsapp"],
    ownerId: "own-1",
    entered: 2640,
    completion: 41.2,
    conversion: 4.8,
    updatedAt: hoursAgo(14),
    createdAt: daysAgo(75),
    failed: 184,
    templateId: "tpl-reengagement",
    specs: [
      ["trigger", "Custom Date Field", "Last engaged + 90 days"],
      ["send_email", "Are you still there?", "reengage_step1"],
      ["wait", "Wait", "4 days"],
      ["send_whatsapp", "One last try", "reengage_final"],
      ["wait", "Wait", "4 days"],
      ["remove_segment", "Remove from Segment", "Active Subscribers"],
    ],
  },
  {
    id: "wf-nps-archive",
    name: "Quarterly NPS Survey",
    description:
      "Replaced by the Review Request journey — kept for its historical reporting.",
    status: "archived",
    triggerKey: "date.recurrence",
    triggerLabel: "Scheduled Recurrence",
    channels: ["email"],
    ownerId: "own-4",
    entered: 9120,
    completion: 72.8,
    conversion: 6.2,
    updatedAt: daysAgo(64),
    createdAt: daysAgo(420),
    specs: [
      ["trigger", "Scheduled Recurrence", "First Monday each quarter"],
      ["send_email", "NPS Survey", "nps_quarterly"],
      ["wait", "Wait", "7 days"],
      ["end", "End Workflow", "Contact exits here"],
    ],
  },
];

/** `GET /automation/workflows`. */
export const WORKFLOWS: Workflow[] = SEEDS.map((seed) => {
  const { nodes, edges } = build(seed.id, seed.specs, seed.entered);
  const completed = Math.round((seed.entered * seed.completion) / 100);
  const converted = Math.round((seed.entered * seed.conversion) / 100);

  /*
   * Failures, where the seed has not stated them.
   *
   * One to four per cent of entrants, seeded off the id. Messaging automation
   * fails at roughly that rate in the real world — disconnected numbers,
   * bounced addresses, templates rejected after the fact — and a fixture set
   * with a 99.9% success rate makes the Activity page's whole reason for
   * existing look like decoration.
   */
  const failed =
    seed.failed ??
    Math.round(seed.entered * (0.012 + seeded(`${seed.id}-failures`) * 0.028));

  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    status: seed.status,
    triggerKey: seed.triggerKey,
    triggerLabel: seed.triggerLabel,
    channels: seed.channels,
    nodes,
    edges,
    ownerId: seed.ownerId,
    stats: {
      entered: seed.entered,
      completed,
      converted,
      running: Math.max(0, seed.entered - completed - failed),
      failed,
    },
    settings: defaultSettings(seed.settings),
    templateId: seed.templateId,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    publishedAt: seed.status === "draft" ? undefined : seed.createdAt,
  };
});

export const workflowById = (id: string) =>
  WORKFLOWS.find((workflow) => workflow.id === id);

/** Everything except archived — what the list page opens on. */
export const LIVE_WORKFLOWS = WORKFLOWS.filter(
  (workflow) => workflow.status !== "archived",
);

export const nodeById = (workflow: Workflow, nodeId: string) =>
  workflow.nodes.find((node) => node.id === nodeId);

/** Conversion as a percentage of contacts that entered. */
export const conversionRate = (workflow: Workflow) =>
  workflow.stats.entered === 0
    ? 0
    : (workflow.stats.converted / workflow.stats.entered) * 100;

/**
 * A blank draft, for the Create Workflow dialog.
 *
 * Built here rather than in the component so a draft created by hand and one
 * created from a template are the same object — which is what lets the builder
 * open either without knowing where it came from. Ids are minted from the
 * caller's clock: with a real API the server owns them, and nothing downstream
 * reads meaning out of the string.
 */
export function createDraftWorkflow({
  name,
  description,
  triggerKey,
  triggerLabel,
  ownerId = "own-1",
  template,
}: {
  name: string;
  description: string;
  triggerKey: string;
  triggerLabel: string;
  ownerId?: string;
  template?: AutomationTemplate;
}): Workflow {
  const id = localId("wf-draft");
  const now = AUTOMATION_NOW;

  const specs: Spec[] = template
    ? template.steps.map((templateStep) =>
        templateStep.branches
          ? {
              fork: [templateStep.kind, templateStep.title, templateStep.summary],
              branches: templateStep.branches.map((label) => ({ label, steps: [] })),
            }
          : ([templateStep.kind, templateStep.title, templateStep.summary] as StepSpec),
      )
    : [["trigger", triggerLabel, "Not configured"] as StepSpec];

  const { nodes, edges } = build(id, specs, 0);

  return {
    id,
    name,
    description,
    status: "draft",
    triggerKey,
    triggerLabel,
    channels: template?.channels ?? [],
    nodes,
    edges,
    ownerId,
    stats: { entered: 0, completed: 0, converted: 0, running: 0, failed: 0 },
    settings: defaultSettings(),
    templateId: template?.id,
    createdAt: now,
    updatedAt: now,
  };
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

const step = (
  kind: NodeKind,
  title: string,
  summary: string,
  branches?: [string, string],
): TemplateStep => ({ kind, title, summary, branches });

/** `GET /automation/templates`. */
export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "tpl-new-lead-welcome",
    name: "New Lead Welcome",
    category: "lead-nurture",
    description:
      "Say hello on WhatsApp the moment a lead arrives, then tag and route them.",
    channels: ["whatsapp", "email"],
    complexity: "starter",
    setupMinutes: 3,
    bestFor: [
      "Teams answering leads by hand today",
      "Any business with a WhatsApp number on its site",
    ],
    triggerKey: "lead.created",
    steps: [
      step("trigger", "New Lead Created", "Any lead source"),
      step("add_tag", "Add Tag", "New Lead"),
      step("send_whatsapp", "Send WhatsApp Welcome", "welcome_new_lead"),
      step("wait", "Wait", "1 day"),
      step("condition", "Did customer reply?", "Inbound message", ["Assign agent", "Send email"]),
    ],
    requiredIntegrations: ["WhatsApp Business API"],
    requiredMessageTemplates: ["welcome_new_lead"],
    installs: 412,
  },
  {
    id: "tpl-lead-nurture",
    name: "Lead Nurture",
    category: "lead-nurture",
    description:
      "A five-touch nurture across WhatsApp and email, paced over two weeks.",
    channels: ["whatsapp", "email"],
    complexity: "intermediate",
    setupMinutes: 8,
    bestFor: ["Considered purchases", "B2B pipelines with a long cycle"],
    triggerKey: "tag.added",
    steps: [
      step("trigger", "Tag Added", "Nurture"),
      step("send_email", "Problem / Solution", "nurture_day0"),
      step("wait", "Wait", "3 days"),
      step("send_whatsapp", "Customer Story", "nurture_story"),
      step("wait", "Wait", "4 days"),
      step("send_email", "Offer", "nurture_offer"),
      step("update_stage", "Update Lead Stage", "Qualified"),
    ],
    requiredIntegrations: ["WhatsApp Business API", "Email sending domain"],
    requiredMessageTemplates: ["nurture_story"],
    installs: 286,
  },
  {
    id: "tpl-lead-qualification",
    name: "Lead Qualification",
    category: "sales",
    description:
      "Ask two qualifying questions on WhatsApp, then route by company size.",
    channels: ["whatsapp", "email"],
    complexity: "advanced",
    setupMinutes: 12,
    bestFor: ["Sales teams with tiered ownership", "High inbound volume"],
    triggerKey: "lead.created",
    steps: [
      step("trigger", "New Lead Created", "Website and campaigns"),
      step("send_whatsapp", "Qualifying Questions", "lead_qualify_questions"),
      step("wait", "Wait", "2 hours"),
      step("multi_branch", "Company size", "Answer to question 2", ["Enterprise", "Everyone else"]),
      step("assign_owner", "Assign Owner", "By territory"),
    ],
    requiredIntegrations: ["WhatsApp Business API", "CRM pipeline"],
    requiredMessageTemplates: ["lead_qualify_questions"],
    installs: 174,
  },
  {
    id: "tpl-whatsapp-inquiry",
    name: "WhatsApp Inquiry Follow-up",
    category: "sales",
    description:
      "Reply to keyword enquiries instantly and escalate live conversations.",
    channels: ["whatsapp"],
    complexity: "starter",
    setupMinutes: 4,
    bestFor: ["Retailers taking orders over WhatsApp", "Out-of-hours coverage"],
    triggerKey: "whatsapp.keyword_received",
    steps: [
      step("trigger", "Keyword Received", "price, pricing, cost"),
      step("send_whatsapp", "Send Price List", "price_list_reply"),
      step("wait", "Wait", "30 minutes"),
      step("condition", "Still in conversation?", "Replied since", ["Assign agent", "Tag and exit"]),
    ],
    requiredIntegrations: ["WhatsApp Business API"],
    requiredMessageTemplates: ["price_list_reply"],
    installs: 358,
  },
  {
    id: "tpl-abandoned-cart",
    name: "Abandoned Cart Recovery",
    category: "ecommerce",
    description:
      "Recover abandoned checkout sessions using WhatsApp and Email.",
    channels: ["whatsapp", "email"],
    complexity: "intermediate",
    setupMinutes: 5,
    bestFor: ["Online stores", "Any checkout with a drop-off problem"],
    triggerKey: "checkout.abandoned",
    steps: [
      step("trigger", "Checkout Abandoned", "Cart value over $20"),
      step("wait", "Wait", "1 hour"),
      step("send_whatsapp", "WhatsApp Reminder", "cart_recovery_reminder"),
      step("wait", "Wait", "23 hours"),
      step("condition", "Purchased?", "Order created since entry", ["End", "Send email"]),
    ],
    requiredIntegrations: ["WhatsApp Business API", "Store checkout"],
    requiredMessageTemplates: ["cart_recovery_reminder"],
    installs: 521,
  },
  {
    id: "tpl-order-confirmation",
    name: "Order Confirmation",
    category: "ecommerce",
    description:
      "Confirm every order on WhatsApp within seconds of payment clearing.",
    channels: ["whatsapp"],
    complexity: "starter",
    setupMinutes: 2,
    bestFor: ["Stores whose confirmation email goes to spam", "Cash-on-delivery"],
    triggerKey: "order.paid",
    steps: [
      step("trigger", "Order Paid", "Any payment method"),
      step("send_whatsapp", "Order Confirmation", "order_confirmation"),
      step("add_tag", "Add Tag", "Customer"),
    ],
    requiredIntegrations: ["WhatsApp Business API", "Store orders"],
    requiredMessageTemplates: ["order_confirmation"],
    installs: 604,
  },
  {
    id: "tpl-delivery-update",
    name: "Order Delivery Update",
    category: "ecommerce",
    description:
      "Shipped, out for delivery and delivered — three messages, no agent time.",
    channels: ["whatsapp", "sms"],
    complexity: "intermediate",
    setupMinutes: 6,
    bestFor: ["Stores with a carrier integration", "High 'where is my order' volume"],
    triggerKey: "order.fulfilled",
    steps: [
      step("trigger", "Order Fulfilled", "All warehouses"),
      step("send_whatsapp", "Shipped", "order_shipped"),
      step("wait_until", "Wait Until", "Out for delivery"),
      step("send_sms", "Out For Delivery", "Arrives today"),
      step("send_whatsapp", "Delivered", "order_delivered"),
    ],
    requiredIntegrations: ["WhatsApp Business API", "SMS sender ID", "Carrier webhook"],
    requiredMessageTemplates: ["order_shipped", "order_delivered"],
    installs: 243,
  },
  {
    id: "tpl-post-purchase",
    name: "Post-Purchase Follow-up",
    category: "customer-success",
    description:
      "Check in a week after delivery and recommend the natural next product.",
    channels: ["whatsapp", "email"],
    complexity: "starter",
    setupMinutes: 4,
    bestFor: ["Repeat-purchase categories", "Anyone measuring second-order rate"],
    triggerKey: "product.purchased",
    steps: [
      step("trigger", "Product Purchased", "Any product"),
      step("wait", "Wait", "7 days"),
      step("send_whatsapp", "How is it going?", "post_purchase_checkin"),
      step("send_email", "Recommended For You", "cross_sell_recommendations"),
    ],
    requiredIntegrations: ["WhatsApp Business API"],
    requiredMessageTemplates: ["post_purchase_checkin"],
    installs: 198,
  },
  {
    id: "tpl-review-request",
    name: "Review Request",
    category: "customer-success",
    description:
      "Ask for a rating, send promoters to your review page and unhappy customers to support.",
    channels: ["whatsapp", "email"],
    complexity: "intermediate",
    setupMinutes: 7,
    bestFor: ["Businesses building social proof", "Teams tracking CSAT"],
    triggerKey: "order.fulfilled",
    steps: [
      step("trigger", "Order Fulfilled", "Delivered orders"),
      step("wait", "Wait", "3 days"),
      step("send_whatsapp", "Ask For Rating", "review_request_rating"),
      step("if_else", "Rating 4 or higher?", "Reply matches 4 or 5", ["Review link", "Alert support"]),
    ],
    requiredIntegrations: ["WhatsApp Business API"],
    requiredMessageTemplates: ["review_request_rating"],
    installs: 307,
  },
  {
    id: "tpl-appointment-reminder",
    name: "Appointment Reminder",
    category: "appointments",
    description:
      "Cut no-shows with a day-before WhatsApp and an hour-before SMS.",
    channels: ["whatsapp", "sms"],
    complexity: "starter",
    setupMinutes: 5,
    bestFor: ["Clinics and salons", "Anyone booking a calendar slot"],
    triggerKey: "date.appointment",
    steps: [
      step("trigger", "Appointment Date", "24 hours before"),
      step("send_whatsapp", "Day-before Reminder", "appointment_reminder_24h"),
      step("wait_until", "Wait Until", "1 hour before"),
      step("send_sms", "Final Reminder", "See you in an hour"),
      step("condition", "Attended?", "Marked complete", ["Tag attended", "Offer rebooking"]),
    ],
    requiredIntegrations: ["WhatsApp Business API", "SMS sender ID", "Calendar"],
    requiredMessageTemplates: ["appointment_reminder_24h"],
    installs: 262,
  },
  {
    id: "tpl-winback",
    name: "Inactive Customer Win-back",
    category: "re-engagement",
    description:
      "A three-step offer ladder for customers who have gone quiet for 90 days.",
    channels: ["email", "sms"],
    complexity: "intermediate",
    setupMinutes: 8,
    bestFor: ["Subscription and repeat-purchase businesses"],
    triggerKey: "lead.inactive",
    steps: [
      step("trigger", "Lead Inactive", "No order in 90 days"),
      step("send_email", "We miss you", "winback_step1"),
      step("wait", "Wait", "5 days"),
      step("send_sms", "Offer Reminder", "15% off, expires Sunday"),
      step("add_segment", "Add to Segment", "Dormant"),
    ],
    requiredIntegrations: ["Email sending domain", "SMS sender ID"],
    requiredMessageTemplates: [],
    installs: 156,
  },
  {
    id: "tpl-vip-journey",
    name: "VIP Customer Journey",
    category: "customer-success",
    description:
      "Early access, a named account manager and a quarterly thank-you for top spenders.",
    channels: ["whatsapp", "email"],
    complexity: "advanced",
    setupMinutes: 14,
    bestFor: ["High-value retail", "Any business with a loyalty tier"],
    triggerKey: "segment.entered",
    steps: [
      step("trigger", "Segment Entered", "VIP Customers"),
      step("assign_owner", "Assign Account Manager", "By territory"),
      step("send_whatsapp", "VIP Welcome", "vip_welcome"),
      step("wait", "Wait", "7 days"),
      step("send_email", "Early Access", "vip_early_access"),
    ],
    requiredIntegrations: ["WhatsApp Business API", "Segments"],
    requiredMessageTemplates: ["vip_welcome"],
    installs: 91,
  },
  {
    id: "tpl-webinar",
    name: "Webinar Follow-up",
    category: "lead-nurture",
    description:
      "Thank attendees, send the recording to no-shows, route hot leads to sales.",
    channels: ["email", "whatsapp"],
    complexity: "intermediate",
    setupMinutes: 9,
    bestFor: ["Teams running live demos", "Event-led growth"],
    triggerKey: "campaign.clicked",
    steps: [
      step("trigger", "Campaign Clicked", "Registration campaign"),
      step("wait_until", "Wait Until", "Webinar end time"),
      step("condition", "Did they attend?", "Attendance recorded", ["Thanks & slides", "Send recording"]),
      step("assign_owner", "Assign Owner", "Sales team"),
    ],
    requiredIntegrations: ["Email sending domain", "Webinar platform"],
    requiredMessageTemplates: [],
    installs: 118,
  },
  {
    id: "tpl-reengagement",
    name: "Re-engagement Campaign",
    category: "re-engagement",
    description:
      "Wake up quiet contacts, then clean the ones who never respond out of your list.",
    channels: ["email", "whatsapp"],
    complexity: "intermediate",
    setupMinutes: 7,
    bestFor: ["Lists with falling open rates", "Deliverability clean-ups"],
    triggerKey: "date.custom_field",
    steps: [
      step("trigger", "Custom Date Field", "Last engaged + 90 days"),
      step("send_email", "Are you still there?", "reengage_step1"),
      step("wait", "Wait", "4 days"),
      step("send_whatsapp", "One last try", "reengage_final"),
      step("remove_segment", "Remove from Segment", "Active Subscribers"),
    ],
    requiredIntegrations: ["Email sending domain", "WhatsApp Business API"],
    requiredMessageTemplates: ["reengage_final"],
    installs: 203,
  },
];

export const templateById = (id: string) =>
  AUTOMATION_TEMPLATES.find((template) => template.id === id);

/* -------------------------------------------------------------------------- */
/* Trigger registry                                                           */
/* -------------------------------------------------------------------------- */

interface TriggerSeed {
  name: string;
  eventKey: string;
  category: AutomationTrigger["category"];
  source: string;
  description: string;
  status?: AutomationTrigger["status"];
  events24h: number;
  failed24h?: number;
  lastEventMinutes?: number;
  payload: Record<string, unknown>;
  custom?: boolean;
}

const TRIGGER_SEEDS: TriggerSeed[] = [
  /* Customer */
  {
    name: "Contact Created",
    eventKey: "contact.created",
    category: "customer",
    source: "CRM",
    description: "A new person is added to the workspace, from any source.",
    events24h: 486,
    lastEventMinutes: 3,
    payload: {
      contact_id: "CT-8451",
      source: "landing_page",
      email: "sarah@brightretail.co",
      created_at: "2026-09-13T09:41:00Z",
    },
  },
  {
    name: "Contact Updated",
    eventKey: "contact.updated",
    category: "customer",
    source: "CRM",
    description: "Any field on a contact record changes.",
    events24h: 1284,
    lastEventMinutes: 1,
    payload: {
      contact_id: "CT-8451",
      changed_fields: ["lifecycle", "owner_id"],
      previous: { lifecycle: "lead" },
    },
  },
  {
    name: "Tag Added",
    eventKey: "tag.added",
    category: "customer",
    source: "CRM",
    description: "A tag is applied to a contact by a person or a workflow.",
    events24h: 942,
    lastEventMinutes: 2,
    payload: { contact_id: "CT-8451", tag: "VIP", applied_by: "workflow" },
  },
  {
    name: "Tag Removed",
    eventKey: "tag.removed",
    category: "customer",
    source: "CRM",
    description: "A tag is taken off a contact.",
    events24h: 214,
    lastEventMinutes: 26,
    payload: { contact_id: "CT-8451", tag: "Trial" },
  },
  {
    name: "Segment Entered",
    eventKey: "segment.entered",
    category: "customer",
    source: "Segments",
    description: "A contact starts matching a dynamic segment's rules.",
    events24h: 328,
    lastEventMinutes: 8,
    payload: { contact_id: "CT-8451", segment_id: "seg-vip", segment_name: "VIP Customers" },
  },
  {
    name: "Segment Exited",
    eventKey: "segment.exited",
    category: "customer",
    source: "Segments",
    description: "A contact stops matching a dynamic segment's rules.",
    events24h: 176,
    lastEventMinutes: 19,
    payload: { contact_id: "CT-8451", segment_id: "seg-vip" },
  },

  /* Leads */
  {
    name: "Lead Created",
    eventKey: "lead.created",
    category: "leads",
    source: "CRM",
    description: "A lead record is opened against a contact.",
    events24h: 248,
    lastEventMinutes: 2,
    payload: { lead_id: "LD-1284", contact_id: "CT-8451", source: "landing_page" },
  },
  {
    name: "Lead Stage Changed",
    eventKey: "lead.stage_changed",
    category: "leads",
    source: "CRM",
    description: "A lead moves between pipeline stages.",
    events24h: 412,
    lastEventMinutes: 6,
    payload: { lead_id: "LD-1284", from: "new", to: "qualified", changed_by: "own-1" },
  },
  {
    name: "Lead Assigned",
    eventKey: "lead.assigned",
    category: "leads",
    source: "CRM",
    description: "Ownership of a lead changes hands.",
    events24h: 186,
    lastEventMinutes: 11,
    payload: { lead_id: "LD-1284", owner_id: "own-2", previous_owner_id: "own-1" },
  },
  {
    name: "Lead Inactive",
    eventKey: "lead.inactive",
    category: "leads",
    source: "CRM",
    description: "A lead has had no activity for the configured window.",
    events24h: 64,
    lastEventMinutes: 92,
    payload: { lead_id: "LD-1284", inactive_days: 90, last_activity_at: "2026-06-15T10:12:00Z" },
  },

  /* WhatsApp */
  {
    name: "Message Received",
    eventKey: "whatsapp.message_received",
    category: "whatsapp",
    source: "WhatsApp",
    description: "An inbound WhatsApp message arrives on any connected number.",
    events24h: 3860,
    lastEventMinutes: 1,
    payload: {
      contact_id: "CT-8451",
      wa_id: "971501184420",
      message: { type: "text", body: "What is the price?" },
    },
  },
  {
    name: "Keyword Received",
    eventKey: "whatsapp.keyword_received",
    category: "whatsapp",
    source: "WhatsApp",
    description: "An inbound message matches one of your configured keywords.",
    events24h: 742,
    lastEventMinutes: 4,
    payload: { contact_id: "CT-8451", keyword: "price", matched_text: "what is the price?" },
  },
  {
    name: "Customer Replied",
    eventKey: "whatsapp.replied",
    category: "whatsapp",
    source: "WhatsApp",
    description: "A contact replies inside an open conversation window.",
    events24h: 1420,
    lastEventMinutes: 2,
    payload: { contact_id: "CT-8451", conversation_id: "CV-2201", within_window: true },
  },
  {
    name: "Message Delivered",
    eventKey: "whatsapp.delivered",
    category: "whatsapp",
    source: "WhatsApp",
    description: "A delivery receipt comes back from the WhatsApp API.",
    events24h: 12840,
    failed24h: 68,
    lastEventMinutes: 1,
    payload: { message_id: "wamid.HBg…", status: "delivered", timestamp: 1789254060 },
  },
  {
    name: "Message Read",
    eventKey: "whatsapp.read",
    category: "whatsapp",
    source: "WhatsApp",
    description: "A read receipt comes back from the WhatsApp API.",
    events24h: 9260,
    lastEventMinutes: 1,
    payload: { message_id: "wamid.HBg…", status: "read" },
  },

  /* Commerce */
  {
    name: "Order Created",
    eventKey: "order.created",
    category: "commerce",
    source: "Commerce",
    description: "An order is placed, before payment is confirmed.",
    events24h: 684,
    lastEventMinutes: 2,
    payload: { order_id: "OR-5521", contact_id: "CT-8451", total: 248.5, currency: "USD" },
  },
  {
    name: "Order Paid",
    eventKey: "order.paid",
    category: "commerce",
    source: "Commerce",
    description: "Payment clears against an order.",
    events24h: 612,
    lastEventMinutes: 3,
    payload: { order_id: "OR-5521", payment_method: "card", paid_at: "2026-09-13T09:42:00Z" },
  },
  {
    name: "Order Fulfilled",
    eventKey: "order.fulfilled",
    category: "commerce",
    source: "Commerce",
    description: "An order is marked shipped or handed to a carrier.",
    events24h: 548,
    lastEventMinutes: 7,
    payload: { order_id: "OR-5521", carrier: "Aramex", tracking: "AR-99182" },
  },
  {
    name: "Checkout Abandoned",
    eventKey: "checkout.abandoned",
    category: "commerce",
    source: "Commerce",
    description: "A checkout is left incomplete for longer than 30 minutes.",
    events24h: 396,
    lastEventMinutes: 5,
    payload: { checkout_id: "CO-7781", contact_id: "CT-8451", cart_total: 186, items: 3 },
  },
  {
    name: "Product Purchased",
    eventKey: "product.purchased",
    category: "commerce",
    source: "Commerce",
    description: "A specific product appears in a paid order.",
    events24h: 1120,
    lastEventMinutes: 3,
    payload: { order_id: "OR-5521", product_id: "PR-118", sku: "MF-CANDLE-01", quantity: 2 },
  },

  /* Marketing */
  {
    name: "Form Submitted",
    eventKey: "form.submitted",
    category: "marketing",
    source: "Forms",
    description: "A landing page or embedded form is submitted.",
    events24h: 312,
    lastEventMinutes: 4,
    payload: { form_id: "FM-22", contact_id: "CT-8451", fields: { company: "Bright Retail" } },
  },
  {
    name: "Campaign Opened",
    eventKey: "campaign.opened",
    category: "marketing",
    source: "Campaigns",
    description: "A contact opens a campaign email.",
    events24h: 4820,
    lastEventMinutes: 1,
    payload: { campaign_id: "CP-903", contact_id: "CT-8451", opened_at: "2026-09-13T09:40:00Z" },
  },
  {
    name: "Campaign Clicked",
    eventKey: "campaign.clicked",
    category: "marketing",
    source: "Campaigns",
    description: "A contact clicks a tracked link in a campaign.",
    events24h: 1180,
    lastEventMinutes: 2,
    payload: { campaign_id: "CP-903", contact_id: "CT-8451", url: "https://marketflow.app/pricing" },
  },
  {
    name: "Email Replied",
    eventKey: "email.replied",
    category: "marketing",
    source: "Email",
    description: "A contact replies to a campaign or automated email.",
    events24h: 96,
    lastEventMinutes: 22,
    payload: { message_id: "EM-4410", contact_id: "CT-8451", subject: "Re: Your quote" },
  },

  /* Date & time */
  {
    name: "Birthday",
    eventKey: "date.birthday",
    category: "datetime",
    source: "Scheduler",
    description: "Fires on a contact's birthday, in their local morning.",
    events24h: 42,
    lastEventMinutes: 165,
    payload: { contact_id: "CT-8451", birthday: "1991-09-13", local_time: "09:00" },
  },
  {
    name: "Appointment Date",
    eventKey: "date.appointment",
    category: "datetime",
    source: "Scheduler",
    description: "Fires a configurable interval before a booked appointment.",
    events24h: 128,
    lastEventMinutes: 34,
    payload: { appointment_id: "AP-771", contact_id: "CT-8451", starts_at: "2026-09-14T10:00:00Z" },
  },
  {
    name: "Custom Date Field",
    eventKey: "date.custom_field",
    category: "datetime",
    source: "Scheduler",
    description: "Fires relative to any date field on the contact record.",
    events24h: 88,
    failed24h: 4,
    lastEventMinutes: 48,
    payload: { contact_id: "CT-8451", field: "last_engaged_at", offset_days: 90 },
  },
  {
    name: "Scheduled Recurrence",
    eventKey: "date.recurrence",
    category: "datetime",
    source: "Scheduler",
    description: "Fires on a cron-style schedule against a segment.",
    status: "disabled",
    events24h: 0,
    lastEventMinutes: 60 * 24 * 9,
    payload: { schedule: "0 9 1 */3 *", segment_id: "seg-all" },
  },

  /* Developer */
  {
    name: "Webhook Received",
    eventKey: "webhook.received",
    category: "developer",
    source: "Webhooks",
    description: "An external system POSTs to your workspace webhook URL.",
    events24h: 264,
    failed24h: 11,
    lastEventMinutes: 9,
    payload: {
      webhook_id: "WH-14",
      signature_valid: true,
      body: { event: "subscription.renewed", customer: "CT-8451" },
    },
  },
  {
    name: "API Event",
    eventKey: "api.event",
    category: "developer",
    source: "API",
    description: "An event posted through the public automation events endpoint.",
    status: "beta",
    events24h: 58,
    lastEventMinutes: 41,
    payload: { event: "trial.started", contact_id: "CT-8451", properties: { plan: "growth" } },
  },
  {
    name: "Demo Requested",
    eventKey: "demo_requested",
    category: "developer",
    source: "Custom",
    description:
      "Raised by the product when someone books a demo from inside the app.",
    events24h: 36,
    lastEventMinutes: 27,
    payload: { contact_id: "CT-8451", plan_interest: "growth", seats: 12 },
    custom: true,
  },
];

const EVENT_CONTACTS = [
  "Sarah Ahmed",
  "Maria Gomez",
  "John Smith",
  "Aisha Bello",
  "Lukas Meyer",
  "Yuki Tanaka",
];

/** `GET /automation/triggers`. */
export const AUTOMATION_TRIGGERS: AutomationTrigger[] = TRIGGER_SEEDS.map(
  (seed, index) => {
    const id = `trg-${seed.eventKey.replace(/\./g, "-")}`;
    const workflowIds = WORKFLOWS.filter(
      (workflow) => workflow.triggerKey === seed.eventKey,
    ).map((workflow) => workflow.id);

    const recentEvents = seed.events24h
      ? Array.from({ length: 4 }, (_, order) => {
          const failed = (seed.failed24h ?? 0) > 0 && order === 2;
          return {
            id: `${id}-ev-${order}`,
            at: minutesAgo((seed.lastEventMinutes ?? 5) + order * 7 + index),
            contactName:
              seed.category === "developer"
                ? undefined
                : EVENT_CONTACTS[(index + order) % EVENT_CONTACTS.length],
            summary: seed.name,
            status: failed ? ("failed" as const) : ("processed" as const),
          };
        })
      : [];

    return {
      id,
      name: seed.name,
      eventKey: seed.eventKey,
      category: seed.category,
      source: seed.source,
      description: seed.description,
      status: seed.status ?? "active",
      workflowIds,
      events24h: seed.events24h,
      failed24h: seed.failed24h ?? 0,
      lastEventAt:
        seed.lastEventMinutes === undefined
          ? undefined
          : minutesAgo(seed.lastEventMinutes),
      payload: seed.payload,
      recentEvents,
      custom: seed.custom,
    };
  },
);

export const triggerById = (id: string) =>
  AUTOMATION_TRIGGERS.find((trigger) => trigger.id === id);

export const triggerByKey = (eventKey: string) =>
  AUTOMATION_TRIGGERS.find((trigger) => trigger.eventKey === eventKey);

/* -------------------------------------------------------------------------- */
/* Runs                                                                       */
/* -------------------------------------------------------------------------- */

interface RunStepSeed {
  nodeIndex: number;
  minutesAgo: number;
  event: string;
  status: ExecutionStatus;
  durationMs?: number;
  channel?: MarketingChannel;
  error?: WorkflowRun["steps"][number]["error"];
}

interface RunSeed {
  id: string;
  workflowId: string;
  contactId: string;
  contactName: string;
  status: ExecutionStatus;
  startedMinutesAgo: number;
  nextActionMinutes?: number;
  steps: RunStepSeed[];
}

/**
 * Runs, written as an index into the workflow's node list.
 *
 * Naming the node rather than repeating its title keeps a log row and the
 * canvas node it executed from ever disagreeing — rename a node in the seed
 * above and every execution row follows it.
 */
const RUN_SEEDS: RunSeed[] = [
  {
    id: "run-90412",
    workflowId: "wf-lead-nurture",
    contactId: "con-1",
    contactName: "Sarah Ahmed",
    status: "waiting",
    startedMinutesAgo: 13,
    nextActionMinutes: 60 * 24,
    steps: [
      { nodeIndex: 0, minutesAgo: 13, event: "Trigger matched", status: "completed", durationMs: 90 },
      { nodeIndex: 1, minutesAgo: 13, event: "Tag added", status: "completed", durationMs: 140 },
      {
        nodeIndex: 2,
        minutesAgo: 12,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1200,
        channel: "whatsapp",
      },
      { nodeIndex: 3, minutesAgo: 12, event: "Delay Scheduled", status: "waiting" },
    ],
  },
  {
    id: "run-90408",
    workflowId: "wf-cart-recovery",
    contactId: "con-6",
    contactName: "John Smith",
    status: "waiting",
    startedMinutesAgo: 65,
    nextActionMinutes: 55,
    steps: [
      { nodeIndex: 0, minutesAgo: 65, event: "Trigger matched", status: "completed", durationMs: 80 },
      { nodeIndex: 1, minutesAgo: 65, event: "Delay Scheduled", status: "waiting" },
    ],
  },
  {
    id: "run-90401",
    workflowId: "wf-vip-journey",
    contactId: "con-2",
    contactName: "Maria Gomez",
    status: "failed",
    startedMinutesAgo: 128,
    steps: [
      { nodeIndex: 0, minutesAgo: 128, event: "Trigger matched", status: "completed", durationMs: 70 },
      { nodeIndex: 1, minutesAgo: 128, event: "Owner assigned", status: "completed", durationMs: 210 },
      {
        nodeIndex: 2,
        minutesAgo: 127,
        event: "Email Failed",
        status: "failed",
        durationMs: 2400,
        channel: "email",
        error: {
          message: "Recipient mailbox unavailable",
          providerResponse: "550 5.1.1 The email account that you tried to reach does not exist",
          retries: 3,
          lastAttemptAt: minutesAgo(96),
        },
      },
    ],
  },
  {
    id: "run-90396",
    workflowId: "wf-order-journey",
    contactId: "con-4",
    contactName: "Elena Rossi",
    status: "running",
    startedMinutesAgo: 34,
    steps: [
      { nodeIndex: 0, minutesAgo: 34, event: "Trigger matched", status: "completed", durationMs: 60 },
      {
        nodeIndex: 1,
        minutesAgo: 34,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 980,
        channel: "whatsapp",
      },
      { nodeIndex: 2, minutesAgo: 33, event: "Waiting for fulfilment", status: "running" },
    ],
  },
  {
    id: "run-90390",
    workflowId: "wf-whatsapp-inquiry",
    contactId: "con-8",
    contactName: "Omar Haddad",
    status: "completed",
    startedMinutesAgo: 190,
    steps: [
      { nodeIndex: 0, minutesAgo: 190, event: "Keyword matched", status: "completed", durationMs: 50 },
      {
        nodeIndex: 1,
        minutesAgo: 190,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1100,
        channel: "whatsapp",
      },
      { nodeIndex: 2, minutesAgo: 189, event: "Delay complete", status: "completed", durationMs: 1800000 },
      { nodeIndex: 3, minutesAgo: 159, event: "Condition evaluated", status: "completed", durationMs: 120 },
      { nodeIndex: 4, minutesAgo: 159, event: "Agent assigned", status: "completed", durationMs: 300 },
    ],
  },
  {
    id: "run-90385",
    workflowId: "wf-delivery-updates",
    contactId: "con-12",
    contactName: "Yuki Tanaka",
    status: "completed",
    startedMinutesAgo: 420,
    steps: [
      { nodeIndex: 0, minutesAgo: 420, event: "Trigger matched", status: "completed", durationMs: 60 },
      {
        nodeIndex: 1,
        minutesAgo: 420,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 890,
        channel: "whatsapp",
      },
      { nodeIndex: 2, minutesAgo: 300, event: "Carrier update received", status: "completed" },
      {
        nodeIndex: 3,
        minutesAgo: 180,
        event: "SMS Sent",
        status: "completed",
        durationMs: 640,
        channel: "sms",
      },
      { nodeIndex: 4, minutesAgo: 90, event: "Delivery confirmed", status: "completed" },
      {
        nodeIndex: 5,
        minutesAgo: 88,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 910,
        channel: "whatsapp",
      },
    ],
  },
  {
    id: "run-90379",
    workflowId: "wf-reengagement",
    contactId: "con-19",
    contactName: "Hannah Berg",
    status: "failed",
    startedMinutesAgo: 520,
    steps: [
      { nodeIndex: 0, minutesAgo: 520, event: "Trigger matched", status: "completed", durationMs: 70 },
      {
        nodeIndex: 1,
        minutesAgo: 520,
        event: "Email Failed",
        status: "failed",
        durationMs: 3100,
        channel: "email",
        error: {
          message: "Sending domain not verified",
          providerResponse: "451 4.7.1 Sender domain marketflow-mail.app failed DMARC alignment",
          retries: 3,
          lastAttemptAt: minutesAgo(470),
        },
      },
    ],
  },
  {
    id: "run-90371",
    workflowId: "wf-appointment",
    contactId: "con-13",
    contactName: "Grace Mwangi",
    status: "waiting",
    startedMinutesAgo: 600,
    nextActionMinutes: 780,
    steps: [
      { nodeIndex: 0, minutesAgo: 600, event: "Trigger matched", status: "completed", durationMs: 60 },
      {
        nodeIndex: 1,
        minutesAgo: 600,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1020,
        channel: "whatsapp",
      },
      { nodeIndex: 2, minutesAgo: 599, event: "Waiting for appointment", status: "waiting" },
    ],
  },
  {
    id: "run-90366",
    workflowId: "wf-landing-lead",
    contactId: "con-17",
    contactName: "Chloe Dubois",
    status: "completed",
    startedMinutesAgo: 760,
    steps: [
      { nodeIndex: 0, minutesAgo: 760, event: "Form submitted", status: "completed", durationMs: 80 },
      { nodeIndex: 1, minutesAgo: 760, event: "Tag added", status: "completed", durationMs: 120 },
      { nodeIndex: 2, minutesAgo: 760, event: "Segment updated", status: "completed", durationMs: 160 },
      {
        nodeIndex: 3,
        minutesAgo: 759,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1240,
        channel: "whatsapp",
      },
      {
        nodeIndex: 4,
        minutesAgo: 758,
        event: "Email Sent",
        status: "completed",
        durationMs: 760,
        channel: "email",
      },
      { nodeIndex: 5, minutesAgo: 758, event: "Stage updated", status: "completed", durationMs: 190 },
    ],
  },
  {
    id: "run-90359",
    workflowId: "wf-review-request",
    contactId: "con-21",
    contactName: "Zainab Khan",
    status: "cancelled",
    startedMinutesAgo: 900,
    steps: [
      { nodeIndex: 0, minutesAgo: 900, event: "Trigger matched", status: "completed", durationMs: 60 },
      { nodeIndex: 1, minutesAgo: 900, event: "Delay Scheduled", status: "cancelled" },
    ],
  },
  {
    id: "run-90351",
    workflowId: "wf-post-purchase",
    contactId: "con-11",
    contactName: "Lukas Meyer",
    status: "running",
    startedMinutesAgo: 1080,
    steps: [
      { nodeIndex: 0, minutesAgo: 1080, event: "Trigger matched", status: "completed", durationMs: 70 },
      { nodeIndex: 1, minutesAgo: 1080, event: "Delay complete", status: "completed" },
      {
        nodeIndex: 2,
        minutesAgo: 20,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1080,
        channel: "whatsapp",
      },
      { nodeIndex: 3, minutesAgo: 19, event: "Delay Scheduled", status: "running" },
    ],
  },
  {
    id: "run-90344",
    workflowId: "wf-lead-qualification",
    contactId: "con-24",
    contactName: "Samuel Adeyemi",
    status: "completed",
    startedMinutesAgo: 1320,
    steps: [
      { nodeIndex: 0, minutesAgo: 1320, event: "Trigger matched", status: "completed", durationMs: 60 },
      {
        nodeIndex: 1,
        minutesAgo: 1320,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1160,
        channel: "whatsapp",
      },
      { nodeIndex: 2, minutesAgo: 1200, event: "Delay complete", status: "completed" },
      { nodeIndex: 3, minutesAgo: 1200, event: "Branch selected", status: "completed", durationMs: 140 },
      { nodeIndex: 4, minutesAgo: 1199, event: "Owner assigned", status: "completed", durationMs: 220 },
      { nodeIndex: 5, minutesAgo: 1199, event: "Stage updated", status: "skipped" },
    ],
  },
  {
    id: "run-90338",
    workflowId: "wf-birthday",
    contactId: "con-15",
    contactName: "Fatima Zahra",
    status: "waiting",
    startedMinutesAgo: 1440,
    nextActionMinutes: 5760,
    steps: [
      { nodeIndex: 0, minutesAgo: 1440, event: "Trigger matched", status: "completed", durationMs: 50 },
      {
        nodeIndex: 1,
        minutesAgo: 1440,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 870,
        channel: "whatsapp",
      },
      { nodeIndex: 2, minutesAgo: 1439, event: "Delay Scheduled", status: "waiting" },
    ],
  },
  {
    id: "run-90330",
    workflowId: "wf-cart-recovery",
    contactId: "con-9",
    contactName: "Noah Bennett",
    status: "completed",
    startedMinutesAgo: 1600,
    steps: [
      { nodeIndex: 0, minutesAgo: 1600, event: "Trigger matched", status: "completed", durationMs: 60 },
      { nodeIndex: 1, minutesAgo: 1600, event: "Delay complete", status: "completed" },
      {
        nodeIndex: 2,
        minutesAgo: 1540,
        event: "WhatsApp Sent",
        status: "completed",
        durationMs: 1020,
        channel: "whatsapp",
      },
      { nodeIndex: 3, minutesAgo: 1539, event: "Delay complete", status: "completed" },
      { nodeIndex: 4, minutesAgo: 160, event: "Condition evaluated", status: "completed", durationMs: 130 },
      { nodeIndex: 5, minutesAgo: 160, event: "Tag added", status: "completed", durationMs: 110 },
    ],
  },
];

/** `GET /automation/runs`. */
export const WORKFLOW_RUNS: WorkflowRun[] = RUN_SEEDS.map((seed) => {
  const workflow = workflowById(seed.workflowId);

  const steps = seed.steps.map((stepSeed, order) => {
    const node = workflow?.nodes[stepSeed.nodeIndex];
    const kind = node?.kind ?? "end";

    return {
      id: `${seed.id}-s${order}`,
      nodeId: node?.id ?? `${seed.id}-missing-${order}`,
      at: minutesAgo(stepSeed.minutesAgo),
      kind,
      title: node?.title ?? "Step",
      detail: node?.summary ?? "",
      event: stepSeed.event,
      status: stepSeed.status,
      durationMs: stepSeed.durationMs,
      channel: stepSeed.channel ?? NODE_META[kind]?.channel,
      error: stepSeed.error,
    };
  });

  const last = seed.steps[seed.steps.length - 1];
  const settled = seed.status === "completed" || seed.status === "failed" || seed.status === "cancelled";

  return {
    id: seed.id,
    workflowId: seed.workflowId,
    workflowName: workflow?.name ?? seed.workflowId,
    contactId: seed.contactId,
    contactName: seed.contactName,
    status: seed.status,
    startedAt: minutesAgo(seed.startedMinutesAgo),
    endedAt: settled ? minutesAgo(last.minutesAgo) : undefined,
    durationMs: settled
      ? (seed.startedMinutesAgo - last.minutesAgo) * 60_000
      : undefined,
    steps,
    nextActionAt:
      seed.nextActionMinutes === undefined
        ? undefined
        : inMinutes(seed.nextActionMinutes),
  };
});

export const runById = (id: string) =>
  WORKFLOW_RUNS.find((run) => run.id === id);

export const runsForWorkflow = (workflowId: string) =>
  WORKFLOW_RUNS.filter((run) => run.workflowId === workflowId);

/**
 * Every step of every run, newest first — the Activity table's row set.
 *
 * Derived rather than stored: the log is a view of the runs, and two lists
 * that have to agree are one list too many.
 */
export const ACTIVITY_ROWS: ActivityRow[] = WORKFLOW_RUNS.flatMap((run) =>
  run.steps.map((runStep) => ({
    ...runStep,
    runId: run.id,
    workflowId: run.workflowId,
    workflowName: run.workflowName,
    contactId: run.contactId,
    contactName: run.contactName,
  })),
).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                 */
/* -------------------------------------------------------------------------- */

const withinHours = (iso: string, hours: number) =>
  NOW_MS - new Date(iso).getTime() <= hours * 3_600_000;

/** The four figures the Workflows page opens with. */
export function workflowTotals() {
  const live = LIVE_WORKFLOWS;
  const active = live.filter((workflow) => workflow.status === "active");
  const running = live.reduce((sum, workflow) => sum + workflow.stats.running, 0);
  const completed = live.reduce(
    (sum, workflow) => sum + workflow.stats.completed,
    0,
  );
  const failed = live.reduce((sum, workflow) => sum + workflow.stats.failed, 0);

  return {
    active: active.length,
    running,
    /*
     * A month's completions, from a lifetime figure.
     *
     * `stats` covers the trailing 90 days — the same window `workflowSeries`
     * builds its daily curve from — so a month is a third of it. Stated here
     * rather than in the KPI card, because a card that does arithmetic on a
     * figure it was handed is a card that will disagree with the next one.
     */
    completedThisMonth: Math.round(completed / 3),
    /* Weighted by volume: averaging seventeen percentages would let a draft
       with nothing in it drag the headline as hard as a flow with 18,000. */
    successRate: completed + failed === 0 ? 0 : (completed / (completed + failed)) * 100,
  };
}

/** The four figures the Triggers page opens with. */
export function triggerTotals() {
  const usedKeys = new Set(LIVE_WORKFLOWS.map((workflow) => workflow.triggerKey));

  return {
    available: AUTOMATION_TRIGGERS.length,
    inUse: AUTOMATION_TRIGGERS.filter((trigger) => usedKeys.has(trigger.eventKey))
      .length,
    eventsToday: AUTOMATION_TRIGGERS.reduce(
      (sum, trigger) => sum + trigger.events24h,
      0,
    ),
    failed: AUTOMATION_TRIGGERS.reduce(
      (sum, trigger) => sum + trigger.failed24h,
      0,
    ),
  };
}

/** The four figures the Activity page opens with. */
export function activityTotals() {
  const today = WORKFLOW_RUNS.filter((run) => withinHours(run.startedAt, 24));

  return {
    runsToday: today.length,
    inProgress: WORKFLOW_RUNS.filter(
      (run) => run.status === "running" || run.status === "waiting" || run.status === "queued",
    ).length,
    completed: WORKFLOW_RUNS.filter((run) => run.status === "completed").length,
    failed: WORKFLOW_RUNS.filter((run) => run.status === "failed").length,
  };
}

/* -------------------------------------------------------------------------- */
/* Analytics series                                                           */
/* -------------------------------------------------------------------------- */

/** Fourteen day labels ending today, for every trend chart in the module. */
export const TREND_DAYS = Array.from({ length: 14 }, (_, index) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(NOW_MS - (13 - index) * 86_400_000),
  ),
);

/**
 * A workflow's daily series, seeded off its id.
 *
 * Generated rather than written out: fourteen days times three series times
 * seventeen workflows is 714 numbers nobody would ever read, and a seeded
 * curve gives the same figures on every render without any of them being
 * suspiciously round.
 */
export function workflowSeries(workflow: Workflow) {
  const daily = workflow.stats.entered / 90;

  const entered = TREND_DAYS.map((_, index) => {
    const wave = 1 + Math.sin(index / 2.2) * 0.18;
    const noise = 0.9 + seeded(`${workflow.id}-e${index}`) * 0.22;
    return Math.round(daily * wave * noise);
  });

  const completed = entered.map((value, index) =>
    Math.round(value * (0.78 + seeded(`${workflow.id}-c${index}`) * 0.16)),
  );

  const converted = entered.map((value, index) =>
    Math.round(value * (conversionRate(workflow) / 100) * (0.85 + seeded(`${workflow.id}-v${index}`) * 0.3)),
  );

  const conversion = entered.map((value, index) =>
    value === 0 ? 0 : Math.round((converted[index] / value) * 1000) / 10,
  );

  return { entered, completed, converted, conversion };
}

/** Per-channel send and reply volume for one workflow, for the bar chart. */
export function channelPerformance(workflow: Workflow) {
  return workflow.channels.map((channel) => {
    const nodes = workflow.nodes.filter(
      (node) => NODE_META[node.kind]?.channel === channel,
    );
    const sent = nodes.reduce((sum, node) => sum + (node.entered ?? 0), 0);
    const engaged = Math.round(sent * (0.28 + seeded(`${workflow.id}-${channel}`) * 0.34));
    return { channel, sent, engaged };
  });
}
