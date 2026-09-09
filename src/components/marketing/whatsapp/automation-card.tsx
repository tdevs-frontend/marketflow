import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ART_HOVER,
  CARD_HOVER,
  CARD_SHELL,
  type AutomationCardData,
} from "./automation-data";

export function AutomationCard({
  card,
  className,
}: {
  card: AutomationCardData;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex w-full flex-col gap-2 px-2.5 py-2",
        "3xsm:flex-row 3xsm:items-center 3xsm:gap-2.5 3xsm:px-3 3xsm:py-2.5",
        CARD_SHELL,
        ART_HOVER,
        CARD_HOVER,
        className,
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-[8px] 3xsm:size-9 3xsm:rounded-[10px]",
          card.tile,
        )}
      >
        <card.icon
          className="size-4 3xsm:size-4.5"
          strokeWidth={1.8}
          aria-hidden
        />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[11px] leading-tight font-semibold text-text-primary 3xsm:text-[13px]">
          {card.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-none text-text-muted 3xsm:mt-1.5 3xsm:text-xs">
          {card.status}
        </span>
      </span>
    </span>
  );
}

export function AutomationBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-2.5 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-white backdrop-blur-sm",
        className,
      )}
    >
      <Zap className="size-3 text-lavender-deep" strokeWidth={2} aria-hidden />
      Automation active
    </span>
  );
}
