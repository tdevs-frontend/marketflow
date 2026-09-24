import type { HTMLAttributes, ReactNode } from "react";

import { mergeClasses } from "@/lib/merge-classes";
import { cn } from "@/lib/utils";

/**
 * The one badge in the product - every status, count, category label, hero
 * pill and section eyebrow renders through it.
 *
 * Four independent axes, so a look is described rather than re-typed:
 *
 * - `variant` is colour: ground, ink, border and elevation.
 * - `size` is geometry: padding, type size, gap and icon size, together.
 * - `weight` and `casing` are the two type choices that genuinely differ
 *   between surfaces - the dashboard's badges are medium and capitalise a raw
 *   status string, the landing page's pills are semibold and sentence case.
 *
 * `className` is for placement (margin, position, responsive visibility) and,
 * rarely, a padding a single badge has always had. It is a real override: see
 * `mergeClasses` in `lib/merge-classes.ts`.
 */

export type BadgeVariant =
  /** The quiet grey chip, and what a badge is with no variant. */
  | "default"
  /** The grey chip with muted ink, for a label that should recede further. */
  | "neutral"
  /** Brand indigo on its soft ground. */
  | "primary"
  /** The violet half of the brand pair. */
  | "secondary"
  /** Brand ground with the lighter primary ink, one step softer than `primary`. */
  | "soft"
  | "success"
  | "warning"
  | "error"
  | "info"
  /**
   * The channel's own green, for a state that is good *on WhatsApp* -
   * an approved template, a connected number.
   *
   * Distinct from `success` on purpose: that is the product's generic green
   * (#16a34a) and means "this worked". This is #059669, the ramp every
   * WhatsApp chart, tile and meter in the module already draws in, and using
   * it here is what makes an approved template read as part of the same
   * workspace rather than as a generic pass.
   */
  | "whatsapp"
  /** No fill, a hairline border - a label on a card that is already a surface. */
  | "outline"
  /** A white pill with no border, for a count sitting on a grey ground. */
  | "surface-plain"
  /** A white pill with a hairline border, for a label riding on a tinted ground. */
  | "surface"
  /** `surface` with muted ink, for a counter that should not compete. */
  | "surface-muted"
  /** A dashed border - a placeholder slot, not a value. */
  | "dashed"
  /** Brand soft ground with a brand border - blog categories, section eyebrows. */
  | "primary-outline"
  /** `primary-outline` with the stronger primary border, for the current step. */
  | "primary-strong"
  /** A white pill lifted off the page - floating labels, the tinted-ground eyebrow. */
  | "floating"
  /** The brand gradient in white ink - "Most popular". */
  | "popular"
  /** Solid brand, white ink - an unread count that has to be seen. */
  | "solid"
  /** Translucent white on a navy or gradient ground. */
  | "glass"
  /** The testimonials band's quieter glass - less border, softer ink. */
  | "glass-subtle"
  /** Emerald on the dark testimonials ground, where the soft greens would glow. */
  | "success-dark";

export type BadgeSize = "xs" | "sm" | "md" | "lg";
export type BadgeWeight = "inherit" | "medium" | "semibold" | "bold";
export type BadgeCasing = "capitalize" | "none" | "uppercase";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-surface-secondary text-text-secondary",
  neutral: "bg-surface-secondary text-text-muted",
  primary: "bg-primary-soft text-primary-dark",
  secondary: "bg-primary-subtle text-secondary-dark",
  soft: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  error: "bg-error-soft text-error-text",
  info: "bg-info-soft text-info-text",
  whatsapp: "bg-whatsapp-soft text-whatsapp-dark",
  outline: "border border-border text-text-secondary",
  "surface-plain": "bg-surface text-text-secondary",
  surface: "border border-border bg-surface text-text-secondary",
  "surface-muted": "border border-border bg-surface text-text-muted",
  dashed: "border border-dashed border-border-strong text-text-secondary",
  "primary-outline": "border border-primary-border bg-primary-soft text-primary",
  "primary-strong": "border border-primary bg-primary-soft text-primary-dark",
  floating: "border border-border bg-surface text-text-secondary shadow-card",
  popular: "brand-gradient text-white shadow-btn",
  solid: "bg-primary text-white",
  glass: "border border-white/16 bg-white/8 text-white backdrop-blur-md",
  "glass-subtle": "border border-white/10 bg-white/10 text-white/80 backdrop-blur",
  "success-dark": "bg-emerald-400/10 text-emerald-400",
};

/**
 * `md` is the page-level badge, at body size. `sm` is the in-row one: inside a
 * dense list or a table, a status set at the same 14px as the amount beside it
 * competes with the figure instead of annotating it, so it drops to the 13px
 * metadata step and the row regains an order to read in.
 *
 * `xs` is the landing page's pill - 12px, the size every label inside a hero
 * or feature visual is set at. `lg` is the section eyebrow: 14px, icon-led, so
 * the padding is weighted to the text side and the gap opens to 8px.
 *
 * Icons are sized from here rather than at each call site. The rule is wrapped
 * in `:where()` so it carries no specificity: an icon that has always been a
 * different size keeps its own `size-*` class and wins.
 *
 * Sizes are rungs on the component rather than a `className` at the call site
 * on purpose: `cn()` is a plain join, so a `text-xs` passed in would race
 * `text-meta` on stylesheet order instead of beating it. Sizes belong to the
 * component that owns the scale.
 */
const SIZES: Record<BadgeSize, string> = {
  xs: "gap-1 px-2 py-0.5 text-xs [:where(&)_svg]:size-3",
  sm: "gap-1 px-2 py-0.5 text-meta [:where(&)_svg]:size-3",
  md: "gap-1 px-2.5 py-0.5 text-sm [:where(&)_svg]:size-3",
  lg: "gap-2 py-1.5 pr-4 pl-3 text-sm tracking-normal [:where(&)_svg]:size-3.5",
};

/* `font-medium` is a family swap, not a weight - see the `--font-*` tokens in
   `variables.css` - so these are the cuts the type system ships. `inherit` sets
   nothing, for the few quiet labels that have always taken their parent's. */
const WEIGHTS: Record<BadgeWeight, string> = {
  inherit: "",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/* `capitalize` is the default because most badges print a raw status string
   ("active", "out-of-stock"); a label already written in sentence case opts
   out with `none` so "Out of stock" is not set as "Out Of Stock". */
const CASINGS: Record<BadgeCasing, string> = {
  capitalize: "capitalize",
  none: "normal-case",
  uppercase: "uppercase",
};

const BASE = "inline-flex items-center rounded-full [&_svg]:shrink-0";

export type BadgeProps = Omit<HTMLAttributes<HTMLElement>, "className"> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  weight?: BadgeWeight;
  casing?: BadgeCasing;
  /**
   * Ground-and-ink classes from a data palette - a tag's own colour, a
   * channel's theme. Replaces `variant` for colour; the palette is the source
   * of truth for those, and restating it as a variant would fork it.
   */
  palette?: string;
  /** Rendered beside the label, sized from `size` unless it carries its own. */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  /** The element to render. A pill that has always been a `<p>` stays one. */
  as?: "span" | "p" | "li";
  className?: string;
  children?: ReactNode;
};

export function Badge({
  variant = "default",
  size = "md",
  weight = "medium",
  casing = "capitalize",
  palette,
  icon,
  iconPosition = "start",
  as: Element = "span",
  className,
  children,
  ...rest
}: BadgeProps) {
  const own = cn(
    BASE,
    SIZES[size],
    WEIGHTS[weight],
    CASINGS[casing],
    palette ?? VARIANTS[variant],
  );

  return (
    <Element className={mergeClasses(own, className)} {...rest}>
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </Element>
  );
}
