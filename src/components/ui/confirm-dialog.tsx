"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { Dialog } from "./dialog";

/**
 * The "are you sure" step, as one component rather than a `Dialog` reassembled
 * at every call site.
 *
 * The confirm label says what will happen ("Delete 3 campaigns") instead of
 * "OK", so a keyboard user who has scrolled past the body still knows what
 * they are agreeing to. Destructive by default — a confirmation this cheap to
 * add is nearly always guarding something irreversible.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  /** Extra detail — what is kept, what is lost. */
  children?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            size="compact"
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? (
        <p className="text-sm text-text-secondary">This cannot be undone.</p>
      )}
    </Dialog>
  );
}
