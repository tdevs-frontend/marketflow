import type { MarketingChannel } from "./marketing";

/**
 * The Automation module's data model.
 *
 * Kept apart from `types/automation.ts`, which describes the per-channel
 * follow-up sequences inside Marketing: those are a linear list of steps, this
 * is an authored node graph with its own runs, templates and event registry.
 * Two different products sharing a word.
 *
 * Every entity here is shaped like the API response it will eventually be -
 * ids rather than embedded objects, ISO timestamps, counts pre-aggregated by
 * the server - so swapping `lib/workflow-fixtures` for a fetch is the only
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
 * the row in All Runs is a run, and they are read side by side - a `waiting`
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

export type NodeCategory =
  | "start"
  | "logic"
  | "wait"
  | "messaging"
  | "crm"
  | "marketing"
  | "advanced";

export type NodeKind =
  /* start */
  | "trigger"
  /* logic */
  | "condition"
  | "if_else"
  | "multi_branch"
  | "split"
  /*
   * Wait, as five kinds rather than one with a mode.
   *
   * They are five different questions - how long, until when, until what time,
   * until which event, until which condition - and a single node whose meaning
   * changes with a dropdown is a node you cannot read on the canvas. Only
   * `wait_until_event` forks, because only it can time out.
   */
  | "wait"
  | "wait_until_date"
  | "wait_until_time"
  | "wait_until_event"
  | "wait_until_condition"
  /* messaging */
  | "send_whatsapp"
  | "send_email"
  | "send_sms"
  /* crm */
  | "add_tag"
  | "remove_tag"
  | "update_contact"
  | "update_lead"
  | "update_stage"
  | "assign_owner"
  | "add_segment"
  | "remove_segment"
  /* marketing */
  | "add_to_campaign"
  | "remove_from_campaign"
  | "create_task"
  | "notify"
  /* advanced */
  | "webhook"
  | "custom_event"
  | "api_action"
  | "end";

/** A branch leaving a forking node. Ordered - the first is the default path. */
export interface NodeBranch {
  id: string;
  label: string;
}

/**
 * One node on the canvas.
 *
 * `summary` is the single line a node shows under its title - "Wait 1 day",
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
  /** Contacts that have reached this node - the node-level analytics figure. */
  entered?: number;
  /** Per-branch share of `entered`, keyed by branch id. Sums to 100. */
  branchShare?: Record<string, number>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  /** Set when `from` forks - names which handle the edge leaves by. */
  branchId?: string;
}

/* -------------------------------------------------------------------------- */
/* Variables and outputs                                                      */
/* -------------------------------------------------------------------------- */

/** Where a personalisation token gets its value from. */
export type VariableSource =
  | "contact"
  | "lead"
  | "trigger"
  | "order"
  | "node"
  | "workspace"
  | "custom";

/**
 * One `{{token}}` in a message, and what fills it.
 *
 * Stored as a binding rather than resolved at authoring time, because the
 * value does not exist yet - the whole point is that it is different for every
 * contact. `path` is dotted and belongs to `source`: `first_name` on a
 * contact, `response.order_id` on a node.
 */
export interface VariableBinding {
  token: string;
  source: VariableSource;
  path: string;
  /** Human label for the mapping row - "Contact First Name". */
  label: string;
  /** What the preview shows in place of the token. */
  sample?: string;
}

/**
 * A value a node produces, for the nodes after it.
 *
 * Declared on the node *type* rather than discovered at runtime, so the
 * inspector of a later node can offer `response.status` in a condition before
 * the workflow has ever run. This is what makes an API action composable
 * rather than a dead end.
 */
export interface NodeOutput {
  key: string;
  type: "string" | "number" | "boolean" | "object";
  description: string;
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How often one contact may enter.
 *
 * `once` is the safe default and the one that stops a customer being messaged
 * twice; `every_time` suits recurring events (an order, an appointment);
 * `cooldown` is the middle ground, and the only mode where the cooldown and
 * the cap both apply.
 */
export type EnrollmentMode = "once" | "every_time" | "cooldown";

export interface EnrollmentRules {
  mode: EnrollmentMode;
  cooldownDays: number;
  maxEntries: number;
}

/**
 * Who is kept out, regardless of the trigger.
 *
 * A separate object from the entry rules because it answers a different
 * question - not "how often" but "never" - and because these are the checks a
 * marketing team is held to. Getting them wrong is a compliance problem, not a
 * UX one.
 */
export interface SuppressionRules {
  unsubscribed: boolean;
  suppressionList: boolean;
  invalidContact: boolean;
  blockedWhatsApp: boolean;
  /** Segments and tags that disqualify a contact from entering. */
  segmentIds: string[];
  tags: string[];
}

export interface ExitRules {
  goalReached: boolean;
  purchased: boolean;
  leadWon: boolean;
  enteredSegment: boolean;
  unsubscribes: boolean;
  tagAdded: boolean;
  manualStop: boolean;
  /** The segment or tag the two rules above watch for. */
  segmentId?: string;
  tag?: string;
}

export type GoalType =
  | "order_completed"
  | "lead_converted"
  | "appointment_booked"
  | "form_submitted"
  | "purchase_value";

/**
 * What the workflow is *for*.
 *
 * Analytics measures conversion against this rather than against "reached the
 * last node", which is the difference between a journey that works and one
 * that merely finishes. Optional, because a delivery-notification workflow has
 * no goal beyond being delivered.
 */
export interface WorkflowGoal {
  enabled: boolean;
  type: GoalType;
  /** For `purchase_value` - the threshold that counts as conversion. */
  value?: number;
  /** How long after entry the goal can still be attributed. */
  windowDays: number;
}

export interface TimingRules {
  timezone: "workspace" | "contact";
  /** Three-letter day keys the workflow is allowed to send on. */
  days: string[];
  /** The window promotional sends are allowed inside, in local time. */
  sendFrom: string;
  sendTo: string;
  quietHours: { enabled: boolean; from: string; to: string };
}

export interface FailureRules {
  retry: boolean;
  maxRetries: number;
  /** Minutes before the first retry; later ones back off from it. */
  retryIntervalMinutes: number;
  continueOnNonCritical: boolean;
  stopOnCritical: boolean;
}

export interface WorkflowSettings {
  enrollment: EnrollmentRules;
  suppression: SuppressionRules;
  exit: ExitRules;
  goal: WorkflowGoal;
  timing: TimingRules;
  failure: FailureRules;
}

/* -------------------------------------------------------------------------- */
/* Versions                                                                   */
/* -------------------------------------------------------------------------- */

export type VersionState = "draft" | "published" | "superseded";

/**
 * One saved version of a workflow.
 *
 * Versioning exists for one reason: editing a live workflow must not change
 * what is happening to the people already inside it. A published version is
 * immutable and keeps running; edits accumulate in a draft; publishing
 * promotes the draft and supersedes the previous version. The frontend models
 * this now so the eventual API has a shape to fill rather than a redesign to
 * force.
 */
export interface WorkflowVersion {
  version: number;
  state: VersionState;
  createdAt: string;
  authorId: string;
  /** What changed, in the author's words. */
  note?: string;
  nodeCount: number;
  /** Contacts still running on this version. Non-zero on superseded ones. */
  activeContacts: number;
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
  /** Left before finishing - goal met early, unsubscribed, manually stopped. */
  exitedEarly: number;
  /** Mean time from entry to completion, in milliseconds. */
  averageCompletionMs: number;
}

/**
 * How contacts get into a workflow.
 *
 * This is the distinction the module turns on, and the one most automation
 * tools blur: "Welcome Series" is a *template*, a recipe for a journey.
 * "Event-based" is a *start type* - the mechanism by which a contact is
 * enrolled. Confusing the two is what leaves a builder unable to explain why
 * anybody is in the workflow at all.
 */
export type StartTypeKey =
  | "event"
  | "criteria"
  | "schedule"
  | "webhook"
  | "template"
  | "blank";

/** One clause of a criteria-based enrolment rule. */
export interface CriteriaCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

/**
 * A criteria rule, deliberately structurally identical to the `RuleGroup` the
 * Customers module's audience builder already edits.
 *
 * That is what lets the creation wizard reuse `RuleGroupEditor` and its live
 * audience count instead of growing a second rule builder - two of those in
 * one product is how "in segment VIP" ends up meaning different things on two
 * screens. Stated in `types/` rather than imported from `lib/` so the data
 * model does not depend on a fixture file.
 */
export interface CriteriaGroup {
  id: string;
  /** How the clauses in this group combine. */
  match: "all" | "any";
  conditions: CriteriaCondition[];
  groups: CriteriaGroup[];
}

/**
 * The configured entry point: the start type, plus whatever that type needs.
 *
 * One object rather than fields scattered across the workflow, because the
 * creation wizard builds exactly this and the Settings page edits exactly
 * this.
 */
export interface WorkflowStart {
  type: StartTypeKey;
  /** Event-based: the registry key it subscribes to. */
  eventKey?: string;
  /**
   * Event-based on `form.submitted`: the one form it listens to. Absent means
   * every form in the workspace raises it.
   */
  formId?: string;
  /** Criteria-based: the rule a contact has to match to be enrolled. */
  criteria?: CriteriaGroup;
  /** Schedule-based: the cadence, in the workspace's words. */
  schedule?: string;
  /** Optional extra filter applied on top of an event before enrolling. */
  conditions?: CriteriaGroup;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  /** How contacts enter - see `WorkflowStart`. */
  start: WorkflowStart;
  /** The registry event that starts it, e.g. `lead.created`. */
  triggerKey: string;
  triggerLabel: string;
  channels: MarketingChannel[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  ownerId: string;
  stats: WorkflowStats;
  settings: WorkflowSettings;
  /**
   * Versioning. `publishedVersion` is what contacts are running on;
   * `hasDraftChanges` says whether edits are waiting behind it.
   */
  publishedVersion: number;
  hasDraftChanges: boolean;
  versions: WorkflowVersion[];
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

/** One step of a template's preview - a flat list, not a graph. */
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
  /** What the journey is trying to achieve - read as the conversion measure. */
  goal: string;
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
  /** The system that emits it - CRM, WhatsApp, Commerce, Webhook. */
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
  /** When it finished. Absent while the step is still running or waiting. */
  finishedAt?: string;
  kind: NodeKind;
  title: string;
  /** What was acted on - "Welcome message", "24 hours", "Tag: New Lead". */
  detail: string;
  /** The event, as the log reads it - "WhatsApp Sent", "Delay Scheduled". */
  event: string;
  status: ExecutionStatus;
  durationMs?: number;
  channel?: MarketingChannel;
  /**
   * What the step was given and what it produced.
   *
   * Both are shown in the execution detail, because "the message failed" is
   * not debuggable and "we sent it to a number with no country code" is. The
   * output is also what a later node's condition reads.
   */
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  /** 1 on the first try. Above 1 means the retry policy has been at work. */
  attempt?: number;
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

/**
 * Three levels, because two is not enough.
 *
 * An `error` makes the workflow impossible to run and blocks publishing. A
 * `warning` is something that will probably bite - an unset connection, a
 * branch that goes nowhere - and is allowed through, because sometimes it is
 * deliberate. A `recommendation` is neither: it is advice about the journey
 * rather than a defect in it, and collapsing it into "warning" is how a
 * validation panel turns into noise nobody reads.
 */
export type ValidationSeverity = "error" | "warning" | "recommendation";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  /** The node it belongs to, where it belongs to one. */
  nodeId?: string;
  message: string;
  /** What to do about it, in one clause. */
  fix: string;
}
