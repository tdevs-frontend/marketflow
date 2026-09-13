import type { MarketingChannel } from "./marketing";

/**
 * The Automation module's data model.
 *
 * Kept apart from `types/automation.ts`, which describes the per-channel
 * follow-up sequences inside Marketing: those are a linear list of steps, this
 * is an authored node graph with its own runs, templates and event registry.
 * Two different products sharing a word.
 *
 * Every entity here is shaped like the API response it will eventually be —
 * ids rather than embedded objects, ISO timestamps, counts pre-aggregated by
 * the server — so swapping `lib/workflow-fixtures` for a fetch is the only
 * change the UI should need.
 */

/* -------------------------------------------------------------------------- */
/* States                                                                     */
/* -------------------------------------------------------------------------- */

export type WorkflowStatus = "draft" | "active" | "paused" | "archived" | "error";

/**
 * A run's state, and a step's.
 *
 * One union rather than two, because the row in Activity Logs is a step and
 * the row in All Runs is a run, and they are read side by side — a `waiting`
 * step inside a `waiting` run should not be two different words.
 */
export type ExecutionStatus =
  | "queued"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

/* -------------------------------------------------------------------------- */
/* Nodes                                                                      */
/* -------------------------------------------------------------------------- */

export type NodeCategory = "start" | "logic" | "messaging" | "crm" | "advanced";

export type NodeKind =
  /* start */
  | "trigger"
  /* logic */
  | "condition"
  | "if_else"
  | "multi_branch"
  | "wait"
  | "wait_until"
  | "split"
  /* messaging */
  | "send_whatsapp"
  | "send_email"
  | "send_sms"
  /* crm */
  | "add_tag"
  | "remove_tag"
  | "update_field"
  | "update_stage"
  | "assign_owner"
  | "add_segment"
  | "remove_segment"
  /* advanced */
  | "webhook"
  | "custom_event"
  | "notify"
  | "end";

/** A branch leaving a forking node. Ordered — the first is the default path. */
export interface NodeBranch {
  id: string;
  label: string;
}

/**
 * One node on the canvas.
 *
 * `summary` is the single line a node shows under its title — "Wait 1 day",
 * "welcome_new_lead". It is stored rather than derived so the canvas never has
 * to know how to render twenty different config shapes; the inspector, which
 * does, writes it back when a node is edited.
 */
export interface WorkflowNode {
  id: string;
  kind: NodeKind;
  title: string;
  summary: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  /** Present on forking nodes. Edges leaving them carry a `branchId`. */
  branches?: NodeBranch[];
  /** Contacts that have reached this node — the node-level analytics figure. */
  entered?: number;
  /** Per-branch share of `entered`, keyed by branch id. Sums to 100. */
  branchShare?: Record<string, number>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  /** Set when `from` forks — names which handle the edge leaves by. */
  branchId?: string;
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export type EntryMode = "once" | "re_entry";

export interface WorkflowSettings {
  entry: {
    mode: EntryMode;
    /** Only meaningful when `mode` is `re_entry`. */
    maxEntries: number;
    cooldownHours: number;
  };
  exit: {
    goalReached: boolean;
    leavesSegment: boolean;
    unsubscribes: boolean;
    manualStop: boolean;
  };
  timing: {
    timezone: string;
    quietHours: { enabled: boolean; from: string; to: string };
    /** Three-letter day keys the workflow is allowed to send on. */
    days: string[];
  };
  failure: {
    retry: boolean;
    maxRetries: number;
    continueOnNonCritical: boolean;
    stopOnCritical: boolean;
  };
}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export interface WorkflowStats {
  entered: number;
  completed: number;
  converted: number;
  /** Contacts sitting inside the workflow right now. */
  running: number;
  failed: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  /** The registry event that starts it, e.g. `lead.created`. */
  triggerKey: string;
  triggerLabel: string;
  channels: MarketingChannel[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  ownerId: string;
  stats: WorkflowStats;
  settings: WorkflowSettings;
  /** Set when the workflow was started from a template. */
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

export type TemplateCategory =
  | "lead-nurture"
  | "sales"
  | "ecommerce"
  | "customer-success"
  | "appointments"
  | "re-engagement";

export type TemplateComplexity = "starter" | "intermediate" | "advanced";

/** One step of a template's preview — a flat list, not a graph. */
export interface TemplateStep {
  kind: NodeKind;
  title: string;
  summary: string;
  /** Rendered as a fork in the preview. Two labels, no deeper nesting. */
  branches?: [string, string];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  channels: MarketingChannel[];
  complexity: TemplateComplexity;
  setupMinutes: number;
  /** Who this journey is for, in the user's own words. */
  bestFor: string[];
  triggerKey: string;
  steps: TemplateStep[];
  requiredIntegrations: string[];
  requiredMessageTemplates: string[];
  /** Times this template has been used in the workspace. */
  installs: number;
  /** Workspace-authored rather than shipped with the product. */
  custom?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Trigger registry                                                           */
/* -------------------------------------------------------------------------- */

export type TriggerCategory =
  | "customer"
  | "leads"
  | "whatsapp"
  | "commerce"
  | "marketing"
  | "datetime"
  | "developer";

export type TriggerStatus = "active" | "disabled" | "beta";

/** One delivery of an event, for the trigger's recent-traffic list. */
export interface TriggerEvent {
  id: string;
  at: string;
  contactName?: string;
  summary: string;
  status: "processed" | "failed" | "ignored";
}

export interface AutomationTrigger {
  id: string;
  name: string;
  /** The dotted key workflows subscribe to, e.g. `order.paid`. */
  eventKey: string;
  category: TriggerCategory;
  /** The system that emits it — CRM, WhatsApp, Commerce, Webhook. */
  source: string;
  description: string;
  status: TriggerStatus;
  /** Workflows currently listening. */
  workflowIds: string[];
  events24h: number;
  failed24h: number;
  lastEventAt?: string;
  /** Shown in the detail view so an integrator can map their own payload. */
  payload: Record<string, unknown>;
  recentEvents: TriggerEvent[];
  custom?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Runs                                                                       */
/* -------------------------------------------------------------------------- */

export interface RunStepError {
  message: string;
  providerResponse: string;
  retries: number;
  lastAttemptAt: string;
}

export interface WorkflowRunStep {
  id: string;
  /** The node this step executed. Links a log row back to the canvas. */
  nodeId: string;
  at: string;
  kind: NodeKind;
  title: string;
  /** What was acted on — "Welcome message", "24 hours", "Tag: New Lead". */
  detail: string;
  /** The event, as the log reads it — "WhatsApp Sent", "Delay Scheduled". */
  event: string;
  status: ExecutionStatus;
  durationMs?: number;
  channel?: MarketingChannel;
  error?: RunStepError;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  contactId: string;
  contactName: string;
  status: ExecutionStatus;
  startedAt: string;
  endedAt?: string;
  /** Total elapsed, including time spent waiting. */
  durationMs?: number;
  steps: WorkflowRunStep[];
  /** When the next scheduled action fires, on a run that is waiting. */
  nextActionAt?: string;
}

/**
 * One row of the Activity table.
 *
 * Flattened from `WorkflowRun.steps` rather than stored: the log is a view of
 * the runs, and keeping a second list in sync with the first is how a run
 * detail ends up disagreeing with the row that opened it.
 */
export interface ActivityRow extends WorkflowRunStep {
  runId: string;
  workflowId: string;
  workflowName: string;
  contactId: string;
  contactName: string;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  /** The node it belongs to, where it belongs to one. */
  nodeId?: string;
  message: string;
  /** What to do about it, in one clause. */
  fix: string;
}
