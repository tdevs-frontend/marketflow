import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "dark"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "inverse";
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
  /* A disabled button keeps its pointer events so the `not-allowed` cursor
     has something to paint on — `pointer-events-none` makes the element stop
     being the hit target, so the cursor resolves from the parent instead and no
     `disabled:cursor-*` rule can ever show. Nothing leaks by allowing them: a
     native `<button disabled>` fires no click. The trade is that `:hover` now
     matches too, so every variant re-states its resting look under `disabled:`
     and the lift is pinned here — Tailwind emits `disabled:` after `hover:` at
     equal specificity, so those win without needing `!` or `enabled:`. */
  "disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none",
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
  /*
   * The brand gradient, and the product's one primary action.
   *
   * This used to be solid indigo with a separate `gradient` variant beside it
   * for page-level CTAs only — which meant the landing page's "Start Free" and
   * the dashboard's "Add contact" were different colours while being the same
   * kind of thing. One variant now, so the journey from a marketing CTA to a
   * dialog's confirm button is one continuous brand.
   *
   * Hover moves *both* stops a step deeper rather than darkening one, so the
   * gradient stays indigo-to-violet through the transition instead of
   * collapsing into a single hue.
   *
   * Disabled drops the gradient entirely. Half-opacity indigo-violet still
   * reads as the brand's loudest object, so it is swapped for the neutral
   * surface and muted ink — `bg-none` is what removes the gradient, since a
   * `background-image` sits above any `background-color` beneath it.
   */
  primary: [
    "brand-gradient text-white shadow-btn",
    "hover:-translate-y-px hover:brand-gradient-hover hover:shadow-btn-hover",
    "active:translate-y-0 active:shadow-btn",
    /* `opacity-100` countermands the shell's `disabled:opacity-50`: that rule
       exists to mute a solid fill, and stacking it on an already-neutral
       surface drove the label to 3:1. Colour alone says inactive here. */
    "disabled:bg-none disabled:bg-surface-secondary disabled:text-text-muted disabled:opacity-100",
  ].join(" "),
  /*
   * Solid dark. The neutral counterweight to `primary`: on a pricing table or
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
    "disabled:bg-dark",
  ].join(" "),
  secondary: [
    /* Neutral resting border, brand colour only on hover: a secondary CTA
       outlined in the brand competes with the primary button beside it. */
    "border border-border-strong bg-surface text-primary shadow-btn",
    "hover:-translate-y-px hover:border-primary hover:bg-primary-soft hover:text-primary-dark hover:shadow-btn-hover",
    "active:translate-y-0 active:bg-primary-soft-hover active:shadow-btn",
    "disabled:border-border-strong disabled:bg-surface disabled:text-primary",
  ].join(" "),
  /*
   * The quiet neutral action — a border and a label, nothing else.
   *
   * Disabled follows `primary` in dropping the shell's `opacity-50`. An outline
   * button is already the lightest object on the page, so halving it took the
   * border to ~1.1:1 against the surface and the label to ~2.4:1 — a control
   * that had vanished rather than one reading as unavailable. Full-strength
   * tokens say the same thing legibly: the border steps *up* to `border-strong`
   * so the shape survives on both the white card and the tinted page behind it,
   * the fill goes to the neutral surface, and only the ink softens to muted
   * (4.4:1 on that fill) to mark it inactive.
   */
  outline: [
    "border border-border bg-surface text-text-secondary shadow-btn",
    "hover:-translate-y-px hover:border-border-strong hover:bg-surface-secondary hover:text-text-primary hover:shadow-card-hover",
    "active:translate-y-0 active:bg-surface-secondary active:shadow-btn",
    "disabled:border-border-strong disabled:bg-surface disabled:text-text-muted disabled:opacity-100",
  ].join(" "),
  ghost: [
    "bg-transparent text-primary",
    "hover:bg-primary-soft hover:text-primary-dark active:bg-primary-soft-hover",
    "disabled:bg-transparent disabled:text-primary",
  ].join(" "),
  /**
   * For dark brand surfaces, where the ink is white rather than a token color.
   * It exists as a variant instead of a `className` override because `cn()` is
   * a plain join — an override would race the base variant in the stylesheet.
   */
  inverse: [
    "border border-white/25 bg-transparent text-white",
    "hover:-translate-y-px hover:border-white/45 hover:bg-white/10",
    "active:translate-y-0 active:bg-white/15",
    "disabled:border-white/25 disabled:bg-transparent",
    "focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.3)]",
  ].join(" "),
  danger: [
    "bg-error text-white shadow-btn focus-visible:shadow-focus-error",
    "hover:-translate-y-px hover:bg-error-hover hover:shadow-card-hover",
    "active:translate-y-0 active:bg-error-hover active:shadow-btn",
    "disabled:bg-error",
  ].join(" "),
};

/**
 * Fixed heights so buttons line up with each other and with form fields
 * (`md` matches the 44px input). `icon` is the square of `md`.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1 px-3.5 text-sm [&_svg]:size-4",
  /* 40px — matches `IconButton` md and the header search field. */
  compact: "h-10 gap-1 px-4 text-sm [&_svg]:size-4.5",
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
    /** Renders a real disabled `<button>` instead of a link — see below. */
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
  const classes = buttonVariants({ variant, size, className });

  /*
   * Disabled renders a native `<button disabled>` rather than a muted anchor.
   *
   * An `<a>` is never `:disabled`, so none of the variants' disabled rules
   * would reach it, and the old `pointer-events-none` both removed the click
   * target and took the `not-allowed` cursor with it — the cursor resolves from
   * the parent once an element stops being hit-testable. Cancelling navigation
   * in an `onClick` isn't open to us either: `ButtonLink` is rendered from
   * Server Components, which can't pass event handlers to a Client Component.
   *
   * A disabled button needs none of that — it is unfocusable and unclickable by
   * the platform, and it matches `:disabled`, so it gets the same treatment as
   * every other disabled button in the system, cursor included. The navigation
   * props go with the anchor, which is what disabled means here.
   */
  if (disabled) {
    return (
      <button type="button" disabled className={classes}>
        {children}
      </button>
    );
  }

  return (
    <Link className={classes} {...props}>
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
  /**
   * Forwarded to the button.
   *
   * `ComponentPropsWithRef` rather than `ButtonHTMLAttributes`, which carries
   * no `ref`. A trigger that opens a panel needs one — to hand focus back when
   * Escape closes it — and without this the only way to get a focusable
   * reference was to copy this component's classes onto a bare `<button>`,
   * which is how two bells in one product end up a pixel apart.
   */
} & Omit<ComponentPropsWithRef<"button">, "aria-label">;

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
