import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
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
  | "whatsapp";
export type BadgeSize = "xs" | "sm" | "md";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-secondary text-text-secondary",
  brand: "bg-primary-soft text-primary-dark",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-error-soft text-error-text",
  info: "bg-info-soft text-info-text",
  whatsapp: "bg-whatsapp-soft text-whatsapp-dark",
};

/**
 * `md` is the page-level badge, at body size. `sm` is the in-row one: inside a
 * dense list or a table, a status set at the same 14px as the amount beside it
 * competes with the figure instead of annotating it, so it drops to the 13px
 * metadata step and the row regains an order to read in.
 *
 * `xs` is the chrome one - a badge riding on a control rather than annotating
 * content, like the plan chip under the name in the dashboard header. There
 * the badge sits *beneath* the thing it qualifies instead of beside it, and at
 * 13px it reads as a second line of equal weight rather than as a tag on the
 * first. 12px with the padding pulled in gives it the 16px height that keeps
 * the whole chip inside the header's rhythm.
 *
 * It is a rung on the scale rather than a `className` at the call site on
 * purpose: `cn()` is a plain join, so a `text-xs` passed in would race
 * `text-meta` on stylesheet order instead of beating it, and the same for any
 * padding. Sizes belong to the component that owns the scale.
 */
const SIZES: Record<BadgeSize, string> = {
  xs: "px-1.5 py-[1px] text-xs",
  sm: "px-2 py-0.5 text-meta",
  md: "px-2.5 py-0.5 text-sm",
};

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  children,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium capitalize",
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
