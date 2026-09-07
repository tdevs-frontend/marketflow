"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  /** Renders the dash state used by a select-all header when a subset is on. */
  indeterminate?: boolean;
}

/**
 * A native checkbox, tinted with `accent-color`.
 *
 * Native rather than a styled span: it keeps keyboard behaviour, form
 * participation and the platform's own focus handling for free. `indeterminate`
 * is a DOM property with no HTML attribute, so it has to be set on the node.
 */
export function Checkbox({ indeterminate, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer accent-primary focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
