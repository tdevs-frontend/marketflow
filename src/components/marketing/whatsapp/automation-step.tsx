import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ART_HOVER,
  CARD_HOVER,
  CARD_SHELL,
  type AutomationStepData,
} from "./automation-data";

/**
 * One step of the automation, as a compact card.
 *
 * Indigo on every tile rather than a colour per step: with the connectors gone,
 * the stack has to read as one sequence, and three different tints would split
 * it into three unrelated features. Green is spent only on the outcome, which
 * is the one thing in the column that is not the automation working.
 */
export function AutomationStep({
  step,
  className,
}: {
  step: AutomationStepData;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-3",
        CARD_SHELL,
        ART_HOVER,
        CARD_HOVER,
        className,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[11px]",
          step.tile ?? "bg-primary-soft text-primary",
        )}
      >
        <step.icon className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-tight font-semibold text-text-primary">
          {step.title}
        </span>
        <span className="mt-1.5 block truncate text-[12px] leading-none text-text-muted">
          {step.status}
        </span>
      </span>
    </span>
  );
}

/**
 * The one label that names what the column is. Small on purpose — it caption
 * the stack, it does not compete with it.
 */
export function AutomationBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-white backdrop-blur-md",
        className,
      )}
    >
      <Zap className="size-3.5 text-lavender-deep" strokeWidth={2} aria-hidden />
      Automation active
    </span>
  );
}
