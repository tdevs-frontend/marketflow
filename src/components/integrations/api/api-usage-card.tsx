"use client";

import { useState } from "react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MeterRow } from "@/components/ui/progress";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiUsage } from "@/types/integration";

/**
 * API traffic, compactly.
 *
 * The 24 bars are plain divs rather than an Apex chart. That is a deliberate
 * exception to the module's "reuse what exists" rule: this is a shape, not a
 * plot - it has no axes, no tooltipped series and no period switcher, and
 * loading a charting runtime to draw 24 rectangles in a 22rem rail costs more
 * than the information is worth. Anything with an axis still goes to
 * `ChartCard`.
 *
 * Hovering or focusing a bar writes its hour and count into the figure above
 * the chart rather than into 24 tooltips. One readout in a fixed position is
 * easier to read along a row than a bubble that moves with the cursor, it
 * cannot be clipped by the rail, and it doubles as the live region that makes
 * the shape reachable by keyboard.
 */
export function ApiUsageCard({
  usage,
  className,
}: {
  usage: ApiUsage;
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const peak = Math.max(...usage.hourly, 1);
  const rateUsedPercent = (usage.rateLimitUsed / usage.rateLimit) * 100;

  const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

  return (
    <Card className={className}>
      <CardHeader
        title="API Usage"
        description="Requests over the last 24 hours, and the hourly ceiling."
      />
      <CardBody className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-text-secondary">
              {hovered === null ? "Requests" : hourLabel(hovered)}
            </p>
            <p
              /* Announced on change so a keyboard user arrowing the bars hears
                 the value the sighted reader sees. */
              aria-live="polite"
              className="text-sm font-bold text-text-primary tabular-nums"
            >
              {formatCount(
                hovered === null ? usage.requests24h : usage.hourly[hovered],
              )}
            </p>
          </div>

          {/* `items-end` so every bar grows from a common baseline. */}
          <div
            className="mt-3 flex h-20 items-end gap-0.5"
            onPointerLeave={() => setHovered(null)}
          >
            {usage.hourly.map((value, hour) => (
              <button
                key={hour}
                type="button"
                aria-label={`${hourLabel(hour)} - ${formatCount(value)} requests`}
                onPointerEnter={() => setHovered(hour)}
                onFocus={() => setHovered(hour)}
                onBlur={() => setHovered(null)}
                className="flex h-full min-w-0 flex-1 items-end rounded-[2px] focus-visible:shadow-focus focus-visible:outline-none"
              >
                <span
                  aria-hidden
                  style={{ height: `${Math.max((value / peak) * 100, 4)}%` }}
                  className={cn(
                    "w-full rounded-[2px] transition-colors",
                    hovered === hour || (hovered === null && value === peak)
                      ? "bg-primary"
                      : "bg-primary-soft-hover",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="mt-1.5 flex justify-between text-meta text-text-muted">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>

        <MeterRow
          label="Rate limit"
          value={rateUsedPercent}
          display={`${formatCount(usage.rateLimitUsed)} / ${formatCount(usage.rateLimit)}`}
          tone={rateUsedPercent > 80 ? "bg-warning" : "bg-primary"}
          hint="Requests allowed per hour on your plan"
        />
      </CardBody>
    </Card>
  );
}
