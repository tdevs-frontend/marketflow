import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { mergeClasses } from "@/lib/merge-classes";

export type ButtonVariant =
  | "primary"
  | "dark"
  | "secondary"
  | "outline"
  /* A dialog's dismiss - grey at rest, the brand tint on hover. */
  | "cancel"
  | "ghost"
  | "danger"
  | "inverse"
  /* Borderless icon actions - close, remove, reveal. */
  | "quiet"
  | "quiet-danger"
  /* Text actions, for `size="inline"`. */
  | "link"
  | "text"
  | "subtle"
  | "arrow";
export type ButtonSize = "sm" | "compact" | "md" | "lg" | "icon" | "inline";

/**
 * Shared shell: geometry, motion, focus and icon rules.
 *
 * Icons are sized from the button rather than at each call site - pass a bare
 * `<ArrowRight />` and it inherits the right box. An icon that genuinely needs
 * to break the scale can override with `!size-5`.
 */
const BASE = [
  "inline-flex select-none items-center justify-center whitespace-nowrap rounded-btn font-medium",
  // `transition-all` on the project's 200ms ease default - the softer curve.
  "transition-all",
  "focus-visible:outline-none focus-visible:shadow-focus",  
  /* A disabled button keeps its pointer events so the `not-allowed` cursor
     has something to paint on - `pointer-events-none` makes the element stop
     being the hit target, so the cursor resolves from the parent instead and no
     `disabled:cursor-*` rule can ever show. Nothing leaks by allowing them: a
     native `<button disabled>` fires no click. The trade is that `:hover` now
     matches too, so every variant re-states its resting look under `disabled:`
     and the lift is pinned here - Tailwind emits `disabled:` after `hover:` at
     equal specificity, so those win without needing `!` or `enabled:`. */
  "disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  // Respect a reduced-motion preference: keep the color change, drop the lift.
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
].join(" ");

/**
 * Hover lifts the button 1px - with no extra shadow, which read as a smudge
 * under light buttons - and active drops it back to rest so a press reads as a
 * press. The light variants (outline, secondary, cancel) all hover to the same
 * `primary-soft` ground, so every non-filled button answers the pointer in the
 * brand's own tint. Ghost stays flat - it has no elevation to begin with.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  /*
   * The brand gradient, and the product's one primary action.
   *
   * This used to be solid indigo with a separate `gradient` variant beside it
   * for page-level CTAs only - which meant the landing page's "Start Free" and
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
   * surface and muted ink - `bg-none` is what removes the gradient, since a
   * `background-image` sits above any `background-color` beneath it.
   */
  primary: [
    "brand-gradient text-white shadow-btn",
    "hover:-translate-y-px hover:brand-gradient-hover",
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
   * Hover moves one step up that same ramp - still unmistakably dark, and white
   * labels clear AA on both (16.7:1 at rest, 14.7:1 on hover).
   */
  dark: [
    "bg-dark text-white shadow-btn",
    "hover:-translate-y-px hover:bg-dark-soft",
    "active:translate-y-0 active:bg-dark active:shadow-btn",
    "disabled:bg-dark",
  ].join(" "),
  secondary: [
    /* Neutral resting border, brand colour only on hover: a secondary CTA
       outlined in the brand competes with the primary button beside it. */
    "border border-border-strong bg-surface text-primary shadow-btn",
    "hover:-translate-y-px hover:border-primary hover:bg-primary-soft hover:text-primary-dark",
    "active:translate-y-0 active:bg-primary-soft-hover active:shadow-btn",
    "disabled:border-border-strong disabled:bg-surface disabled:text-primary",
  ].join(" "),
  /*
   * The quiet neutral action - a border and a label at rest, the shared
   * `primary-soft` tint on hover.
   *
   * Disabled follows `primary` in dropping the shell's `opacity-50`. An outline
   * button is already the lightest object on the page, so halving it took the
   * border to ~1.1:1 against the surface and the label to ~2.4:1 - a control
   * that had vanished rather than one reading as unavailable. Full-strength
   * tokens say the same thing legibly: the border steps *up* to `border-strong`
   * so the shape survives on both the white card and the tinted page behind it,
   * the fill goes to the neutral surface, and only the ink softens to muted
   * (4.4:1 on that fill) to mark it inactive.
   */
  outline: [
    "border border-border bg-surface text-text-secondary shadow-btn",
    "hover:-translate-y-px hover:border-primary-border hover:bg-primary-soft hover:text-primary-dark",
    "active:translate-y-0 active:bg-primary-soft-hover active:shadow-btn",
    "disabled:border-border-strong disabled:bg-surface disabled:text-text-muted disabled:opacity-100",
  ].join(" "),
  /*
   * The dismiss beside a dialog's real action - Cancel, Keep editing.
   *
   * Neutral grey at rest, so the eye goes to the primary button next to it
   * first; the brand's light tint on hover - the same `primary-soft` ground and
   * `primary-dark` ink the ghost and secondary variants hover to - so it still
   * answers the pointer like every other control in the product. Geometry,
   * motion and focus are the shell's and the size's, exactly as `outline`'s
   * were, so swapping a Cancel onto it moves nothing by a pixel.
   */
  cancel: [
    "border border-border bg-surface-secondary text-text-secondary shadow-btn",
    "hover:-translate-y-px hover:border-primary-border hover:bg-primary-soft hover:text-primary-dark",
    "active:translate-y-0 active:bg-primary-soft-hover active:shadow-btn",
    "disabled:border-border disabled:bg-surface-secondary disabled:text-text-muted disabled:opacity-100",
  ].join(" "),
  ghost: [
    "bg-transparent text-primary",
    "hover:bg-primary-soft hover:text-primary-dark active:bg-primary-soft-hover",
    "disabled:bg-transparent disabled:text-primary",
  ].join(" "),
  /**
   * For dark brand surfaces, where the ink is white rather than a token color.
   * It exists as a variant instead of a `className` override because `cn()` is
   * a plain join - an override would race the base variant in the stylesheet.
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
    "hover:-translate-y-px hover:bg-error-hover",
    "active:translate-y-0 active:bg-error-hover active:shadow-btn",
    "disabled:bg-error",
  ].join(" "),

  /*
   * The icon action that sits inside something else - a dialog's close, a
   * toast's dismiss, a field's reveal toggle, a row's remove.
   *
   * No resting ground, unlike `IconButton`'s grey toolbar tile: inside a card
   * or a dialog header a filled square competes with the content it closes.
   * The tint only arrives on hover, and `transition-colors` replaces the
   * shell's `transition-all` because nothing here moves. Disabled restates
   * the resting look, since `:hover` still matches a disabled button.
   */
  quiet: [
    "text-text-muted transition-colors",
    "hover:bg-surface-secondary hover:text-text-primary",
    "disabled:bg-transparent disabled:text-text-muted",
  ].join(" "),
  /* `quiet`, for a remove or delete: the hover says what the click will do. */
  "quiet-danger": [
    "text-text-muted transition-colors",
    "hover:bg-error-soft hover:text-error",
    "disabled:bg-transparent disabled:text-text-muted",
  ].join(" "),

  /*
   * The text actions. All four are for `size="inline"`, which drops the box -
   * a text action is read as part of the line it sits on, and a 44px hit
   * area around "Mark all as read" would push the heading beside it apart.
   *
   * - `link` is the inline link: primary ink, an underline on hover and
   *   nothing else. No transition, because `text-decoration-line` does not
   *   animate and a fading focus ring on a link reads as lag.
   * - `text` is the primary-ink action whose colour deepens on hover instead -
   *   the "open this record" links in a detail panel.
   * - `subtle` is the muted one - "Back to products", "Advanced options" -
   *   that should not compete with the page's real actions.
   * - `arrow` is the card-footer call to action, "Read article" and "Learn
   *   more": a heavier label whose trailing arrow nudges forward on hover, of
   *   the link itself or of a `group` card around it. The arrow is the
   *   treatment, so its size and gap live here rather than in `inline`.
   */
  link: [
    "rounded-btn text-primary underline-offset-2 transition-none",
    "hover:underline",
  ].join(" "),
  text: "text-primary transition-colors hover:text-primary-dark",
  subtle: "text-text-muted transition-colors hover:text-text-primary",
  arrow: [
    "w-fit shrink-0 gap-1 rounded-sm font-semibold text-text-primary",
    "transition-colors duration-200 hover:text-primary group-hover:text-primary",
    "[&_svg]:size-4.5 [&_svg]:transition-[translate] [&_svg]:duration-200",
    "hover:[&_svg]:translate-x-0.5 group-hover:[&_svg]:translate-x-0.5",
    "motion-reduce:[&_svg]:transition-none motion-reduce:hover:[&_svg]:translate-x-0 motion-reduce:group-hover:[&_svg]:translate-x-0",
  ].join(" "),
};

/**
 * Fixed heights so buttons line up with each other and with form fields
 * (`md` matches the 44px input). `icon` is the square of `md`.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1 px-3.5 text-sm [&_svg]:size-4",
  /* 40px - matches `IconButton` md and the header search field. */
  compact: "h-10 gap-1 px-4 text-sm [&_svg]:size-4.5",
  md: "h-11 gap-2 px-5 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2.5 px-6 text-base [&_svg]:size-5",
  icon: "size-11 gap-0 p-0 [&_svg]:size-4",
  /*
   * No box at all: auto height, no padding, the body's 14px. For the text
   * variants, which sit in a line of copy rather than in a row of controls,
   * so the label wraps and can be selected like the text around it - the
   * shell's `whitespace-nowrap` and `select-none` are for boxed buttons.
   * The icon rule carries no specificity, so an icon that has always been
   * its own size keeps its own class.
   */
  inline: "h-auto gap-1.5 p-0 text-sm whitespace-normal select-auto [:where(&)_svg]:size-4",
};

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Builds the class string on its own, for the cases where a button's styling
 * has to sit on an element this file doesn't render (a third-party trigger,
 * an `<a>` to an external URL, the `<span>` inside a card that is already
 * one link).
 *
 * Layered with `mergeClasses` rather than joined: the size can restate the
 * shell's geometry, the variant can restate the size's (the `arrow` glyph),
 * and `className` has the last word on all three - a `px-7` passed in
 * replaces the size's `px-6` instead of racing it on stylesheet order.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantProps = {}) {
  return mergeClasses(BASE, SIZES[size], VARIANTS[variant], className);
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
    /** Renders a real disabled `<button>` instead of a link - see below. */
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
   * target and took the `not-allowed` cursor with it - the cursor resolves from
   * the parent once an element stops being hit-testable. Cancelling navigation
   * in an `onClick` isn't open to us either: `ButtonLink` is rendered from
   * Server Components, which can't pass event handlers to a Client Component.
   *
   * A disabled button needs none of that - it is unfocusable and unclickable by
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

/* `compact` has no entry: IconButton's `md` is already the 40px control.
   `xs` is the 24px control inside a toast, a chip row or a rule builder. */
type IconButtonSize = "xs" | "sm" | "md" | "lg";

const ICON_SIZES: Record<IconButtonSize, string> = {
  xs: "size-6 [&_svg]:size-3.5",
  sm: "size-8 [&_svg]:size-4",
  md: "size-10 [&_svg]:size-4.5",
  lg: "size-11 [&_svg]:size-5",
};

export type IconButtonProps = {
  /** Accessible name - the button has no visible label. */
  label: string;
  size?: IconButtonSize;
  /** Defaults to the neutral toolbar treatment; opt into a full variant here. */
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
  /**
   * Forwarded to the button.
   *
   * `ComponentPropsWithRef` rather than `ButtonHTMLAttributes`, which carries
   * no `ref`. A trigger that opens a panel needs one - to hand focus back when
   * Escape closes it - and without this the only way to get a focusable
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
      className={mergeClasses(
        BASE,
        ICON_SIZES[size],
        variant ? VARIANTS[variant] : TOOLBAR,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
