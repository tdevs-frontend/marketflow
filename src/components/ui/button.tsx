import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "gradient"
  | "dark"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "inverse"
  | "light";
export type ButtonSize = "sm" | "compact" | "md" | "lg" | "icon";

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
  /*
   * The brand gradient as a button. Reserved for the page-level CTAs — the hero,
   * the featured plan, the closing block — because a gradient on every button
   * is the fastest way to make it stop meaning anything. In-product buttons
   * stay `primary`, which is the same indigo, solid.
   *
   * Hover shifts the whole ramp a step deeper rather than darkening one stop,
   * so the gradient direction stays readable through the transition.
   */
  gradient: [
    "brand-gradient text-white shadow-btn",
    "hover:-translate-y-px hover:brand-gradient-hover hover:shadow-btn-hover",
    "active:translate-y-0 active:shadow-btn",
  ].join(" "),
  /*
   * Solid dark. The neutral counterweight to `gradient`: on a pricing table or
   * a feature comparison it lets one row keep the brand CTA while the rest read
   * as equally deliberate rather than as the runner-up.
   *
   * `dark` is the token for the product's dark surfaces (the footer, full-bleed
   * breaks), so the button matches them rather than introducing a second black.
   * Hover moves one step up that same ramp — still unmistakably dark, and white
   * labels clear AA on both (16.7:1 at rest, 14.7:1 on hover).
   */
  dark: [
    "bg-dark text-white shadow-btn",
    "hover:-translate-y-px hover:bg-dark-soft hover:shadow-card-hover",
    "active:translate-y-0 active:bg-dark active:shadow-btn",
  ].join(" "),
  secondary: [
    /* Neutral resting border, brand colour only on hover: a secondary CTA
       outlined in the brand competes with the primary button beside it. */
    "border border-border-strong bg-surface text-primary shadow-btn",
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
  /*
   * White on a brand ground. The counterpart to `inverse`: where that is the
   * outlined secondary for a dark surface, this is the solid primary for one.
   *
   * It exists because the closing CTA's ground *is* the brand gradient, and a
   * `gradient` button on it is a gradient on a gradient — the one place where
   * the page's loudest button reads as the quietest. White against violet is
   * the highest-contrast pairing the palette can make, and the label takes the
   * heading ink so the button belongs to the product rather than to the panel.
   */
  light: [
    "bg-white text-text-primary shadow-btn",
    "hover:-translate-y-px hover:bg-primary-soft hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.55)]",
    "active:translate-y-0 active:bg-primary-soft-hover active:shadow-btn",
    "focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.45)]",
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
  /* 40px — matches `IconButton` md and the header search field. */
  compact: "h-10 gap-2 px-4 text-sm [&_svg]:size-4",
  md: "h-11 gap-2 px-5 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2.5 px-6 text-base [&_svg]:size-5",
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
 * Square action button for toolbar icons, on its own compact scale. Grey rather
 * than a brand tint: these sit beside the page's real CTA, and two green
 * controls in one row leave nothing for the eye to pick.
 */
const TOOLBAR =
  "bg-gray-soft text-gray-ink hover:bg-gray hover:text-text-primary active:bg-gray-strong";

/* `compact` has no entry: IconButton's `md` is already the 40px control. */
const ICON_SIZES: Record<Exclude<ButtonSize, "icon" | "compact">, string> = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-10 [&_svg]:size-4.5",
  lg: "size-11 [&_svg]:size-5",
};

export type IconButtonProps = {
  /** Accessible name — the button has no visible label. */
  label: string;
  size?: Exclude<ButtonSize, "icon" | "compact">;
  /** Defaults to the neutral toolbar treatment; opt into a full variant here. */
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
