export type AutomationTriggerType =
  | "contact_created"
  | "tag_added"
  | "form_submitted"
  | "lead_stage_changed"
  | "message_received"
  | "campaign_opened"
  | "campaign_clicked"
  | "date_based"
  | "webhook";

export type AutomationActionType =
  | "send_email"
  | "send_sms"
  | "send_whatsapp"
  | "add_tag"
  | "remove_tag"
  | "update_field"
  | "create_lead"
  | "move_stage"
  | "assign_owner"
  | "wait"
  | "webhook"
  | "condition";

export type AutomationStatus = "draft" | "active" | "paused" | "archived";

export interface AutomationTrigger {
  id: string;
  type: AutomationTriggerType;
  config: Record<string, unknown>;
}

export interface AutomationNode {
  id: string;
  type: AutomationActionType;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  nextNodeIds: string[];
}

export interface AutomationStats {
  entered: number;
  completed: number;
  active: number;
  failed: number;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  nodes: AutomationNode[];
  stats: AutomationStats;
  createdAt: string;
  updatedAt: string;
}

export type CreateAutomationPayload = Omit<
  Automation,
  "id" | "stats" | "createdAt" | "updatedAt"
>;

export type UpdateAutomationPayload = Partial<CreateAutomationPayload> & { id: string };

/* -------------------------------------------------------------------------- */
/* Visual flow                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The shape the automation builder renders.
 *
 * Sequential with named branches, rather than the free `{x, y}` graph above:
 * a marketing follow-up is a line with the occasional fork, and a list of
 * steps is what a builder can render, reorder and read out to a screen reader.
 * The node graph stays for flows authored on a canvas.
 */
export type FlowStepType = "trigger" | "action" | "condition" | "delay" | "goal";

export interface FlowStep {
  id: string;
  type: FlowStepType;
  title: string;
  /** The configured detail — "Wait 1 day", "Send welcome_message". */
  detail: string;
  /** Lucide key for the node's icon. */
  icon: string;
  /** Channel the step sends on, where it sends at all. */
  channel?: "whatsapp" | "email" | "sms";
  /** Contacts that have reached this step. */
  entered?: number;
  /**
   * A condition's outcomes, in order. Two is the norm — yes and no — and the
   * builder renders them as parallel columns under the fork.
   */
  branches?: { label: string; steps: FlowStep[] }[];
}

export interface AutomationFlow {
  id: string;
  name: string;
  description: string;
  channel: "whatsapp" | "email" | "sms";
  status: AutomationStatus;
  /** Plain-language trigger, e.g. "New lead created". */
  triggerLabel: string;
  triggerIcon: string;
  /** Excludes the trigger — `steps.length` is what "5 steps" means. */
  steps: FlowStep[];
  contactsProcessed: number;
  /** Percentage completing the flow. */
  successRate: number;
  lastActivityAt: string;
  createdAt: string;
}
