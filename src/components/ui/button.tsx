import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-btn hover:-translate-y-px hover:bg-primary-dark hover:shadow-btn-hover active:translate-y-0 active:bg-primary-darker active:shadow-btn",
  secondary:
    "border border-primary-border bg-surface text-primary shadow-btn hover:-translate-y-px hover:border-primary hover:bg-primary-soft hover:text-primary-dark hover:shadow-btn-hover active:translate-y-0 active:shadow-btn",
  outline:
    "border border-border bg-surface text-text-secondary shadow-btn hover:-translate-y-px hover:border-border-strong hover:bg-surface-secondary hover:text-text-primary hover:shadow-card-hover active:translate-y-0 active:shadow-btn",
  ghost: "bg-transparent text-primary hover:bg-primary-soft hover:text-primary-dark",
  danger:
    "bg-error text-white shadow-btn hover:-translate-y-px hover:bg-error-hover hover:shadow-card-hover active:translate-y-0 focus-visible:shadow-focus-error",
};

/** 12px / 20px is the house padding; sm and lg step evenly off it. */
const SIZES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-btn font-semibold leading-none transition-all focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}

/**
 * Square action button for toolbar icons — soft brand tint at rest,
 * one step deeper on hover.
 */
export function IconButton({
  label,
  className,
  children,
  ...props
}: { label: string; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-grid h-9 w-9 place-items-center rounded-btn bg-primary-soft text-primary transition-all",
        "hover:bg-primary-soft-hover hover:text-primary-dark",
        "focus-visible:outline-none focus-visible:shadow-focus",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
