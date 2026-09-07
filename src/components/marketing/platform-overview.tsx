import {
  ArrowRight,
  BarChart3,
  Filter,
  Megaphone,
  MessageCircle,
  Send,
  Target,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { PlatformDashboard } from "./platform-dashboard";

type Module = {
  title: string;
  body: string;
  status: string;
  icon: LucideIcon;
};

/** Left rail — where a customer enters the system and gets organised. */
const INBOUND: Module[] = [
  {
    title: "WhatsApp Automation",
    body: "Automate conversations & follow-ups",
    status: "Active",
    icon: MessageCircle,
  },
  {
    title: "CRM & Leads",
    body: "Capture, organize & convert leads",
    status: "1,248 Leads",
    icon: Users,
  },
  {
    title: "Campaigns",
    body: "Launch targeted campaigns",
    status: "12 Active",
    icon: Megaphone,
  },
];

/** Right rail — where the platform acts and reports back. */
const OUTBOUND: Module[] = [
  {
    title: "Automation",
    body: "Build workflows without code",
    status: "8 Workflows",
    icon: Workflow,
  },
  {
    title: "Email & SMS",
    body: "Reach customers across channels",
    status: "Multi-channel",
    icon: Send,
  },
  {
    title: "Analytics",
    body: "Measure what drives growth",
    status: "Live",
    icon: BarChart3,
  },
  {
    title: "Audience Segmentation",
    body: "Target the right customers",
    status: "24 Segments",
    icon: Filter,
  },
];

const JOURNEY: { label: string; icon: LucideIcon }[] = [
  { label: "Capture", icon: UserPlus },
  { label: "Engage", icon: MessageCircle },
  { label: "Automate", icon: Zap },
  { label: "Convert", icon: Target },
  { label: "Measure", icon: BarChart3 },
];

/**
 * Curves run from each module's centre to the dashboard's centre, so only the
 * span crossing the column gap is visible — the cards cover the rest. The
 * viewBox is percentage space with `preserveAspectRatio="none"`, which keeps
 * every endpoint anchored at any width; `non-scaling-stroke` stops the
 * hairlines stretching with it.
 */
const LEFT_ROWS = [17, 50, 83];
const RIGHT_ROWS = [12.5, 37.5, 62.5, 87.5];

function connectorPath(from: [number, number], to: [number, number]) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const midX = (x1 + x2) / 2;
  return `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;
}

function Connectors() {
  const paths = [
    ...LEFT_ROWS.map((y) => connectorPath([14, y], [50, 50])),
    ...RIGHT_ROWS.map((y) => connectorPath([86, y], [50, 50])),
  ];

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 hidden size-full lg:block"
    >
      {paths.map((d, index) => (
        <g key={index} fill="none" vectorEffect="non-scaling-stroke">
          <path
            d={d}
            stroke="var(--color-border-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={d}
            stroke="var(--color-secondary)"
            strokeWidth="1.5"
            strokeDasharray="4 24"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="animate-flow"
            style={{ animationDelay: `${index * 260}ms` }}
          />
        </g>
      ))}
    </svg>
  );
}

function ModuleCard({ module }: { module: Module }) {
  return (
    <article className="group relative rounded-card border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-border hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <module.icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {module.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            {module.body}
          </p>
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
            {module.status}
          </p>
        </div>
      </div>
    </article>
  );
}

/** The vertical rail that replaces the connector curves once the grid stacks. */
function FlowRail() {
  return (
    <div aria-hidden className="flex justify-center py-2 lg:hidden">
      <span className="h-6 w-px bg-border-strong" />
    </div>
  );
}

function ModuleRail({
  modules,
  className,
}: {
  modules: Module[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between", className)}>
      {modules.map((module, index) => (
        <div key={module.title}>
          {index > 0 ? <FlowRail /> : null}
          <ModuleCard module={module} />
        </div>
      ))}
    </div>
  );
}

export function PlatformOverview() {
  return (
    <section
      aria-labelledby="platform-overview-title"
      className="section-space-py relative isolate overflow-hidden bg-background"
    >
      {/* Dot texture, faded out at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_center,black,transparent_75%)] bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] bg-[size:22px_22px] opacity-50"
      />
      {/* Mint bloom behind the command center */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-208 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(37,211,102,0.10),transparent)]"
      />

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-3 pr-3.5 text-xs font-medium text-text-secondary shadow-card">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
            One platform. Complete marketing control.
          </p>

          <h2
            id="platform-overview-title"
            className="mt-5 text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Everything you need to turn leads into loyal customers
          </h2>

          <p className="mt-5 text-lg leading-[1.7] text-text-secondary text-pretty">
            Capture leads, manage conversations, launch campaigns, automate
            follow-ups and measure growth — all from{" "}
            <span className="font-semibold text-primary">
              one powerful workspace
            </span>
          </p>
        </header>

        {/* Command center */}
        <div className="relative">
          <Connectors />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)_minmax(0,0.9fr)] lg:items-stretch lg:gap-8">
            <ModuleRail
              modules={INBOUND}
              className="order-2 lg:order-1 lg:h-full"
            />

            <div className="order-1 lg:order-2">
              <p className="mb-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                  MarketFlow Command Center
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <span className="relative flex size-1.5" aria-hidden>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-secondary" />
                  </span>
                  All systems operational
                </span>
              </p>
              <PlatformDashboard />
            </div>

            <ModuleRail modules={OUTBOUND} className="order-3 lg:h-full" />
          </div>
        </div>

        {/* Journey */}
        <div className="mt-14 flex justify-center">
          <ol className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-card border border-border bg-surface px-6 py-4 shadow-card sm:gap-x-5">
            {JOURNEY.map((step, index) => (
              <li key={step.label} className="flex items-center gap-2 sm:gap-4">
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-btn bg-primary-soft text-primary">
                    <step.icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {step.label}
                  </span>
                </span>
                {index < JOURNEY.length - 1 ? (
                  <ArrowRight
                    className="size-3.5 shrink-0 text-text-muted"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
