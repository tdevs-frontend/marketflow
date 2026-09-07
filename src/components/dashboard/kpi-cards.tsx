"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  MessageCircle,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SparklineChart } from "./charts/sparkline-chart";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Kpi {
  key: string;
  label: string;
  value: string;
  changePercent: number;
  icon: LucideIcon;
  /** Eight points across the selected window — shape only, not to scale. */
  trend: number[];
}

const KPIS: Kpi[] = [
  {
    key: "leads",
    label: "Total Leads",
    value: "12,480",
    changePercent: 18.4,
    icon: Users,
    trend: [620, 710, 680, 840, 910, 1040, 1180, 1320],
  },
  {
    key: "conversations",
    label: "WhatsApp Conversations",
    value: "8,420",
    changePercent: 24.6,
    icon: MessageCircle,
    trend: [380, 420, 510, 490, 620, 710, 790, 880],
  },
  {
    key: "orders",
    label: "Orders",
    value: "1,284",
    changePercent: 16.8,
    icon: ShoppingCart,
    trend: [118, 142, 136, 168, 186, 214, 226, 230],
  },
  {
    key: "revenue",
    label: "Revenue Generated",
    value: "$48.2K",
    changePercent: 21.5,
    icon: DollarSign,
    trend: [3800, 4200, 4050, 4900, 5400, 6100, 6800, 7400],
  },
];

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function KpiCard({ kpi }: { kpi: Kpi }) {
  const positive = kpi.changePercent >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
  const Icon = kpi.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-secondary">{kpi.label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
        {kpi.value}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="flex items-center gap-1 text-xs">
          {/* Brand green marks growth and nothing else on this card. */}
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              positive ? "text-primary" : "text-error",
            )}
          >
            <TrendIcon className="size-3.5" aria-hidden />
            {Math.abs(kpi.changePercent).toFixed(1)}%
          </span>
          <span className="text-text-muted">vs last period</span>
        </p>

        <div className="w-20 shrink-0" aria-hidden>
          <SparklineChart data={kpi.trend} trend={positive ? "up" : "down"} />
        </div>
      </div>
    </Card>
  );
}

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  );
}
