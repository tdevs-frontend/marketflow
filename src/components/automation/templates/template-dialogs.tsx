"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { TEMPLATE_CATEGORIES, TEMPLATE_COMPLEXITIES } from "@/constants/automation";
import { LIVE_WORKFLOWS } from "@/lib/workflow-fixtures";

/**
 * Turning an existing workflow into a template.
 *
 * That is the only way this should work: a template written from scratch in a
 * dialog would be a second authoring surface for the thing the builder already
 * does. Pick a workflow, name it, and its steps become the template's preview.
 */
export function CreateTemplateDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const id = useId();
  const toast = useToast();

  const [workflowId, setWorkflowId] = useState(LIVE_WORKFLOWS[0]?.id ?? "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(TEMPLATE_CATEGORIES[0].value);
  const [complexity, setComplexity] = useState(TEMPLATE_COMPLEXITIES[0].value);
  const [description, setDescription] = useState("");

  /* Opening resets the form to the first workflow. Adjusted during render,
     which is React's shape for state derived from a prop. */
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const first = LIVE_WORKFLOWS[0];
      setWorkflowId(first?.id ?? "");
      setName(first?.name ?? "");
      setDescription(first?.description ?? "");
    }
  }

  const invalid = name.trim().length === 0 || workflowId === "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create template"
      description="Save an existing workflow so your team can launch it again in one click."
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={invalid}
            onClick={() => {
              onClose();
              toast(`${name.trim()} saved to your template library`, "success");
            }}
          >
            Create template
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Start from"
          htmlFor={`${id}-workflow`}
          hint="The workflow whose steps and settings the template copies."
        >
          <Select
            id={`${id}-workflow`}
            hideLabel={false}
            label="Start from"
            value={workflowId}
            onChange={(next) => {
              setWorkflowId(next);
              const workflow = LIVE_WORKFLOWS.find((item) => item.id === next);
              if (workflow) {
                setName(workflow.name);
                setDescription(workflow.description);
              }
            }}
            options={LIVE_WORKFLOWS.map((workflow) => ({
              value: workflow.id,
              label: workflow.name,
              hint: `${workflow.nodes.length} steps`,
            }))}
          />
        </Field>

        <Field label="Template name" htmlFor={`${id}-name`}>
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field
          label="Description"
          htmlFor={`${id}-description`}
          hint="One line telling a colleague what this journey is for."
        >
          <Textarea
            id={`${id}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor={`${id}-category`}>
            <Select
              id={`${id}-category`}
              hideLabel={false}
              label="Category"
              value={category}
              onChange={(next) => setCategory(next as typeof category)}
              options={TEMPLATE_CATEGORIES}
            />
          </Field>

          <Field label="Complexity" htmlFor={`${id}-complexity`}>
            <Select
              id={`${id}-complexity`}
              hideLabel={false}
              label="Complexity"
              value={complexity}
              onChange={(next) => setComplexity(next as typeof complexity)}
              options={TEMPLATE_COMPLEXITIES}
            />
          </Field>
        </div>

        <p className="rounded-panel bg-surface-secondary px-3.5 py-2.5 text-sm font-medium text-text-muted">
          Message templates and connections are referenced by name, not copied.
          Whoever uses this template picks their own on first run.
        </p>
      </div>
    </Dialog>
  );
}
