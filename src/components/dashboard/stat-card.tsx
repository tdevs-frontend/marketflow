import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { MetricSummary } from "@/types/analytics";

function formatValue(value: number, format: MetricSummary["format"]) {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "duration":
      return `${Math.round(value)}m`;
    default:
      return formatNumber(value);
  }
}

export function StatCard({ metric }: { metric: MetricSummary }) {
  const positive = metric.changePercent >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="p-5" interactive>
      <p className="text-sm font-medium text-text-muted">{metric.label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
        {formatValue(metric.value, metric.format)}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex items-center gap-1 text-xs font-medium",
          positive ? "text-primary":"text-error",
        )}
      >
        <TrendIcon className="h-3.5 w-3.5" />
        {formatPercent(Math.abs(metric.changePercent))}
        <span className="font-normal text-text-muted">vs last period</span>
      </p>
    </Card>
  );
}

export function StatCardGrid({ metrics }: { metrics: MetricSummary[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <StatCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}
