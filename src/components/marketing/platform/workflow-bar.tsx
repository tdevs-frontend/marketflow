import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORKFLOW_STEPS } from "./platform-features";

/**
 * The journey bar: Capture, Engage, Automate, Convert, Grow.
 *
 * An ordered list, because the steps are a sequence — the arrows between them
 * are decoration on top of that, not the thing carrying the order.
 *
 * The steps are deliberately neutral except one. Automate wears the brand
 * gradient because it is the differentiator the section above it spends eight
 * cards arguing for; five brand-coloured tiles would say nothing at all.
 */
export function WorkflowBar() {
  return (
    <div className="flex justify-center">
      <ol className="inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-3xl border border-border bg-surface p-2 shadow-card sm:gap-x-2 sm:rounded-full sm:p-2.5">
        {WORKFLOW_STEPS.map((step, index) => (
          <li key={step.label} className="flex items-center gap-1 sm:gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full py-1 pr-3 pl-1",
                step.accent && "bg-primary-soft",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full",
                  step.accent
                    ? "brand-gradient text-white shadow-[0_6px_14px_-6px_rgba(79,70,229,0.85)]"
                    : "bg-surface-secondary text-text-muted",
                )}
              >
                <step.icon className="size-3.5" strokeWidth={2} aria-hidden />
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  step.accent ? "text-primary" : "text-text-primary",
                )}
              >
                {step.label}
              </span>
            </span>

            {index < WORKFLOW_STEPS.length - 1 ? (
              <ArrowRight
                className="size-3.5 shrink-0 text-text-muted/60"
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
