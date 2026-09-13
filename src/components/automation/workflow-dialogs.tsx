"use client";

import { useId, useState } from "react";
import { FileJson, LayoutTemplate, Upload } from "lucide-react";

import { ButtonLink, Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { OWNERS } from "@/lib/customer-fixtures";
import { AUTOMATION_TRIGGERS, createDraftWorkflow } from "@/lib/workflow-fixtures";
import type { Workflow } from "@/types/workflow";

/**
 * The three dialogs the workflow list owns.
 *
 * Dialogs, not drawers: each is a short form with a single decision at the end
 * of it, and a modal is the right shape for a step you either finish or
 * abandon. Node editing — the long, exploratory kind — goes to the inspector
 * instead, which is why there is no "edit workflow" dialog here.
 */

const ACTIVE_TRIGGERS = AUTOMATION_TRIGGERS.filter(
  (trigger) => trigger.status !== "disabled",
);

export function NewWorkflowDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (workflow: Workflow) => void;
}) {
  const id = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerKey, setTriggerKey] = useState(ACTIVE_TRIGGERS[0]?.eventKey ?? "");
  const [ownerId, setOwnerId] = useState(OWNERS[0]?.id ?? "own-1");
  const [touched, setTouched] = useState(false);

  /*
   * Reset on open rather than on close, so the fields do not visibly clear
   * while the dialog is still animating away — and adjusted during render
   * rather than in an effect, which is React's own shape for state derived
   * from a prop and avoids a frame of the previous values.
   */
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName("");
      setDescription("");
      setTriggerKey(ACTIVE_TRIGGERS[0]?.eventKey ?? "");
      setOwnerId(OWNERS[0]?.id ?? "own-1");
      setTouched(false);
    }
  }

  const invalid = name.trim().length === 0;

  function submit() {
    setTouched(true);
    if (invalid) return;

    const trigger = ACTIVE_TRIGGERS.find((item) => item.eventKey === triggerKey);
    onCreate(
      createDraftWorkflow({
        name: name.trim(),
        description:
          description.trim() ||
          `Automated journey starting from ${trigger?.name ?? "an event"}.`,
        triggerKey,
        triggerLabel: trigger?.name ?? "Trigger",
        ownerId,
      }),
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New workflow"
      description="Name it, choose what starts it, and the builder opens on an empty canvas."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" onClick={submit}>
            Create workflow
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Workflow name"
          htmlFor={`${id}-name`}
          error={touched && invalid ? "Give the workflow a name." : undefined}
        >
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Abandoned Checkout Recovery"
            error={touched && invalid}
            autoFocus
          />
        </Field>

        <Field
          label="Description"
          htmlFor={`${id}-description`}
          hint="One line explaining what this journey does. Shown on the workflow card."
        >
          <Textarea
            id={`${id}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Recover abandoned carts using automated WhatsApp and Email follow-ups."
            rows={3}
          />
        </Field>

        <Field
          label="Trigger"
          htmlFor={`${id}-trigger`}
          hint="The event that puts a contact into this workflow. You can change it later."
        >
          <Select
            id={`${id}-trigger`}
            hideLabel={false}
            label="Trigger"
            value={triggerKey}
            onChange={setTriggerKey}
            options={ACTIVE_TRIGGERS.map((trigger) => ({
              value: trigger.eventKey,
              label: trigger.name,
              hint: trigger.eventKey,
            }))}
          />
        </Field>

        <Field label="Owner" htmlFor={`${id}-owner`}>
          <Select
            id={`${id}-owner`}
            hideLabel={false}
            label="Owner"
            value={ownerId}
            onChange={setOwnerId}
            options={OWNERS.map((owner) => ({ value: owner.id, label: owner.name }))}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2 rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
          <LayoutTemplate className="size-4 shrink-0 text-text-muted" aria-hidden />
          <p className="min-w-0 flex-1 text-xs text-text-secondary">
            Starting from a proven journey is usually faster than an empty canvas.
          </p>
          <ButtonLink href={AUTOMATION_ROUTES.templates} variant="ghost" size="sm">
            Browse templates
          </ButtonLink>
        </div>
      </div>
    </Dialog>
  );
}

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
          <span className="text-xs text-text-muted">
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
            placeholder={'{ "name": "Abandoned Checkout Recovery", "nodes": [ … ] }'}
            className="font-mono text-xs"
            rows={5}
          />
        </Field>

        <p className="flex items-start gap-2 text-xs text-text-muted">
          <FileJson className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Imported workflows always arrive as drafts, so nothing sends until you
          have checked the message templates and connections they refer to.
        </p>
      </div>
    </Dialog>
  );
}
