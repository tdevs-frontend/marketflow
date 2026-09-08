"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Signal } from "lucide-react";

import { Field, Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import {
  SMS_SUBSTITUTIONS,
  SMS_VARIABLES,
} from "@/lib/sms-fixtures";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SMS_CONCAT_LIMIT, SMS_SINGLE_LIMIT, countSmsSegments } from "@/types/sms";

/**
 * The SMS message composer.
 *
 * The character counter is the whole point of this component, and it counts
 * what the gateway will *bill*, not what is typed: placeholders are measured
 * expanded to their longest realistic substitution, so a draft that reads
 * 148/160 in the box does not quietly become two billed segments once
 * `{{first_name}}` becomes "Christopher".
 *
 * That is also why the counter shows the segment count and the projected cost
 * next to it — crossing 160 characters does not break anything, it doubles the
 * bill, and the only way to make that visible is to show it.
 */

export interface ComposerState {
  message: string;
  characters: number;
  segments: number;
}

export function SmsComposer({
  value,
  onChange,
  /** Recipients, for the cost projection. Omit to hide it. */
  recipients,
  /** Per-segment rate in USD. */
  ratePerSegment = 0.045,
  label = "Message",
  id = "sms-message",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  recipients?: number;
  ratePerSegment?: number;
  label?: string;
  id?: string;
  className?: string;
}) {
  const [focusedVariable, setFocusedVariable] = useState<string | null>(null);

  /* Two counts: what is typed, and what will be sent once placeholders
     expand. The second is the one that decides the segment count. */
  const typed = value.length;
  const { characters, segments } = useMemo(
    () => countSmsSegments(value, SMS_SUBSTITUTIONS),
    [value],
  );

  const inCurrentSegment =
    segments <= 1 ? characters : characters - (segments - 1) * SMS_CONCAT_LIMIT;
  const segmentCapacity = segments <= 1 ? SMS_SINGLE_LIMIT : SMS_CONCAT_LIMIT;
  const remaining = segments * segmentCapacity - characters;

  const over = segments > 1;
  const near = !over && characters > SMS_SINGLE_LIMIT * 0.85;

  const cost =
    recipients === undefined ? null : recipients * segments * ratePerSegment;

  function insert(name: string) {
    onChange(`${value}${value.endsWith(" ") || value === "" ? "" : " "}{{${name}}}`);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Field
        label={label}
        htmlFor={id}
        hint="Personalisation expands when the message sends. The counter already accounts for it."
      >
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Hi {{first_name}}, your appointment is scheduled for {{appointment_date}}."
          className="min-h-28 font-mono text-[13px]"
        />
      </Field>

      {/* ------------------------------------------------------- The counter */}
      <div className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-lg leading-none font-bold tabular-nums",
                over ? "text-warning-text" : near ? "text-warning-text" : "text-sms",
              )}
            >
              {inCurrentSegment}
            </span>
            <span className="text-sm text-text-muted tabular-nums">
              / {segmentCapacity} characters
            </span>
          </p>

          <p className="flex items-center gap-1.5 text-xs">
            <Signal className="size-3.5 text-text-muted" aria-hidden />
            <span className="font-medium text-text-primary tabular-nums">
              {segments === 0 ? "0" : segments} segment{segments === 1 ? "" : "s"}
            </span>
            <Tooltip
              content={
                over
                  ? `Concatenated messages carry a 7-character header, so each part holds ${SMS_CONCAT_LIMIT} rather than ${SMS_SINGLE_LIMIT}.`
                  : `A single SMS holds ${SMS_SINGLE_LIMIT} characters. Past that it splits and each part is billed.`
              }
            >
              <button
                type="button"
                aria-label="How segments are counted"
                className="grid size-4 place-items-center rounded-full border border-border-strong text-[9px] font-bold text-text-muted transition-colors hover:border-sms hover:text-sms focus-visible:shadow-focus focus-visible:outline-none"
              >
                ?
              </button>
            </Tooltip>
          </p>
        </div>

        {/* The bar fills per segment, so crossing into a second one is a
            visible reset rather than a number quietly ticking past 160. */}
        <div className="mt-2.5 flex gap-1">
          {Array.from({ length: Math.max(segments, 1) }, (_, index) => {
            const filled =
              index < segments - 1
                ? 100
                : segments === 0
                  ? 0
                  : (inCurrentSegment / segmentCapacity) * 100;

            return (
              <div
                key={index}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    over ? "bg-warning" : "bg-sms",
                  )}
                  style={{ width: `${Math.min(filled, 100)}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px]">
          <p className="text-text-muted">
            {typed !== characters ? (
              <>
                {typed} typed, {formatNumber(characters)} after personalisation ·{" "}
              </>
            ) : null}
            {remaining >= 0
              ? `${remaining} left in this segment`
              : "over the segment limit"}
          </p>

          {cost !== null ? (
            <p className="text-text-secondary">
              <span className="font-medium text-text-primary tabular-nums">
                {formatCurrency(cost)}
              </span>{" "}
              projected for {formatNumber(recipients ?? 0)} recipients
            </p>
          ) : null}
        </div>

        {over ? (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-btn bg-warning-soft px-2.5 py-2 text-[11px] text-warning-text">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
            <span>
              This message sends as {segments} parts and is billed {segments} times.
              Trimming {characters - SMS_SINGLE_LIMIT} characters brings it back to
              one.
            </span>
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------- Personalisation */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
          Personalisation
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {SMS_VARIABLES.map((variable) => (
            <li key={variable.name}>
              <button
                type="button"
                onClick={() => insert(variable.name)}
                onPointerEnter={() => setFocusedVariable(variable.name)}
                onPointerLeave={() => setFocusedVariable(null)}
                onFocus={() => setFocusedVariable(variable.name)}
                onBlur={() => setFocusedVariable(null)}
                className="inline-flex items-center gap-1 rounded-btn border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text-secondary transition-colors hover:border-sms hover:bg-sms-soft hover:text-sms-dark focus-visible:shadow-focus focus-visible:outline-none"
              >
                <Plus className="size-3 shrink-0" aria-hidden />
                {`{{${variable.name}}}`}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 min-h-4 text-[11px] text-text-muted">
          {focusedVariable
            ? `Counted as "${SMS_SUBSTITUTIONS[focusedVariable]}" — the longest value on your list.`
            : null}
        </p>
      </div>
    </div>
  );
}

/**
 * The message as a handset would show it, placeholders filled in.
 *
 * Worth the space because the two things people get wrong in an SMS draft are
 * a placeholder that reads as literal braces and an opt-out line they forgot —
 * both obvious the moment the message is shown in a bubble.
 */
export function SmsPreview({
  message,
  senderId = "MARKETFLOW",
  className,
}: {
  message: string;
  senderId?: string;
  className?: string;
}) {
  const resolved = message.replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (match, name: string) => SMS_SUBSTITUTIONS[name] ?? match,
  );

  const { segments } = countSmsSegments(message, SMS_SUBSTITUTIONS);

  return (
    <div className={cn("rounded-panel bg-background p-4", className)}>
      <p className="text-center text-[11px] font-medium text-text-muted">{senderId}</p>

      <div className="mx-auto mt-3 max-w-[17rem]">
        <div className="rounded-2xl rounded-tl-sm bg-surface px-3.5 py-2.5 shadow-btn">
          <p className="text-[13px] leading-relaxed break-words text-text-primary">
            {resolved || (
              <span className="text-text-muted italic">Your message appears here</span>
            )}
          </p>
        </div>

        <p className="mt-1.5 text-[10px] text-text-muted">
          now · {segments === 0 ? "no" : segments} segment{segments === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
