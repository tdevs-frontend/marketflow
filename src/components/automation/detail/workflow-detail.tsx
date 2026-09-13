"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  Download,
  FlaskConical,
  Pause,
  Pencil,
  Play,
  Rocket,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Menu } from "@/components/ui/menu";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { ownerName } from "@/lib/customer-fixtures";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowStatus } from "@/types/workflow";
import { WorkflowStatusBadge } from "../automation-badges";
import { RenameWorkflowDialog } from "../workflow-dialogs";
import { WorkflowBuilder } from "../builder/workflow-builder";
import { TestWorkflowDialog } from "../builder/test-panel";
import { countErrors } from "../builder/workflow-validator";
import { useWorkflowDraft } from "../builder/use-workflow-draft";
import { WorkflowActivity } from "./workflow-activity";
import { WorkflowAnalytics } from "./workflow-analytics";
import { WorkflowSettings } from "./workflow-settings";

/**
 * One workflow, and the four ways of looking at it.
 *
 * The header stays compact — a back link, the name, the state and the three
 * actions — because the builder underneath needs every pixel of height it can
 * get, and a workflow's identity is already established by the time anybody
 * reaches this screen.
 *
 * Publish is gated on validation rather than on confidence: a workflow with a
 * message node and no template will fail on the first contact, and finding
 * that out from the Activity log is the worst possible way to find it out.
 */

type TabValue = "builder" | "analytics" | "activity" | "settings";

const TABS: TabItem<TabValue>[] = [
  { value: "builder", label: "Builder" },
  { value: "analytics", label: "Analytics" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
];

const isTab = (value: string | null): value is TabValue =>
  TABS.some((tab) => tab.value === value);

export function WorkflowDetail({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const idBase = useId();

  const draft = useWorkflowDraft(workflow);

  const [status, setStatus] = useState<WorkflowStatus>(workflow.status);
  const [name, setName] = useState(workflow.name);
  const [renaming, setRenaming] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const raw = params.get("tab");
  const tab: TabValue = isTab(raw) ? raw : "builder";

  /* The tab lives in the URL so a link can point at Analytics, and Back from a
     run detail returns to the tab it was opened from. `replace`, not `push`:
     four tabs should not fill the history stack. */
  const setTab = (value: TabValue) => {
    const next = new URLSearchParams(params.toString());
    if (value === "builder") next.delete("tab");
    else next.set("tab", value);
    const query = next.toString();
    router.replace(
      query ? `${AUTOMATION_ROUTES.workflow(workflow.id)}?${query}` : AUTOMATION_ROUTES.workflow(workflow.id),
      { scroll: false },
    );
  };

  const errors = countErrors(draft.issues);
  const active = status === "active";

  function save() {
    draft.markSaved();
    setPublishError(null);
    toast("Workflow saved", "success");
  }

  function publish() {
    if (errors > 0) {
      setPublishError(
        `${errors} ${errors === 1 ? "issue has" : "issues have"} to be fixed before this workflow can go live. Open the validation panel on the canvas to see them.`,
      );
      setTab("builder");
      toast("Publish blocked by validation", "error");
      return;
    }

    draft.markSaved();
    setStatus("active");
    setPublishError(null);
    toast(`${name} published — it is live now`, "success");
  }

  return (
    <>
      <Link
        href={AUTOMATION_ROUTES.workflows}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Workflows
      </Link>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">{name}</h1>
            <WorkflowStatusBadge status={status} />
            <span
              className={cn(
                "text-xs",
                draft.dirty ? "font-medium text-warning-text" : "text-text-muted",
              )}
            >
              {draft.dirty ? "Unsaved changes" : "Saved"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-text-secondary">
            {workflow.triggerLabel} · {draft.nodes.length} steps ·{" "}
            {ownerName(workflow.ownerId)} · edited{" "}
            {formatRelativeTime(workflow.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button variant="outline" size="compact" onClick={() => setTesting(true)}>
            <FlaskConical aria-hidden />
            Test
          </Button>

          <Button
            variant="outline"
            size="compact"
            onClick={save}
            disabled={!draft.dirty}
          >
            <Save aria-hidden />
            Save
          </Button>

          {active ? (
            <Button variant="outline" size="compact" onClick={() => setConfirmPause(true)}>
              <Pause aria-hidden />
              Pause Workflow
            </Button>
          ) : (
            <Tooltip
              content={
                errors > 0
                  ? `${errors} ${errors === 1 ? "issue" : "issues"} to fix first`
                  : "Make this workflow live"
              }
            >
              <Button size="compact" onClick={publish}>
                <Rocket aria-hidden />
                Publish
              </Button>
            </Tooltip>
          )}

          <Menu
            label={`More actions for ${name}`}
            items={[
              {
                label: "Rename",
                icon: <Pencil className="size-4" />,
                onSelect: () => setRenaming(true),
              },
              {
                label: "Duplicate",
                icon: <Copy className="size-4" />,
                onSelect: () => toast(`${name} duplicated as a draft`, "success"),
              },
              {
                label: "Export as JSON",
                icon: <Download className="size-4" />,
                onSelect: () => toast("Export runs against the API once connected", "info"),
              },
              {
                label: active ? "Pause workflow" : "Activate workflow",
                icon: active ? <Pause className="size-4" /> : <Play className="size-4" />,
                onSelect: () =>
                  active ? setConfirmPause(true) : setStatus("active"),
              },
              {
                label: "Archive",
                icon: <Trash2 className="size-4" />,
                onSelect: () => setConfirmArchive(true),
              },
              {
                label: "Delete workflow",
                icon: <Trash2 className="size-4" />,
                onSelect: () => setConfirmDelete(true),
                destructive: true,
              },
            ]}
          />
        </div>
      </div>

      {publishError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-panel border border-error/40 bg-error-soft/50 px-4 py-3"
        >
          <p className="min-w-0 flex-1 text-[13px] text-error-text">{publishError}</p>
          <Button size="sm" variant="outline" onClick={() => setPublishError(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Workflow sections"
        idBase={idBase}
      />

      {tab === "builder" ? (
        <TabPanel idBase={idBase} value="builder">
          <WorkflowBuilder draft={draft} />
        </TabPanel>
      ) : null}

      {tab === "analytics" ? (
        <TabPanel idBase={idBase} value="analytics">
          <WorkflowAnalytics workflow={workflow} />
        </TabPanel>
      ) : null}

      {tab === "activity" ? (
        <TabPanel idBase={idBase} value="activity">
          <WorkflowActivity workflow={workflow} />
        </TabPanel>
      ) : null}

      {tab === "settings" ? (
        <TabPanel idBase={idBase} value="settings">
          <WorkflowSettings
            workflow={{ ...workflow, name, status }}
            onArchive={() => {
              setStatus("archived");
              toast(`${name} archived`, "success");
            }}
            onDelete={() => {
              toast(`${name} deleted`, "success");
              router.push(AUTOMATION_ROUTES.workflows);
            }}
          />
        </TabPanel>
      ) : null}

      <TestWorkflowDialog
        open={testing}
        onClose={() => setTesting(false)}
        nodes={draft.nodes}
        edges={draft.edges}
      />

      <RenameWorkflowDialog
        workflow={renaming ? { ...workflow, name } : null}
        onClose={() => setRenaming(false)}
        onRename={(_, next) => {
          setName(next);
          setRenaming(false);
          toast(`Renamed to ${next}`, "success");
        }}
      />

      <ConfirmDialog
        open={confirmPause}
        onClose={() => setConfirmPause(false)}
        onConfirm={() => {
          setStatus("paused");
          setConfirmPause(false);
          toast(`${name} paused`, "success");
        }}
        title="Pause this workflow?"
        description={`${workflow.stats.running.toLocaleString("en-US")} contacts are inside this journey right now.`}
        confirmLabel="Pause workflow"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          Their scheduled actions are held rather than cancelled, and nobody new
          enters until you publish it again.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => {
          setStatus("archived");
          setConfirmArchive(false);
          toast(`${name} archived`, "success");
        }}
        title="Archive this workflow?"
        description="It stops running and leaves the workflow list, but keeps its reporting."
        confirmLabel="Archive"
        tone="primary"
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          toast(`${name} deleted`, "success");
          router.push(AUTOMATION_ROUTES.workflows);
        }}
        title={`Delete ${name}?`}
        description="Its steps, settings and execution history are removed with it."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
