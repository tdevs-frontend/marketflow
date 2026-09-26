"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Rendered in a divided bar at the bottom. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Both surfaces are a native `<dialog>` opened with `showModal()`, which gives
 * the focus trap, Escape handling, inert background and `::backdrop` for free
 * rather than reimplementing them. The element stays mounted so the browser
 * keeps ownership of open state; only the contents are conditional.
 */
function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    /* Fires for Escape too, so React state never drifts from the DOM. */
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  /** A click landing on the dialog itself is a click on the backdrop. */
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose();
  };

  return { ref, onBackdropClick };
}

function Header({
  titleId,
  title,
  description,
  onClose,
}: {
  titleId?: string;
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h2 id={titleId} className="text-base sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary font-medium">{description}</p>
        ) : null}
      </div>
      <IconButton
        onClick={onClose}
        label="Close"
        size="sm"
        variant="quiet"
        className="-mt-1 -mr-1 shrink-0"
      >
        <X className="size-4" aria-hidden />
      </IconButton>
    </div>
  );
}

const BACKDROP =
  "backdrop:bg-text-primary/45 open:flex focus-visible:outline-none";

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
}: BaseProps & { size?: "md" | "lg" }) {
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-label={title}
      className={cn(
        BACKDROP,
        "m-auto hidden max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-card border border-border bg-surface p-0 shadow-float",
        size === "lg" ? "max-w-3xl" : "max-w-lg",
      )}
    >
      <Header title={title} description={description} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border px-5 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

/*
 * Background scroll lock for the drawer.
 *
 * `showModal()` makes the page inert but does not stop it scrolling - a wheel
 * over the backdrop still chains to the document - so the root is locked while
 * a drawer is up. Counted, so a drawer opening a dialog opening another drawer
 * unlocks only when the last one closes. The hidden scrollbar's width goes
 * back on as padding, so the page does not jump sideways - and only when there
 * was a scrollbar, so overlay scrollbars add nothing. Padding rather than
 * `scrollbar-gutter: stable`, which also narrows the box fixed and top-layer
 * elements lay out in and would leave a strip between drawer and window edge.
 */
let scrollLocks = 0;
let restoreScroll: (() => void) | null = null;

function lockScroll() {
  scrollLocks += 1;
  if (scrollLocks > 1) return;

  const root = document.documentElement;
  const { overflow, paddingRight } = root.style;
  const scrollbar = window.innerWidth - root.clientWidth;

  root.style.overflow = "hidden";
  if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;

  restoreScroll = () => {
    root.style.overflow = overflow;
    root.style.paddingRight = paddingRight;
  };
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) {
    restoreScroll?.();
    restoreScroll = null;
  }
}

/** Matches `duration-300` below; the fallback if `transitionend` never comes. */
const DRAWER_EXIT_MS = 300;

interface DrawerContent {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Right-hand panel for record detail - the one slide-over the dashboard has.
 * Full-screen below `sm`, because a narrow drawer on a phone leaves a useless
 * sliver of background.
 *
 * Still a native `<dialog>` under `showModal()`, so the focus trap, inert
 * page, top layer and focus return on close are the browser's. What this adds
 * is motion: the panel slides in from the right edge (ease-out) and back out
 * (ease-in) while the backdrop fades, both over 300ms.
 *
 * The exit is why the open state is not simply `open`. A `<dialog>` leaves
 * the top layer the instant `close()` runs, so the panel is kept open with
 * `data-state="closed"` until its slide finishes, and only then closed. Escape
 * goes through the same path - its `cancel` is intercepted and turned into
 * `onClose` - so every way out animates. (CSS alone cannot do this: exit
 * animations out of the top layer need `overlay`, which Firefox lacks.)
 *
 * Callers pass `open={Boolean(record)}` and render from `record`, so on close
 * the content they hand over is already empty. The drawer keeps showing what
 * it last showed open until the slide-out ends, so it leaves with its content
 * rather than as a blank panel.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: BaseProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const live: DrawerContent = { title, description, footer, children };
  const [snapshot, setSnapshot] = useState<DrawerContent | null>(null);
  if (
    open &&
    (snapshot?.title !== title ||
      snapshot.description !== description ||
      snapshot.footer !== footer ||
      snapshot.children !== children)
  ) {
    setSnapshot(live);
  }
  const content = !open && snapshot ? snapshot : live;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        /* Commit the off-screen start so the next state change transitions. */
        void dialog.offsetWidth;
      }
      dialog.dataset.state = "open";
      lockScroll();
      return unlockScroll;
    }

    if (!dialog.open) return;
    dialog.dataset.state = "closed";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      dialog.close();
      return;
    }

    const finish = () => dialog.close();
    const onEnd = (event: TransitionEvent) => {
      if (event.target === dialog && event.propertyName === "translate") finish();
    };
    const timer = window.setTimeout(finish, DRAWER_EXIT_MS + 100);
    dialog.addEventListener("transitionend", onEnd);

    /* Reopened mid-exit: drop the pending close and let the open path run. */
    return () => {
      window.clearTimeout(timer);
      dialog.removeEventListener("transitionend", onEnd);
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    /* Escape: animate out through the caller rather than vanishing. */
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    /* Fires once the slide-out is done - or straight away, if the browser
       refused to let `cancel` be prevented - so state never drifts. */
    const handleClose = () => {
      setSnapshot(null);
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  /** A click landing on the dialog itself is a click on the backdrop. */
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-labelledby={titleId}
      className={cn(
        BACKDROP,
        "mt-0 mr-0 mb-0 ml-auto hidden h-dvh max-h-dvh w-full max-w-none flex-col overflow-hidden border-l border-border bg-surface p-0 shadow-float sm:w-104 lg:w-112",
        /* The slide. Off-screen right until `data-state="open"`. */
        "translate-x-full transition-[translate] duration-300 ease-in data-[state=open]:translate-x-0 data-[state=open]:ease-out",
        /* The backdrop fades on the same clock. */
        "backdrop:opacity-0 backdrop:transition-[opacity] backdrop:duration-300 data-[state=open]:backdrop:opacity-100",
        "motion-reduce:transition-none motion-reduce:backdrop:transition-none",
      )}
    >
      <Header
        titleId={titleId}
        title={content.title}
        description={content.description}
        onClose={onClose}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {content.children}
      </div>
      {content.footer ? (
        <div className="border-t border-border px-5 py-4">{content.footer}</div>
      ) : null}
    </dialog>
  );
}
