import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChannelPerformanceChart } from "./charts/channel-performance-chart";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Channel {
  name: string;
  /** Share of total marketing contribution. */
  share: number;
  messages: string;
  deliveryRate: string;
  engagement: string;
  conversions: string;
  /** Matches the donut's slice colour, which comes from `SERIES_COLORS`. */
  swatch: string;
}

const CHANNELS: Channel[] = [
  {
    name: "WhatsApp",
    share: 68,
    messages: "84,290",
    deliveryRate: "98.4%",
    engagement: "38.2%",
    conversions: "10,780",
    swatch: "bg-primary",
  },
  {
    name: "Email",
    share: 24,
    messages: "42,850",
    deliveryRate: "94.2%",
    engagement: "12.4%",
    conversions: "3,804",
    swatch: "bg-accent",
  },
  {
    name: "SMS",
    share: 8,
    messages: "18,420",
    deliveryRate: "97.1%",
    engagement: "9.1%",
    conversions: "1,268",
    swatch: "bg-border-strong",
  },
];

const METRIC_ROWS = [
  { key: "messages", label: "Messages" },
  { key: "deliveryRate", label: "Delivery rate" },
  { key: "engagement", label: "Engagement" },
  { key: "conversions", label: "Conversions" },
] as const;

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function ChannelPerformance({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <h2 className="text-base">Channel Performance</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Where your marketing results are coming from.
      </p>

      <div className="mt-4">
        <ChannelPerformanceChart
          labels={CHANNELS.map((channel) => channel.name)}
          values={CHANNELS.map((channel) => channel.share)}
          totalLabel="Messages sent"
          totalValue="145.5K"
        />
      </div>

      <ul className="mt-4 space-y-2">
        {CHANNELS.map((channel) => (
          <li
            key={channel.name}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-text-secondary">
              <span aria-hidden className={cn("size-2 rounded-full", channel.swatch)} />
              {channel.name}
            </span>
            <span className="font-bold text-text-primary tabular-nums">
              {channel.share}%
            </span>
          </li>
        ))}
      </ul>

      {/*
       * The donut answers "which channel dominates". This answers "why" — and
       * it is a table because four labelled measures across three channels is
       * tabular data, not something a second chart would read better.
       */}
      <div className="mt-5 -mx-1 overflow-x-auto border-t border-border pt-4">
        <table className="w-full min-w-76 text-left text-[13px]">
          <caption className="sr-only">
            Channel metrics for WhatsApp, Email and SMS
          </caption>
          <thead>
            <tr className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
              <th scope="col" className="pb-2 font-medium">
                Metric
              </th>
              {CHANNELS.map((channel) => (
                <th key={channel.name} scope="col" className="pb-2 text-right font-medium">
                  {channel.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {METRIC_ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="py-2 font-medium text-text-secondary">
                  {row.label}
                </th>
                {CHANNELS.map((channel) => (
                  <td
                    key={channel.name}
                    className="py-2 text-right font-medium text-text-primary tabular-nums"
                  >
                    {channel[row.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
