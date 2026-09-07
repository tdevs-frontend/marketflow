"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

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
  title,
  description,
  onClose,
}: {
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h2 className="text-base">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-btn text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden />
      </button>
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

/**
 * Right-hand panel for record detail. Full-screen below `sm`, because a 28rem
 * drawer on a phone leaves a useless sliver of background.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: BaseProps) {
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      aria-label={title}
      className={cn(
        BACKDROP,
        "mt-0 mr-0 mb-0 ml-auto hidden h-dvh max-h-dvh w-full max-w-lg flex-col overflow-hidden border-l border-border bg-surface p-0 shadow-float sm:w-120",
      )}
    >
      <Header title={title} description={description} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer ? (
        <div className="border-t border-border px-5 py-4">{footer}</div>
      ) : null}
    </dialog>
  );
}
