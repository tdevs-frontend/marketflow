import type {
  ExecutionStatus,
  NodeCategory,
  NodeKind,
  TemplateCategory,
  TemplateComplexity,
  TriggerCategory,
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
 * Node identity is carried by an icon and a *soft* tile — never a saturated
 * card. A flow chart in eight fully-coloured boxes reads as a toy; the surface
 * stays the product's own `surface`, and the category shows up in a 28px tile
 * and a two-pixel top rule.
 */

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

export const AUTOMATION_ROUTES = {
  workflows: "/dashboard/automation",
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
}

export const NODE_TYPES: NodeTypeMeta[] = [
  {
    kind: "trigger",
    label: "Trigger",
    category: "start",
    icon: "Zap",
    description: "The event that starts this workflow",
    defaultSummary: "Choose an event",
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
    description: "Three or more paths from one decision",
    defaultSummary: "No branches configured",
    defaultBranches: ["Branch A", "Branch B", "Branch C"],
  },
  {
    kind: "wait",
    label: "Wait",
    category: "logic",
    icon: "Clock",
    description: "Hold the contact for a fixed duration",
    defaultSummary: "1 hour",
  },
  {
    kind: "wait_until",
    label: "Wait Until",
    category: "logic",
    icon: "CalendarClock",
    description: "Hold until a date, time or condition is met",
    defaultSummary: "No condition set",
  },
  {
    kind: "split",
    label: "Percentage Split",
    category: "logic",
    icon: "Percent",
    description: "Divide traffic for an A/B test",
    defaultSummary: "50 / 50",
    defaultBranches: ["Variant A", "Variant B"],
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
  },
  {
    kind: "send_email",
    label: "Send Email",
    category: "messaging",
    icon: "Mail",
    description: "Send a designed email",
    defaultSummary: "No email selected",
    channel: "email",
  },
  {
    kind: "send_sms",
    label: "Send SMS",
    category: "messaging",
    icon: "Smartphone",
    description: "Send a plain-text SMS",
    defaultSummary: "No message written",
    channel: "sms",
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
    kind: "update_field",
    label: "Update Contact Field",
    category: "crm",
    icon: "PencilLine",
    description: "Write a value onto the contact record",
    defaultSummary: "No field selected",
  },
  {
    kind: "update_stage",
    label: "Update Lead Stage",
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

  /* Advanced */
  {
    kind: "webhook",
    label: "Webhook",
    category: "advanced",
    icon: "Webhook",
    description: "POST the contact to an external URL",
    defaultSummary: "No endpoint set",
  },
  {
    kind: "custom_event",
    label: "Custom Event",
    category: "advanced",
    icon: "Code",
    description: "Emit an event other workflows can listen for",
    defaultSummary: "No event key set",
  },
  {
    kind: "notify",
    label: "Internal Notification",
    category: "advanced",
    icon: "Bell",
    description: "Alert a teammate in the workspace",
    defaultSummary: "No recipient selected",
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

/** The node library's groups, in the order a workflow is built. */
export const NODE_LIBRARY: { category: NodeCategory; kinds: NodeKind[] }[] = [
  { category: "start", kinds: ["trigger"] },
  {
    category: "logic",
    kinds: ["condition", "if_else", "multi_branch", "wait", "wait_until", "split"],
  },
  { category: "messaging", kinds: ["send_whatsapp", "send_email", "send_sms"] },
  {
    category: "crm",
    kinds: [
      "add_tag",
      "remove_tag",
      "update_field",
      "update_stage",
      "assign_owner",
      "add_segment",
      "remove_segment",
    ],
  },
  { category: "advanced", kinds: ["webhook", "custom_event", "notify", "end"] },
];

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
    description: "Form submissions and campaign engagement",
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
