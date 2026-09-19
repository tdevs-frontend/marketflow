"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ServiceResult } from "@/types/account";

/**
 * The four shapes every Settings page is built from.
 *
 * Settings is twenty-odd blocks across six pages, and the thing that makes it
 * read as one module rather than as twenty forms is that they all take the same
 * shape: heading, one line of description, the content, and the action that
 * commits it. Writing that shape once means a new section cannot accidentally
 * introduce a fifth kind of card.
 *
 * Nothing new is drawn here. `Card`, `CardHeader`, `CardBody` and `Button` are
 * the product's own; this composes them at the spacing Settings uses and adds
 * the two things a settings form needs and a card does not — a footer band for
 * the save action, and a save state that can be announced.
 */

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function SettingsSection({
  id,
  title,
  description,
  action,
  footer,
  bodyClassName,
  className,
  children,
}: {
  /**
   * Anchor id, for a page that links between its own sections — Security has
   * two and the page header links to each.
   */
  id?: string;
  title: string;
  description?: ReactNode;
  /** A control that belongs beside the heading rather than below the content. */
  action?: ReactNode;
  /** The commit band. Usually a `SaveBar`. */
  footer?: ReactNode;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    /* A `<section>` around the card rather than an id on the card itself: the
       landmark is what an in-page link should target and what a screen reader
       should be able to jump between, and `scroll-mt` keeps the heading clear
       of the sticky dashboard header when it does. */
    <section id={id} className={cn("scroll-mt-24", className)}>
      <Card>
        <CardHeader title={title} description={description} action={action} />
        <CardBody className={bodyClassName}>{children}</CardBody>
        {footer ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </Card>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One setting inside a divided section: what it is on the left, its controls on
 * the right.
 *
 * The shape the long lists repeat — every notification row, in both the member
 * and the administrator view. It exists because those two were the same eight
 * utility classes written twice, and a row that drifts by a few pixels between
 * two lists of the same thing is the kind of difference everybody sees and
 * nobody can name.
 *
 * Stacks below `sm`, where there is no room for two columns and the controls
 * belong under the label they apply to rather than squeezed beside it.
 *
 * `px-5` matches `CardBody`'s padding, so a section using this passes
 * `bodyClassName="divide-y divide-border p-0"` and the dividing rules run the
 * full width of the card while the text still lines up with every other card.
 */
export function SettingsRow({
  children,
  actions,
  className,
}: {
  /** The label and its description. */
  children: ReactNode;
  /** Checkboxes, badges — whatever the row is set with. */
  actions: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
        {actions}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Read-only detail                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Facts the person cannot change, laid out as a description list.
 *
 * A `<dl>` rather than rows of disabled inputs. A disabled text field says "you
 * could edit this, but not now"; a role granted by an owner and a joined date
 * are not things anybody edits, and dressing them as fields invites a merchant
 * to hunt for the toggle that unlocks them.
 */
export function DetailList({
  items,
  columns = 2,
  className,
}: {
  items: { label: string; value: ReactNode; hint?: string }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : columns === 2
            ? "sm:grid-cols-2"
            : null,
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-meta font-semibold tracking-wide text-text-muted uppercase">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-medium break-words text-text-primary">
            {item.value}
          </dd>
          {item.hint ? (
            <p className="mt-0.5 text-sm text-text-muted">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Save state                                                                 */
/* -------------------------------------------------------------------------- */

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SaveState {
  status: SaveStatus;
  /** Present only while `status` is `error`. */
  message: string | null;
}

const IDLE: SaveState = { status: "idle", message: null };

/**
 * Runs one service call and reports where it got to.
 *
 * Three things this exists to get right, all of which were wrong before.
 *
 * It never reports a success it did not have: `run` takes a function returning
 * a `ServiceResult` and reads the result, so a rejected password change cannot
 * arrive on screen as "Saved".
 *
 * It settles. "Saved" reverts to idle after a few seconds, because a receipt
 * that stays up forever stops being a receipt — the next edit would sit under a
 * tick belonging to the previous one.
 *
 * It does not set state on an unmounted panel. Settings pages are routes now,
 * and a merchant who saves and immediately navigates away would otherwise be
 * the React warning nobody can reproduce.
 */
export function useSaveState(resetAfterMs = 2600) {
  const [state, setState] = useState<SaveState>(IDLE);

  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState(IDLE);
  }, []);

  const run = useCallback(
    async <T,>(
      operation: () => Promise<ServiceResult<T>>,
    ): Promise<T | null> => {
      if (timer.current) clearTimeout(timer.current);
      setState({ status: "saving", message: null });

      const result = await operation();
      if (!alive.current) return result.ok ? result.data : null;

      if (!result.ok) {
        setState({ status: "error", message: result.error.message });
        return null;
      }

      setState({ status: "saved", message: null });
      timer.current = setTimeout(() => {
        if (alive.current) setState(IDLE);
      }, resetAfterMs);

      return result.data;
    },
    [resetAfterMs],
  );

  /** For validation the form can decide locally, without a round trip. */
  const setError = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setState({ status: "error", message });
  }, []);

  return { state, run, reset, setError };
}

/* -------------------------------------------------------------------------- */
/* Save bar                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The commit control, its label, and the outcome beside it.
 *
 * The label is the state — Save changes / Saving… / Saved — because a button
 * that says the same thing throughout leaves the reader checking a spinner in
 * the corner to find out whether anything happened.
 *
 * The outcome is in an `aria-live` region so it is announced rather than merely
 * drawn. That matters most for the failures: somebody who cannot see the red
 * text has otherwise pressed a button and been told nothing at all.
 */
export function SaveBar({
  state,
  onSave,
  onCancel,
  dirty = true,
  disabled = false,
  label = "Save changes",
  savingLabel = "Saving…",
  savedLabel = "Saved",
  variant,
  children,
}: {
  state: SaveState;
  onSave: () => void;
  onCancel?: () => void;
  /** When false the button is inert — there is nothing to commit. */
  dirty?: boolean;
  disabled?: boolean;
  label?: string;
  savingLabel?: string;
  savedLabel?: string;
  variant?: ButtonProps["variant"];
  /** Extra controls, pushed to the far end of the bar. */
  children?: ReactNode;
}) {
  const saving = state.status === "saving";

  return (
    <>
      <Button
        variant={variant}
        onClick={onSave}
        disabled={disabled || saving || !dirty}
        aria-busy={saving || undefined}
      >
        {saving ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : state.status === "saved" ? (
          <Check aria-hidden />
        ) : null}
        {saving ? savingLabel : state.status === "saved" ? savedLabel : label}
      </Button>

      {onCancel && dirty && !saving ? (
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}

      <SaveStatusMessage state={state} />

      {children}
    </>
  );
}

/** The announced half of `SaveBar`, separated for forms that place it inline. */
export function SaveStatusMessage({
  state,
  className,
}: {
  state: SaveState;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-sm font-medium",
        state.status === "error" ? "text-error-text" : "text-text-muted",
        className,
      )}
    >
      {state.status === "error" ? (
        <>
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0">{state.message}</span>
        </>
      ) : null}
    </p>
  );
}
