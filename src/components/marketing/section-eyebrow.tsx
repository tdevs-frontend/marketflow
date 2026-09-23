import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The pill above a section heading - "Our features", "FAQ", "How it works".
 *
 * Set from the "Our features" section on /features, which is the reference for
 * every section on a white or light-gray ground: the brand-soft fill and
 * border, primary ink, a 14px icon 8px from the label, `.section-eyebrow`
 * type. The heading under it sits at `mt-5`.
 *
 * Hero and breadcrumb badges do not use it, and neither do the sections that
 * carry their own ground (the dark testimonials, the brand-gradient WhatsApp
 * band, the tinted platform flow and the CTA panel): their pills are tuned to
 * that ground and keep their own classes.
 */
export function SectionEyebrow({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "section-eyebrow inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-soft py-1.5 pr-4 pl-3 text-primary",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {children}
    </p>
  );
}
