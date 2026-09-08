import {
  ArrowRight,
  Check,
  CheckCheck,
  Clock,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

/** The four words the campaign card carries as its identity chain. */
const CAMPAIGN_CHAIN = ["Campaign", "Audience", "Channels", "Growth"];

const ORCHESTRATION: { label: string; detail: string; icon: LucideIcon }[] = [
  { label: "Campaign created", detail: "Summer Product Launch", icon: Sparkles },
  { label: "Audience selected", detail: "12,480 contacts", icon: Users },
  { label: "WhatsApp sent", detail: "Day 1 · 09:00", icon: MessageCircle },
  { label: "Email follow-up", detail: "Day 2 · 10:30", icon: Mail },
  { label: "SMS reminder", detail: "Day 4 · 17:00", icon: Smartphone },
  { label: "Conversion", detail: "2,845 customers", icon: Target },
];

const RESULTS = [
  { label: "Reached", value: "12,480" },
  { label: "Engaged", value: "8,420" },
  { label: "Conversions", value: "2,845" },
  { label: "Conversion rate", value: "24.8%" },
];

const BENEFITS = ["Consistent messaging", "Smarter audience targeting", "Better campaign performance"];

/* -------------------------------------------------------------------------- */
/* Connectors                                                                 */
/* -------------------------------------------------------------------------- */

/** Column centres of a three-up grid, in percent. */
const LANES = [100 / 6, 50, 500 / 6];

/**
 * The fan is drawn in percentage space with `preserveAspectRatio="none"`, so
 * the branch points stay locked to the grid columns at any width;
 * `non-scaling-stroke` keeps the hairlines honest while the box stretches.
 */
function Fan({ direction }: { direction: "out" | "in" }) {
  const paths = LANES.map((lane) =>
    direction === "out"
      ? `M50,0 C50,58 ${lane},42 ${lane},100`
      : `M${lane},0 C${lane},58 50,42 50,100`,
  );

  return (
    <div aria-hidden className="relative hidden h-20 w-full sm:block">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        {paths.map((d, index) => (
          <g key={index} fill="none">
            <path
              d={d}
              stroke="var(--color-border-strong)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={d}
              stroke="var(--color-secondary)"
              strokeWidth="2"
              strokeDasharray="3 26"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="animate-flow"
              style={{ animationDelay: `${index * 400}ms` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Vertical rail that carries the flow once the fan is hidden. */
function StackRail() {
  return (
    <div aria-hidden className="flex justify-center py-3 sm:hidden">
      <span className="h-8 w-px bg-border-strong" />
    </div>
  );
}

/** Anchor dot where a connector meets a card. */
function Node({ side }: { side: "top" | "bottom" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute left-1/2 hidden size-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-surface sm:block",
        side === "top" ? "-top-1.5" : "-bottom-1.5",
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

function CampaignCard() {
  return (
    <article className="relative mx-auto max-w-md rounded-card border border-border bg-surface p-6 shadow-card-hover">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-primary-border bg-primary-soft text-[9px] leading-tight font-bold tracking-tight text-primary-dark">
          ONE
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
            One campaign
          </p>
          <h3 className="truncate font-heading text-lg font-bold text-text-primary">
            Summer Product Launch
          </h3>
        </div>
      </div>

      <p className="mt-4 rounded-panel bg-background px-4 py-3 text-sm text-text-secondary">
        New collection is here — explore the latest products.
      </p>

      <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        {CAMPAIGN_CHAIN.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">{step}</span>
            {index < CAMPAIGN_CHAIN.length - 1 ? (
              <ArrowRight className="size-3 text-text-muted" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs text-text-muted">
          <Users className="size-3.5" aria-hidden />
          Audience{" "}
          <span className="font-semibold text-text-primary tabular-nums">12,480 contacts</span>
        </p>
        <p className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-3.5 py-2 text-xs font-semibold text-white">
          Launch Campaign
          <ArrowRight className="size-3.5" aria-hidden />
        </p>
      </div>

      <Node side="bottom" />
    </article>
  );
}

function ChannelShell({
  icon: Icon,
  title,
  meta,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      <Node side="top" />
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-btn bg-primary-soft text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-bold text-text-primary">{title}</span>
        </span>
        <span className="text-[11px] whitespace-nowrap text-text-muted tabular-nums">{meta}</span>
      </div>
      {children}
      <Node side="bottom" />
    </article>
  );
}

function WhatsAppChannel() {
  return (
    <ChannelShell icon={MessageCircle} title="WhatsApp" meta="8,420 recipients">
      <div className="mt-4 flex justify-end">
        <div className="max-w-[92%] rounded-panel rounded-br-sm bg-primary-soft px-3.5 py-2.5">
          <p className="text-xs leading-relaxed text-text-primary">
            Hi Sarah 👋 Our new collection is here. Explore the latest products →
          </p>
          <p className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-text-muted">
            09:00
            <CheckCheck className="size-3 text-accent" aria-hidden />
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
        Delivered
      </p>
    </ChannelShell>
  );
}

function EmailChannel() {
  return (
    <ChannelShell icon={Mail} title="Email" meta="12,480 recipients">
      <div className="mt-4 rounded-panel border border-border bg-background p-3.5">
        <p className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
          Subject
        </p>
        <p className="mt-1 text-xs font-semibold text-text-primary">
          Meet our newest collection
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          Shop Collection
          <ArrowRight className="size-3" aria-hidden />
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-text-muted">Open rate</p>
        <p className="font-heading text-sm font-bold text-text-primary tabular-nums">42.8%</p>
      </div>
      <span aria-hidden className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
        <span className="block h-full w-[42.8%] rounded-full bg-primary" />
      </span>
    </ChannelShell>
  );
}

function SmsChannel() {
  return (
    <ChannelShell icon={Smartphone} title="SMS" meta="3,840 recipients">
      <div className="mt-4 rounded-panel border border-border bg-background px-3.5 py-3">
        <p className="text-xs leading-relaxed text-text-primary">
          Your exclusive offer is waiting. Shop now →
        </p>
        <p className="mt-1.5 text-[10px] text-text-muted">17:00 · 1 segment</p>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
        Delivered
      </p>
    </ChannelShell>
  );
}

function ResultsCard() {
  return (
    <article className="relative mx-auto max-w-3xl rounded-card border border-border bg-surface p-5 shadow-card">
      <Node side="top" />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-sm font-bold text-text-primary">Campaign Results</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
          <TrendingUp className="size-3" aria-hidden />
          +21.5% campaign growth
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {RESULTS.map((result) => (
          <div key={result.label}>
            <dd className="font-heading text-2xl font-bold tracking-tight text-text-primary tabular-nums">
              {result.value}
            </dd>
            <dt className="mt-0.5 text-[11px] text-text-muted">{result.label}</dt>
          </div>
        ))}
      </dl>
    </article>
  );
}

function OrchestrationTimeline() {
  return (
    <div className="rounded-card border border-border bg-background p-5">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
        Orchestration
      </p>
      <ol className="mt-4">
        {ORCHESTRATION.map((step, index) => (
          <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
            {index < ORCHESTRATION.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-8 left-3.75 h-[calc(100%-2.25rem)] w-px bg-border-strong"
              />
            ) : null}
            <span className="relative grid size-8 shrink-0 place-items-center rounded-full border border-primary-border bg-surface text-primary">
              <step.icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 pt-1">
              <span className="block truncate text-sm leading-tight font-semibold text-text-primary">
                {step.label}
              </span>
              <span className="mt-0.5 block truncate text-xs leading-tight text-text-muted">
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function MultiChannelCampaign() {
  return (
    <section
      aria-labelledby="multi-channel-title"
      className="section-space-py relative isolate overflow-hidden bg-surface"
    >
      {/* Curved background lines — the idea of messages travelling outward. */}
      <svg
        aria-hidden
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 -z-10 size-full opacity-[0.55] mask-[radial-gradient(ellipse_at_center,black,transparent_78%)]"
      >
        {[0, 1, 2, 3].map((index) => (
          <path
            key={index}
            d={`M-100,${180 + index * 90} C300,${60 + index * 90} 900,${420 - index * 40} 1300,${240 + index * 70}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}
      </svg>
      {/* Mint bloom behind the journey */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-216 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.08),transparent)]"
      />

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-text-secondary uppercase shadow-card">
            <Send className="size-3.5 text-primary" aria-hidden />
            Multi-channel campaigns
          </p>

          <h2
            id="multi-channel-title"
            className="mt-6 text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Reach customers wherever they are.
          </h2>

          <p className="mt-5 text-lg leading-[1.7] text-text-secondary text-pretty">
            Create one campaign and deliver personalized experiences across{" "}
            <span className="font-semibold text-primary">WhatsApp, Email and SMS</span> — from a
            single, unified workspace.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start lg:gap-14">
          {/* Journey */}
          <div className="relative order-1 lg:order-2">
            {/* Personalization badges, placed off the grid so the composition
                reads as designed rather than tiled. */}
            <span className="absolute -top-2 right-0 z-10 hidden rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-text-secondary shadow-card xl:block">
              Personalized
            </span>
            <span className="absolute top-1/2 -left-6 z-10 hidden rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-text-secondary shadow-card xl:block">
              Segment-based
            </span>
            <span className="absolute -right-4 bottom-24 z-10 hidden rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-text-secondary shadow-card xl:block">
              <Clock className="mr-1 inline size-3 align-[-2px]" aria-hidden />
              Scheduled
            </span>

            <CampaignCard />

            <StackRail />
            <Fan direction="out" />

            <div className="grid items-start gap-4 sm:grid-cols-3">
              <WhatsAppChannel />
              <StackRail />
              <EmailChannel />
              <StackRail />
              <SmsChannel />
            </div>

            <StackRail />
            <Fan direction="in" />

            <ResultsCard />
          </div>

          {/* Orchestration rail */}
          <div className="order-2 lg:order-1">
            <OrchestrationTimeline />
          </div>
        </div>

        {/* Value statement */}
        <div className="mt-14 flex flex-col items-center gap-5 text-center">
          <p className="max-w-2xl font-heading text-xl font-bold tracking-tight text-text-primary text-balance sm:text-2xl">
            One campaign. Every channel. One connected customer journey.
          </p>
          <ul className="flex flex-col items-center gap-3 sm:flex-row sm:gap-7">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-text-secondary">
                <span
                  aria-hidden
                  className="grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
