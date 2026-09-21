import {
  Clock,
  GitBranch,
  MessageCircle,
  Tag,
  UserPlus,
  Webhook,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ProductFrame } from "./feature-section";

/**
 * The automation builder's canvas, as a five-step journey.
 *
 * The brief's example journey, drawn the way the builder draws it: a trigger at
 * the top, steps down the spine, a condition that actually splits, and the
 * node library down the side. The split matters more than anything else here —
 * a linear list of five boxes is a drip sequence, and the thing that makes this
 * a workflow builder rather than an autoresponder is that step four asks a
 * question and step five depends on the answer.
 *
 * Node kinds are tinted by what they do, not by hue for its own sake: the
 * trigger is brand, messages are their channel's green, waits and conditions
 * are neutral, and the CRM action is the one that writes back to a record.
 */

interface Node {
  label: string;
  detail: string;
  icon: LucideIcon;
  kind: "trigger" | "message" | "wait" | "condition" | "action";
}

const NODES: Node[] = [
  { label: "New lead", detail: "Trigger · form or WhatsApp", icon: UserPlus, kind: "trigger" },
  { label: "Welcome message", detail: "WhatsApp template", icon: MessageCircle, kind: "message" },
  { label: "Wait 1 day", detail: "Then continue", icon: Clock, kind: "wait" },
  { label: "Replied?", detail: "Condition", icon: GitBranch, kind: "condition" },
];

const KIND_TONE: Record<Node["kind"], string> = {
  trigger: "bg-primary text-white",
  message: "bg-whatsapp-soft text-whatsapp",
  wait: "bg-surface-secondary text-text-secondary",
  condition: "bg-warning-soft text-warning-text",
  action: "bg-primary-soft text-primary",
};

/** What the node library offers. The real step kinds, not a sample. */
const LIBRARY: { label: string; icon: LucideIcon }[] = [
  { label: "Message", icon: MessageCircle },
  { label: "Wait", icon: Clock },
  { label: "Condition", icon: GitBranch },
  { label: "Add tag", icon: Tag },
  { label: "Webhook", icon: Webhook },
];

function Connector() {
  return (
    <span aria-hidden className="ml-4 block h-4 w-px bg-border-strong" />
  );
}

export function WorkflowVisual() {
  return (
    <ProductFrame path="/dashboard/automation" status="8 running">
      <div className="flex bg-background">
        {/* The canvas */}
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <ol className="space-y-0">
            {NODES.map((node, index) => (
              <li key={node.label}>
                <div className="flex items-center gap-2.5 rounded-panel border border-border bg-surface p-2.5 shadow-card">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-btn",
                      KIND_TONE[node.kind],
                    )}
                  >
                    <node.icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-text-primary">
                      {node.label}
                    </span>
                    <span className="block truncate text-[11px] text-text-muted">
                      {node.detail}
                    </span>
                  </span>
                </div>
                {index < NODES.length - 1 ? <Connector /> : null}
              </li>
            ))}
          </ol>

          {/* The branch. Two outcomes, each with its own next step — the whole
              reason this is a canvas and not a list. */}
          <div aria-hidden className="ml-4 h-4 w-px bg-border-strong" />
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                answer: "Yes",
                tone: "bg-success-soft text-success-text",
                step: "Mark qualified",
                detail: "Update lead stage",
              },
              {
                answer: "No",
                tone: "bg-surface-secondary text-text-secondary",
                step: "Send follow-up",
                detail: "Wait 2 days, then retry",
              },
            ].map((branch) => (
              <div key={branch.answer} className="min-w-0">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                    branch.tone,
                  )}
                >
                  {branch.answer}
                </span>
                <div className="mt-1.5 rounded-panel border border-dashed border-border-strong bg-surface p-2.5">
                  <p className="truncate text-xs font-semibold text-text-primary">
                    {branch.step}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-text-muted">
                    {branch.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The node library, as a rail. Hidden on a phone, where the canvas
            needs every pixel it can get. */}
        <div className="hidden w-32 shrink-0 border-l border-border bg-surface p-2.5 sm:block">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-text-muted uppercase">
            Add step
          </p>
          <ul className="mt-2 space-y-1">
            {LIBRARY.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 rounded-btn border border-border px-2 py-1.5"
              >
                <item.icon className="size-3 shrink-0 text-text-muted" aria-hidden />
                <span className="truncate text-[11px] font-medium text-text-secondary">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProductFrame>
  );
}
