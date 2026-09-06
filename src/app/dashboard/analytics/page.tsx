import type { Metadata } from "next";

import { ChannelPerformanceTable } from "@/components/analytics/channel-performance-table";
import { StatCardGrid } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/format";
import type { ChannelPerformance, FunnelStep, MetricSummary } from "@/types/analytics";

export const metadata: Metadata = { title: "Analytics" };

// Placeholder figures — replace with `useGetOverviewQuery` once the API is live.
const METRICS: MetricSummary[] = [
  { key: "sent", label: "Messages sent", value: 84210, previousValue: 79800, changePercent: 5.5, format: "number" },
  { key: "delivered", label: "Delivery rate", value: 97.4, previousValue: 96.9, changePercent: 0.5, format: "percent" },
  { key: "clicks", label: "Click rate", value: 8.9, previousValue: 7.4, changePercent: 20.3, format: "percent" },
  { key: "revenue", label: "Attributed revenue", value: 92400, previousValue: 71300, changePercent: 29.6, format: "currency" },
];

const CHANNELS: ChannelPerformance[] = [
  { channel: "email", sent: 52400, delivered: 51010, opened: 21320, clicked: 4530, replied: 610, conversionRate: 3.1, revenue: 48200 },
  { channel: "whatsapp", sent: 21100, delivered: 20880, opened: 18240, clicked: 5120, replied: 3980, conversionRate: 7.8, revenue: 33900 },
  { channel: "sms", sent: 10710, delivered: 10390, opened: 9120, clicked: 1180, replied: 420, conversionRate: 2.4, revenue: 10300 },
];

const FUNNEL: FunnelStep[] = [
  { label: "Delivered", count: 82280, conversionRate: 100 },
  { label: "Opened", count: 48680, conversionRate: 59.2 },
  { label: "Clicked", count: 10830, conversionRate: 13.2 },
  { label: "Converted", count: 2140, conversionRate: 2.6 },
];

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Performance across every channel for the last 30 days."
        action={<Button variant="outline">Export report</Button>}
      />

      <StatCardGrid metrics={METRICS} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Channel performance</h2>
        <ChannelPerformanceTable rows={CHANNELS} />
      </section>

      <Card>
        <CardHeader title="Conversion funnel" description="From delivery through to purchase" />
        <CardBody className="space-y-4">
          {FUNNEL.map((step) => (
            <div key={step.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-text-primary">{step.label}</span>
                <span className="text-text-muted">
                  {formatNumber(step.count)} · {formatPercent(step.conversionRate)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${step.conversionRate}%` }}
                />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
