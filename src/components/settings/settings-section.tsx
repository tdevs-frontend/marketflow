"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ServiceError, ServiceResult } from "@/types/account";

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
 * the two things a settings form needs and a card does not - a footer band for
 * the save action, and a save state that can be announced.
 */

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One settings card, built to the dashboard's card standard.
 *
 * It used to be `Card` + `CardHeader` + `CardBody`: a 14px semibold title in a
 * bordered band, a muted note under it, and a separately padded body below the
 * rule. Every other card in the product - the overview's widgets, the charts,
 * the order table - is a single `p-5` box with a 16/18px heading, a
 * secondary-ink description and the content sixteen pixels under it. Settings
 * was the one module drawing a second kind of card, and it read as a different
 * application the moment somebody moved between Billing and the dashboard.
 *
 * So this now renders exactly what `PanelCard` renders. The geometry is copied
 * rather than the component imported for one reason: a settings card is a
 * `<section>` with an anchor id and `scroll-mt`, because Security links between
 * its own blocks from the page header, and a card cannot be a landmark. Every
 * class below is `PanelCard`'s, in `PanelCard`'s order - if that component's
 * padding or type scale changes, this is the file that has to change with it.
 *
 * Three consequences worth naming, because call sites depend on them:
 *
 *   **The padding moved onto the card.** `p-5` is on the `Card` now, not on the
 *   body. A body that wants to run edge to edge asks for `-mx-5` rather than
 *   `p-0` - same result, opposite direction, and the children keep whatever
 *   padding they already had.
 *
 *   **There is no rule under the heading.** The 16px gap does that work, the
 *   way it does on every dashboard card. A divided list no longer gets a free
 *   top border from the header band.
 *
 *   **The title is an `<h2>`.** Settings pages set their `<h1>` in
 *   `PageHeader`, so the section headings below it are the second level; they
 *   were `<h3>` and skipped one.
 *
 * `description` is `string`, deliberately narrowed from `ReactNode`. It renders
 * inside a `<p>`, which accepts phrasing content only, and the last time this
 * prop took elements a `Skeleton` - a `<div>` - was passed into one and every
 * Settings page logged a hydration error. The type is the fix that cannot be
 * forgotten.
 */
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
   * Anchor id, for a page that links between its own sections - Security has
   * two and the page header links to each.
   */
  id?: string;
  title: string;
  description?: string;
  /** A control that belongs beside the heading rather than below the content. */
  action?: ReactNode;
  /** The commit band. Usually a `SaveBar`. */
  footer?: ReactNode;
  /** Extra classes on the content block. `-mx-5` makes it edge to edge. */
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
      <Card className="flex flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {/* No weight or colour utility: the base layer sets every heading
                to `font-heading`, 700, primary ink, and a `font-semibold` here
                would quietly make Settings a step lighter than the dashboard
                cards it is being matched to. */}
            <h2 className="text-base sm:text-lg">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm font-medium text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        <div className={cn("mt-4 flex-1", bodyClassName)}>{children}</div>

        {footer ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
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
 * The shape the long lists repeat - every notification row, in both the member
 * and the administrator view. It exists because those two were the same eight
 * utility classes written twice, and a row that drifts by a few pixels between
 * two lists of the same thing is the kind of difference everybody sees and
 * nobody can name.
 *
 * Stacks below `sm`, where there is no room for two columns and the controls
 * belong under the label they apply to rather than squeezed beside it.
 *
 * `px-5` matches the card's own padding, so a section using this passes
 * `bodyClassName="-mx-5 divide-y divide-border"` - the body reaches the card's
 * edges, the rules run its full width, and the text still lines up with every
 * other card in the module.
 */
export function SettingsRow({
  children,
  actions,
  className,
}: {
  /** The label and its description. */
  children: ReactNode;
  /** Checkboxes, badges - whatever the row is set with. */
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
          <dt className="text-meta font-semibold text-text-muted capitalize">
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
 * that stays up forever stops being a receipt - the next edit would sit under a
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
 * The label is the state - Save changes / Saving… / Saved - because a button
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
  /** When false the button is inert - there is nothing to commit. */
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

/* -------------------------------------------------------------------------- */
/* Loading a section                                                          */
/* -------------------------------------------------------------------------- */

export type QueryStatus = "loading" | "ready" | "error";

export type QueryState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: ServiceError };

/**
 * The read side of `useSaveState`: fetch once, and be honest about where it
 * got to.
 *
 * `useSaveState` covers a panel that *writes* - a form with a save button.
 * Active Sessions and Sign-in activity are the first panels that *read*, and
 * reading has a state the writing machine does not: the moment before there is
 * anything to show. A section that renders nothing then is a section that looks
 * broken on a slow connection and looks empty on a failed one, which are two
 * different facts wearing the same blank space.
 *
 * Three states, all of them rendered. `loading` is a skeleton shaped like the
 * rows that will replace it. `ready` may still be empty, and empty is a
 * legitimate answer that the caller renders as such. `error` carries the
 * service's own `ServiceError`, code included - which is what lets a caller
 * tell "this failed, try again" apart from `service_unavailable`, where there
 * is nothing to retry and a Try again button would be a loop with a button on
 * it.
 *
 * `load` is expected to be a module-level function, not a closure rebuilt each
 * render; it is held in a ref so that a caller who passes an inline arrow does
 * not re-fetch on every keystroke somewhere else in the tree.
 */
export function useServiceQuery<T>(load: () => Promise<ServiceResult<T>>) {
  const [state, setState] = useState<QueryState<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  const loader = useRef(load);
  const alive = useRef(true);

  useEffect(() => {
    loader.current = load;
  }, [load]);

  /**
   * The fetch itself, which never touches state before it has an answer.
   *
   * That is what keeps the mount path out of a cascading render: the initial
   * state is already `loading`, so setting it again on the way in would be a
   * synchronous setState inside an effect for no change in what is drawn.
   */
  const fetch = useCallback(async () => {
    const result = await loader.current();
    if (!alive.current) return;

    setState(
      result.ok
        ? { status: "ready", data: result.data, error: null }
        : { status: "error", data: null, error: result.error },
    );
  }, []);

  /**
   * A retry, from a button. This one *does* return to `loading` first - a Try
   * again that leaves the error on screen until the second answer arrives
   * looks like a button that did nothing.
   */
  const reload = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    return fetch();
  }, [fetch]);

  useEffect(() => {
    alive.current = true;
    void fetch();

    return () => {
      alive.current = false;
    };
  }, [fetch]);

  /**
   * Amends what is already loaded, without a round trip.
   *
   * For the one case that needs it: a session signed out of should leave the
   * list immediately, and re-fetching to learn that a row the service just
   * removed is gone is a request whose answer is already known.
   */
  const update = useCallback((next: (data: T) => T) => {
    setState((current) =>
      current.status === "ready"
        ? { status: "ready", data: next(current.data), error: null }
        : current,
    );
  }, []);

  return { state, reload, update };
}
