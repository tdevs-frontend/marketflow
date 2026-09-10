"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CONTACTS,
  CUSTOMER_TAGS,
  LEAD_SOURCES,
  OWNERS,
  PIPELINES,
  PIPELINE_STAGES,
  contactName,
} from "@/lib/customer-fixtures";
import type { LeadSource, LeadStage } from "@/types/lead";
import { cn } from "@/lib/utils";
import { TagDot } from "./customer-badges";

/**
 * Create a lead.
 *
 * A deal has to belong to somebody, so the first field is the contact — either
 * an existing one or a name to create alongside the lead. That choice is a
 * segmented pair rather than a clever combobox that does both: "search or
 * type a new name" is the control everyone gets wrong, and the two modes have
 * genuinely different required fields.
 *
 * Validation runs on submit and the dialog stays open on failure.
 */
export function NewLeadDialog({
  open,
  onClose,
  onCreated,
  defaultStage = "new",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (title: string) => void;
  defaultStage?: LeadStage;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [contactId, setContactId] = useState("");
  const [newName, setNewName] = useState("");
  const [title, setTitle] = useState("");
  const [pipeline, setPipeline] = useState(PIPELINES[0].id);
  const [stage, setStage] = useState<LeadStage>(defaultStage);
  const [value, setValue] = useState("");
  const [owner, setOwner] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [source, setSource] = useState<LeadSource>("manual");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /* Reset on open, during render — see `ContactFormDialog` for why not an
     effect. `defaultStage` lets the column's own "+" preselect its stage. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode("existing");
      setContactId("");
      setNewName("");
      setTitle("");
      setPipeline(PIPELINES[0].id);
      setStage(defaultStage);
      setValue("");
      setOwner("");
      setCloseDate("");
      setSource("manual");
      setTags([]);
      setNotes("");
      setSubmitted(false);
    }
  }

  const errors = {
    contact:
      mode === "existing"
        ? contactId
          ? null
          : "Choose the contact this deal belongs to."
        : newName.trim()
          ? null
          : "Enter a name for the new contact.",
    title: title.trim() ? null : "Give the deal a title.",
    value:
      value.trim() === "" || Number(value) >= 0
        ? null
        : "Value cannot be negative.",
  };

  const invalid = Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) =>
    submitted ? (errors[key] ?? undefined) : undefined;

  function submit() {
    setSubmitted(true);
    if (invalid) return;
    onCreated(title.trim());
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="New lead"
      description="Deals sit on a pipeline and always belong to a contact."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Create lead</Button>
        </>
      }
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="block text-sm font-medium text-text-primary">
            Contact
          </legend>

          <div className="mt-2 inline-flex rounded-btn bg-surface-secondary p-0.5">
            {(
              [
                ["existing", "Existing contact"],
                ["new", "Create new"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                className={cn(
                  "rounded-btn px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                  mode === key
                    ? "bg-surface text-primary shadow-btn"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {mode === "existing" ? (
              <Field
                label="Contact"
                htmlFor="lead-contact"
                error={show("contact")}
              >
                <Select
                  id="lead-contact"
                  hideLabel
                  label="Contact"
                  value={contactId || "none"}
                  error={Boolean(show("contact"))}
                  onChange={(next) => setContactId(next === "none" ? "" : next)}
                  options={[
                    { value: "none", label: "Choose a contact…" },
                    ...CONTACTS.map((item) => ({
                      value: item.id,
                      label: item.company
                        ? `${contactName(item)} — ${item.company}`
                        : contactName(item),
                    })),
                  ]}
                />
              </Field>
            ) : (
              <Field
                label="New contact name"
                htmlFor="lead-new-contact"
                error={show("contact")}
                hint="A contact is created with the lead and can be completed later."
              >
                <Input
                  id="lead-new-contact"
                  value={newName}
                  error={Boolean(show("contact"))}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Amina Rahman"
                />
              </Field>
            )}
          </div>
        </fieldset>

        <Field label="Deal title" htmlFor="lead-title" error={show("title")}>
          <Input
            id="lead-title"
            value={title}
            error={Boolean(show("title"))}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Bright Retail — 3 locations"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pipeline" htmlFor="lead-pipeline">
            <Select
              id="lead-pipeline"
              hideLabel
              label="Pipeline"
              value={pipeline}
              onChange={setPipeline}
              options={PIPELINES.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Field>

          <Field label="Stage" htmlFor="lead-stage">
            <Select
              id="lead-stage"
              hideLabel
              label="Stage"
              value={stage}
              onChange={(next) => setStage(next as LeadStage)}
              options={PIPELINE_STAGES.map((item) => ({
                value: item.stage,
                label: item.label,
              }))}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Value (USD)" htmlFor="lead-value" error={show("value")}>
            <Input
              id="lead-value"
              type="number"
              min={0}
              value={value}
              error={Boolean(show("value"))}
              onChange={(event) => setValue(event.target.value)}
              placeholder="2400"
            />
          </Field>

          <Field label="Owner" htmlFor="lead-owner">
            <Select
              id="lead-owner"
              hideLabel
              label="Owner"
              value={owner || "none"}
              onChange={(next) => setOwner(next === "none" ? "" : next)}
              options={[
                { value: "none", label: "Unassigned" },
                ...OWNERS.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </Field>

          <Field label="Expected close" htmlFor="lead-close">
            <Input
              id="lead-close"
              type="date"
              value={closeDate}
              onChange={(event) => setCloseDate(event.target.value)}
            />
          </Field>
        </div>

        <Field label="Source" htmlFor="lead-source">
          <Select
            id="lead-source"
            hideLabel
            label="Source"
            value={source}
            onChange={(next) => setSource(next as LeadSource)}
            options={LEAD_SOURCES}
          />
        </Field>

        <Field label="Tags" htmlFor="lead-tags">
          <div id="lead-tags" className="flex flex-wrap gap-1.5">
            {CUSTOMER_TAGS.map((tag) => {
              const picked = tags.includes(tag.name);

              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={picked}
                  onClick={() =>
                    setTags((prev) =>
                      picked
                        ? prev.filter((name) => name !== tag.name)
                        : [...prev, tag.name],
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    picked
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-border text-text-secondary hover:border-border-strong",
                  )}
                >
                  <TagDot color={tag.color} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Notes" htmlFor="lead-notes">
          <Textarea
            id="lead-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What was discussed, and what happens next."
          />
        </Field>
      </div>
    </Dialog>
  );
}
