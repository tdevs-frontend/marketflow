import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CommerceKpi {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tints the icon tile. Defaults to neutral — green is for good news only. */
  tone?: "neutral" | "brand" | "warning" | "danger";
  hint?: string;
}

const TONES = {
  neutral: "bg-surface-secondary text-text-muted",
  brand: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-error-soft text-error-text",
} as const;

/**
 * The KPI strip every Commerce page opens with. Four or five tiles, one line
 * each — a merchant should read the state of the page before scrolling.
 */
export function CommerceKpis({
  items,
  className,
}: {
  items: CommerceKpi[];
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

        return (
          <Card key={item.label} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium text-text-secondary">
                {item.label}
              </p>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-btn",
                  TONES[item.tone ?? "neutral"],
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
            </div>

            <p className="mt-2.5 text-2xl leading-none font-bold text-text-primary">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-2 text-xs text-text-muted">{item.hint}</p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
