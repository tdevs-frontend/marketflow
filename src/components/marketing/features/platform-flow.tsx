import {
  MessagesSquare,
  Target,
  TrendingUp,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The platform, as the journey it covers rather than as a list of modules.
 *
 * The landing page answers "what is in the box" with an ecosystem diagram of
 * eight cards around a hub. This section answers a different question — in what
 * order do these things happen to a customer — and it is the frame every
 * section below it hangs off: WhatsApp is Engage, the automation builder is
 * Automate, commerce is Convert, analytics is Grow.
 *
 * Each stage names the modules that do the work, so the diagram is checkable
 * rather than aspirational. Those names are the real sidebar entries; a stage
 * cannot claim a capability the product does not ship.
 *
 * The connector is one absolutely positioned rule behind the row, not five
 * per-stage borders. It runs from the first tile's centre to the last — inset
 * by a tenth of the row at each end, which is half of one five-column cell — so
 * it starts and stops under a tile instead of running off into the gutter. On a
 * phone the row becomes a column and the rule flips to a vertical one down the
 * left, drawn by each stage so it stops at the last.
 */

interface Stage {
  label: string;
  icon: LucideIcon;
  headline: string;
  modules: string[];
  /** Exactly one stage carries the brand. See the note below. */
  accent?: boolean;
}

const STAGES: Stage[] = [
  {
    label: "Capture",
    icon: UserPlus,
    headline: "A lead arrives from a form, a campaign or a WhatsApp message.",
    modules: ["Leads", "Contacts", "Forms"],
  },
  {
    label: "Engage",
    icon: MessagesSquare,
    headline: "Your team replies in a shared inbox, with the full history open.",
    modules: ["WhatsApp Inbox", "Email", "SMS"],
  },
  {
    label: "Automate",
    icon: Zap,
    headline: "Follow-ups fire on what the customer does, not on a schedule.",
    modules: ["Workflows", "Triggers", "Templates"],
    accent: true,
  },
  {
    label: "Convert",
    icon: Target,
    headline: "The order lands, and the conversation that earned it is attached.",
    modules: ["Orders", "Products", "Discounts"],
  },
  {
    label: "Grow",
    icon: TrendingUp,
    headline: "You see which channel produced the revenue, and do it again.",
    modules: ["Analytics", "Segments", "Campaigns"],
  },
];

export function PlatformFlow() {
  return (
    <section
      id="platform"
      aria-labelledby="platform-flow-title"
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
            One connected workspace
          </p>

          <h2
            id="platform-flow-title"
            className="section-title mt-5 text-balance"
          >
            From first interaction to repeat customer.
          </h2>

          <p className="mt-5 text-base leading-[1.7] text-text-secondary text-pretty">
            MarketFlow connects every stage of the customer journey in one
            workspace — so a lead captured on Monday and the order it becomes on
            Friday are the same record, not two exports.
          </p>
        </header>

        <div className="relative">
          {/* The rule the stages sit on, desktop only. Behind the tiles, which
              paint their own ground over it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] top-6 hidden h-px bg-[linear-gradient(to_right,transparent,var(--color-border-strong)_12%,var(--color-border-strong)_88%,transparent)] lg:block"
          />

          <ol className="grid gap-x-4 gap-y-0 lg:grid-cols-5">
            {STAGES.map((stage, index) => (
              <li
                key={stage.label}
                className="relative flex gap-4 pb-8 last:pb-0 lg:block lg:pb-0"
              >
                {/* The phone's vertical rule, drawn by every stage but the
                    last so the column ends on a tile rather than a line. */}
                {index < STAGES.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-12 bottom-0 left-6 w-px -translate-x-1/2 bg-border-strong lg:hidden"
                  />
                ) : null}

                <span
                  className={cn(
                    "relative z-1 grid size-12 shrink-0 place-items-center rounded-2xl border lg:size-12",
                    stage.accent
                      ? "brand-gradient border-transparent text-white shadow-[0_10px_24px_-10px_rgba(79,70,229,0.9)]"
                      : "border-border bg-surface text-primary shadow-card",
                  )}
                >
                  <stage.icon className="size-5" strokeWidth={1.9} aria-hidden />
                </span>

                <div className="min-w-0 lg:mt-5 lg:pr-4">
                  <h3 className="text-base font-bold text-text-primary">
                    {stage.label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary text-pretty">
                    {stage.headline}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {stage.modules.map((module) => (
                      <li
                        key={module}
                        className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary"
                      >
                        {module}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
