"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  AUTOMATION_ROUTES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_COMPLEXITIES,
} from "@/constants/automation";
import { CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { useDebounce } from "@/hooks/useDebounce";
import { AUTOMATION_TEMPLATES, createDraftWorkflow } from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { MarketingChannel } from "@/types/marketing";
import type { AutomationTemplate, TemplateCategory } from "@/types/workflow";
import { TemplateCard } from "./template-card";
import { CreateTemplateDialog } from "./template-dialogs";

/**
 * The template library.
 *
 * Deliberately a different page from Workflows rather than a variation of it:
 * this one is browsed, not managed. So the categories are chips across the top
 * instead of a dropdown — the fastest way to say "show me e-commerce" — and
 * there is no table view, because comparing templates by number is not a
 * question anybody asks.
 */

const ALL = "all";

export function TemplatesWorkspace() {
  const router = useRouter();
  const toast = useToast();

  const [category, setCategory] = useState<TemplateCategory | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [channel, setChannel] = useState(ALL);
  const [complexity, setComplexity] = useState(ALL);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();

    return AUTOMATION_TEMPLATES.filter((template) => {
      if (category !== ALL && template.category !== category) return false;
      if (
        channel !== ALL &&
        !template.channels.includes(channel as MarketingChannel)
      ) {
        return false;
      }
      if (complexity !== ALL && template.complexity !== complexity) return false;
      if (term) {
        const haystack = [
          template.name,
          template.description,
          ...template.bestFor,
          ...template.steps.map((step) => step.title),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [category, channel, complexity, debounced]);

  const activeCount = [channel, complexity].filter((value) => value !== ALL).length;

  function use(template: AutomationTemplate) {
    const workflow = createDraftWorkflow({
      name: template.name,
      description: template.description,
      triggerKey: template.triggerKey,
      triggerLabel: template.steps[0]?.title ?? "Trigger",
      template,
    });

    toast(`${template.name} added as a draft workflow`, "success");
    router.push(AUTOMATION_ROUTES.workflow(workflow.id));
  }

  function reset() {
    setSearch("");
    setChannel(ALL);
    setComplexity(ALL);
    setCategory(ALL);
  }

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const template of AUTOMATION_TEMPLATES) {
      map.set(template.category, (map.get(template.category) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <>
      <PageHeader
        title="Automation Templates"
        description="Launch proven customer journeys without building every workflow from scratch."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Create Template
          </Button>
        }
      />

      {/* Chips rather than tabs: these filter a grid, they do not switch a
          panel, and `role="tablist"` would promise a `tabpanel` that is not
          there. The pressed state is carried by `aria-pressed`. */}
      <div
        role="group"
        aria-label="Template categories"
        className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {[{ value: ALL, label: "All" }, ...TEMPLATE_CATEGORIES].map((item) => {
          const selected = category === item.value;
          const count =
            item.value === ALL ? AUTOMATION_TEMPLATES.length : counts.get(item.value) ?? 0;

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(item.value as TemplateCategory | typeof ALL)}
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
          placeholder="Search automation templates…"
          activeCount={activeCount}
          onReset={reset}
        >
          <Select
            label="Filter by channel"
            size="sm"
            value={channel}
            onChange={setChannel}
            options={[
              { value: ALL, label: "All channels" },
              ...CHANNEL_ORDER.filter((item) => item !== "social").map((item) => ({
                value: item,
                label: CHANNEL_THEME[item].label,
              })),
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by complexity"
            size="sm"
            value={complexity}
            onChange={setComplexity}
            options={[
              { value: ALL, label: "Any complexity" },
              ...TEMPLATE_COMPLEXITIES,
            ]}
            className="lg:w-40"
          />
        </FilterBar>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="No templates found"
              description="Nothing matches this search in the chosen category. Try another category, or start from an empty canvas."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={reset}>
                    Clear filters
                  </Button>
                  <Button size="sm" onClick={() => setCreating(true)}>
                    <Plus aria-hidden />
                    Create Template
                  </Button>
                </div>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((template) => (
                <li key={template.id}>
                  <TemplateCard template={template} onUse={use} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <CreateTemplateDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
