import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-field border border-border-strong bg-surface px-3.5 py-3 text-sm leading-none text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-primary focus:shadow-focus-field disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-60";

const INVALID = "border-error focus:border-error focus:shadow-focus-error";

type FieldState = { error?: boolean };

export function Input({
  className,
  error,
  ...props
}: FieldState & ComponentPropsWithRef<"input">) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(FIELD, error && INVALID, className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  error,
  ...props
}: FieldState & ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(FIELD, "min-h-24 resize-y leading-relaxed", error && INVALID, className)}
      {...props}
    />
  );
}

export function Select({
  className,
  error,
  ...props
}: FieldState & ComponentPropsWithRef<"select">) {
  return (
    <select
      aria-invalid={error || undefined}
      className={cn(FIELD, "cursor-pointer", error && INVALID, className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {/* Ids are derived from the control's own, so a caller can point
          `aria-describedby` at the message without threading an id through. */}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
