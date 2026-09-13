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

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Kpi {
  key: string;
  label: string;
  value: string;
  changePercent: number;
  icon: LucideIcon;
}

const KPIS: Kpi[] = [
  {
    key: "leads",
    label: "Total Leads",
    value: "12,480",
    changePercent: 18.4,
    icon: Users,
  },
  {
    key: "conversations",
    label: "WhatsApp Conversations",
    value: "8,420",
    changePercent: 24.6,
    icon: MessageCircle,
  },
  {
    key: "orders",
    label: "Orders",
    value: "1,284",
    changePercent: 16.8,
    icon: ShoppingCart,
  },
  {
    key: "revenue",
    label: "Revenue Generated",
    value: "$48.2K",
    changePercent: 21.5,
    icon: DollarSign,
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

      <p className="mt-3 flex items-center gap-1 text-sm">
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
