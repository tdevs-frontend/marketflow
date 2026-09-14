"use client";

import { useId, useState } from "react";
import { FileJson, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Workflow } from "@/types/workflow";

/**
 * The two dialogs the workflow list owns.
 *
 * Dialogs, not drawers: each is a short form with a single decision at the end
 * of it, and a modal is the right shape for a step you either finish or
 * abandon. Creating a workflow is not one of those — it is a two-step question
 * with a rule builder in it, so it has a route of its own. Node editing goes to
 * the inspector.
 */

export function RenameWorkflowDialog({
  workflow,
  onClose,
  onRename,
}: {
  workflow: Workflow | null;
  onClose: () => void;
  onRename: (workflow: Workflow, name: string) => void;
}) {
  const id = useId();
  const [name, setName] = useState(workflow?.name ?? "");

  /* The field follows whichever workflow is being renamed. */
  const [lastId, setLastId] = useState(workflow?.id ?? null);
  if ((workflow?.id ?? null) !== lastId) {
    setLastId(workflow?.id ?? null);
    if (workflow) setName(workflow.name);
  }

  return (
    <Dialog
      open={Boolean(workflow)}
      onClose={onClose}
      title="Rename workflow"
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={name.trim().length === 0}
            onClick={() => workflow && onRename(workflow, name.trim())}
          >
            Save name
          </Button>
        </>
      }
    >
      <Field label="Workflow name" htmlFor={`${id}-rename`}>
        <Input
          id={`${id}-rename`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
      </Field>
    </Dialog>
  );
}

/**
 * Import, as a file drop plus a paste box.
 *
 * Two routes because both are real: a workflow exported from another workspace
 * arrives as a file, and one copied out of the docs arrives on the clipboard.
 */
export function ImportWorkflowDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const id = useId();
  const toast = useToast();
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setJson("");
      setFileName(null);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import workflow"
      description="Bring a workflow in from another workspace as a MarketFlow JSON export."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={!fileName && json.trim().length === 0}
            onClick={() => {
              onClose();
              toast("Import runs against the API once it is connected", "info");
            }}
          >
            Import
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label
          htmlFor={`${id}-file`}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-panel border border-dashed border-border-strong bg-surface-secondary px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary-soft/40 focus-within:shadow-focus"
        >
          <Upload className="size-5 text-text-muted" aria-hidden />
          <span className="text-sm font-medium text-text-primary">
            {fileName ?? "Choose a .json export"}
          </span>
          <span className="text-sm text-text-muted">
            Up to 2 MB. Nodes, edges and settings are read; run history is not.
          </span>
          <input
            id={`${id}-file`}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
        </label>

        <Field
          label="Or paste the export"
          htmlFor={`${id}-json`}
          hint="The object from a workflow export — it starts with a nodes array."
        >
          <Textarea
            id={`${id}-json`}
            value={json}
            onChange={(event) => setJson(event.target.value)}
            className="font-mono text-sm"
            rows={5}
          />
        </Field>

        <p className="flex items-start gap-2 text-sm text-text-muted">
          <FileJson className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Imported workflows always arrive as drafts, so nothing sends until you
          have checked the message templates and connections they refer to.
        </p>
      </div>
    </Dialog>
  );
}
