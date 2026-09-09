import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ART_HOVER } from "./automation-data";

/**
 * One result orbiting the phone on a handset.
 *
 * Dark and translucent rather than white: the phone's screen is already the
 * bright object here, and three white chips around it would leave the eye
 * nothing to land on. Smoked glass over the brand gradient keeps them legible
 * while staying unmistakably secondary — and it is the one treatment that works
 * whether a badge is sitting over the gradient or over the phone's own bezel,
 * which on a 375px viewport it will be doing both of.
 *
 * The slate is written out rather than tokenised: it is a glass recipe for this
 * one component, not a surface the design system needs a name for.
 */
export function PhoneBadge({
  icon: Icon,
  value,
  label,
  tone = "brand",
  className,
}: {
  icon: LucideIcon;
  value: string;
  label?: string;
  tone?: "brand" | "success";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-[#0f172a]/30 px-2.5 py-1.5 backdrop-blur-md",
        "shadow-[0_10px_28px_rgba(30,27,75,0.28)]",
        ART_HOVER,
        "group-hover/art:-translate-y-0.5",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          tone === "success" ? "text-whatsapp-bright" : "text-lavender-deep",
        )}
        strokeWidth={2}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-[11px] leading-tight font-bold whitespace-nowrap text-white">
          {value}
        </span>
        {label ? (
          <span className="mt-0.5 block text-[9px] leading-none whitespace-nowrap text-white/65">
            {label}
          </span>
        ) : null}
      </span>
    </span>
  );
}
