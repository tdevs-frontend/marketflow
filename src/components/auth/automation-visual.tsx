import {
  Check,
  Clock,
  MessageCircle,
  Send,
  TrendingUp,
  UserPlus,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

type StepState = "done" | "active" | "pending";

type Step = { icon: LucideIcon; label: string; state: StepState };

/** One lead moving through a WhatsApp-first journey, caught mid-run. */
const JOURNEY: Step[] = [
  { icon: UserPlus, label: "New lead", state: "done" },
  { icon: MessageCircle, label: "WhatsApp", state: "done" },
  { icon: Clock, label: "Follow-up", state: "active" },
  { icon: Check, label: "Converted", state: "pending" },
];

/** Reply rate over the last nine weeks. Only the shape is doing work here. */
const GROWTH = [18, 24, 21, 32, 29, 41, 47, 58, 66];

/* -------------------------------------------------------------------------- */
/* Chart geometry                                                             */
/* -------------------------------------------------------------------------- */

const CHART = { width: 232, height: 56, pad: 5 };

const MIN = Math.min(...GROWTH);
const MAX = Math.max(...GROWTH);

const pointX = (index: number) => (index / (GROWTH.length - 1)) * CHART.width;

const pointY = (value: number) =>
  CHART.pad + (1 - (value - MIN) / (MAX - MIN)) * (CHART.height - CHART.pad * 2);

const LINE = GROWTH.map(
  (value, index) => `${index === 0 ? "M" : "L"}${pointX(index)},${pointY(value)}`,
).join(" ");

const AREA = `${LINE} L${CHART.width},${CHART.height} L0,${CHART.height} Z`;

/* -------------------------------------------------------------------------- */
/* Journey                                                                    */
/* -------------------------------------------------------------------------- */

const NODE: Record<StepState, string> = {
  done: "border-primary bg-primary text-white",
  /**
   * The only place the bright brand green appears: a soft halo rather than a
   * fill, so the eye lands on the step that is actually running.
   */
  active:
    "border-primary bg-surface text-primary shadow-[0_0_0_5px_rgba(37,211,102,0.14)]",
  pending: "border-border bg-surface-secondary text-text-muted",
};

function Journey() {
  return (
    <div className="mt-6 flex items-start justify-between">
      {JOURNEY.map((step, index) => {
        const StepIcon = step.icon;

        return (
          <div key={step.label} className="contents">
            {index > 0 ? (
              /* 17px clears the node's 18px half-height by the rule's own width. */
              <div
                className={cn(
                  "mt-[17px] h-px flex-1",
                  step.state === "pending" ? "bg-border" : "bg-primary/30",
                )}
              />
            ) : null}

            <div className="flex w-[4.25rem] shrink-0 flex-col items-center gap-2.5">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border",
                  NODE[step.state],
                )}
              >
                <StepIcon className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-center text-[11px] leading-tight font-medium text-text-secondary">
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Visual                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The brand panel's product vignette: one journey card, with an inbound reply
 * and a campaign readout floating off its corners.
 *
 * Decorative in full. Everything a visitor actually needs is in the headline
 * beside it, so the tree is hidden from assistive tech rather than narrated —
 * a screen reader arrives at the form, not at a pile of invented metrics.
 */
export function AutomationVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative max-w-sm", className)} aria-hidden>
      <div className="rounded-card border border-border bg-surface p-5 shadow-float">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
              <Workflow className="size-4" />
            </span>
            <span>
              <span className="block text-[13px] leading-tight font-medium text-text-primary">
                Welcome journey
              </span>
              <span className="block text-[11px] leading-tight text-text-muted">
                4 steps · WhatsApp first
              </span>
            </span>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-primary uppercase">
            <span className="size-1.5 rounded-full bg-secondary" />
            Live
          </span>
        </div>

        <Journey />

        {/* Growth */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-text-muted uppercase">
                Reply rate
              </p>
              <p className="mt-1.5 text-2xl leading-none font-bold text-text-primary">
                38.2%
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[11px] font-medium text-success-text">
              <TrendingUp className="size-3.5" />
              +12.4%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            className="mt-3 h-14 w-full"
            preserveAspectRatio="none"
            role="presentation"
          >
            <defs>
              <linearGradient id="mf-auth-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={AREA} fill="url(#mf-auth-spark)" />
            <path
              d={LINE}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      {/*
       * The two floats appear only at xl. Below that the brand column is too
       * narrow to hold them without colliding with the card or the divider.
       */}

      {/* Floating: an inbound reply */}
      <div className="absolute -top-8 -right-10 hidden w-56 rounded-card border border-border bg-surface p-3.5 shadow-float xl:block">
        <div className="flex items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary/15 text-primary-dark">
            <MessageCircle className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-text-muted">Reply · 2m ago</p>
            <p className="mt-1.5 rounded-panel rounded-tl-sm bg-primary-soft px-3 py-2 text-xs leading-snug text-text-primary">
              Yes — send me the pricing details.
            </p>
          </div>
        </div>
      </div>

      {/* Floating: a campaign in flight */}
      <div className="absolute -bottom-8 -left-10 hidden w-52 rounded-card border border-border bg-surface p-3.5 shadow-float xl:block">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1.5 text-text-primary">
            <Send className="size-3.5 text-primary" />
            Summer Sale
          </span>
          <span className="text-text-muted">98.4%</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
          <span className="block h-full w-[84%] rounded-full bg-gradient-to-r from-primary to-secondary" />
        </div>
        <p className="mt-2 text-[11px] text-text-muted">12,480 delivered</p>
      </div>
    </div>
  );
}
