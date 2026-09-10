import { cn } from "@/lib/utils";
import {
  FLOW_METRICS,
  FLOW_STEPS,
  type AutomationStepData,
} from "./automation-data";

/**
 * One node of the flow: tinted tile, label, and the connector down to the
 * next one.
 *
 * The connector is drawn by the step above it rather than sitting between
 * steps, so the line always starts under a tile centre and no wrapper is
 * needed to hold it.
 */
export function AutomationStep({
  step,
  last,
}: {
  step: AutomationStepData;
  last: boolean;
}) {
  return (
    <li className="relative flex items-center gap-1.5 @[440px]:gap-2">
      {last ? null : (
        <span
          aria-hidden
          className="absolute top-4 left-[7.5px] h-2 w-px bg-border-strong @[440px]:top-5 @[440px]:left-[9.5px] @[440px]:h-3"
        />
      )}

      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[5px] @[440px]:size-5 @[440px]:rounded-md",
          step.tile,
        )}
      >
        <step.icon className="size-2.5 @[440px]:size-3" strokeWidth={2} />
      </span>

      <span className="truncate text-[7px] leading-none font-medium text-text-primary @[440px]:text-[9px]">
        {step.label}
      </span>
    </li>
  );
}

/**
 * The automation, running inside the product rather than floating beside it.
 *
 * This is the panel that makes the section's second point: the conversation on
 * the left is not being typed by anyone. Status sits at the top where a real
 * product would put it, the five steps read top to bottom, and two numbers
 * close it out — the flow is the subject, so the metrics stay a footnote.
 */
export function AutomationFlowPanel() {
  return (
    <div
      aria-hidden
      className="flex w-26 shrink-0 flex-col border-l border-border bg-surface @[440px]:w-33 @[620px]:w-37.5"
    >
      {/* Status */}
      <div className="border-b border-border px-2 py-2 @[440px]:px-2.5 @[440px]:py-2.5">
        <span className="flex items-center gap-1">
          <span className="animate-soft-pulse size-1.5 shrink-0 rounded-full bg-whatsapp-brand" />
          <span className="truncate text-[8px] leading-none font-bold tracking-tight text-text-primary @[440px]:text-[9.5px]">
            Automation Active
          </span>
        </span>
        <span className="mt-1 block truncate text-[7px] leading-none text-text-muted @[440px]:text-[8px]">
          Premium flow
        </span>
      </div>

      {/* The flow */}
      <ol className="flex flex-col gap-2 px-2 py-2.5 @[440px]:gap-3 @[440px]:px-2.5 @[440px]:py-3">
        {FLOW_STEPS.map((step, index) => (
          <AutomationStep
            key={step.label}
            step={step}
            last={index === FLOW_STEPS.length - 1}
          />
        ))}
      </ol>

      {/* Two live numbers, pushed to the bottom of the panel. */}
      <div className="mt-auto hidden flex-col gap-1 border-t border-border px-2 py-2 @[440px]:flex @[440px]:gap-1.5 @[440px]:px-2.5">
        {FLOW_METRICS.map((metric) => (
          <span
            key={metric.label}
            className="flex items-baseline justify-between gap-1"
          >
            <span className="truncate text-[7px] leading-none text-text-muted @[440px]:text-[8px]">
              {metric.label}
            </span>
            <span className="text-[8px] leading-none font-bold text-text-primary @[440px]:text-[9px]">
              {metric.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
