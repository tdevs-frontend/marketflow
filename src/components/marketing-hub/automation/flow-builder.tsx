"use client";

import { useState } from "react";
import { Play, Save, Settings2, Trash2, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { MiniStat } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_THEME } from "@/constants/channels";
import { STEP_PALETTE, countSteps } from "@/lib/automation-fixtures";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AutomationFlow, FlowStep } from "@/types/automation";
import { AddStepSlot, AutomationNode, FlowBranch } from "./automation-node";

/**
 * The automation builder.
 *
 * Three columns: a palette of steps, the flow itself, and an inspector for the
 * selected node. The flow is the middle column and gets the room, because that
 * is the thing being built — a builder that gives equal thirds to its chrome
 * makes the canvas the smallest part of the screen.
 *
 * Selection is the interaction this stub implements end to end; adding and
 * reordering steps report through a toast, since persisting a flow needs the
 * API this module is still waiting on.
 */
export function FlowBuilder({ flow }: { flow: AutomationFlow }) {
  const toast = useToast();
  const [selected, setSelected] = useState<FlowStep | null>(null);
  const [name, setName] = useState(flow.name);
  const [description, setDescription] = useState(flow.description);

  const theme = CHANNEL_THEME[flow.channel];
  const total = countSteps(flow.steps);

  const trigger: FlowStep = {
    id: "trigger",
    type: "trigger",
    title: "Trigger",
    detail: flow.triggerLabel,
    icon: flow.triggerIcon,
    entered: flow.contactsProcessed,
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
      {/* ------------------------------------------------------------ Palette */}
      <Card className="h-max p-4 xl:sticky xl:top-22">
        <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
          Add a step
        </p>

        <div className="mt-3 space-y-4">
          {STEP_PALETTE.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-medium text-text-secondary">{group.group}</p>
              <ul className="mt-1.5 space-y-1">
                {group.items.map((item) => (
                  <li key={item.title}>
                    <button
                      type="button"
                      onClick={() => toast(`${item.title} added to the flow`)}
                      className="flex w-full items-center gap-2.5 rounded-btn px-2 py-2 text-left transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
                        <Icon name={item.icon} className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-text-primary">
                          {item.title}
                        </span>
                        <span className="block truncate text-[11px] text-text-muted">
                          {item.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* ------------------------------------------------------------- Canvas */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-panel",
                theme.soft,
                theme.text,
              )}
            >
              <Workflow className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base">{name}</h2>
              <p className="mt-0.5 text-xs text-text-muted">
                {total} steps · {theme.label} ·{" "}
                {formatNumber(flow.contactsProcessed)} contacts processed
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Test contact pushed through the flow")}
            >
              <Play aria-hidden />
              Test
            </Button>
            <Button size="sm" onClick={() => toast(`${name} saved`)}>
              <Save aria-hidden />
              Save
            </Button>
          </div>
        </div>

        {/* The canvas scrolls on its own so the palette and inspector stay put
            on a long flow. */}
        <div className="mt-5 max-w-3xl">
          <AutomationNode
            step={trigger}
            selected={selected?.id === "trigger"}
            onSelect={setSelected}
          />

          {/* An insertion point immediately after the trigger, which is where a
              step is most often added — the first message people forget. */}
          <AddStepSlot onAdd={() => toast("Pick a step from the palette")} />

          <FlowBranch
            steps={flow.steps}
            selectedId={selected?.id}
            onSelect={setSelected}
          />

          <AddStepSlot onAdd={() => toast("Pick a step from the palette")} />

          <div className="rounded-panel border border-dashed border-border-strong px-4 py-5 text-center">
            <p className="text-xs text-text-muted">
              Contacts that reach the end without hitting a goal leave the flow here.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------- Inspector */}
      <div className="space-y-4 xl:sticky xl:top-22 xl:h-max">
        {selected ? (
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Step settings
              </p>
              <Badge tone="neutral">{selected.type}</Badge>
            </div>

            <div className="mt-3 space-y-3">
              <Field label="Step name" htmlFor="step-title">
                <Input id="step-title" defaultValue={selected.title} />
              </Field>
              <Field
                label="Configuration"
                htmlFor="step-detail"
                hint="What this step does when a contact reaches it."
              >
                <Textarea
                  id="step-detail"
                  defaultValue={selected.detail}
                  className="min-h-20"
                />
              </Field>

              {typeof selected.entered === "number" && selected.entered > 0 ? (
                <MiniStat
                  label="Reached this step"
                  value={formatNumber(selected.entered)}
                  hint={`${formatPercent(
                    (selected.entered / Math.max(flow.contactsProcessed, 1)) * 100,
                  )} of entrants`}
                />
              ) : null}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  Done
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    toast(`${selected.title} removed`, "info");
                    setSelected(null);
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="flex items-start gap-2.5">
              <Settings2 className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
              <p className="text-xs text-text-secondary">
                Select a step on the canvas to configure it, or pick one from the
                palette to add it to the flow.
              </p>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Automation
          </p>

          <div className="mt-3 space-y-3">
            <Field label="Name" htmlFor="flow-name">
              <Input
                id="flow-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="Description" htmlFor="flow-description">
              <Textarea
                id="flow-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-20"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <MiniStat
                label="Processed"
                value={formatNumber(flow.contactsProcessed)}
              />
              <MiniStat label="Success" value={formatPercent(flow.successRate)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
