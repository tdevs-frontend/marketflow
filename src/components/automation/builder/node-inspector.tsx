"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { NODE_CATEGORY, NODE_META } from "@/constants/automation";
import { APP_ROUTES } from "@/constants/app";
import {
  CUSTOMER_SEGMENTS,
  OWNERS,
  PIPELINE_STAGES,
  TAG_NAMES,
} from "@/lib/customer-fixtures";
import { EMAIL_TEMPLATES } from "@/lib/email-fixtures";
import {
  TEMPLATES as WHATSAPP_TEMPLATES,
  TEMPLATE_LANGUAGES,
  TEMPLATE_VARIABLES,
} from "@/lib/whatsapp-fixtures";
import { AUTOMATION_TRIGGERS } from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { NodeKind, WorkflowNode } from "@/types/workflow";
import { NodeIcon } from "../node-icon";

/**
 * The node editor, as a persistent panel rather than a modal.
 *
 * That is the single most important decision in the builder. Configuring a
 * node is a back-and-forth — set the template, look at where the node sits,
 * adjust the wait above it — and a dialog that covers the canvas makes the
 * thing being configured invisible exactly while it is being configured. The
 * inspector sits beside the canvas and stays open as the selection moves.
 *
 * Fields are described per node kind rather than written as twenty-one forms,
 * so every control in the panel is the same `Select` and `Input` the rest of
 * the product uses and a new node type is a table entry.
 */

type FieldSpec =
  | {
      type: "select";
      key: string;
      label: string;
      options: SelectOption[];
      hint?: string;
      placeholder?: string;
    }
  | { type: "text"; key: string; label: string; placeholder?: string; hint?: string }
  | { type: "textarea"; key: string; label: string; placeholder?: string; hint?: string }
  | { type: "number"; key: string; label: string; hint?: string; min?: number }
  | { type: "toggle"; key: string; label: string; hint?: string };

const option = (value: string, label = value): SelectOption => ({ value, label });

const TAG_OPTIONS = TAG_NAMES.map((name) => option(name));
const SEGMENT_OPTIONS = CUSTOMER_SEGMENTS.map((segment) =>
  option(segment.id, segment.name),
);
const OWNER_OPTIONS = [
  option("round_robin", "Round robin — Sales team"),
  ...OWNERS.map((owner) => option(owner.id, owner.name)),
];
const STAGE_OPTIONS = PIPELINE_STAGES.map((stage) => option(stage.stage, stage.label));
const WHATSAPP_OPTIONS = WHATSAPP_TEMPLATES.map((template) => ({
  value: template.name,
  label: template.name,
  hint: template.status === "approved" ? "Approved" : "Awaiting approval",
}));
const EMAIL_OPTIONS = EMAIL_TEMPLATES.map((template) =>
  option(template.id, template.name),
);
const CONTACT_FIELDS = [
  option("lifecycle", "Lifecycle stage"),
  option("source", "Source"),
  option("company", "Company"),
  option("job_title", "Job title"),
  option("last_engaged_at", "Last engaged at"),
];

const WAIT_UNITS = [
  option("minutes", "Minutes"),
  option("hours", "Hours"),
  option("days", "Days"),
  option("weeks", "Weeks"),
];

const CONDITION_FIELDS = [
  option("replied", "Replied to the last message"),
  option("opened", "Opened the last email"),
  option("clicked", "Clicked a link"),
  option("purchased", "Placed an order"),
  option("tag", "Has tag"),
  option("segment", "In segment"),
  option("lifecycle", "Lifecycle stage"),
];

const CONDITION_OPERATORS = [
  option("is", "is"),
  option("is_not", "is not"),
  option("within", "within the last"),
  option("not_within", "not within the last"),
];

/** The controls one node kind needs, beyond its name. */
function fieldsFor(kind: NodeKind): FieldSpec[] {
  switch (kind) {
    case "trigger":
      return [
        {
          type: "select",
          key: "eventKey",
          label: "Event",
          options: AUTOMATION_TRIGGERS.filter((trigger) => trigger.status !== "disabled").map(
            (trigger) => ({
              value: trigger.eventKey,
              label: trigger.name,
              hint: trigger.eventKey,
            }),
          ),
          hint: "What puts a contact into this workflow.",
        },
        {
          type: "text",
          key: "filter",
          label: "Entry filter",
          placeholder: "Source is website",
          hint: "Optional. Only contacts matching this enter.",
        },
      ];

    case "send_whatsapp":
      return [
        {
          type: "select",
          key: "connection",
          label: "Connection",
          options: [
            option("main", "Main WhatsApp Account"),
            option("support", "Support Line"),
          ],
        },
        { type: "select", key: "template", label: "Template", options: WHATSAPP_OPTIONS },
        {
          type: "select",
          key: "language",
          label: "Language",
          options: TEMPLATE_LANGUAGES as SelectOption[],
        },
      ];

    case "send_email":
      return [
        {
          type: "select",
          key: "sender",
          label: "From",
          options: [
            option("hello", "hello@marketflow.app"),
            option("sales", "sales@marketflow.app"),
          ],
        },
        { type: "select", key: "template", label: "Email template", options: EMAIL_OPTIONS },
        {
          type: "text",
          key: "subject",
          label: "Subject override",
          placeholder: "Leave blank to use the template subject",
        },
      ];

    case "send_sms":
      return [
        {
          type: "select",
          key: "sender",
          label: "Sender ID",
          options: [option("MARKETFLOW", "MARKETFLOW"), option("MF-ALERTS", "MF-ALERTS")],
        },
        {
          type: "textarea",
          key: "body",
          label: "Message",
          placeholder: "Hi {{first_name}}, your order is on its way.",
          hint: "160 characters per segment. Variables count toward the limit.",
        },
      ];

    case "wait":
      return [
        { type: "number", key: "duration", label: "Duration", min: 1 },
        { type: "select", key: "unit", label: "Unit", options: WAIT_UNITS },
        {
          type: "select",
          key: "timezone",
          label: "Timezone",
          options: [
            option("workspace", "Workspace timezone"),
            option("contact", "Contact timezone"),
          ],
        },
      ];

    case "wait_until":
      return [
        {
          type: "select",
          key: "mode",
          label: "Wait until",
          options: [
            option("time", "A specific time of day"),
            option("date_field", "A date on the contact"),
            option("condition", "A condition becomes true"),
          ],
        },
        {
          type: "text",
          key: "value",
          label: "Value",
          placeholder: "09:00, or appointment_date − 1 hour",
        },
      ];

    case "condition":
    case "if_else":
      return [
        { type: "select", key: "field", label: "Check", options: CONDITION_FIELDS },
        { type: "select", key: "operator", label: "Operator", options: CONDITION_OPERATORS },
        { type: "text", key: "value", label: "Value", placeholder: "true, 24 hours, VIP" },
      ];

    case "split":
      return [
        { type: "number", key: "share", label: "Variant A share (%)", min: 1 },
        {
          type: "toggle",
          key: "sticky",
          label: "Keep contacts on the same variant",
          hint: "A contact re-entering the workflow sees the branch they saw before.",
        },
      ];

    case "multi_branch":
      return [
        { type: "select", key: "field", label: "Branch on", options: CONDITION_FIELDS },
      ];

    case "add_tag":
    case "remove_tag":
      return [{ type: "select", key: "tag", label: "Tag", options: TAG_OPTIONS }];

    case "add_segment":
    case "remove_segment":
      return [{ type: "select", key: "segment", label: "Segment", options: SEGMENT_OPTIONS }];

    case "update_stage":
      return [{ type: "select", key: "stage", label: "Lead stage", options: STAGE_OPTIONS }];

    case "assign_owner":
      return [{ type: "select", key: "owner", label: "Owner", options: OWNER_OPTIONS }];

    case "update_field":
      return [
        { type: "select", key: "field", label: "Field", options: CONTACT_FIELDS },
        { type: "text", key: "value", label: "New value", placeholder: "Repeat" },
      ];

    case "webhook":
      return [
        {
          type: "select",
          key: "method",
          label: "Method",
          options: [option("POST"), option("PUT"), option("GET")],
        },
        {
          type: "text",
          key: "url",
          label: "Endpoint URL",
          placeholder: "https://example.com/hooks/marketflow",
        },
        {
          type: "textarea",
          key: "payload",
          label: "Payload",
          placeholder: '{ "contact_id": "{{contact.id}}" }',
          hint: "JSON. Variables are substituted before the request is sent.",
        },
      ];

    case "custom_event":
      return [
        { type: "text", key: "eventKey", label: "Event key", placeholder: "demo_requested" },
        { type: "textarea", key: "properties", label: "Properties", placeholder: '{ "plan": "growth" }' },
      ];

    case "notify":
      return [
        {
          type: "select",
          key: "recipient",
          label: "Notify",
          options: [
            option("owner", "The contact's owner"),
            ...OWNERS.map((owner) => option(owner.id, owner.name)),
            option("channel", "#sales channel"),
          ],
        },
        { type: "textarea", key: "message", label: "Message", placeholder: "New hot lead: {{first_name}}" },
      ];

    case "end":
      return [
        {
          type: "select",
          key: "reason",
          label: "Exit reason",
          options: [
            option("goal", "Goal reached"),
            option("completed", "Journey complete"),
            option("disqualified", "No longer eligible"),
          ],
        },
      ];

    default:
      return [];
  }
}

const labelOf = (options: SelectOption[], value: unknown) =>
  options.find((item) => item.value === value)?.label ?? String(value ?? "");

/**
 * Rebuilds the one line the node shows on the canvas.
 *
 * Derived from the config on save rather than typed by hand, so the canvas can
 * never disagree with the inspector — and so the validator, which reads the
 * summary, is reading the configuration.
 */
function summaryOf(kind: NodeKind, config: Record<string, unknown>): string {
  const value = (key: string) => (config[key] ? String(config[key]) : "");

  switch (kind) {
    case "trigger": {
      const trigger = AUTOMATION_TRIGGERS.find((item) => item.eventKey === config.eventKey);
      return value("filter") || trigger?.eventKey || NODE_META[kind].defaultSummary;
    }
    case "send_whatsapp":
      return value("template") || NODE_META[kind].defaultSummary;
    case "send_email":
      return labelOf(EMAIL_OPTIONS, config.template) || NODE_META[kind].defaultSummary;
    case "send_sms":
      return value("body").slice(0, 48) || NODE_META[kind].defaultSummary;
    case "wait":
      return config.duration
        ? `${config.duration} ${labelOf(WAIT_UNITS, config.unit).toLowerCase()}`
        : NODE_META[kind].defaultSummary;
    case "wait_until":
      return value("value") || NODE_META[kind].defaultSummary;
    case "condition":
    case "if_else":
      return config.field
        ? `${labelOf(CONDITION_FIELDS, config.field)} ${labelOf(
            CONDITION_OPERATORS,
            config.operator,
          )} ${value("value")}`.trim()
        : NODE_META[kind].defaultSummary;
    case "multi_branch":
      return config.field
        ? labelOf(CONDITION_FIELDS, config.field)
        : NODE_META[kind].defaultSummary;
    case "split":
      return config.share ? `${config.share} / ${100 - Number(config.share)}` : "50 / 50";
    case "add_tag":
    case "remove_tag":
      return value("tag") || NODE_META[kind].defaultSummary;
    case "add_segment":
    case "remove_segment":
      return labelOf(SEGMENT_OPTIONS, config.segment) || NODE_META[kind].defaultSummary;
    case "update_stage":
      return labelOf(STAGE_OPTIONS, config.stage) || NODE_META[kind].defaultSummary;
    case "assign_owner":
      return labelOf(OWNER_OPTIONS, config.owner) || NODE_META[kind].defaultSummary;
    case "update_field":
      return config.field
        ? `${labelOf(CONTACT_FIELDS, config.field)} = ${value("value")}`
        : NODE_META[kind].defaultSummary;
    case "webhook":
      return value("url") || NODE_META[kind].defaultSummary;
    case "custom_event":
      return value("eventKey") || NODE_META[kind].defaultSummary;
    case "notify":
      return labelOf(
        [option("owner", "The contact's owner"), option("channel", "#sales channel"), ...OWNERS.map((owner) => option(owner.id, owner.name))],
        config.recipient,
      ) || NODE_META[kind].defaultSummary;
    case "end":
      return labelOf(
        [option("goal", "Goal reached"), option("completed", "Journey complete"), option("disqualified", "No longer eligible")],
        config.reason,
      ) || NODE_META[kind].defaultSummary;
    default:
      /* Unreachable while every kind is handled above — and a compile error
         the moment a new one is added without a summary. */
      return "";
  }
}

/** Where a node's configured object lives in the rest of the product. */
function crossLink(kind: NodeKind, config: Record<string, unknown>) {
  switch (kind) {
    case "send_whatsapp":
      return { href: APP_ROUTES.whatsappTemplates, label: "Open WhatsApp templates" };
    case "send_email":
      return { href: APP_ROUTES.emailTemplates, label: "Open email templates" };
    case "send_sms":
      return { href: APP_ROUTES.smsTemplates, label: "Open SMS templates" };
    case "add_segment":
    case "remove_segment":
      return { href: APP_ROUTES.customerSegments, label: "Open segments" };
    case "add_tag":
    case "remove_tag":
      return { href: APP_ROUTES.tags, label: "Open tags" };
    case "update_stage":
      return { href: APP_ROUTES.leads, label: "Open the pipeline" };
    case "trigger":
      return {
        href: `/dashboard/automation/triggers`,
        label: "Open the trigger registry",
      };
    default:
      return config.url ? { href: String(config.url), label: "Open endpoint" } : null;
  }
}

export function NodeInspector({
  node,
  onChange,
  onClose,
  onDelete,
  className,
}: {
  node: WorkflowNode | null;
  onChange: (node: WorkflowNode) => void;
  onClose?: () => void;
  onDelete?: (nodeId: string) => void;
  className?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState<WorkflowNode | null>(node);

  /*
   * Selection changes reset the panel.
   *
   * Adjusted during render rather than in an effect — React's own recommended
   * shape for state that derives from a prop, and the one that avoids a frame
   * of the previous node's configuration showing under the new node's name.
   * Keyed on the id rather than the object, so a canvas drag (which replaces
   * the node object on every pointer move) does not throw away half-typed
   * configuration.
   */
  const [lastId, setLastId] = useState(node?.id ?? null);
  if ((node?.id ?? null) !== lastId) {
    setLastId(node?.id ?? null);
    setDraft(node);
  }

  const kind = draft?.kind;
  const fields = useMemo(() => (kind ? fieldsFor(kind) : []), [kind]);

  if (!draft) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-2 px-6 text-center",
          className,
        )}
      >
        <span className="grid size-10 place-items-center rounded-panel bg-surface-secondary text-text-muted">
          <Plus className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-text-primary">No step selected</p>
        <p className="max-w-56 text-xs text-text-muted">
          Pick a node on the canvas to configure it, or drag a new one in from
          the library.
        </p>
      </div>
    );
  }

  const meta = NODE_META[draft.kind];
  const theme = NODE_CATEGORY[meta?.category ?? "advanced"];
  const link = crossLink(draft.kind, draft.config);
  const messaging = meta?.category === "messaging";

  const set = (key: string, value: unknown) =>
    setDraft((current) =>
      current ? { ...current, config: { ...current.config, [key]: value } } : current,
    );

  function save() {
    if (!draft) return;
    onChange({ ...draft, summary: summaryOf(draft.kind, draft.config) });
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-start gap-2.5 border-b border-border px-4 py-3">
        <NodeIcon kind={draft.kind} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10px] font-medium tracking-[0.08em] uppercase",
              theme.text,
            )}
          >
            {meta?.label}
          </p>
          <h2 className="truncate text-sm">{draft.title}</h2>
        </div>
        {onClose ? (
          <IconButton label="Close configuration" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        ) : null}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <Field
          label="Step name"
          htmlFor={`${id}-title`}
          hint="What this step is called on the canvas."
        >
          <Input
            id={`${id}-title`}
            value={draft.title}
            onChange={(event) =>
              setDraft((current) =>
                current ? { ...current, title: event.target.value } : current,
              )
            }
          />
        </Field>

        {fields.map((field) => {
          const controlId = `${id}-${field.key}`;
          const value = draft.config[field.key];

          if (field.type === "select") {
            return (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={controlId}
                hint={field.hint}
              >
                <Select
                  id={controlId}
                  hideLabel={false}
                  label={field.label}
                  value={String(value ?? "")}
                  onChange={(next) => set(field.key, next)}
                  options={field.options}
                  placeholder={field.placeholder ?? "Select…"}
                />
              </Field>
            );
          }

          if (field.type === "textarea") {
            return (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={controlId}
                hint={field.hint}
              >
                <Textarea
                  id={controlId}
                  value={String(value ?? "")}
                  onChange={(event) => set(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              </Field>
            );
          }

          if (field.type === "toggle") {
            return (
              <CheckboxField
                key={field.key}
                id={controlId}
                checked={Boolean(value)}
                onCheckedChange={(checked) => set(field.key, checked)}
                label={field.label}
                hint={field.hint}
              />
            );
          }

          return (
            <Field
              key={field.key}
              label={field.label}
              htmlFor={controlId}
              hint={field.hint}
            >
              <Input
                id={controlId}
                type={field.type === "number" ? "number" : "text"}
                min={field.type === "number" ? field.min : undefined}
                value={String(value ?? "")}
                onChange={(event) =>
                  set(
                    field.key,
                    field.type === "number"
                      ? Number(event.target.value)
                      : event.target.value,
                  )
                }
                placeholder={field.type === "text" ? field.placeholder : undefined}
              />
            </Field>
          );
        })}

        {draft.branches?.length ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-text-primary">Branches</legend>
            <p className="text-xs text-text-muted">
              What each path out of this step is called on the canvas.
            </p>
            {draft.branches.map((branch, index) => (
              <Input
                key={branch.id}
                value={branch.label}
                aria-label={`Branch ${index + 1} label`}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          branches: current.branches?.map((item) =>
                            item.id === branch.id
                              ? { ...item, label: event.target.value }
                              : item,
                          ),
                        }
                      : current,
                  )
                }
              />
            ))}
          </fieldset>
        ) : null}

        {messaging ? (
          <section className="space-y-2 rounded-panel border border-border bg-surface-secondary/60 p-3">
            <h3 className="text-[13px] font-semibold text-text-primary">Variables</h3>
            <p className="text-[11px] text-text-muted">
              Filled from the contact record when the message is sent.
            </p>
            <dl className="space-y-1.5">
              {TEMPLATE_VARIABLES.slice(0, 4).map((variable) => (
                <div key={variable.name} className="flex items-center gap-2 text-[11px]">
                  <dt>
                    <code className="rounded-btn bg-surface px-1.5 py-0.5 font-mono text-text-secondary">
                      {`{{${variable.name}}}`}
                    </code>
                  </dt>
                  <dd className="min-w-0 flex-1 truncate text-text-muted">
                    → {variable.sample}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-primary">
            Additional conditions
          </h3>
          <p className="text-xs text-text-muted">
            Contacts who do not match skip this step and carry on.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              set("conditions", [...(Array.isArray(draft.config.conditions) ? draft.config.conditions : []), "New condition"])
            }
          >
            <Plus aria-hidden />
            Add Condition
          </Button>

          {Array.isArray(draft.config.conditions) && draft.config.conditions.length > 0 ? (
            <ul className="space-y-1.5">
              {(draft.config.conditions as string[]).map((condition, index) => (
                <li
                  key={`${condition}-${index}`}
                  className="flex items-center gap-2 rounded-btn border border-border bg-surface px-2.5 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
                    {condition}
                  </span>
                  <IconButton
                    label={`Remove condition ${index + 1}`}
                    size="sm"
                    onClick={() =>
                      set(
                        "conditions",
                        (draft.config.conditions as string[]).filter(
                          (_, order) => order !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 />
                  </IconButton>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {link ? (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1.5 rounded-btn text-xs font-medium text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            {link.label}
          </Link>
        ) : null}

        {draft.entered !== undefined && draft.entered > 0 ? (
          <p className="flex items-center gap-2 border-t border-border pt-3 text-xs text-text-muted">
            <Badge tone="neutral">{draft.entered.toLocaleString("en-US")}</Badge>
            contacts have reached this step
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3">
        <Button size="compact" className="flex-1" onClick={save}>
          Save
        </Button>
        {onDelete && draft.kind !== "trigger" ? (
          <Button
            size="compact"
            variant="outline"
            onClick={() => onDelete(draft.id)}
            className="text-error hover:border-error hover:bg-error-soft hover:text-error-text"
          >
            <Trash2 aria-hidden />
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
