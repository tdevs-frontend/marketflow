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
 * cards arguing for; five brand-coloured tiles would say nothing at all. The
 * bar as a whole is kept small and quiet for the same reason — it summarises
 * the ecosystem above it, it does not compete with it.
 */
export function WorkflowBar() {
  return (
    <div className="flex justify-center">
      <ol className="inline-flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1 rounded-3xl border border-border bg-surface p-1.5 shadow-card sm:gap-x-1 sm:rounded-full">
        {WORKFLOW_STEPS.map((step, index) => (
          <li key={step.label} className="flex items-center gap-0.5 sm:gap-1">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors duration-200 motion-reduce:transition-none",
                step.accent
                  ? "bg-primary-soft hover:bg-primary-soft-hover"
                  : "hover:bg-surface-secondary",
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
                <step.icon className="size-4" strokeWidth={1.9} aria-hidden />
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
