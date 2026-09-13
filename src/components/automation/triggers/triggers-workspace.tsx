"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Activity, Plug, Plus, Zap } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  AUTOMATION_ROUTES,
  TRIGGER_CATEGORIES,
  triggerCategoryLabel,
} from "@/constants/automation";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCount } from "@/lib/format";
import {
  AUTOMATION_TRIGGERS,
  createDraftWorkflow,
  triggerTotals,
} from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { AutomationTrigger, TriggerCategory, TriggerStatus } from "@/types/workflow";
import { CustomTriggerDialog } from "./trigger-dialogs";
import { TriggerTable } from "./trigger-table";

/**
 * The event registry.
 *
 * This page is not another builder and must not read like one: it answers what
 * *can* start a workflow, what is actually firing, and what a payload looks
 * like. So it opens on traffic figures, groups by the system the event comes
 * from, and its primary action creates an event rather than a journey.
 */

const ALL = "all";

function kpis(): Kpi[] {
  const totals = triggerTotals();

  return [
    {
      label: "Available triggers",
      value: formatCount(totals.available),
      icon: Zap,
      tone: "brand",
      hint: "Across seven event sources",
    },
    {
      label: "Active in workflows",
      value: formatCount(totals.inUse),
      icon: Plug,
      hint: "Listened to by at least one workflow",
    },
    {
      label: "Events today",
      value: formatCount(totals.eventsToday),
      icon: Activity,
      tone: "success",
    },
    {
      label: "Failed events",
      value: formatCount(totals.failed),
      icon: AlertTriangle,
      tone: totals.failed > 0 ? "warning" : "neutral",
      hint: totals.failed > 0 ? "Delivery or payload errors" : "Nothing failing",
    },
  ];
}

export function TriggersWorkspace() {
  const router = useRouter();
  const toast = useToast();

  const [category, setCategory] = useState<TriggerCategory | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [status, setStatus] = useState(ALL);
  const [usage, setUsage] = useState(ALL);
  const [creating, setCreating] = useState(false);
  const [disabled, setDisabled] = useState<Record<string, TriggerStatus>>({});
  const [confirmDisable, setConfirmDisable] = useState<AutomationTrigger | null>(null);

  const triggers = useMemo(
    () =>
      AUTOMATION_TRIGGERS.map((trigger) => ({
        ...trigger,
        status: disabled[trigger.id] ?? trigger.status,
      })),
    [disabled],
  );

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();

    return triggers.filter((trigger) => {
      if (category !== ALL && trigger.category !== category) return false;
      if (status !== ALL && trigger.status !== status) return false;
      if (usage === "used" && trigger.workflowIds.length === 0) return false;
      if (usage === "unused" && trigger.workflowIds.length > 0) return false;
      if (term) {
        const haystack = [trigger.name, trigger.eventKey, trigger.description, trigger.source]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [category, debounced, status, triggers, usage]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const trigger of triggers) {
      map.set(trigger.category, (map.get(trigger.category) ?? 0) + 1);
    }
    return map;
  }, [triggers]);

  /* Grouped while the reader is browsing all of them, flat once they have
     narrowed it down — a single section with its own heading above it is a
     heading that says nothing. */
  const groups =
    category === ALL
      ? TRIGGER_CATEGORIES.map((item) => ({
          ...item,
          triggers: filtered.filter((trigger) => trigger.category === item.value),
        })).filter((group) => group.triggers.length > 0)
      : null;

  const activeCount = [status, usage].filter((value) => value !== ALL).length;

  function reset() {
    setSearch("");
    setStatus(ALL);
    setUsage(ALL);
    setCategory(ALL);
  }

  function createWorkflow(trigger: AutomationTrigger) {
    const workflow = createDraftWorkflow({
      name: `${trigger.name} workflow`,
      description: `Automated journey starting from ${trigger.name.toLowerCase()}.`,
      triggerKey: trigger.eventKey,
      triggerLabel: trigger.name,
    });

    toast(`Draft created from ${trigger.name}`, "success");
    router.push(AUTOMATION_ROUTES.workflow(workflow.id));
  }

  function toggle(trigger: AutomationTrigger) {
    if (trigger.status !== "disabled") {
      setConfirmDisable(trigger);
      return;
    }
    setDisabled((map) => ({ ...map, [trigger.id]: "active" }));
    toast(`${trigger.name} enabled`, "success");
  }

  return (
    <>
      <PageHeader
        title="Automation Triggers"
        description="Manage the customer and business events that can start automated workflows."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Create Trigger
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <div
        role="group"
        aria-label="Trigger categories"
        className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {[{ value: ALL, label: "All" }, ...TRIGGER_CATEGORIES].map((item) => {
          const selected = category === item.value;
          const count =
            item.value === ALL ? triggers.length : counts.get(item.value) ?? 0;

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(item.value as TriggerCategory | typeof ALL)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                selected
                  ? "border-primary bg-primary-soft text-primary-dark"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  selected ? "text-primary/70" : "text-text-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search triggers or event keys…"
          activeCount={activeCount}
          onReset={reset}
        >
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { value: ALL, label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "beta", label: "Beta" },
              { value: "disabled", label: "Disabled" },
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by usage"
            size="sm"
            value={usage}
            onChange={setUsage}
            options={[
              { value: ALL, label: "Any usage" },
              { value: "used", label: "Used by a workflow" },
              { value: "unused", label: "Not used yet" },
            ]}
            className="lg:w-48"
          />
        </FilterBar>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="No triggers found"
              description="Nothing matches this search. Clear the filters, or register a custom event your product raises."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={reset}>
                    Clear filters
                  </Button>
                  <Button size="sm" onClick={() => setCreating(true)}>
                    <Plus aria-hidden />
                    Create Trigger
                  </Button>
                </div>
              }
            />
          ) : groups ? (
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.value}>
                  <div className="mb-3">
                    <h2 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                      {group.label}
                    </h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {group.description}
                    </p>
                  </div>
                  <TriggerTable
                    triggers={group.triggers}
                    onToggle={toggle}
                    onCreateWorkflow={createWorkflow}
                  />
                </section>
              ))}
            </div>
          ) : (
            <>
              <h2 className="mb-3 text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                {triggerCategoryLabel(category as TriggerCategory)}
              </h2>
              <TriggerTable
                triggers={filtered}
                onToggle={toggle}
                onCreateWorkflow={createWorkflow}
              />
            </>
          )}
        </div>
      </Card>

      <CustomTriggerDialog open={creating} onClose={() => setCreating(false)} />

      <ConfirmDialog
        open={Boolean(confirmDisable)}
        onClose={() => setConfirmDisable(null)}
        onConfirm={() => {
          if (!confirmDisable) return;
          setDisabled((map) => ({ ...map, [confirmDisable.id]: "disabled" }));
          toast(`${confirmDisable.name} disabled`, "success");
          setConfirmDisable(null);
        }}
        title="Disable this trigger?"
        description={
          confirmDisable
            ? `${confirmDisable.workflowIds.length} workflow${
                confirmDisable.workflowIds.length === 1 ? "" : "s"
              } listen to ${confirmDisable.eventKey}.`
            : undefined
        }
        confirmLabel="Disable trigger"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          The event keeps being raised, but no workflow starts from it. Anyone
          already inside a journey carries on — this only closes the door.
        </p>
      </ConfirmDialog>
    </>
  );
}
