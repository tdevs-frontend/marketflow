"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MarketingStat {
  label: string;
  value: string;
  /** Signed. Positive is brand green, negative is red — nothing else is. */
  changePercent: number;
  icon: LucideIcon;
  hint: string;
  /** Flips the colouring where a fall is the good outcome (bounces, opt-outs). */
  invertTrend?: boolean;
}

export function MarketingStats({
  items,
  className,
}: {
  items: MarketingStat[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        items.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const rising = item.changePercent >= 0;
        const good = item.invertTrend ? !rising : rising;
        const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium text-text-secondary">
                {item.label}
              </p>
              <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>

            <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
              {item.value}
            </p>

            <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  good ? "text-primary" : "text-error",
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden />
                {Math.abs(item.changePercent).toFixed(1)}%
              </span>
              <span className="text-text-muted">{item.hint}</span>
            </p>
          </Card>
        );
      })}
    </div>
  );
}
