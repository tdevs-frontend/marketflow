import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
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
      <p className="mt-1 text-sm text-text-secondary font-medium">
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
       * The donut answers "which channel dominates". This answers "why" - and
       * it is a table because four labelled measures across three channels is
       * tabular data, not something a second chart would read better.
       */}
      <div className="mt-5 border-t border-border pt-4">
        <Table minWidth="19rem">
          <caption className="sr-only">
            Channel metrics for WhatsApp, Email and SMS
          </caption>
          <THead>
            <TH>Metric</TH>
            {CHANNELS.map((channel) => (
              <TH key={channel.name} align="right">
                {channel.name}
              </TH>
            ))}
          </THead>
          <TBody>
            {METRIC_ROWS.map((row) => (
              <TR key={row.key}>
                <TH scope="row" className="text-text-secondary">
                  {row.label}
                </TH>
                {CHANNELS.map((channel) => (
                  <TD
                    key={channel.name}
                    align="right"
                    className="text-text-primary tabular-nums"
                  >
                    {channel[row.key]}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
