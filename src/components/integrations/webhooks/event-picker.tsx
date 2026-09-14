"use client";

import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { WEBHOOK_EVENT_GROUPS } from "@/constants/integrations";
import { cn } from "@/lib/utils";
import { CodeText } from "../integration-badges";

/**
 * Which events an endpoint receives.
 *
 * Grouped by the module the event comes from, with a select-all per group. A
 * merchant wiring a CRM wants "all of Contacts and all of Leads" and should not
 * have to tick seven boxes to say so; a merchant wiring a fulfilment bridge
 * wants exactly `order.paid` and should not have to untick twenty-nine.
 *
 * The event key is shown beside the human label because both are needed: the
 * label is what the merchant chooses by, the key is what their handler switches
 * on.
 */
export function EventPicker({
  selected,
  onChange,
  className,
}: {
  selected: string[];
  onChange: (events: string[]) => void;
  className?: string;
}) {
  const chosen = new Set(selected);

  function toggle(key: string, on: boolean) {
    const next = new Set(chosen);
    if (on) next.add(key);
    else next.delete(key);
    onChange([...next]);
  }

  function toggleGroup(keys: string[], on: boolean) {
    const next = new Set(chosen);
    for (const key of keys) {
      if (on) next.add(key);
      else next.delete(key);
    }
    onChange([...next]);
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {WEBHOOK_EVENT_GROUPS.map((group) => {
        const keys = group.events.map((event) => event.key);
        const on = keys.filter((key) => chosen.has(key)).length;
        const all = on === keys.length;

        return (
          <fieldset
            key={group.label}
            className="rounded-panel border border-border p-3.5"
          >
            <legend className="sr-only">{group.label} events</legend>

            <div className="flex items-center gap-2.5">
              <Checkbox
                checked={all}
                indeterminate={on > 0 && !all}
                onCheckedChange={(next) => toggleGroup(keys, next)}
                label={`All ${group.label} events`}
              />
              <Icon name={group.icon} className="size-4 shrink-0 text-text-muted" />
              <span className="flex-1 text-sm font-semibold text-text-primary">
                {group.label}
              </span>
              <span className="shrink-0 text-meta text-text-muted tabular-nums">
                {on}/{keys.length}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 border-t border-border pt-3">
              {group.events.map((event) => (
                <CheckboxField
                  key={event.key}
                  id={`event-${event.key}`}
                  checked={chosen.has(event.key)}
                  onCheckedChange={(next) => toggle(event.key, next)}
                  label={event.label}
                  hint={event.description}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** The chosen events, as a read-only row of keys. */
export function EventKeyList({
  events,
  max,
  className,
}: {
  events: string[];
  /** Truncates to this many, with a "+n more" chip. Omit to show all. */
  max?: number;
  className?: string;
}) {
  const shown = max ? events.slice(0, max) : events;
  const rest = events.length - shown.length;

  return (
    <span className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((event) => (
        <CodeText key={event}>{event}</CodeText>
      ))}
      {rest > 0 ? (
        <span className="text-meta font-medium text-text-muted">+{rest} more</span>
      ) : null}
    </span>
  );
}
