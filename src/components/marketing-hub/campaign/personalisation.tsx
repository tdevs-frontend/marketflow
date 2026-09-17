"use client";

import { useState } from "react";
import { Info, UserSquare2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  MERGE_VARIABLES,
  SOCIAL_VARIABLE_SOURCES,
  VARIABLE_SOURCE_LABEL,
  variablesForChannel,
} from "@/lib/campaign-fixtures";
import { cn } from "@/lib/utils";
import type { VariableSource } from "@/types/marketing";
import { StepSection, WarningNote } from "./shared";
import type { StepProps } from "./types";

/**
 * Merge tags, and what happens when the data behind one is missing.
 *
 * This exists for the fallback column. A campaign that opens "Hi {{first_name}},"
 * and hits four hundred contacts with no first name sends four hundred people
 * their own placeholder, and nobody finds out until the replies arrive. Every
 * tag in the draft is listed whether or not it has a value, and the ones
 * without a fallback are called out rather than sorted to the bottom.
 *
 * It was a wizard step of its own until that slot went to the sender. A
 * fallback is an edit to the message, so it belongs beside the composer that
 * wrote it: asking for the copy on one screen and for what happens when half
 * its data is missing on the next split one decision across two.
 */

export function PersonalisationSection({ draft, set, derived }: StepProps) {
  const [source, setSource] = useState<VariableSource | "all">("all");

  const available = variablesForChannel(draft.channel);
  const sources = [...new Set(available.map((item) => item.source))];
  /* Switching to social drops the contact-shaped sources. A filter left on one
     of them would otherwise survive the switch and show an empty catalogue
     under a control with nothing selected, so it falls back to All. */
  const active = source !== "all" && !sources.includes(source) ? "all" : source;
  const visible =
    active === "all"
      ? available
      : available.filter((item) => item.source === active);

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------- Catalogue */}
      <StepSection
        title="Available variables"
        hint={
          derived.isSocial
            ? "A post has no single recipient, so contact, lead, customer and order variables are not offered here."
            : "Paste one into the message above to personalise it."
        }
      >
        <div className="space-y-3">
          <SegmentedControl
            label="Variable source"
            size="sm"
            value={active}
            onChange={setSource}
            options={[
              { value: "all" as const, label: "All" },
              ...sources.map((item) => ({
                value: item,
                label: VARIABLE_SOURCE_LABEL[item],
              })),
            ]}
            className="max-w-full overflow-x-auto"
          />

          <ul className="grid gap-2 sm:grid-cols-2">
            {visible.map((variable) => (
              <li
                key={variable.name}
                className="flex items-center justify-between gap-3 rounded-panel border border-border px-3 py-2"
              >
                <span className="min-w-0">
                  <code className="rounded-btn bg-primary-soft px-1.5 py-0.5 font-mono text-sm text-primary-dark">
                    {`{{${variable.name}}}`}
                  </code>
                  <span className="mt-1 block truncate text-sm font-medium text-text-muted">
                    {VARIABLE_SOURCE_LABEL[variable.source]} · {variable.sample}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {derived.isSocial ? (
            <p className="flex items-start gap-2 rounded-panel bg-surface-secondary px-3.5 py-2.5 text-sm font-medium text-text-secondary">
              <Info className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
              Contact personalisation applies to channels that deliver to one
              person. If direct messaging arrives on a platform, those variables
              become available for that flow.
            </p>
          ) : null}
        </div>
      </StepSection>

      {/* ------------------------------------------------------- Fallbacks */}
      {derived.mergeTags.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border-strong px-4 py-6 text-center">
          <UserSquare2 className="mx-auto size-6 text-text-muted" aria-hidden />
          <p className="mt-2 text-sm font-medium text-text-primary">
            No merge tags in this message
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Add one above — a message that opens with the recipient&apos;s first
            name reads noticeably better than one that does not. Or send it as it
            is.
          </p>
        </div>
      ) : (
        <StepSection
          title="Fallback values"
          hint="Used for contacts with no value for a tag. Without one, the raw {{tag}} is sent as written."
        >
          <ul className="space-y-3">
            {derived.mergeTags.map((tag) => {
              const covered = !derived.missingFallbacks.includes(tag);
              const known = MERGE_VARIABLES.find((item) => item.name === tag);
              const unsupported =
                derived.isSocial &&
                known &&
                !SOCIAL_VARIABLE_SOURCES.includes(known.source);

              return (
                <li
                  key={tag}
                  className={cn(
                    "grid gap-2 rounded-panel border px-3.5 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center",
                    unsupported ? "border-error/30 bg-error-soft/30" : "border-border",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-btn bg-primary-soft px-1.5 py-0.5 font-mono text-sm text-primary-dark">
                      {`{{${tag}}}`}
                    </code>
                    {unsupported ? (
                      <span className="text-sm font-medium tracking-[0.06em] text-error-text uppercase">
                        Not on social
                      </span>
                    ) : covered ? null : (
                      <span className="text-sm font-medium tracking-[0.06em] text-warning-text uppercase">
                        No fallback
                      </span>
                    )}
                  </div>

                  <Input
                    size="sm"
                    value={draft.fallbacks[tag] ?? ""}
                    placeholder={known ? `e.g. ${known.sample}` : "Fallback value"}
                    onChange={(event) =>
                      set("fallbacks", {
                        ...draft.fallbacks,
                        [tag]: event.target.value,
                      })
                    }
                    aria-label={`Fallback for ${tag}`}
                  />
                </li>
              );
            })}
          </ul>

          {derived.missingFallbacks.length > 0 ? (
            <WarningNote>
              {derived.missingFallbacks.length} tag
              {derived.missingFallbacks.length === 1 ? " has" : "s have"} no
              fallback. Any contact missing that field receives the tag literally
              — set a fallback here, or write one inline as{" "}
              <code className="font-mono">{"{{first_name | Customer}}"}</code>.
            </WarningNote>
          ) : null}
        </StepSection>
      )}
    </div>
  );
}
