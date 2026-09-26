import type {
  ExecutionStatus,
  GoalType,
  NodeCategory,
  NodeKind,
  NodeOutput,
  StartTypeKey,
  TemplateCategory,
  TemplateComplexity,
  TriggerCategory,
  VariableSource,
  WorkflowStatus,
} from "@/types/workflow";

/**
 * The Automation module's vocabulary: what a node is called, what it looks
 * like, and what each state is named.
 *
 * One table rather than a `switch` in every component. The node library, the
 * canvas, the inspector, the template preview and the execution timeline all
 * draw the same node, and the only way five renderers agree on the icon for
 * "Send WhatsApp" is to ask the same object.
 *
 * Node identity is carried by an icon and a *soft* tile - never a saturated
 * card. A flow chart in eight fully-coloured boxes reads as a toy; the surface
 * stays the product's own `surface`, and the category shows up in a 28px tile
 * and a two-pixel top rule.
 */

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

export const AUTOMATION_ROUTES = {
  workflows: "/dashboard/automation",
  /* The creation wizard. A static segment, so it wins over `[workflowId]`. */
  create: "/dashboard/automation/new",
  templates: "/dashboard/automation/templates",
  triggers: "/dashboard/automation/triggers",
  activity: "/dashboard/automation/activity",
  workflow: (id: string) => `/dashboard/automation/${id}`,
  template: (id: string) => `/dashboard/automation/templates/${id}`,
  trigger: (id: string) => `/dashboard/automation/triggers/${id}`,
  run: (id: string) => `/dashboard/automation/activity/${id}`,
} as const;

/* -------------------------------------------------------------------------- */
/* Node categories                                                            */
/* -------------------------------------------------------------------------- */

export interface CategoryTheme {
  label: string;
  /** Tinted tile behind the node icon. */
  tile: string;
  /** The 2px rule along the top of a node card. */
  rail: string;
  /** Ink for the uppercase kind label. */
  text: string;
}

export const NODE_CATEGORY: Record<NodeCategory, CategoryTheme> = {
  start: {
    label: "Start",
    tile: "bg-primary-soft text-primary",
    rail: "bg-primary",
    text: "text-primary",
  },
  logic: {
    label: "Logic",
    tile: "bg-warning-soft text-warning-text",
    rail: "bg-warning",
    text: "text-warning-text",
  },
  /*
   * Wait is its own category, and its own neutral.
   *
   * It used to live under Logic, which put "Send WhatsApp after 3 days" and
   * "Send WhatsApp if they replied" in the same bucket - and timing is the
   * thing people get wrong most often in an automation. A grey tile is right
   * for it: a delay is the absence of an action, and colouring it as loudly as
   * a send would be a lie about what is happening.
   */
  wait: {
    label: "Wait",
    tile: "bg-gray-soft text-gray-ink",
    rail: "bg-gray-strong",
    text: "text-gray-ink",
  },
  messaging: {
    label: "Messaging",
    tile: "bg-whatsapp-soft text-whatsapp",
    rail: "bg-whatsapp",
    text: "text-whatsapp",
  },
  crm: {
    label: "CRM",
    tile: "bg-accent-soft text-accent",
    rail: "bg-accent",
    text: "text-accent",
  },
  /* Marketing borrows the brand's second stop - near the CRM cyan but clearly
     not it, which is the distinction between updating a record and acting on a
     campaign. */
  marketing: {
    label: "Marketing",
    tile: "bg-sms-soft text-sms",
    rail: "bg-sms",
    text: "text-sms",
  },
  advanced: {
    label: "Advanced",
    tile: "bg-surface-secondary text-text-muted",
    rail: "bg-border-strong",
    text: "text-text-muted",
  },
};

/* -------------------------------------------------------------------------- */
/* Node types                                                                 */
/* -------------------------------------------------------------------------- */

export interface NodeTypeMeta {
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  /** Lucide component name, resolved by `automation/node-icon`. */
  icon: string;
  /** One line in the node library, explaining what it does. */
  description: string;
  /** Placeholder summary for a freshly dropped node. */
  defaultSummary: string;
  /** Branch labels a fresh node of this kind forks into. */
  defaultBranches?: string[];
  /** Messaging nodes carry the channel their accent comes from. */
  channel?: "whatsapp" | "email" | "sms";
  /**
   * Values this node hands to the ones after it.
   *
   * Declared here rather than discovered at runtime, so a condition three
   * steps later can offer `response.status` before the workflow has ever run.
   */
  outputs?: NodeOutput[];
}

export const NODE_TYPES: NodeTypeMeta[] = [
  {
    kind: "trigger",
    label: "Trigger",
    category: "start",
    icon: "Zap",
    description: "The event or rule that starts this workflow",
    defaultSummary: "Choose an event",
    outputs: [
      { key: "event.key", type: "string", description: "The event that fired" },
      { key: "event.at", type: "string", description: "When it fired" },
    ],
  },

  /* Logic */
  {
    kind: "condition",
    label: "Condition",
    category: "logic",
    icon: "GitBranch",
    description: "Split on a contact property or past behaviour",
    defaultSummary: "No condition set",
    defaultBranches: ["Yes", "No"],
  },
  {
    kind: "if_else",
    label: "If / Else",
    category: "logic",
    icon: "Split",
    description: "Two paths from a single rule",
    defaultSummary: "No rule set",
    defaultBranches: ["If", "Else"],
  },
  {
    kind: "multi_branch",
    label: "Multi Branch",
    category: "logic",
    icon: "Network",
    description: "Several paths, taken in priority order",
    defaultSummary: "No branches configured",
    defaultBranches: ["Branch A", "Branch B", "Otherwise"],
  },
  {
    kind: "split",
    label: "Percentage Split",
    category: "logic",
    icon: "Percent",
    description: "Divide traffic between variants for a test",
    defaultSummary: "50 / 50",
    defaultBranches: ["Variant A", "Variant B"],
  },

  /* Wait */
  {
    kind: "wait",
    label: "Wait Duration",
    category: "wait",
    icon: "Clock",
    description: "Hold the contact for a fixed length of time",
    defaultSummary: "1 hour",
  },
  {
    kind: "wait_until_date",
    label: "Wait Until Date",
    category: "wait",
    icon: "CalendarClock",
    description: "Hold until a fixed date, or a date on the contact record",
    defaultSummary: "No date set",
  },
  {
    kind: "wait_until_time",
    label: "Wait Until Time",
    category: "wait",
    icon: "Clock3",
    description: "Hold until a time of day, optionally on a chosen weekday",
    defaultSummary: "No time set",
  },
  {
    kind: "wait_until_event",
    label: "Wait Until Event",
    category: "wait",
    icon: "Hourglass",
    description: "Hold until the customer does something - with a timeout",
    defaultSummary: "No event set",
    defaultBranches: ["Event happened", "Timed out"],
    outputs: [
      { key: "wait.outcome", type: "string", description: "event or timeout" },
      { key: "wait.waited_ms", type: "number", description: "Time spent waiting" },
    ],
  },
  {
    kind: "wait_until_condition",
    label: "Wait Until Condition",
    category: "wait",
    icon: "CalendarCheck",
    description: "Hold until a rule about the contact becomes true",
    defaultSummary: "No condition set",
  },

  /* Messaging */
  {
    kind: "send_whatsapp",
    label: "Send WhatsApp",
    category: "messaging",
    icon: "MessageCircle",
    description: "Send an approved WhatsApp template",
    defaultSummary: "No template selected",
    channel: "whatsapp",
    outputs: [
      { key: "message.id", type: "string", description: "Provider message id" },
      { key: "message.status", type: "string", description: "sent, delivered, read, failed" },
    ],
  },
  {
    kind: "send_email",
    label: "Send Email",
    category: "messaging",
    icon: "Mail",
    description: "Send a designed email",
    defaultSummary: "No email selected",
    channel: "email",
    outputs: [
      { key: "message.id", type: "string", description: "Provider message id" },
      { key: "message.status", type: "string", description: "sent, opened, clicked, bounced" },
    ],
  },
  {
    kind: "send_sms",
    label: "Send SMS",
    category: "messaging",
    icon: "Smartphone",
    description: "Send a plain-text SMS",
    defaultSummary: "No message written",
    channel: "sms",
    outputs: [
      { key: "message.id", type: "string", description: "Provider message id" },
      { key: "message.segments", type: "number", description: "Billable segments" },
    ],
  },

  /* CRM */
  {
    kind: "add_tag",
    label: "Add Tag",
    category: "crm",
    icon: "Tag",
    description: "Label the contact",
    defaultSummary: "No tag selected",
  },
  {
    kind: "remove_tag",
    label: "Remove Tag",
    category: "crm",
    icon: "Tags",
    description: "Take a label off the contact",
    defaultSummary: "No tag selected",
  },
  {
    kind: "update_contact",
    label: "Update Contact",
    category: "crm",
    icon: "PencilLine",
    description: "Write a value onto the contact record",
    defaultSummary: "No field selected",
  },
  {
    kind: "update_lead",
    label: "Update Lead",
    category: "crm",
    icon: "ClipboardList",
    description: "Change a field on the contact's open lead",
    defaultSummary: "No field selected",
  },
  {
    kind: "update_stage",
    label: "Change Lead Stage",
    category: "crm",
    icon: "Target",
    description: "Move the lead along the pipeline",
    defaultSummary: "No stage selected",
  },
  {
    kind: "assign_owner",
    label: "Assign Owner",
    category: "crm",
    icon: "UserCog",
    description: "Hand the contact to a team member",
    defaultSummary: "No owner selected",
    outputs: [{ key: "owner.id", type: "string", description: "Who it went to" }],
  },
  {
    kind: "add_segment",
    label: "Add to Segment",
    category: "crm",
    icon: "Layers",
    description: "Put the contact into a static segment",
    defaultSummary: "No segment selected",
  },
  {
    kind: "remove_segment",
    label: "Remove from Segment",
    category: "crm",
    icon: "Layers3",
    description: "Take the contact out of a segment",
    defaultSummary: "No segment selected",
  },

  /* Marketing */
  {
    kind: "add_to_campaign",
    label: "Add to Campaign",
    category: "marketing",
    icon: "Megaphone",
    description: "Enrol the contact in a campaign audience",
    defaultSummary: "No campaign selected",
  },
  {
    kind: "remove_from_campaign",
    label: "Remove from Campaign",
    category: "marketing",
    icon: "Ban",
    description: "Take the contact out of a campaign audience",
    defaultSummary: "No campaign selected",
  },
  {
    kind: "create_task",
    label: "Create Task",
    category: "marketing",
    icon: "ListChecks",
    description: "Raise a follow-up task for a teammate",
    defaultSummary: "No task described",
    outputs: [{ key: "task.id", type: "string", description: "The task created" }],
  },
  {
    kind: "notify",
    label: "Internal Notification",
    category: "marketing",
    icon: "Bell",
    description: "Alert a teammate in the workspace",
    defaultSummary: "No recipient selected",
  },

  /* Advanced */
  {
    kind: "webhook",
    label: "Webhook",
    category: "advanced",
    icon: "Webhook",
    description: "POST the contact to an external URL",
    defaultSummary: "No endpoint set",
    outputs: [
      { key: "response.status", type: "number", description: "HTTP status code" },
      { key: "response.body", type: "object", description: "Parsed response body" },
    ],
  },
  {
    kind: "api_action",
    label: "API Action",
    category: "advanced",
    icon: "Code",
    description: "Call a connected integration and use what it returns",
    defaultSummary: "No action selected",
    outputs: [
      { key: "result.ok", type: "boolean", description: "Whether the call succeeded" },
      { key: "result.data", type: "object", description: "What the integration returned" },
    ],
  },
  {
    kind: "custom_event",
    label: "Custom Event",
    category: "advanced",
    icon: "Radio",
    description: "Emit an event other workflows can listen for",
    defaultSummary: "No event key set",
  },
  {
    kind: "end",
    label: "End Workflow",
    category: "advanced",
    icon: "CircleStop",
    description: "Exit the contact from this journey",
    defaultSummary: "Contact exits here",
  },
];

export const NODE_META: Record<NodeKind, NodeTypeMeta> = Object.fromEntries(
  NODE_TYPES.map((type) => [type.kind, type]),
) as Record<NodeKind, NodeTypeMeta>;

/**
 * The node library's groups, in the order a workflow is built.
 *
 * Reads as the questions the journey answers: who starts, which path, when,
 * what do we say, what do we record, what does marketing do with it, and then
 * everything a developer needs - which is last on purpose.
 */
export const NODE_LIBRARY: { category: NodeCategory; kinds: NodeKind[] }[] = [
  { category: "start", kinds: ["trigger"] },
  { category: "logic", kinds: ["condition", "if_else", "multi_branch", "split"] },
  {
    category: "wait",
    kinds: [
      "wait",
      "wait_until_date",
      "wait_until_time",
      "wait_until_event",
      "wait_until_condition",
    ],
  },
  { category: "messaging", kinds: ["send_whatsapp", "send_email", "send_sms"] },
  {
    category: "crm",
    kinds: [
      "add_tag",
      "remove_tag",
      "update_contact",
      "update_lead",
      "update_stage",
      "assign_owner",
      "add_segment",
      "remove_segment",
    ],
  },
  {
    category: "marketing",
    kinds: ["add_to_campaign", "remove_from_campaign", "create_task", "notify"],
  },
  {
    category: "advanced",
    kinds: ["webhook", "api_action", "custom_event", "end"],
  },
];

/* -------------------------------------------------------------------------- */
/* Start types                                                                */
/* -------------------------------------------------------------------------- */

export interface StartTypeMeta {
  key: StartTypeKey;
  label: string;
  icon: string;
  description: string;
  /** Three or four concrete cases, so the card is choosable without docs. */
  examples: string[];
  /** Whether the wizard has a second step for this type. */
  configurable: boolean;
}

/**
 * How a contact can be enrolled, as the creation wizard offers it.
 *
 * The first four are mechanisms; the last two are shortcuts to one. Keeping
 * them in one list is deliberate - "Use a template" and "Start from scratch"
 * are what a reader is actually choosing between at that moment, and hiding
 * them behind a different control would make the common path the slow one.
 */
export const START_TYPES: StartTypeMeta[] = [
  {
    key: "event",
    label: "Event-based",
    icon: "Zap",
    description: "Start the moment something happens.",
    examples: ["Lead created", "WhatsApp message received", "Order paid"],
    configurable: true,
  },
  {
    key: "criteria",
    label: "Criteria-based",
    icon: "Filter",
    description: "Start when a contact starts matching a rule.",
    examples: ["Tag is VIP", "Lifetime value over $500", "No activity for 30 days"],
    configurable: true,
  },
  {
    key: "schedule",
    label: "Date & Schedule",
    icon: "CalendarDays",
    description: "Start relative to a date, or on a repeating schedule.",
    examples: ["Birthday", "Renewal date", "Every Monday at 09:00"],
    configurable: true,
  },
  {
    key: "webhook",
    label: "API / Webhook",
    icon: "Webhook",
    description: "Start from an event your own systems raise.",
    examples: ["Webhook received", "API event", "Custom application event"],
    configurable: true,
  },
  {
    key: "template",
    label: "Use a template",
    icon: "LayoutTemplate",
    description: "Start from a proven MarketFlow journey and adjust it.",
    examples: ["Abandoned cart", "Welcome series", "Review request"],
    configurable: false,
  },
  {
    key: "blank",
    label: "Start from scratch",
    icon: "Frame",
    description: "An empty canvas. Add the trigger yourself in the builder.",
    examples: ["For journeys that do not fit a pattern"],
    configurable: false,
  },
];

export const startTypeMeta = (key: StartTypeKey) =>
  START_TYPES.find((type) => type.key === key) ?? START_TYPES[0];

/* -------------------------------------------------------------------------- */
/* Variables                                                                  */
/* -------------------------------------------------------------------------- */

export interface VariableSourceMeta {
  key: VariableSource;
  label: string;
  /** What this source can offer, as dotted paths. */
  paths: { path: string; label: string; sample: string }[];
}

/**
 * Where a `{{token}}` can get its value.
 *
 * Ordered by how often it is the answer: the contact record first, the event
 * that started the run second, and the output of an earlier node last - that
 * one is powerful and rarely what a marketer wants.
 */
export const VARIABLE_SOURCES: VariableSourceMeta[] = [
  {
    key: "contact",
    label: "Contact",
    paths: [
      { path: "first_name", label: "First name", sample: "Sarah" },
      { path: "last_name", label: "Last name", sample: "Ahmed" },
      { path: "email", label: "Email", sample: "sarah@brightretail.co" },
      { path: "phone", label: "Phone", sample: "+971 50 118 4420" },
      { path: "company", label: "Company", sample: "Bright Retail" },
    ],
  },
  {
    key: "lead",
    label: "Lead",
    paths: [
      { path: "stage", label: "Stage", sample: "Qualified" },
      { path: "owner", label: "Owner", sample: "Amara Okafor" },
      { path: "source", label: "Source", sample: "Landing page" },
    ],
  },
  {
    key: "trigger",
    label: "Trigger event",
    paths: [
      { path: "product_name", label: "Product name", sample: "Premium Package" },
      { path: "order_id", label: "Order ID", sample: "MF-10248" },
      { path: "cart_total", label: "Cart total", sample: "$186.00" },
      { path: "keyword", label: "Matched keyword", sample: "price" },
    ],
  },
  {
    key: "order",
    label: "Order",
    paths: [
      { path: "id", label: "Order number", sample: "MF-10248" },
      { path: "total", label: "Order total", sample: "$149.00" },
      { path: "tracking", label: "Tracking number", sample: "AR-99182" },
    ],
  },
  {
    key: "node",
    label: "Previous node output",
    paths: [
      { path: "response.status", label: "Webhook status", sample: "200" },
      { path: "result.data", label: "API result", sample: "{ … }" },
      { path: "wait.outcome", label: "Wait outcome", sample: "event" },
    ],
  },
  {
    key: "workspace",
    label: "Workspace",
    paths: [
      { path: "name", label: "Workspace name", sample: "MarketFlow" },
      { path: "support_phone", label: "Support number", sample: "+971 4 000 0000" },
    ],
  },
  {
    key: "custom",
    label: "Custom field",
    paths: [
      { path: "loyalty_tier", label: "Loyalty tier", sample: "Gold" },
      { path: "renewal_date", label: "Renewal date", sample: "14 Oct 2026" },
    ],
  },
];

export const variableSourceLabel = (source: VariableSource) =>
  VARIABLE_SOURCES.find((item) => item.key === source)?.label ?? source;

/* -------------------------------------------------------------------------- */
/* Goals                                                                      */
/* -------------------------------------------------------------------------- */

export const GOAL_TYPES: { value: GoalType; label: string; hint: string }[] = [
  {
    value: "order_completed",
    label: "Order completed",
    hint: "The contact places and pays for an order",
  },
  {
    value: "lead_converted",
    label: "Lead converted",
    hint: "Their lead reaches the Won stage",
  },
  {
    value: "appointment_booked",
    label: "Appointment booked",
    hint: "A slot is booked on the calendar",
  },
  {
    value: "form_submitted",
    label: "Form submitted",
    hint: "They submit a tracked form",
  },
  {
    value: "purchase_value",
    label: "Purchase value above",
    hint: "An order over a threshold you set",
  },
];

export const goalLabel = (type: GoalType) =>
  GOAL_TYPES.find((item) => item.value === type)?.label ?? type;


/* -------------------------------------------------------------------------- */
/* Statuses                                                                   */
/* -------------------------------------------------------------------------- */

export const WORKFLOW_STATUSES: { value: WorkflowStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "error", label: "Error" },
  { value: "archived", label: "Archived" },
];

export const EXECUTION_STATUSES: { value: ExecutionStatus; label: string }[] = [
  { value: "completed", label: "Success" },
  { value: "running", label: "Running" },
  { value: "waiting", label: "Waiting" },
  { value: "queued", label: "Queued" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "cancelled", label: "Cancelled" },
];

export const executionLabel = (status: ExecutionStatus) =>
  EXECUTION_STATUSES.find((item) => item.value === status)?.label ?? status;

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "lead-nurture", label: "Lead Nurture" },
  { value: "sales", label: "Sales" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "customer-success", label: "Customer Success" },
  { value: "appointments", label: "Appointments" },
  { value: "re-engagement", label: "Re-engagement" },
];

export const templateCategoryLabel = (category: TemplateCategory) =>
  TEMPLATE_CATEGORIES.find((item) => item.value === category)?.label ?? category;

export const TEMPLATE_COMPLEXITIES: {
  value: TemplateComplexity;
  label: string;
}[] = [
  { value: "starter", label: "Starter" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

/* -------------------------------------------------------------------------- */
/* Trigger registry                                                           */
/* -------------------------------------------------------------------------- */

export const TRIGGER_CATEGORIES: {
  value: TriggerCategory;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "customer",
    label: "Customer",
    icon: "Users",
    description: "Contact records, tags and segment membership",
  },
  {
    value: "leads",
    label: "Leads",
    icon: "Target",
    description: "Pipeline movement and lead ownership",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: "MessageCircle",
    description: "Inbound messages, keywords and delivery receipts",
  },
  {
    value: "commerce",
    label: "Commerce",
    icon: "ShoppingCart",
    description: "Orders, payments, fulfilment and abandoned checkouts",
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: "Megaphone",
    description: "Campaign opens, clicks and replies",
  },
  {
    value: "forms",
    label: "Forms & Lead Capture",
    icon: "ClipboardList",
    description: "Submissions from embedded and hosted forms",
  },
  {
    value: "datetime",
    label: "Date & Time",
    icon: "CalendarDays",
    description: "Birthdays, appointments and scheduled recurrence",
  },
  {
    value: "developer",
    label: "Developer",
    icon: "Code",
    description: "Webhooks, API events and custom events",
  },
];

export const triggerCategoryLabel = (category: TriggerCategory) =>
  TRIGGER_CATEGORIES.find((item) => item.value === category)?.label ?? category;
