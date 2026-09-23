import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SectionEyebrowVariant = "default" | "surface" | "dark";

/**
 * Only the colour treatment differs between variants; type, padding, radius,
 * icon size and spacing are shared.
 *
 * - `default` is the "Our features" pill on /features, the reference for every
 *   white or light-gray ground.
 * - `surface` is for a brand-tinted ground, where the soft fill would sink
 *   into the tint: a white pill with secondary ink and a primary icon.
 * - `dark` is for a navy or brand-gradient ground, where the soft fill would
 *   glow: a translucent white pill with white ink.
 */
const VARIANTS: Record<SectionEyebrowVariant, { pill: string; icon?: string }> = {
  default: { pill: "border-primary-border bg-primary-soft text-primary" },
  surface: {
    pill: "border-border bg-surface text-text-secondary shadow-card",
    icon: "text-primary",
  },
  dark: { pill: "border-white/16 bg-white/8 text-white backdrop-blur-md" },
};

/**
 * The pill above a section heading - "Our features", "FAQ", "Ready to grow?".
 *
 * The one eyebrow on the public site: `.section-eyebrow` type, a 14px icon 8px
 * from the label, `pl-3 pr-4 py-1.5`. The heading under it sits at `mt-5`.
 *
 * Hero and breadcrumb badges do not use it, and neither do the dark
 * testimonials and the WhatsApp band, which keep their own tuned pills.
 */
export function SectionEyebrow({
  text,
  icon: Icon,
  variant = "default",
  className,
}: {
  text: string;
  icon: LucideIcon;
  variant?: SectionEyebrowVariant;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "section-eyebrow inline-flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-3",
        VARIANTS[variant].pill,
        className,
      )}
    >
      <Icon className={cn("size-3.5", VARIANTS[variant].icon)} aria-hidden />
      {text}
    </p>
  );
}
