"use client";

import { useId, useState } from "react";
import { Code } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

/**
 * Registering a custom event.
 *
 * Advanced on purpose: the built-in registry covers everything a marketer
 * needs, and this exists for a product raising its own events through the API.
 * So the dialog leads with the event key, validates its shape, and shows the
 * payload schema — the three things an integrator actually has to get right.
 */

const SOURCES = [
  { value: "custom", label: "Custom (your product)" },
  { value: "webhook", label: "Webhook" },
  { value: "api", label: "API" },
];

const KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;

const SAMPLE_SCHEMA = `{
  "contact_id": "string",
  "plan_interest": "string",
  "seats": "number"
}`;

export function CustomTriggerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const id = useId();
  const toast = useToast();

  const [name, setName] = useState("");
  const [eventKey, setEventKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("custom");
  const [schema, setSchema] = useState(SAMPLE_SCHEMA);
  const [touched, setTouched] = useState(false);

  /* Opening clears the form. Adjusted during render, which is React's shape
     for state derived from a prop. */
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName("");
      setEventKey("");
      setKeyTouched(false);
      setDescription("");
      setSource("custom");
      setSchema(SAMPLE_SCHEMA);
      setTouched(false);
    }
  }

  /* The key follows the name until somebody edits it by hand, which is the
     behaviour every slug field should have and almost none do. */
  const setNameAndKey = (value: string) => {
    setName(value);
    if (!keyTouched) setEventKey(slugify(value).replace(/-/g, "_"));
  };

  const keyInvalid = eventKey.length > 0 && !KEY_PATTERN.test(eventKey);
  const invalid = name.trim().length === 0 || eventKey.length === 0 || keyInvalid;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create custom trigger"
      description="Register an event your product raises, so workflows can start from it."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            onClick={() => {
              setTouched(true);
              if (invalid) return;
              onClose();
              toast(`${eventKey} registered — post to it from the API`, "success");
            }}
          >
            Create trigger
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Trigger name"
          htmlFor={`${id}-name`}
          error={touched && name.trim().length === 0 ? "Give the trigger a name." : undefined}
        >
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(event) => setNameAndKey(event.target.value)}
            placeholder="Demo Requested"
            error={touched && name.trim().length === 0}
            autoFocus
          />
        </Field>

        <Field
          label="Event key"
          htmlFor={`${id}-key`}
          hint="Lowercase, dots and underscores only — this is what you POST."
          error={
            keyInvalid
              ? "Use lowercase letters, numbers, underscores and dots, e.g. demo.requested"
              : undefined
          }
        >
          <Input
            id={`${id}-key`}
            value={eventKey}
            onChange={(event) => {
              setKeyTouched(true);
              setEventKey(event.target.value);
            }}
            placeholder="demo_requested"
            className="font-mono text-sm"
            error={keyInvalid}
          />
        </Field>

        <Field
          label="Description"
          htmlFor={`${id}-description`}
          hint="What raises this event, in one line. Your teammates read it in the registry."
        >
          <Textarea
            id={`${id}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Raised when someone books a demo from inside the app."
            rows={2}
          />
        </Field>

        <Field label="Source" htmlFor={`${id}-source`}>
          <Select
            id={`${id}-source`}
            hideLabel={false}
            label="Source"
            value={source}
            onChange={setSource}
            options={SOURCES}
          />
        </Field>

        <Field
          label="Payload schema"
          htmlFor={`${id}-schema`}
          hint="The fields your event sends. Workflows can branch on any of them."
        >
          <Textarea
            id={`${id}-schema`}
            value={schema}
            onChange={(event) => setSchema(event.target.value)}
            className="font-mono text-sm"
            rows={6}
          />
        </Field>

        <p className="flex items-start gap-2 rounded-panel bg-surface-secondary px-3.5 py-2.5 text-sm text-text-muted">
          <Code className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Custom triggers start disabled until the first valid event arrives, so
          a typo in the key cannot silently start a journey.
        </p>
      </div>
    </Dialog>
  );
}
