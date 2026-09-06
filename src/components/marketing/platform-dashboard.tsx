import { MessageCircle, Send, TrendingUp, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

type Kpi = { label: string; value: string; change: string };

const KPIS: Kpi[] = [
  { label: "Total Leads", value: "12,480", change: "+18.4%" },
  { label: "WhatsApp Conversations", value: "8,420", change: "+24.6%" },
  { label: "Campaign Conversion", value: "24.8%", change: "+8.2%" },
  { label: "Revenue Generated", value: "$48.2K", change: "+21.5%" },
];

/** Lead growth, six months. One series, one hue. */
const GROWTH = [38, 45, 42, 58, 71, 86];
const GROWTH_PEAK = Math.max(...GROWTH);

type Campaign = { name: string; rate: string; width: string };

const CAMPAIGNS: Campaign[] = [
  { name: "Festive launch", rate: "32%", width: "88%" },
  { name: "Cart recovery", rate: "26%", width: "68%" },
  { name: "Re-engagement", rate: "18%", width: "46%" },
];

type FunnelStep = { label: string; value: string; width: string };

const FUNNEL: FunnelStep[] = [
  { label: "Reached", value: "24.6K", width: "100%" },
  { label: "Engaged", value: "9.8K", width: "58%" },
  { label: "Converted", value: "2.4K", width: "26%" },
];

const CHANNELS = ["WhatsApp", "Email", "SMS"];

type Conversation = { initials: string; name: string; preview: string; time: string };

const CONVERSATIONS: Conversation[] = [
  { initials: "SM", name: "Sarah Mitchell", preview: "Premium package details", time: "2m" },
  { initials: "DO", name: "Daniel Okafor", preview: "Order confirmed", time: "14m" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.06em] text-text-muted uppercase">
      {children}
    </p>
  );
}

export function PlatformDashboard({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="MarketFlow command center: total leads, WhatsApp conversations, campaign conversion and revenue, with lead growth, campaign performance, a conversion funnel and live conversations."
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface shadow-card-hover",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-4">
        <h3 className="text-sm font-bold text-text-primary">Marketing Overview</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
          <TrendingUp className="size-3" aria-hidden />
          32.8% overall growth
        </span>
        <ul className="ml-auto flex items-center gap-3">
          {CHANNELS.map((channel) => (
            <li key={channel} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
              {channel}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 bg-background p-4">
        {/* KPIs */}
        <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="rounded-panel border border-border bg-surface p-3.5">
              <dt className="truncate text-[11px] font-medium text-text-muted">{kpi.label}</dt>
              <dd className="mt-1.5 font-heading text-xl font-bold tracking-tight text-text-primary tabular-nums">
                {kpi.value}
              </dd>
              <dd className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                <TrendingUp className="size-3" aria-hidden />
                {kpi.change}
              </dd>
            </div>
          ))}
        </dl>

        {/* Charts */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-panel border border-border bg-surface p-3.5">
            <SectionLabel>Lead growth</SectionLabel>
            <div className="mt-3 flex h-20 items-end gap-1.5">
              {GROWTH.map((point, index) => (
                <span key={index} className="flex h-full flex-1 items-end">
                  <span
                    className="w-full rounded-t bg-chart-1"
                    style={{ height: `${Math.round((point / GROWTH_PEAK) * 100)}%` }}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-panel border border-border bg-surface p-3.5">
            <SectionLabel>Campaign performance</SectionLabel>
            <ul className="mt-3 space-y-2.5">
              {CAMPAIGNS.map((campaign) => (
                <li key={campaign.name}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] text-text-secondary">{campaign.name}</span>
                    <span className="text-[11px] font-semibold text-text-primary tabular-nums">
                      {campaign.rate}
                    </span>
                  </div>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: campaign.width }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Funnel · conversations · automations */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-panel border border-border bg-surface p-3.5">
            <SectionLabel>Conversion funnel</SectionLabel>
            <ul className="mt-3 space-y-2">
              {FUNNEL.map((step) => (
                <li key={step.label} className="flex items-center gap-2.5">
                  <span className="w-16 shrink-0 text-[11px] text-text-secondary">{step.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: step.width }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-[11px] font-semibold text-text-primary tabular-nums">
                    {step.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="rounded-panel border border-border bg-surface p-3.5">
              <SectionLabel>Recent conversations</SectionLabel>
              <ul className="mt-2.5 space-y-2">
                {CONVERSATIONS.map((chat) => (
                  <li key={chat.name} className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-secondary text-[10px] font-semibold text-text-secondary">
                      {chat.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-text-primary">
                        {chat.name}
                      </span>
                      <span className="block truncate text-[11px] text-text-muted">
                        {chat.preview}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-text-muted">{chat.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 rounded-panel border border-border bg-surface p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
                <Workflow className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-bold text-text-primary">
                  8 automations
                </span>
                <span className="block text-[11px] text-text-muted">Running right now</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-text-muted" aria-hidden>
                <MessageCircle className="size-3.5" />
                <Send className="size-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
