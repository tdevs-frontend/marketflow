"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  Download,
  FlaskConical,
  History,
  Pause,
  Pencil,
  Play,
  Redo2,
  Rocket,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Menu } from "@/components/ui/menu";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { ownerName } from "@/lib/customer-fixtures";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowStatus } from "@/types/workflow";
import { WorkflowStatusBadge } from "../automation-badges";
import { RenameWorkflowDialog } from "../workflow-dialogs";
import { WorkflowBuilder } from "../builder/workflow-builder";
import { TestWorkflowDialog } from "../builder/test-panel";
import { countErrors } from "../builder/workflow-validator";
import { useWorkflowDraft } from "../builder/use-workflow-draft";
import { VersionHistoryDialog } from "./version-history";
import { WorkflowActivity } from "./workflow-activity";
import { WorkflowAnalytics } from "./workflow-analytics";
import { WorkflowSettings } from "./workflow-settings";

/**
 * One workflow, and the four ways of looking at it.
 *
 * The header carries the thing that makes this a professional automation tool
 * rather than a diagram editor: a live workflow and its draft are two
 * different objects. Editing an Active workflow changes the *draft*; the
 * published version keeps running, and the people inside it keep the journey
 * they entered on. Nothing reaches a customer until Publish changes.
 *
 * That is also why Publish is gated on validation rather than on confidence. A
 * workflow with a message node and no template will fail on its first contact,
 * and finding that out from the Activity log is the worst possible way to find
 * it out.
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
  const [publishedVersion, setPublishedVersion] = useState(workflow.publishedVersion);
  /* Unsaved edits and *saved but unpublished* edits are different things: the
     first is lost on reload, the second is a draft version waiting behind the
     live one. The header has to say which. */
  const [savedDraft, setSavedDraft] = useState(workflow.hasDraftChanges);

  const [renaming, setRenaming] = useState(false);
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
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
    const base = AUTOMATION_ROUTES.workflow(workflow.id);
    router.replace(query ? `${base}?${query}` : base, { scroll: false });
  };

  const errors = countErrors(draft.issues);
  const live = status === "active";
  const neverPublished = publishedVersion === 0;
  const pendingChanges = draft.dirty || savedDraft;

  function saveDraftChanges() {
    draft.markSaved();
    setSavedDraft(true);
    setPublishError(null);
    toast(
      neverPublished
        ? "Draft saved"
        : "Draft saved — the published version keeps running",
      "success",
    );
  }

  function publish() {
    if (errors > 0) {
      setPublishError(
        `${errors} ${errors === 1 ? "issue has" : "issues have"} to be fixed before this can go live. Open the validation panel on the canvas to see ${errors === 1 ? "it" : "them"}.`,
      );
      setTab("builder");
      toast("Publish blocked by validation", "error");
      return;
    }

    draft.markSaved();
    setSavedDraft(false);
    setPublishedVersion((version) => version + 1);
    setStatus("active");
    setPublishError(null);
    toast(
      neverPublished
        ? `${name} published — it is live now`
        : `Version ${publishedVersion + 1} published. Contacts already inside finish on v${publishedVersion}.`,
      "success",
    );
  }

  function discard() {
    draft.reset();
    setSavedDraft(false);
    setPublishError(null);
    toast("Draft changes discarded", "info");
  }

  /* One primary action at a time, and it is always the one that changes what
     customers experience. Everything else is outline, ghost or in the menu. */
  const primaryAction =
    pendingChanges || neverPublished ? (
      <Tooltip
        content={
          errors > 0
            ? `${errors} ${errors === 1 ? "issue" : "issues"} to fix first`
            : neverPublished
              ? "Make this workflow live"
              : "Replace the running version with your draft"
        }
      >
        <Button size="compact" onClick={publish}>
          <Rocket aria-hidden />
          {neverPublished ? "Publish" : "Publish changes"}
        </Button>
      </Tooltip>
    ) : live ? (
      <Button variant="outline" size="compact" onClick={() => setConfirmPause(true)}>
        <Pause aria-hidden />
        Pause
      </Button>
    ) : (
      <Button size="compact" onClick={publish}>
        <Play aria-hidden />
        Activate
      </Button>
    );

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

            {publishedVersion > 0 ? (
              <Tooltip content="The version contacts are running on right now">
                <button
                  type="button"
                  onClick={() => setHistory(true)}
                  className="rounded-full focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <Badge tone="neutral">Published v{publishedVersion}</Badge>
                </button>
              </Tooltip>
            ) : null}

            {savedDraft ? (
              <Badge tone="warning">Draft changes</Badge>
            ) : null}

            <span
              className={cn(
                "text-sm",
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

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {tab === "builder" ? (
            <span className="flex items-center gap-1 rounded-btn border border-border bg-surface p-0.5 max-sm:hidden">
              <Tooltip content="Undo">
                <IconButton
                  label="Undo"
                  size="sm"
                  onClick={draft.undo}
                  disabled={!draft.canUndo}
                >
                  <Undo2 />
                </IconButton>
              </Tooltip>
              <Tooltip content="Redo">
                <IconButton
                  label="Redo"
                  size="sm"
                  onClick={draft.redo}
                  disabled={!draft.canRedo}
                >
                  <Redo2 />
                </IconButton>
              </Tooltip>
            </span>
          ) : null}

          {savedDraft || draft.dirty ? (
            <Button variant="ghost" size="compact" onClick={() => setConfirmDiscard(true)}>
              Discard
            </Button>
          ) : null}

          <Button variant="outline" size="compact" onClick={() => setTesting(true)}>
            <FlaskConical aria-hidden />
            {pendingChanges && !neverPublished ? "Test changes" : "Test"}
          </Button>

          <Button
            variant="outline"
            size="compact"
            onClick={saveDraftChanges}
            disabled={!draft.dirty}
          >
            <Save aria-hidden />
            Save draft
          </Button>

          {primaryAction}

          <Menu
            label={`More actions for ${name}`}
            items={[
              {
                label: "Rename",
                icon: <Pencil className="size-4" />,
                onSelect: () => setRenaming(true),
              },
              {
                label: "Version history",
                icon: <History className="size-4" />,
                onSelect: () => setHistory(true),
              },
              {
                label: "Duplicate",
                icon: <Copy className="size-4" />,
                onSelect: () => toast(`${name} duplicated as a draft`, "success"),
              },
              {
                label: "Export as JSON",
                icon: <Download className="size-4" />,
                onSelect: () =>
                  toast("Export runs against the API once connected", "info"),
              },
              {
                label: live ? "Pause workflow" : "Activate workflow",
                icon: live ? <Pause className="size-4" /> : <Play className="size-4" />,
                onSelect: () => (live ? setConfirmPause(true) : setStatus("active")),
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

      {/* The one place the draft/live distinction is spelled out in words.
          A badge alone does not explain why Publish exists. */}
      {savedDraft && !neverPublished ? (
        <div className="flex flex-wrap items-center gap-3 rounded-panel border border-warning/40 bg-warning-soft/40 px-4 py-2.5">
          <p className="min-w-0 flex-1 text-sm text-warning-text">
            <span className="font-medium">Draft changes are not live.</span>{" "}
            {formatCount(workflow.stats.running)} contacts are still running on
            published v{publishedVersion}. Publishing applies your changes to
            everyone who enters from that moment.
          </p>
          <Button size="sm" variant="outline" onClick={() => setTesting(true)}>
            Test changes
          </Button>
        </div>
      ) : null}

      {publishError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-panel border border-error/40 bg-error-soft/50 px-4 py-3"
        >
          <p className="min-w-0 flex-1 text-sm text-error-text">{publishError}</p>
          <Button size="sm" variant="outline" onClick={() => setPublishError(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {/* Page level, so no bleed — same reason as the Settings strip. */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Workflow sections"
        idBase={idBase}
        bleed={false}
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
            workflow={{ ...workflow, name, status, publishedVersion }}
            onArchive={() => {
              setStatus("archived");
              toast(`${name} archived`, "success");
            }}
            onDelete={() => {
              toast(`${name} deleted`, "success");
              router.push(AUTOMATION_ROUTES.workflows);
            }}
            onRestoreVersion={() => {
              setSavedDraft(true);
              setTab("builder");
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

      <VersionHistoryDialog
        open={history}
        onClose={() => setHistory(false)}
        workflow={{ ...workflow, name, publishedVersion }}
        onRestore={() => {
          setSavedDraft(true);
          setHistory(false);
          setTab("builder");
        }}
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
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          discard();
        }}
        title="Discard draft changes?"
        description={
          neverPublished
            ? "Every edit since this draft was created is lost."
            : `The workflow goes back to published v${publishedVersion}.`
        }
        confirmLabel="Discard changes"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          Nothing that is running changes — the published version has been live
          the whole time. Only your unpublished edits are thrown away.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmPause}
        onClose={() => setConfirmPause(false)}
        onConfirm={() => {
          setStatus("paused");
          setConfirmPause(false);
          toast(`${name} paused`, "success");
        }}
        title="Pause this workflow?"
        description={`${formatCount(workflow.stats.running)} contacts are inside this journey right now.`}
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
        description="Its steps, every version and its execution history are removed with it."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
