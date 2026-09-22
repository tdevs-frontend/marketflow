import {
  BarChart3,
  MessageCircle,
  Receipt,
  Send,
  Target,
  UserPlus,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One customer, nine steps, and the module that handles each.
 *
 * This is the section the whole page is building towards. Every block above it
 * describes a part of MarketFlow; this one is the argument that they are not
 * parts. A prospect comparing tools is really asking whether buying one thing
 * beats wiring five together, and the only honest way to answer is to walk a
 * single customer from the ad they clicked to the revenue line they became and
 * name what does the work at each step.
 *
 * Each step carries the module that owns it, and every one of those modules has
 * a section above with a screenshot in it — so the claim is checkable by
 * scrolling up rather than taken on trust.
 *
 * The rail is a two-column grid: a fixed 44px gutter holding the dots and the
 * line, and the content beside it. One vertical rule, drawn behind the dots and
 * stopped short of the last one, rather than a border per row — a per-row
 * border cannot stop before the final step without a special case.
 */

interface Step {
  title: string;
  module: string;
  icon: LucideIcon;
  /** Marks the two moments that are the point: the sale and the measurement. */
  accent?: boolean;
}

const STEPS: Step[] = [
  { title: "A customer clicks your campaign", module: "Campaigns", icon: Target },
  { title: "The lead is captured", module: "Leads", icon: UserPlus },
  { title: "A contact record is created", module: "Contacts", icon: Users },
  { title: "A WhatsApp conversation opens", module: "WhatsApp Inbox", icon: MessageCircle },
  { title: "Automation sends the follow-up", module: "Workflows", icon: Workflow },
  { title: "They place an order", module: "Orders", icon: Receipt, accent: true },
  { title: "A post-purchase message goes out", module: "Templates", icon: Send },
  { title: "Revenue is attributed to the campaign", module: "Analytics", icon: BarChart3, accent: true },
];

export function ConnectedJourney() {
  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="section-space-py relative isolate scroll-mt-32 overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] bg-size-[22px_22px] opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
            How MarketFlow works
          </p>

          <h2 id="journey-title" className="section-title mt-5 text-balance">
            One customer journey. One connected system
          </h2>

          <p className="mt-5 text-base leading-[1.7] text-text-secondary text-pretty">
            Every step below happens in the same workspace, on the same record.
            Nothing here is an export, a Zap or a nightly sync.
          </p>
        </header>

        <ol className="mx-auto max-w-2xl">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] items-start"
            >
              {/* The rule, drawn by every step but the last. */}
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-10 left-[1.375rem] h-full w-px -translate-x-1/2 bg-border-strong"
                />
              ) : null}

              <span
                className={cn(
                  "relative z-1 grid size-10 place-items-center rounded-full border",
                  step.accent
                    ? "brand-gradient border-transparent text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.9)]"
                    : "border-border bg-surface text-primary shadow-card",
                )}
              >
                <step.icon className="size-4" strokeWidth={1.9} aria-hidden />
              </span>

              <div className="pb-7 pl-4">
                <p className="text-sm font-semibold text-text-primary text-pretty">
                  {step.title}
                </p>
                <p className="mt-1 text-xs font-medium text-text-muted">
                  {step.module}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
