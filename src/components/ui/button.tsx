import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "inverse";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

/**
 * Shared shell: geometry, motion, focus and icon rules.
 *
 * Icons are sized from the button rather than at each call site — pass a bare
 * `<ArrowRight />` and it inherits the right box. An icon that genuinely needs
 * to break the scale can override with `!size-5`.
 */
const BASE = [
  "inline-flex select-none items-center justify-center whitespace-nowrap rounded-btn font-semibold",
  // `transition-all` on the project's 200ms ease default — the softer curve.
  "transition-all",
  "focus-visible:outline-none focus-visible:shadow-focus",
  "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  // Respect a reduced-motion preference: keep the color change, drop the lift.
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
].join(" ");

/**
 * Hover lifts the button 1px and deepens the shadow; active drops it back to
 * rest so a press reads as a press. Ghost stays flat — it has no elevation to
 * begin with.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary text-white shadow-btn",
    "hover:-translate-y-px hover:bg-primary-dark hover:shadow-btn-hover",
    "active:translate-y-0 active:bg-primary-darker active:shadow-btn",
  ].join(" "),
  secondary: [
    "border border-primary-border bg-surface text-primary shadow-btn",
    "hover:-translate-y-px hover:border-primary hover:bg-primary-soft hover:text-primary-dark hover:shadow-btn-hover",
    "active:translate-y-0 active:bg-primary-soft-hover active:shadow-btn",
  ].join(" "),
  outline: [
    "border border-border bg-surface text-text-secondary shadow-btn",
    "hover:-translate-y-px hover:border-border-strong hover:bg-surface-secondary hover:text-text-primary hover:shadow-card-hover",
    "active:translate-y-0 active:bg-surface-secondary active:shadow-btn",
  ].join(" "),
  ghost:
    "bg-transparent text-primary hover:bg-primary-soft hover:text-primary-dark active:bg-primary-soft-hover",
  /**
   * For dark brand surfaces, where the ink is white rather than a token color.
   * It exists as a variant instead of a `className` override because `cn()` is
   * a plain join — an override would race the base variant in the stylesheet.
   */
  inverse: [
    "border border-white/25 bg-transparent text-white",
    "hover:-translate-y-px hover:border-white/45 hover:bg-white/10",
    "active:translate-y-0 active:bg-white/15",
    "focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.3)]",
  ].join(" "),
  danger: [
    "bg-error text-white shadow-btn focus-visible:shadow-focus-error",
    "hover:-translate-y-px hover:bg-error-hover hover:shadow-card-hover",
    "active:translate-y-0 active:bg-error-hover active:shadow-btn",
  ].join(" "),
};

/**
 * Fixed heights so buttons line up with each other and with form fields
 * (`md` matches the 44px input). `icon` is the square of `md`.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-xs [&_svg]:size-4",
  md: "h-11 gap-2 px-5 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2.5 px-7 text-base [&_svg]:size-5",
  icon: "size-11 gap-0 p-0 [&_svg]:size-4",
};

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Builds the class string on its own, for the cases where a button's styling
 * has to sit on an element this file doesn't render (a third-party trigger,
 * an `<a>` to an external URL).
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantProps = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export type ButtonProps = ButtonVariantProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

export type ButtonLinkProps = ButtonVariantProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
    children: ReactNode;
    /** Links can't be `disabled`, so this mirrors the look and removes the target. */
    disabled?: boolean;
  };

export function ButtonLink({
  variant,
  size,
  className,
  disabled,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={buttonVariants({
        variant,
        size,
        className: cn(
          disabled && "pointer-events-none opacity-50 shadow-none",
          className,
        ),
      })}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Square action button for toolbar icons — soft brand tint at rest, one step
 * deeper on hover. It keeps its own compact scale rather than the text-button
 * heights, because a toolbar row wants a smaller target than a CTA.
 */
const TOOLBAR =
  "bg-primary-soft text-primary hover:bg-primary-soft-hover hover:text-primary-dark active:bg-primary-soft-hover";

const ICON_SIZES: Record<Exclude<ButtonSize, "icon">, string> = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-10 [&_svg]:size-[18px]",
  lg: "size-11 [&_svg]:size-5",
};

export type IconButtonProps = {
  /** Accessible name — the button has no visible label. */
  label: string;
  size?: Exclude<ButtonSize, "icon">;
  /** Defaults to the soft brand toolbar treatment; opt into a full variant here. */
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">;

export function IconButton({
  label,
  size = "md",
  variant,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        BASE,
        variant ? VARIANTS[variant] : TOOLBAR,
        ICON_SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
