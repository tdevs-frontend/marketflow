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
