"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  NODE_CATEGORY,
  NODE_META,
  VARIABLE_SOURCES,
} from "@/constants/automation";
import { APP_ROUTES } from "@/constants/app";
import { AUTOMATION_ROUTES } from "@/constants/automation";
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
} from "@/lib/whatsapp-fixtures";
import { AUTOMATION_TRIGGERS } from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { NodeKind, VariableBinding, WorkflowNode } from "@/types/workflow";
import { NodeIcon } from "../node-icon";
import { bindingsOf, guessBinding, requiredTokens } from "./variables";

/**
 * The node editor, as a persistent panel rather than a modal.
 *
 * That is the single most important decision in the builder. Configuring a
 * node is a back-and-forth - set the template, look at where the node sits,
 * adjust the wait above it - and a dialog that covers the canvas makes the
 * thing being configured invisible exactly while it is being configured.
 *
 * The panel is sectioned rather than flat, and only Configuration is open to
 * begin with. A WhatsApp node has configuration, variables, conditions, timing
 * and retry behaviour; showing all five at once is how a builder starts
 * looking like a settings screen. Everything past the first section is one
 * click away and stays shut until it is wanted.
 */

/* -------------------------------------------------------------------------- */
/* Field descriptors                                                          */
/* -------------------------------------------------------------------------- */

type FieldSpec =
  | {
      type: "select";
      key: string;
      label: string;
      options: SelectOption[];
      hint?: string;
      /** Only rendered when this returns true for the current config. */
      when?: (config: Record<string, unknown>) => boolean;
    }
  | {
      type: "text";
      key: string;
      label: string;
      hint?: string;
      when?: (config: Record<string, unknown>) => boolean;
    }
  | {
      type: "textarea";
      key: string;
      label: string;
      hint?: string;
      when?: (config: Record<string, unknown>) => boolean;
    }
  | {
      type: "number";
      key: string;
      label: string;
      hint?: string;
      min?: number;
      when?: (config: Record<string, unknown>) => boolean;
    }
  | {
      type: "date";
      key: string;
      label: string;
      hint?: string;
      when?: (config: Record<string, unknown>) => boolean;
    }
  | {
      type: "time";
      key: string;
      label: string;
      hint?: string;
      when?: (config: Record<string, unknown>) => boolean;
    }
  | {
      type: "toggle";
      key: string;
      label: string;
      hint?: string;
      when?: (config: Record<string, unknown>) => boolean;
    };

const option = (value: string, label = value): SelectOption => ({ value, label });

const TAG_OPTIONS = TAG_NAMES.map((name) => option(name));
const SEGMENT_OPTIONS = CUSTOMER_SEGMENTS.map((segment) =>
  option(segment.id, segment.name),
);
const OWNER_OPTIONS = [
  option("round_robin", "Round robin - Sales team"),
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

const LEAD_FIELDS = [
  option("value", "Deal value"),
  option("source", "Lead source"),
  option("score", "Lead score"),
  option("close_date", "Expected close date"),
];

const DATE_FIELDS = [
  option("appointment_date", "Appointment date"),
  option("birthday", "Birthday"),
  option("renewal_date", "Subscription renewal date"),
  option("last_order_at", "Last order date"),
];

const UNITS = [
  option("minutes", "Minutes"),
  option("hours", "Hours"),
  option("days", "Days"),
  option("weeks", "Weeks"),
];

const WEEKDAYS = [
  option("any", "Any day"),
  option("mon", "Monday"),
  option("tue", "Tuesday"),
  option("wed", "Wednesday"),
  option("thu", "Thursday"),
  option("fri", "Friday"),
  option("sat", "Saturday"),
  option("sun", "Sunday"),
];

const TIMEZONES = [
  option("workspace", "Workspace timezone"),
  option("contact", "Contact timezone"),
];

/** The customer actions a Wait Until Event node can wait for. */
const WAIT_EVENTS = [
  option("whatsapp_reply", "Replies on WhatsApp"),
  option("form_submitted", "Submits a form"),
  option("order_placed", "Places an order"),
  option("link_clicked", "Clicks a link"),
  option("email_opened", "Opens the email"),
];

const CONDITION_FIELDS = [
  option("replied", "Replied to the last message"),
  option("opened", "Opened the last email"),
  option("clicked", "Clicked a link"),
  option("purchased", "Placed an order"),
  option("tag", "Has tag"),
  option("segment", "In segment"),
  option("lifecycle", "Lifecycle stage"),
  option("lead_score", "Lead score"),
  option("node_output", "Output of an earlier step"),
];

const CONDITION_OPERATORS = [
  option("is", "is"),
  option("is_not", "is not"),
  option("gt", "is greater than"),
  option("lt", "is less than"),
  option("within", "within the last"),
  option("not_within", "not within the last"),
];

const DATE_MODES = [
  option("fixed", "A specific date"),
  option("contact_field", "A date on the contact"),
];

const OFFSET_DIRECTIONS = [
  option("before", "before"),
  option("on", "on the day"),
  option("after", "after"),
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
          hint: "Which connected number this sends from.",
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
          hint: "160 characters per segment. Variables count toward the limit.",
        },
      ];

    /* ---------------------------------------------------------------- Wait */

    case "wait":
      return [
        { type: "number", key: "duration", label: "Wait for", min: 1 },
        { type: "select", key: "unit", label: "Unit", options: UNITS },
      ];

    case "wait_until_date":
      return [
        { type: "select", key: "mode", label: "Wait until", options: DATE_MODES },
        {
          type: "date",
          key: "date",
          label: "Date",
          when: (config) => config.mode !== "contact_field",
        },
        {
          type: "select",
          key: "field",
          label: "Contact date field",
          options: DATE_FIELDS,
          when: (config) => config.mode === "contact_field",
        },
        {
          type: "select",
          key: "direction",
          label: "Relative to it",
          options: OFFSET_DIRECTIONS,
          when: (config) => config.mode === "contact_field",
        },
        {
          type: "number",
          key: "offsetDays",
          label: "Days",
          min: 0,
          when: (config) =>
            config.mode === "contact_field" && config.direction !== "on",
        },
      ];

    case "wait_until_time":
      return [
        { type: "time", key: "time", label: "Time of day" },
        {
          type: "select",
          key: "weekday",
          label: "Day",
          options: WEEKDAYS,
          hint: "Pick a weekday to hold until, say, Monday morning.",
        },
        { type: "select", key: "timezone", label: "Timezone", options: TIMEZONES },
      ];

    case "wait_until_event":
      return [
        {
          type: "select",
          key: "event",
          label: "Wait until the customer",
          options: WAIT_EVENTS,
        },
        {
          type: "number",
          key: "timeout",
          label: "Give up after",
          min: 1,
          hint: "Contacts who do nothing take the timeout branch.",
        },
        { type: "select", key: "timeoutUnit", label: "Unit", options: UNITS },
      ];

    case "wait_until_condition":
      return [
        { type: "select", key: "field", label: "Wait until", options: CONDITION_FIELDS },
        { type: "select", key: "operator", label: "Operator", options: CONDITION_OPERATORS },
        { type: "text", key: "value", label: "Value" },
        { type: "number", key: "timeout", label: "Give up after (days)", min: 1 },
      ];

    /* --------------------------------------------------------------- Logic */

    case "condition":
    case "if_else":
      return [
        { type: "select", key: "field", label: "Check", options: CONDITION_FIELDS },
        { type: "select", key: "operator", label: "Operator", options: CONDITION_OPERATORS },
        { type: "text", key: "value", label: "Value" },
        {
          type: "text",
          key: "outputPath",
          label: "Output path",
          hint: "Which earlier step's output to read.",
          when: (config) => config.field === "node_output",
        },
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

    /* ----------------------------------------------------------------- CRM */

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

    case "update_contact":
      return [
        { type: "select", key: "field", label: "Field", options: CONTACT_FIELDS },
        { type: "text", key: "value", label: "New value" },
      ];

    case "update_lead":
      return [
        { type: "select", key: "field", label: "Field", options: LEAD_FIELDS },
        { type: "text", key: "value", label: "New value" },
      ];

    /* ----------------------------------------------------------- Marketing */

    case "add_to_campaign":
    case "remove_from_campaign":
      return [
        {
          type: "select",
          key: "campaign",
          label: "Campaign",
          options: [
            option("cp-newsletter", "Monthly newsletter"),
            option("cp-vip", "VIP early access"),
            option("cp-winback", "Win-back offer"),
          ],
        },
      ];

    case "create_task":
      return [
        {
          type: "select",
          key: "assignee",
          label: "Assign to",
          options: OWNER_OPTIONS,
        },
        {
          type: "text",
          key: "title",
          label: "Task",
        },
        { type: "number", key: "dueDays", label: "Due in (days)", min: 0 },
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
        {
          type: "textarea",
          key: "message",
          label: "Message",
        },
      ];

    /* ------------------------------------------------------------ Advanced */

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
        },
        {
          type: "textarea",
          key: "payload",
          label: "Payload",
          hint: "JSON. Variables are substituted before the request is sent.",
        },
      ];

    case "api_action":
      return [
        {
          type: "select",
          key: "integration",
          label: "Integration",
          options: [
            option("shopify", "Shopify"),
            option("stripe", "Stripe"),
            option("sheets", "Google Sheets"),
          ],
        },
        {
          type: "text",
          key: "action",
          label: "Action",
        },
      ];

    case "custom_event":
      return [
        { type: "text", key: "eventKey", label: "Event key" },
        {
          type: "textarea",
          key: "properties",
          label: "Properties",
        },
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
  options.find((item) => item.value === value)?.label ?? "";

/**
 * Rebuilds the one line the node shows on the canvas.
 *
 * Derived from the config on save rather than typed by hand, so the canvas can
 * never disagree with the inspector - and so the validator, which reads the
 * summary, is reading the configuration.
 */
function summaryOf(kind: NodeKind, config: Record<string, unknown>): string {
  const value = (key: string) => (config[key] ? String(config[key]) : "");
  const fallback = NODE_META[kind]?.defaultSummary ?? "";

  switch (kind) {
    case "trigger": {
      const trigger = AUTOMATION_TRIGGERS.find((item) => item.eventKey === config.eventKey);
      return value("filter") || trigger?.eventKey || fallback;
    }

    case "send_whatsapp":
      return value("template") || fallback;
    case "send_email":
      return labelOf(EMAIL_OPTIONS, config.template) || fallback;
    case "send_sms":
      return value("body").slice(0, 48) || fallback;

    case "wait":
      return config.duration
        ? `${config.duration} ${labelOf(UNITS, config.unit || "hours").toLowerCase()}`
        : fallback;

    case "wait_until_date":
      if (config.mode === "contact_field") {
        const field = labelOf(DATE_FIELDS, config.field);
        if (!field) return fallback;
        if (config.direction === "on" || !config.direction) return `On ${field}`;
        return `${config.offsetDays ?? 0} days ${config.direction} ${field}`;
      }
      return value("date") ? `Until ${value("date")}` : fallback;

    case "wait_until_time": {
      const time = value("time");
      if (!time) return fallback;
      const day = config.weekday && config.weekday !== "any"
        ? `${labelOf(WEEKDAYS, config.weekday)} `
        : "";
      return `Until ${day}${time}`;
    }

    case "wait_until_event": {
      const event = labelOf(WAIT_EVENTS, config.event);
      if (!event) return fallback;
      const timeout = config.timeout
        ? `, max ${config.timeout} ${labelOf(UNITS, config.timeoutUnit || "days").toLowerCase()}`
        : "";
      return `${event}${timeout}`;
    }

    case "wait_until_condition":
      return config.field
        ? `${labelOf(CONDITION_FIELDS, config.field)} ${labelOf(
            CONDITION_OPERATORS,
            config.operator,
          )} ${value("value")}`.trim()
        : fallback;

    case "condition":
    case "if_else":
      return config.field
        ? `${labelOf(CONDITION_FIELDS, config.field)} ${labelOf(
            CONDITION_OPERATORS,
            config.operator,
          )} ${value("value")}`.trim()
        : fallback;

    case "multi_branch":
      return config.field ? labelOf(CONDITION_FIELDS, config.field) : fallback;

    case "split":
      return config.share ? `${config.share} / ${100 - Number(config.share)}` : "50 / 50";

    case "add_tag":
    case "remove_tag":
      return value("tag") || fallback;
    case "add_segment":
    case "remove_segment":
      return labelOf(SEGMENT_OPTIONS, config.segment) || fallback;
    case "update_stage":
      return labelOf(STAGE_OPTIONS, config.stage) || fallback;
    case "assign_owner":
      return labelOf(OWNER_OPTIONS, config.owner) || fallback;

    case "update_contact":
      return config.field
        ? `${labelOf(CONTACT_FIELDS, config.field)} = ${value("value")}`
        : fallback;
    case "update_lead":
      return config.field
        ? `${labelOf(LEAD_FIELDS, config.field)} = ${value("value")}`
        : fallback;

    case "add_to_campaign":
    case "remove_from_campaign":
      return value("campaign") ? labelOf(
        [
          option("cp-newsletter", "Monthly newsletter"),
          option("cp-vip", "VIP early access"),
          option("cp-winback", "Win-back offer"),
        ],
        config.campaign,
      ) : fallback;

    case "create_task":
      return value("title") || fallback;

    case "notify":
      return (
        labelOf(
          [
            option("owner", "The contact's owner"),
            option("channel", "#sales channel"),
            ...OWNERS.map((owner) => option(owner.id, owner.name)),
          ],
          config.recipient,
        ) || fallback
      );

    case "webhook":
      return value("url") || fallback;
    case "api_action":
      return config.integration
        ? `${labelOf(
            [
              option("shopify", "Shopify"),
              option("stripe", "Stripe"),
              option("sheets", "Google Sheets"),
            ],
            config.integration,
          )} · ${value("action")}`
        : fallback;
    case "custom_event":
      return value("eventKey") || fallback;

    case "end":
      return (
        labelOf(
          [
            option("goal", "Goal reached"),
            option("completed", "Journey complete"),
            option("disqualified", "No longer eligible"),
          ],
          config.reason,
        ) || fallback
      );

    default:
      /* Unreachable while every kind is handled above - and a compile error
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
    case "update_lead":
      return { href: APP_ROUTES.leads, label: "Open the pipeline" };
    case "add_to_campaign":
    case "remove_from_campaign":
      return { href: APP_ROUTES.marketingCampaigns, label: "Open campaigns" };
    case "trigger":
      return { href: AUTOMATION_ROUTES.triggers, label: "Open the trigger registry" };
    default:
      return config.url ? { href: String(config.url), label: "Open endpoint" } : null;
  }
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A disclosure, not an accordion: several can be open at once.
 *
 * Closing one should never close another - somebody comparing a wait against
 * its retry policy needs both, and an accordion would fight them for it.
 */
function Section({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-2 rounded-btn py-1 text-left text-sm font-semibold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", open ? "" : "-rotate-90")}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {badge}
        </button>
      </h3>
      {open ? <div className="mt-3 space-y-4 pb-1">{children}</div> : null}
    </section>
  );
}

export function NodeInspector({
  node,
  onChange,
  onDelete,
  className,
  onClose,
}: {
  node: WorkflowNode | null;
  onChange: (node: WorkflowNode) => void;
  onDelete?: (nodeId: string) => void;
  className?: string;
  onClose?: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<WorkflowNode | null>(node);

  /*
   * Selection changes reset the panel.
   *
   * Adjusted during render rather than in an effect - React's own recommended
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

  const tokens = useMemo(() => (draft ? requiredTokens(draft) : []), [draft]);
  const bindings = draft ? bindingsOf(draft) : {};
  const unmapped = tokens.filter((token) => !bindings[token]?.path);

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
        <p className="max-w-56 text-sm text-text-muted">
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
  const timed = messaging || meta?.category === "wait";
  const conditions = Array.isArray(draft.config.conditions)
    ? (draft.config.conditions as string[])
    : [];

  const set = (key: string, value: unknown) =>
    setDraft((current) =>
      current ? { ...current, config: { ...current.config, [key]: value } } : current,
    );

  const setBinding = (token: string, patch: Partial<VariableBinding>) =>
    setDraft((current) => {
      if (!current) return current;
      const existing = bindingsOf(current)[token] ?? guessBinding(token);
      const next = { ...existing, ...patch };

      /* The label and the sample follow the path, so a mapping row never shows
         a description belonging to the field it used to point at. */
      const source = VARIABLE_SOURCES.find((item) => item.key === next.source);
      const path = source?.paths.find((item) => item.path === next.path);
      if (source && path) {
        next.label = `${source.label} · ${path.label}`;
        next.sample = path.sample;
      }

      return {
        ...current,
        config: {
          ...current.config,
          variables: { ...bindingsOf(current), [token]: next },
        },
      };
    });

  function save() {
    if (!draft) return;
    onChange({ ...draft, summary: summaryOf(draft.kind, draft.config) });
  }

  function renderField(field: FieldSpec) {
    if (field.when && !field.when(draft!.config)) return null;

    const controlId = `${id}-${field.key}`;
    const value = draft!.config[field.key];

    if (field.type === "select") {
      return (
        <Field key={field.key} label={field.label} htmlFor={controlId} hint={field.hint}>
          <Select
            id={controlId}
            hideLabel={false}
            label={field.label}
            value={String(value ?? "")}
            onChange={(next) => set(field.key, next)}
            options={field.options}
          />
        </Field>
      );
    }

    if (field.type === "textarea") {
      return (
        <Field key={field.key} label={field.label} htmlFor={controlId} hint={field.hint}>
          <Textarea
            id={controlId}
            value={String(value ?? "")}
            onChange={(event) => set(field.key, event.target.value)}
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

    const inputType =
      field.type === "number"
        ? "number"
        : field.type === "date"
          ? "date"
          : field.type === "time"
            ? "time"
            : "text";

    return (
      <Field key={field.key} label={field.label} htmlFor={controlId} hint={field.hint}>
        <Input
          id={controlId}
          type={inputType}
          min={field.type === "number" ? field.min : undefined}
          value={String(value ?? "")}
          onChange={(event) =>
            set(
              field.key,
              field.type === "number" ? Number(event.target.value) : event.target.value,
            )
          }
        />
      </Field>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-start gap-2.5 border-b border-border px-4 py-3">
        <NodeIcon kind={draft.kind} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium  uppercase",
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

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <Section title="Configuration" defaultOpen>
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

          {fields.map(renderField)}
        </Section>

        {draft.branches?.length ? (
          <Section
            title="Branches"
            defaultOpen={draft.kind === "multi_branch"}
            badge={<Badge variant="default">{draft.branches.length}</Badge>}
          >
            <p className="text-sm text-text-muted">
              Paths are taken in order, top to bottom - the first one a contact
              matches wins, so the catch-all belongs last.
            </p>

            <ul className="space-y-2">
              {draft.branches.map((branch, index) => (
                <li key={branch.id} className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-secondary text-xs font-bold text-text-secondary tabular-nums">
                    {index + 1}
                  </span>
                  <Input
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
                  <IconButton
                    label={`Move branch ${index + 1} up`}
                    size="sm"
                    disabled={index === 0}
                    onClick={() =>
                      setDraft((current) => {
                        if (!current?.branches) return current;
                        const next = [...current.branches];
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        return { ...current, branches: next };
                      })
                    }
                  >
                    <ChevronDown className="rotate-180" />
                  </IconButton>
                </li>
              ))}
            </ul>

            {draft.kind === "multi_branch" ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          branches: [
                            ...(current.branches ?? []),
                            {
                              id: `${current.id}-b${(current.branches?.length ?? 0) + 1}`,
                              label: `Branch ${(current.branches?.length ?? 0) + 1}`,
                            },
                          ],
                        }
                      : current,
                  )
                }
              >
                <Plus aria-hidden />
                Add branch
              </Button>
            ) : null}
          </Section>
        ) : null}

        {messaging ? (
          <Section
            title="Variables"
            defaultOpen={unmapped.length > 0}
            badge={
              unmapped.length > 0 ? (
                <Badge variant="error" icon={<AlertTriangle aria-hidden />}>
                  {unmapped.length} unmapped
                </Badge>
              ) : tokens.length > 0 ? (
                <Badge variant="success">{tokens.length} mapped</Badge>
              ) : null
            }
          >
            {tokens.length === 0 ? (
              <p className="text-sm text-text-muted">
                This message has no variables. Choose a template that uses them
                to personalise it.
              </p>
            ) : (
              <>
                <p className="text-sm text-text-muted">
                  Each token is filled per contact when the message is sent.
                  Anything left unmapped blocks publishing - a message that goes
                  out reading “Hi {"{{first_name}}"}” is the worst bug this
                  module can ship.
                </p>

                <ul className="space-y-3">
                  {tokens.map((token) => {
                    const binding = bindings[token] ?? guessBinding(token);
                    const source = VARIABLE_SOURCES.find(
                      (item) => item.key === binding.source,
                    );

                    return (
                      <li
                        key={token}
                        className={cn(
                          "space-y-2 rounded-panel border p-2.5",
                          binding.path ? "border-border" : "border-error/40 bg-error-soft/30",
                        )}
                      >
                        <code className="block font-mono text-sm text-text-secondary">
                          {`{{${token}}}`}
                        </code>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Select
                            label={`Source for ${token}`}
                            size="sm"
                            value={binding.source}
                            onChange={(next) =>
                              setBinding(token, {
                                source: next as VariableBinding["source"],
                                path: "",
                              })
                            }
                            options={VARIABLE_SOURCES.map((item) => ({
                              value: item.key,
                              label: item.label,
                            }))}
                          />
                          <Select
                            label={`Field for ${token}`}
                            size="sm"
                            value={binding.path}
                            placeholder="Choose a field"
                            onChange={(next) => setBinding(token, { path: next })}
                            options={(source?.paths ?? []).map((item) => ({
                              value: item.path,
                              label: item.label,
                              hint: item.sample,
                            }))}
                          />
                        </div>

                        {binding.sample && binding.path ? (
                          <p className="text-sm font-medium text-text-muted">
                            Preview: <span className="text-text-secondary">{binding.sample}</span>
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Section>
        ) : null}

        <Section
          title="Conditions"
          badge={conditions.length > 0 ? <Badge variant="primary">{conditions.length}</Badge> : null}
        >
          <p className="text-sm text-text-muted">
            Contacts who do not match skip this step and carry on to the next
            one. Use it for exceptions, not for branching.
          </p>

          {conditions.length > 0 ? (
            <ul className="space-y-1.5">
              {conditions.map((condition, index) => (
                <li
                  key={`${condition}-${index}`}
                  className="flex items-center gap-2 rounded-btn border border-border bg-surface px-2.5 py-1.5"
                >
                  <Input
                    value={condition}
                    aria-label={`Condition ${index + 1}`}
                    className="h-8 border-0 px-0 shadow-none focus:shadow-none"
                    onChange={(event) =>
                      set(
                        "conditions",
                        conditions.map((item, order) =>
                          order === index ? event.target.value : item,
                        ),
                      )
                    }
                  />
                  <IconButton
                    label={`Remove condition ${index + 1}`}
                    size="sm"
                    onClick={() =>
                      set(
                        "conditions",
                        conditions.filter((_, order) => order !== index),
                      )
                    }
                  >
                    <Trash2 />
                  </IconButton>
                </li>
              ))}
            </ul>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => set("conditions", [...conditions, "Tag is VIP"])}
          >
            <Plus aria-hidden />
            Add Condition
          </Button>
        </Section>

        {timed ? (
          <Section title="Timing">
            <CheckboxField
              id={`${id}-quiet`}
              checked={draft.config.respectQuietHours !== false}
              onCheckedChange={(checked) => set("respectQuietHours", checked)}
              label="Respect the workflow's quiet hours"
              hint="Anything due inside the window is held until it closes."
            />
            <CheckboxField
              id={`${id}-window`}
              checked={Boolean(draft.config.ignoreSendWindow)}
              onCheckedChange={(checked) => set("ignoreSendWindow", checked)}
              label="Send outside the allowed window"
              hint="For transactional steps - an order confirmation should not wait until Monday."
            />
          </Section>
        ) : null}

        {meta?.outputs?.length ? (
          <Section title="Outputs">
            <p className="text-sm text-text-muted">
              Values this step hands to the ones after it. Any later condition
              can read them.
            </p>
            <ul className="space-y-1.5">
              {meta.outputs.map((output) => (
                <li key={output.key} className="rounded-btn bg-surface-secondary px-2.5 py-2">
                  <code className="font-mono text-sm text-text-primary">
                    {output.key}
                  </code>
                  <span className="ml-1.5 text-sm text-text-muted">{output.type}</span>
                  <p className="mt-0.5 text-sm text-text-muted">{output.description}</p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Advanced">
          <CheckboxField
            id={`${id}-retry`}
            checked={draft.config.retryOverride !== false}
            onCheckedChange={(checked) => set("retryOverride", checked)}
            label="Retry this step if it fails"
            hint="Follows the workflow's retry policy unless turned off here."
          />
          <CheckboxField
            id={`${id}-continue`}
            checked={Boolean(draft.config.continueOnFailure)}
            onCheckedChange={(checked) => set("continueOnFailure", checked)}
            label="Continue the journey if this step fails"
            hint="For steps that are nice to have - a tag, an internal notification."
          />

          {link ? (
            <ButtonLink href={link.href} variant="text" size="inline">
              <ExternalLink className="size-3.5" aria-hidden />
              {link.label}
            </ButtonLink>
          ) : null}

          <p className="text-sm text-text-muted">
            Node ID <code className="font-mono text-text-secondary">{draft.id}</code>
          </p>
        </Section>

        {draft.entered !== undefined && draft.entered > 0 ? (
          <p className="flex items-center gap-2 border-t border-border pt-3 text-sm text-text-muted">
            <Badge variant="default">{draft.entered.toLocaleString("en-US")}</Badge>
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
            className="hover:border-error"
          >
            <Trash2 aria-hidden />
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
