import { ArrowRight, Mail, MessageCircle, Smartphone, Sparkles, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const RANGES = ["7 Days", "30 Days", "90 Days", "12 Months"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Three measures of very different magnitude (leads, conversions, revenue)
 * cannot share a y-axis honestly, and a second axis is never the answer — so
 * every series is indexed to the period start at 100. That keeps one axis,
 * and the shape of each line stays truthful.
 */
type Series = { name: string; color: string; values: number[] };

const SERIES: Series[] = [
  {
    name: "Leads",
    color: "var(--color-chart-1)",
    values: [100, 108, 115, 112, 124, 133, 141, 138, 152, 166, 178, 192],
  },
  {
    name: "Conversions",
    color: "var(--color-chart-2)",
    values: [100, 103, 108, 113, 117, 115, 124, 129, 133, 139, 143, 148],
  },
  {
    name: "Revenue",
    color: "var(--color-chart-3)",
    values: [100, 105, 111, 108, 116, 124, 129, 135, 141, 152, 162, 171],
  },
];

type Campaign = { name: string; reach: string; conversion: string; width: string };

const CAMPAIGNS: Campaign[] = [
  { name: "Summer Sale", reach: "24,580", conversion: "8.4%", width: "100%" },
  { name: "Product Launch", reach: "18,240", conversion: "6.9%", width: "82%" },
  { name: "Lead Nurture", reach: "14,120", conversion: "5.6%", width: "67%" },
  { name: "Re-engagement", reach: "9,480", conversion: "4.1%", width: "49%" },
  { name: "Welcome Campaign", reach: "6,240", conversion: "3.4%", width: "38%" },
];

type Channel = {
  name: string;
  icon: LucideIcon;
  messages: string;
  delivered: string;
  replies: string;
  conversion: string;
};

const CHANNELS: Channel[] = [
  {
    name: "WhatsApp",
    icon: MessageCircle,
    messages: "84,290",
    delivered: "98.4%",
    replies: "38.2%",
    conversion: "12.8%",
  },
  {
    name: "Email",
    icon: Mail,
    messages: "42,850",
    delivered: "94.2%",
    replies: "12.4%",
    conversion: "8.4%",
  },
  {
    name: "SMS",
    icon: Smartphone,
    messages: "18,420",
    delivered: "97.1%",
    replies: "9.1%",
    conversion: "6.2%",
  },
];

/** Widths stay strictly proportional — the narrowing *is* the story. */
const FUNNEL = [
  { stage: "Visitors", value: "48,920", width: "100%" },
  { stage: "Leads", value: "12,480", width: "25.5%" },
  { stage: "Engaged", value: "7,820", width: "16%" },
  { stage: "Qualified", value: "4,240", width: "8.7%" },
  { stage: "Customers", value: "3,095", width: "6.3%" },
];

const ACTIVITY = [
  { text: "Campaign delivered to 1,240 contacts", time: "just now" },
  { text: "New lead captured from landing page", time: "1m" },
  { text: "WhatsApp reply received", time: "3m" },
  { text: "Automation completed", time: "6m" },
  { text: "Customer converted", time: "11m" },
];

/* -------------------------------------------------------------------------- */
/* Chart geometry                                                             */
/* -------------------------------------------------------------------------- */

const VIEW = { width: 720, height: 240, top: 16, right: 56, bottom: 26, left: 8 };
const DOMAIN = { min: 95, max: 200 };
const GRID = [100, 125, 150, 175, 200];

const plotWidth = VIEW.width - VIEW.left - VIEW.right;
const plotHeight = VIEW.height - VIEW.top - VIEW.bottom;

const pointX = (index: number, length: number) =>
  VIEW.left + (index / (length - 1)) * plotWidth;

const pointY = (value: number) =>
  VIEW.top + plotHeight - ((value - DOMAIN.min) / (DOMAIN.max - DOMAIN.min)) * plotHeight;

function linePath(values: number[]) {
  return values
    .map((value, index) => `${index === 0 ? "M" : "L"}${pointX(index, values.length)},${pointY(value)}`)
    .join(" ");
}

function areaPath(values: number[]) {
  const base = VIEW.top + plotHeight;
  return `${linePath(values)} L${pointX(values.length - 1, values.length)},${base} L${VIEW.left},${base} Z`;
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PanelHead({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        {note ? <p className="mt-0.5 text-xs text-text-muted">{note}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Panels                                                                     */
/* -------------------------------------------------------------------------- */

function GrowthChart() {
  const endLabels = SERIES.map((series) => ({
    name: series.name,
    color: series.color,
    x: (pointX(series.values.length - 1, series.values.length) / VIEW.width) * 100,
    y: (pointY(series.values[series.values.length - 1]) / VIEW.height) * 100,
  }));

  return (
    <Panel className="flex flex-col">
      <PanelHead
        title="Growth Overview"
        note="Indexed to period start = 100"
        action={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark sm:inline-flex">
              <TrendingUp className="size-3" aria-hidden />
              32.8% growth this month
            </span>
            <div
              role="group"
              aria-label="Date range"
              className="flex items-center gap-0.5 rounded-btn border border-border bg-background p-0.5"
            >
              {RANGES.map((range, index) => (
                <span
                  key={range}
                  aria-current={index === 1 ? "true" : undefined}
                  className={cn(
                    "rounded-[7px] px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                    index === 1
                      ? "bg-surface text-text-primary shadow-card"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  {range}
                </span>
              ))}
            </div>
          </div>
        }
      />

      {/* Legend — identity never rests on color alone. */}
      <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {SERIES.map((series) => (
          <li key={series.name} className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.name}
          </li>
        ))}
      </ul>

      <div className="relative aspect-[3/1] w-full flex-1">
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          role="img"
          aria-label="Leads, conversions and revenue rising over twelve months, each indexed to 100 at the period start."
        >
          <defs>
            <linearGradient id="mf-growth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {GRID.map((value) => (
            <line
              key={value}
              x1={VIEW.left}
              x2={VIEW.width - VIEW.right}
              y1={pointY(value)}
              y2={pointY(value)}
              stroke="var(--color-chart-grid)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={areaPath(SERIES[0].values)} fill="url(#mf-growth-fill)" />

          {SERIES.map((series) => (
            <path
              key={series.name}
              d={linePath(series.values)}
              fill="none"
              stroke={series.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {SERIES.map((series) => (
            <circle
              key={series.name}
              cx={pointX(series.values.length - 1, series.values.length)}
              cy={pointY(series.values[series.values.length - 1])}
              r="4"
              fill={series.color}
              stroke="var(--color-surface)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Direct labels in text ink — the two lighter hues sit under 3:1 on
            white, so identity is carried by the swatch plus a readable label. */}
        {endLabels.map((label) => (
          <span
            key={label.name}
            className="absolute flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-text-primary"
            style={{ left: `${label.x + 1.4}%`, top: `${label.y}%` }}
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
          </span>
        ))}
      </div>

      <div className="mt-2 flex">
        {MONTHS.map((month, index) => (
          <span
            key={month}
            className={cn(
              "flex-1 text-center text-[11px] text-text-muted",
              index % 2 === 1 && "max-sm:hidden",
            )}
          >
            {month}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function CampaignPerformance() {
  return (
    <Panel>
      <PanelHead title="Campaign Performance" note="Reach and conversion, last 30 days" />
      <ul className="space-y-3.5">
        {CAMPAIGNS.map((campaign, index) => (
          <li key={campaign.name} className="group -mx-2 rounded-btn px-2 py-1 transition-colors hover:bg-primary-subtle">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-text-primary">
                  {campaign.name}
                </span>
                {index === 0 ? (
                  <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-primary-dark">
                    Top performing
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-text-muted tabular-nums">
                {campaign.reach} reach
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    index === 0 ? "bg-primary" : "bg-primary/60",
                  )}
                  style={{ width: campaign.width }}
                />
              </span>
              <span className="w-11 shrink-0 text-right text-sm font-semibold text-text-primary tabular-nums">
                {campaign.conversion}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ChannelPerformance() {
  return (
    <Panel>
      <PanelHead title="Channel Performance" note="Delivery and reply quality" />
      <ul className="space-y-4">
        {CHANNELS.map((channel) => (
          <li key={channel.name}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
                <channel.icon className="size-3.5" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-semibold text-text-primary">{channel.name}</span>
              <span className="text-xs text-text-muted tabular-nums">{channel.messages} msgs</span>
            </div>
            <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: channel.delivered }}
              />
            </span>
            <dl className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
              <span className="flex gap-1">
                <dt>Delivered</dt>
                <dd className="font-semibold text-text-secondary tabular-nums">
                  {channel.delivered}
                </dd>
              </span>
              <span className="flex gap-1">
                <dt>Replies</dt>
                <dd className="font-semibold text-text-secondary tabular-nums">
                  {channel.replies}
                </dd>
              </span>
              <span className="flex gap-1">
                <dt>Conv.</dt>
                <dd className="font-semibold text-primary tabular-nums">{channel.conversion}</dd>
              </span>
            </dl>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ConversionFunnel() {
  return (
    <Panel>
      <PanelHead
        title="Conversion Funnel"
        action={
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
            24.8% lead-to-customer
          </span>
        }
      />
      <ol className="space-y-2.5">
        {FUNNEL.map((step, index) => {
          const last = index === FUNNEL.length - 1;
          return (
            <li key={step.stage} className="group">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "text-xs",
                    last ? "font-semibold text-primary-dark" : "text-text-secondary",
                  )}
                >
                  {step.stage}
                </span>
                <span className="text-sm font-semibold text-text-primary tabular-nums">
                  {step.value}
                </span>
              </div>
              <span className="mt-1 block h-2.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                <span
                  className={cn(
                    "block h-full rounded-full transition-opacity group-hover:opacity-90",
                    last ? "bg-secondary" : "bg-primary/70",
                  )}
                  style={{ width: step.width }}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function LiveActivity() {
  return (
    <Panel>
      <PanelHead
        title="Live Activity"
        action={
          <span className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary">
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-secondary" />
            </span>
            Live data
          </span>
        }
      />
      <ul className="space-y-2.5">
        {ACTIVITY.map((item) => (
          <li key={item.text} className="flex items-center gap-2.5">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-secondary" />
            <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
              {item.text}
            </span>
            <span className="shrink-0 text-[11px] text-text-muted">{item.time}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function GrowthInsight() {
  return (
    <Panel className="flex flex-col justify-between bg-primary-soft/40">
      <div>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-btn bg-surface text-primary">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <h3 className="text-base font-bold text-text-primary">Growth Insight</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Your WhatsApp campaigns are generating{" "}
          <span className="font-semibold text-primary-dark">42% more conversions</span> than email
          campaigns this month.
        </p>
      </div>
      <p className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        View campaign insights
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </p>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * DOM order is the mobile reading order the brief asks for; `lg:order-*` plus a
 * row span lifts the insight and activity panels beside the chart on desktop.
 */
export function AnalyticsDashboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:order-1 lg:col-span-8 lg:row-span-2">
        <GrowthChart />
      </div>

      <div className="lg:order-4 lg:col-span-5">
        <CampaignPerformance />
      </div>

      <div className="lg:order-5 lg:col-span-4">
        <ChannelPerformance />
      </div>

      <div className="lg:order-6 lg:col-span-3">
        <ConversionFunnel />
      </div>

      <div className="lg:order-3 lg:col-span-4">
        <LiveActivity />
      </div>

      <div className="lg:order-2 lg:col-span-4">
        <GrowthInsight />
      </div>
    </div>
  );
}
