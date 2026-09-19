import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The control height scale, shared by every field that sits on a form row.
 *
 * It is a real scale rather than three loose numbers: `sm` is the filter and
 * toolbar height, `md` is the dashboard form default, and `lg` is for the
 * pages where a form *is* the page — auth, onboarding, landing. Before this
 * existed the same three heights were spelled out as `className="h-10"`,
 * `"h-11"` and `"h-12"` at forty-odd call sites, which is how a scale drifts:
 * nothing named it, so nothing kept it honest.
 *
 * `Select` imports `InputSize` rather than declaring its own, so a filter row
 * built from a search box and four dropdowns has one vocabulary and one set of
 * heights.
 */
export type InputSize = "sm" | "md" | "lg";

/*
 * `sm` carries its own ink as well as its metrics. It is the filter and
 * toolbar tier, where the control annotates a table rather than collecting a
 * value — medium on the secondary ink sits it a step back from the data it
 * filters, instead of competing with it. `md` and `lg` keep the primary ink
 * from `FIELD`, because there the typed value *is* the content.
 *
 * The colour has to live here rather than in `FIELD`: `cn()` is a plain join,
 * and `.text-text-secondary` is emitted after `.text-text-primary`, so this is
 * the side of the pair that wins.
 */
const SIZES: Record<InputSize, string> = {
  sm: "h-10 px-3 text-sm font-medium text-text-secondary",
  md: "h-11 px-3.5 text-sm",
  lg: "h-12 px-4 text-base",
};

/**
 * Everything that is *not* size: the border, ground, focus ring and disabled
 * treatment. Split out so `Textarea` can take the same look without taking a
 * height — a textarea is sized by its rows, and pinning it to 44px would make
 * it a single-line input with a drag handle.
 */
const FIELD =
  "w-full rounded-field border border-border-strong bg-surface text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-primary focus:shadow-focus-field disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-60";

const INVALID = "border-error focus:border-error focus:shadow-focus-error";

type FieldState = { error?: boolean };

/**
 * `size` is omitted from the native props on purpose: `<input size>` is a real
 * HTML attribute that takes a character count, and leaving it in the union
 * would let `size={20}` typecheck into a class lookup that returns undefined.
 */
export function Input({
  className,
  error,
  size = "md",
  ...props
}: FieldState &
  { size?: InputSize } &
  Omit<ComponentPropsWithRef<"input">, "size">) {
  return (
    <input
      aria-invalid={error || undefined}
      /* `leading-none` keeps the text from fighting the fixed height: the box
         is set by `h-*` now, and an input centres its own text inside it. */
      className={cn(FIELD, "leading-none", SIZES[size], error && INVALID, className)}
      {...props}
    />
  );
}

/**
 * Deliberately outside the height scale — see `FIELD`. It keeps the padding and
 * type size the fields had before the scale existed, so a textarea beside an
 * `md` input still reads as the same family.
 */
export function Textarea({
  className,
  error,
  ...props
}: FieldState & ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(
        FIELD,
        "min-h-24 resize-y px-3.5 py-3 text-sm leading-relaxed",
        error && INVALID,
        className,
      )}
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
  /**
   * `ReactNode` rather than `string` so a hint can carry the link that answers
   * it — "Must be a verified address. Manage sender identities" is one
   * sentence, and splitting the link out below the field turns a hint into a
   * second paragraph competing with it.
   */
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-bold text-text-secondary">
        {label}
      </label>
      {children}
      {/* Ids derive from the control's, so `aria-describedby` can point here. */}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm font-medium text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
