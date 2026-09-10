"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import {
  TAG_COLORS,
  TAG_COLOR_KEYS,
  type CustomerTag,
  type TagColor,
} from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";

/**
 * Create or rename a tag.
 *
 * The colour is a swatch row, not a colour input. Six choices drawn from the
 * product's own tokens means a tag can never introduce a hue the dashboard
 * does not already use — which is exactly what a free-form picker eventually
 * produces, and why a tag list ends up with two nearly identical greens.
 */
export function TagFormDialog({
  open,
  tag,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Present when renaming; absent when creating. */
  tag: CustomerTag | null;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<TagColor>("indigo");
  const [submitted, setSubmitted] = useState(false);

  /*
   * Load the subject during render rather than in an effect.
   *
   * Keyed on the tag's id — or `"new"` when creating — so opening the dialog
   * for a different tag reloads the fields while a re-render for the same one
   * keeps whatever has been typed. An effect here would paint the previous
   * tag's name for a frame first.
   */
  const subject = open ? (tag?.id ?? "new") : null;
  const [lastSubject, setLastSubject] = useState(subject);
  if (subject !== lastSubject) {
    setLastSubject(subject);
    setName(tag?.name ?? "");
    setDescription(tag?.description ?? "");
    setColor(tag?.color ?? "indigo");
    setSubmitted(false);
  }

  const invalid = name.trim().length === 0;

  function submit() {
    setSubmitted(true);
    if (invalid) return;
    onSaved(name.trim());
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tag ? "Edit tag" : "Create tag"}
      description={
        tag
          ? "Renaming updates the tag everywhere it is used."
          : "Tags apply to both contacts and leads."
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {tag ? "Save changes" : "Create tag"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Tag name"
          htmlFor="tag-name"
          error={submitted && invalid ? "A tag needs a name." : undefined}
        >
          <Input
            id="tag-name"
            value={name}
            error={submitted && invalid}
            onChange={(event) => setName(event.target.value)}
            placeholder="VIP"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="tag-description"
          hint="Optional. What the tag means, so the next person applies it the same way."
        >
          <Input
            id="tag-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Top 5% by lifetime spend"
          />
        </Field>

        <fieldset>
          <legend className="block text-sm font-medium text-text-primary">
            Colour
          </legend>

          <div className="mt-2 flex flex-wrap gap-2">
            {TAG_COLOR_KEYS.map((key) => {
              const selected = key === color;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-btn border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-border text-text-secondary hover:border-border-strong",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 rounded-full", TAG_COLORS[key].dot)}
                  />
                  {TAG_COLORS[key].label}
                  {selected ? <Check className="size-3.5" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Preview, so the swatch choice is judged as the pill it becomes. */}
        <div className="rounded-panel bg-surface-secondary p-3.5">
          <p className="text-[11px] text-text-muted">Preview</p>
          <span
            className={cn(
              "mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-tight font-medium",
              TAG_COLORS[color].pill,
            )}
          >
            {name.trim() || "Tag name"}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
