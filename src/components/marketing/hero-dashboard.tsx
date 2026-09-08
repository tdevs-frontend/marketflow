import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageCircle,
  Search,
  Send,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const CONVERSATIONS = [
  {
    initials: "AR",
    name: "Ayesha Rahman",
    message: "Is the festive bundle still 20% off? ",
    time: "2m",
    unread: 2,
  },
  {
    initials: "DO",
    name: "Daniel Okafor",
    message: "Payment sent — order #4821 confirmed",
    time: "11m",
    unread: 0,
  },
  {
    initials: "ML",
    name: "Mei Lin",
    message: "Can you ship to Singapore this week? ",
    time: "26m",
    unread: 1,
  },
];

const METRICS = [
  { label: "Conversion rate", value: "24.8%", delta: "+4.2 pts" },
  { label: "Active leads", value: "1,284", delta: "+186" },
  { label: "Revenue influenced", value: "$48.2k", delta: "+12.4%" },
];

/** Conversations handled per day, Mon–Sun. One series, one hue. */
const WEEK = [
  { day: "M", value: 46 },
  { day: "T", value: 58 },
  { day: "W", value: 51 },
  { day: "T", value: 72 },
  { day: "F", value: 66 },
  { day: "S", value: 84 },
  { day: "S", value: 97 },
];

const PEAK = Math.max(...WEEK.map((point) => point.value));

const PIPELINE = [
  { stage: "New", count: 320, width: "100%" },
  { stage: "Qualified", count: 148, width: "62%" },
  { stage: "Proposal", count: 62, width: "34%" },
  { stage: "Won", count: 41, width: "22%" },
];

const WORKFLOW = [
  { label: "Lead", icon: UserPlus, caption: "Captured" },
  { label: "Message", icon: MessageCircle, caption: "Auto-sent" },
  { label: "Follow-up", icon: Clock, caption: "After 24h" },
  { label: "Conversion", icon: CheckCircle2, caption: "Won" },
];

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-panel border border-border bg-surface p-3.5", className)}>
      {children}
    </div>
  );
}

function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">{children}</p>
      {action}
    </div>
  );
}

export function HeroDashboard() {
  return (
    <div
      role="img"
      aria-label="MarketFlow workspace preview: a WhatsApp inbox, conversion metrics, a seven-day conversation chart, a lead pipeline, and a Lead to Conversion automation flow."
      className="relative"
    >
      {/* Soft brand glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-card border border-border bg-surface shadow-card-hover">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-field border border-border bg-background px-2.5 py-1.5">
            <Search className="h-3 w-3 text-text-muted" aria-hidden />
            <span className="text-[11px] text-text-muted">Search contacts, campaigns, flows</span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary-dark sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live
          </span>
        </div>

        <div className="space-y-3.5 bg-background p-3.5">
          {/* Conversion metrics */}
          <div className="grid grid-cols-3 gap-3">
            {METRICS.map((metric) => (
              <Panel key={metric.label} className="p-3">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  {metric.label}
                </p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">
                  {metric.value}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  {metric.delta}
                </p>
              </Panel>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* WhatsApp inbox */}
            <Panel>
              <PanelTitle
                action={
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary-dark">
                    3 new
                  </span>
                }
              >
                WhatsApp inbox
              </PanelTitle>
              <ul className="space-y-2.5">
                {CONVERSATIONS.map((chat) => (
                  <li key={chat.name} className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-secondary text-[11px] font-semibold text-text-secondary">
                      {chat.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-text-primary">
                          {chat.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-text-muted">{chat.time}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-text-muted">{chat.message}</span>
                        {chat.unread > 0 ? (
                          <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                            {chat.unread}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* Campaign analytics */}
            <Panel className="flex flex-col">
              <PanelTitle
                action={<span className="text-[10px] font-medium text-text-muted">Last 7 days</span>}
              >
                Conversations
              </PanelTitle>

              <div className="relative flex-1">
                {/* Recessive gridlines */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-22">
                  {[0, 1, 2].map((line) => (
                    <span
                      key={line}
                      className="absolute inset-x-0 border-t border-dashed border-chart-grid"
                      style={{ top: `${line * 44}px` }}
                    />
                  ))}
                </div>

                <div className="relative flex h-22 items-end gap-1.5">
                  {WEEK.map((point, index) => (
                    <span key={index} className="flex h-full flex-1 items-end">
                      <span
                        className="w-full rounded-t bg-chart-1"
                        style={{ height: `${Math.round((point.value / PEAK) * 76)}%` }}
                      />
                    </span>
                  ))}
                  <span className="absolute right-0 top-0 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold text-primary-dark shadow-card ring-1 ring-border">
                    97
                  </span>
                </div>

                <div className="mt-1.5 flex gap-1.5">
                  {WEEK.map((point, index) => (
                    <span key={index} className="flex-1 text-center text-[10px] text-text-muted">
                      {point.day}
                    </span>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Lead pipeline */}
          <Panel>
            <PanelTitle
              action={
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                  View leads
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </span>
              }
            >
              Lead pipeline
            </PanelTitle>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4">
              {PIPELINE.map((stage) => (
                <div key={stage.stage}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-text-muted">{stage.stage}</span>
                    <span className="text-xs font-bold text-text-primary">{stage.count}</span>
                  </div>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: stage.width }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Automation workflow */}
        <div className="border-t border-border bg-surface px-3.5 py-3">
          <div className="mb-2.5 flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            <p className="text-[11px] font-semibold text-text-primary">Automation running</p>
            <span className="text-[11px] text-text-muted">· Welcome + recovery flow</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5">
            {WORKFLOW.map((step, index) => (
              <span key={step.label} className="flex flex-1 items-center gap-1.5">
                <span className="flex flex-1 items-center gap-2 rounded-btn border border-border bg-surface px-2 py-1.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                    <step.icon className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold leading-tight text-text-primary">
                      {step.label}
                    </span>
                    <span className="block truncate text-[10px] leading-tight text-text-muted">
                      {step.caption}
                    </span>
                  </span>
                </span>
                {index < WORKFLOW.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden h-px w-3 shrink-0 bg-border-strong lg:block"
                  />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating: reply-rate lift */}
      <div className="animate-float absolute -right-4 -top-6 hidden rounded-card border border-border bg-surface p-3 shadow-float md:block">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary text-white">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Reply rate
            </span>
            <span className="block text-base font-bold leading-tight text-text-primary">+38%</span>
          </span>
        </div>
        <svg viewBox="0 0 120 36" className="mt-2 h-8 w-28" role="presentation" aria-hidden>
          <defs>
            <linearGradient id="mf-hero-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M2,30 L19,25 L36,27 L53,17 L70,20 L87,11 L104,8 L118,3 L118,36 L2,36 Z"
            fill="url(#mf-hero-spark)"
          />
          <path
            d="M2,30 L19,25 L36,27 L53,17 L70,20 L87,11 L104,8 L118,3"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="118" cy="3" r="3.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
        </svg>
      </div>

      {/* Floating: new lead toast */}
      <div className="animate-float-slow absolute -bottom-6 -left-4 hidden items-center gap-2.5 rounded-card border border-border bg-surface px-3.5 py-2.5 shadow-float md:flex">
        <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary-soft text-primary">
          <Send className="h-4 w-4" aria-hidden />
        </span>
        <span>
          <span className="block text-xs font-semibold leading-tight text-text-primary">
            New lead captured
          </span>
          <span className="block text-[11px] leading-tight text-text-muted">
            Fatima R. · WhatsApp · replied in 8s
          </span>
        </span>
      </div>
    </div>
  );
}
