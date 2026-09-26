"use client";

import { useState } from "react";
import { Check, Copy, Eye, Pause, Play } from "lucide-react";

import { ServiceNotice } from "@/components/settings/service-notice";
import { useClipboard } from "@/components/integrations/credential-field";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
import { FORMS_EMBED_ORIGIN } from "@/constants/forms";
import {
  recordPreviewSubmission,
  setFormStatus,
  useFormState,
} from "@/lib/form-store";
import type { Form } from "@/types/form";
import { FormStatusBadge } from "./form-badges";
import { FormPreview } from "./form-preview";

/**
 * The two dialogs every surface in the module opens: Embed and Preview.
 *
 * Both take a form id rather than a form, and read the record from the store
 * while open - so publishing from inside the Embed dialog updates the badge in
 * the dialog, the row behind it and the detail header in one step.
 */

type Snippet = "script" | "iframe";

/**
 * The snippet, built from `FORMS_EMBED_ORIGIN`.
 *
 * Script is the default: it renders the form inline, inherits the host page's
 * width and reports views. The iframe is the fallback for site builders that
 * strip scripts; it needs a fixed height, estimated from the field count.
 */
export function embedCode(form: Form, kind: Snippet) {
  if (kind === "iframe") {
    const height = 140 + form.fields.length * 84;
    return `<iframe
  src="${FORMS_EMBED_ORIGIN}/f/${form.id}"
  title="${form.name.replace(/"/g, "&quot;")}"
  width="100%"
  height="${height}"
  style="border: 0"
  loading="lazy"
></iframe>`;
  }

  return `<div data-marketflow-form="${form.id}"></div>
<script src="${FORMS_EMBED_ORIGIN}/embed.js" async></script>`;
}

export function FormEmbedDialog({
  formId,
  onClose,
  onPreview,
}: {
  formId: string | null;
  onClose: () => void;
  onPreview: (id: string) => void;
}) {
  const toast = useToast();
  const { forms } = useFormState();
  const form = forms.find((item) => item.id === formId) ?? null;
  const [kind, setKind] = useState<Snippet>("script");
  const { copied, copy } = useClipboard();

  const code = form ? embedCode(form, kind) : "";

  function publish(next: "active" | "paused") {
    if (!form) return;
    setFormStatus(form.id, next);
    toast(
      next === "active" ? `${form.name} is published` : `${form.name} is paused`,
      "success",
    );
  }

  return (
    <Dialog
      open={Boolean(form)}
      onClose={onClose}
      size="lg"
      title="Embed form"
      description={form ? form.name : undefined}
      footer={
        form ? (
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => onPreview(form.id)}
            >
              <Eye aria-hidden />
              Preview
            </Button>
            <Button size="compact" onClick={() => copy(code, "Embed code")}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "Copied" : "Copy embed code"}
            </Button>
          </>
        ) : null
      }
    >
      {form ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border px-3.5 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-medium text-text-secondary">
                Publish status
              </span>
              <FormStatusBadge status={form.status} />
            </div>
            {form.status === "active" ? (
              <Button variant="outline" size="sm" onClick={() => publish("paused")}>
                <Pause aria-hidden />
                Pause form
              </Button>
            ) : (
              <Button size="sm" onClick={() => publish("active")}>
                <Play aria-hidden />
                {form.status === "draft" ? "Publish form" : "Resume form"}
              </Button>
            )}
          </div>

          {form.status !== "active" ? (
            <p className="text-sm font-medium text-text-secondary">
              {form.status === "draft"
                ? "You can copy the code now. The form accepts submissions once it is published."
                : "Pages already carrying this code show a “not accepting responses” notice while the form is paused."}
            </p>
          ) : null}

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-text-secondary">Embed code</p>
              <SegmentedControl
                label="Embed method"
                size="sm"
                value={kind}
                onChange={setKind}
                options={[
                  { value: "script", label: "JavaScript" },
                  { value: "iframe", label: "iFrame" },
                ]}
              />
            </div>
            <pre className="custom-scrollbar overflow-x-auto rounded-panel bg-surface-secondary px-3.5 py-3 font-mono text-sm leading-relaxed text-text-secondary">
              {code}
            </pre>
            <p className="text-sm text-text-muted">
              {kind === "script"
                ? "Paste it where the form should appear. It takes the page's width and reports views for the conversion rate."
                : "For site builders that strip scripts. Views are not counted inside an iframe."}
            </p>
          </div>

          <ServiceNotice tone="unavailable" title="The form host is not connected yet">
            The code is final, but {FORMS_EMBED_ORIGIN.replace("https://", "")} does
            not serve forms in this workspace yet - a page carrying it will render
            nothing until the Forms API is live. Use Preview to try the form, and
            its submissions, in the meantime.
          </ServiceNotice>
        </div>
      ) : null}
    </Dialog>
  );
}

/**
 * The form, filled in for real.
 *
 * A submission made here runs the form's behaviour - match or create the
 * contact, open the lead, apply the tags - and is recorded as a Preview test,
 * so the whole path from form to CRM can be watched before the form goes live.
 */
export function FormPreviewDialog({
  formId,
  onClose,
}: {
  formId: string | null;
  onClose: () => void;
}) {
  const { forms } = useFormState();
  const form = forms.find((item) => item.id === formId) ?? null;
  const [note, setNote] = useState<string | undefined>();

  function submit(values: Parameters<typeof recordPreviewSubmission>[1]) {
    if (!form) return;
    const recorded = recordPreviewSubmission(form.id, values);
    if (!recorded) return;

    setNote(describeOutcome(recorded));
  }

  function describeOutcome(recorded: NonNullable<ReturnType<typeof recordPreviewSubmission>>) {
    if (recorded.status === "awaiting_confirmation") {
      return "Recorded as a preview test. It waits for the double opt-in before a contact is created.";
    }
    if (!recorded.contactId) {
      return "Recorded as a preview test. This form leaves submissions for review, so no contact was created.";
    }
    return recorded.contactCreated
      ? "Recorded as a preview test - a new contact was created for it this session."
      : "Recorded as a preview test - it matched an existing contact, so nobody was duplicated.";
  }

  return (
    <Dialog
      open={Boolean(form)}
      onClose={() => {
        setNote(undefined);
        onClose();
      }}
      size="lg"
      title="Preview form"
      description={
        form
          ? `${form.name} · submissions made here are saved as Preview tests`
          : undefined
      }
    >
      {form ? (
        <FormPreview
          key={form.id}
          fields={form.fields}
          design={form.design}
          behavior={form.behavior}
          onSubmit={submit}
          note={note}
        />
      ) : null}
    </Dialog>
  );
}
