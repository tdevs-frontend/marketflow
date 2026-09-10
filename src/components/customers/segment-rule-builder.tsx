"use client";

import { Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import {
  CONDITION_FIELDS,
  CONDITION_OPERATOR_LABELS,
  conditionField,
  countConditions,
  emptyGroup,
  matchContacts,
  type Condition,
  type ConditionField,
  type ConditionOperator,
  type RuleGroup,
} from "@/lib/customer-fixtures";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Ids only need to be unique inside the open builder, so a counter is enough —
 * and unlike a clock read it produces the same value on the server and after
 * hydration. Called from event handlers, never during render.
 */
let seq = 0;
const nextId = (prefix: string) => `${prefix}-${(seq += 1)}`;

/** A fresh condition, with the first operator its field actually supports. */
export function newCondition(field: ConditionField = "tag"): Condition {
  const meta = conditionField(field);
  return {
    id: nextId("c"),
    field,
    operator: meta.operators[0],
    value: meta.input === "select" ? (meta.options?.()[0]?.value ?? "") : "",
  };
}

export const newGroup = (match: RuleGroup["match"] = "any") => ({
  ...emptyGroup(nextId("g"), match),
  conditions: [newCondition()],
});

const MATCH_OPTIONS = [
  { value: "all", label: "ALL" },
  { value: "any", label: "ANY" },
];

/** The value control depends on the field, and some operators need none. */
function ConditionValue({
  condition,
  onChange,
  disabled,
}: {
  condition: Condition;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const meta = conditionField(condition.field);

  if (condition.operator === "is_set" || condition.operator === "is_not_set") {
    if (meta.input !== "select") {
      return (
        <p className="flex h-10 items-center text-xs text-text-muted">
          No value needed
        </p>
      );
    }
  }

  if (meta.input === "select") {
    return (
      <Select
        label={`${meta.label} value`}
        hideLabel
        size="sm"
        value={condition.value}
        onChange={onChange}
        options={meta.options?.() ?? []}
        disabled={disabled}
      />
    );
  }

  if (meta.input === "none") return null;

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type={meta.input === "number" ? "number" : "text"}
        min={meta.input === "number" ? 0 : undefined}
        value={condition.value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${meta.label} value`}
        placeholder={meta.input === "number" ? "0" : "Value"}
        className="h-10"
        disabled={disabled}
      />
      {meta.unit ? (
        <span className="shrink-0 text-xs text-text-muted">{meta.unit}</span>
      ) : null}
    </div>
  );
}

/**
 * One group of conditions, and the groups nested inside it.
 *
 * Recursive, but capped at one level of nesting: "ALL of these and ANY of
 * those" is the shape people actually need, and a tree deeper than that is one
 * nobody can read back later. The cap is enforced by hiding "Add group" rather
 * than by refusing the click, so the limit is visible instead of surprising.
 */
export function RuleGroupEditor({
  rule,
  onChange,
  onRemove,
  depth = 0,
  disabled = false,
}: {
  rule: RuleGroup;
  onChange: (rule: RuleGroup) => void;
  onRemove?: () => void;
  depth?: number;
  disabled?: boolean;
}) {
  const patch = (changes: Partial<RuleGroup>) =>
    onChange({ ...rule, ...changes });

  const setCondition = (id: string, changes: Partial<Condition>) =>
    patch({
      conditions: rule.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...changes } : condition,
      ),
    });

  return (
    <div
      className={cn(
        "rounded-panel border border-border p-3",
        depth > 0 && "border-l-2 border-l-primary bg-surface-secondary",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-text-secondary">
          {depth === 0 ? "Contacts matching" : "and matching"}
        </p>
        <Select
          label={
            depth === 0
              ? "Match all or any condition"
              : "Match all or any in group"
          }
          hideLabel
          size="sm"
          value={rule.match}
          onChange={(next) => patch({ match: next as RuleGroup["match"] })}
          options={MATCH_OPTIONS}
          disabled={disabled}
          className="w-24"
        />
        <p className="text-xs text-text-secondary">of the conditions below</p>

        {onRemove && !disabled ? (
          <Tooltip content="Remove this group">
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove this group"
              className="ml-auto grid size-6 place-items-center rounded-btn text-text-muted transition-colors hover:bg-error-soft hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </Tooltip>
        ) : null}
      </div>

      <ul className="mt-2.5 space-y-2">
        {rule.conditions.map((condition, index) => (
          <li key={condition.id} className="rounded-panel bg-surface p-2.5">
            {/* The connective is a label, not a control: it belongs to the
                group, and a per-row "and/or" is how mixed precedence becomes
                unreadable. */}
            <p className="text-[10px] font-bold tracking-[0.06em] text-text-muted uppercase">
              {index === 0 ? "Where" : rule.match === "all" ? "And" : "Or"}
            </p>

            <div className="mt-1.5 flex flex-wrap items-start gap-2 sm:flex-nowrap">
              <div className="min-w-36 flex-1">
                <Select
                  label={`Condition ${index + 1} field`}
                  hideLabel
                  size="sm"
                  value={condition.field}
                  onChange={(next) => {
                    /* Operators and the value control are field-specific, so a
                       field change resets both rather than leaving "Tag is
                       more than 500" on screen. */
                    const fresh = newCondition(next as ConditionField);
                    setCondition(condition.id, {
                      field: fresh.field,
                      operator: fresh.operator,
                      value: fresh.value,
                    });
                  }}
                  options={CONDITION_FIELDS.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  disabled={disabled}
                />
              </div>

              <div className="min-w-32 flex-1">
                <Select
                  label={`Condition ${index + 1} operator`}
                  hideLabel
                  size="sm"
                  value={condition.operator}
                  onChange={(next) =>
                    setCondition(condition.id, {
                      operator: next as ConditionOperator,
                    })
                  }
                  options={conditionField(condition.field).operators.map(
                    (op) => ({
                      value: op,
                      label: CONDITION_OPERATOR_LABELS[op],
                    }),
                  )}
                  disabled={disabled}
                />
              </div>

              <div className="min-w-32 flex-1">
                <ConditionValue
                  condition={condition}
                  onChange={(value) => setCondition(condition.id, { value })}
                  disabled={disabled}
                />
              </div>

              {disabled ? null : (
                <Tooltip content="Remove condition">
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        conditions: rule.conditions.filter(
                          (item) => item.id !== condition.id,
                        ),
                      })
                    }
                    aria-label={`Remove condition ${index + 1}`}
                    className="mt-1 grid size-8 shrink-0 place-items-center rounded-btn text-text-muted transition-colors hover:bg-error-soft hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </Tooltip>
              )}
            </div>
          </li>
        ))}
      </ul>

      {rule.groups.length ? (
        <div className="mt-2 space-y-2">
          {rule.groups.map((child) => (
            <RuleGroupEditor
              key={child.id}
              rule={child}
              depth={depth + 1}
              disabled={disabled}
              onChange={(next) =>
                patch({
                  groups: rule.groups.map((item) =>
                    item.id === child.id ? next : item,
                  ),
                })
              }
              onRemove={() =>
                patch({
                  groups: rule.groups.filter((item) => item.id !== child.id),
                })
              }
            />
          ))}
        </div>
      ) : null}

      {disabled ? null : (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              patch({ conditions: [...rule.conditions, newCondition()] })
            }
          >
            <Plus className="size-4" />
            Add condition
          </Button>
          {depth === 0 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => patch({ groups: [...rule.groups, newGroup()] })}
            >
              <Plus className="size-4" />
              Add group
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * The live audience count.
 *
 * Evaluated from the rules on every keystroke, against the same contact list
 * the Contacts page shows — so the number here is the number of rows you get
 * when you open the segment, not a separate estimate that can disagree with it.
 */
export function AudiencePreview({
  rule,
  type,
  staticCount,
  className,
}: {
  rule: RuleGroup;
  type: "dynamic" | "static";
  staticCount?: number;
  className?: string;
}) {
  const count =
    type === "static" ? (staticCount ?? 0) : matchContacts(rule).length;
  const total = matchContacts(emptyGroup("preview-all")).length;
  const conditions = countConditions(rule);

  return (
    <div
      className={cn(
        "rounded-panel border border-primary-border bg-primary-subtle px-3.5 py-3",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-primary-dark">
        <Users className="size-3.5" aria-hidden />
        Estimated audience
      </p>
      <p
        className="mt-1.5 text-lg leading-none font-bold text-text-primary tabular-nums"
        aria-live="polite"
      >
        {formatNumber(count)}
        <span className="ml-1.5 text-xs font-medium text-text-muted">
          of {formatNumber(total)} contacts
        </span>
      </p>
      <p className="mt-1.5 text-[11px] text-text-secondary">
        {type === "static"
          ? "A static segment keeps the members it was built with. Nobody is added or removed as they change."
          : conditions === 0
            ? "No conditions yet, so this matches everyone. Add one to narrow it."
            : `${conditions} condition${conditions === 1 ? "" : "s"}. A dynamic segment re-evaluates on every send, so its size moves on its own.`}
      </p>
    </div>
  );
}

/** A rule tree as readable lines, for a details view or a table cell. */
export function describeGroup(rule: RuleGroup): string[] {
  const lines = rule.conditions.map((condition) => {
    const meta = conditionField(condition.field);
    const operator = CONDITION_OPERATOR_LABELS[condition.operator];
    if (
      condition.operator === "is_set" ||
      condition.operator === "is_not_set"
    ) {
      const label =
        meta.options?.().find((item) => item.value === condition.value)
          ?.label ?? condition.value;
      return meta.input === "select"
        ? `${label} ${meta.label.toLowerCase()} ${operator}`
        : `${meta.label} ${operator}`;
    }
    const value =
      meta.options?.().find((item) => item.value === condition.value)?.label ??
      condition.value;
    return `${meta.label} ${operator} ${value}${meta.unit ? ` ${meta.unit}` : ""}`;
  });

  return [
    ...lines,
    ...rule.groups.flatMap((child) =>
      describeGroup(child).map((line) => `↳ ${line}`),
    ),
  ];
}
