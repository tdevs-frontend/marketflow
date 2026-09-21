import { Heart, Image as ImageIcon, MessageSquare, Repeat2 } from "lucide-react";

import { BrandIcon } from "@/components/ui/brand-icon";
import { PanelLabel, ProductFrame } from "./feature-section";

/**
 * The Social Planner: a week of the calendar, one post, and what it did.
 *
 * Three things in one frame because that is the whole loop the module covers —
 * plan it, see it, measure it — and three separate panels would make the
 * section longer without making it clearer.
 *
 * The calendar is a real week grid with posts landing on specific days rather
 * than a filled-in block per cell: scheduling software is recognisable by its
 * gaps, and a week where every day is booked reads as a placeholder.
 *
 * Platforms come from the connected accounts the Planner actually supports —
 * Facebook, Instagram, LinkedIn, X — so nothing here promises a network the
 * product cannot publish to.
 */

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Day index → the platforms scheduled that day. */
const SCHEDULE: Record<number, string[]> = {
  1: ["instagram"],
  2: ["facebook", "linkedin"],
  4: ["instagram", "x"],
  5: ["facebook"],
};

const PLATFORM_DOT: Record<string, string> = {
  facebook: "bg-info",
  instagram: "bg-tint-fuchsia-ink",
  linkedin: "bg-email",
  x: "bg-text-primary",
};

const STATS = [
  { label: "Reach", value: "24.6K", icon: Repeat2 },
  { label: "Engagement", value: "3,180", icon: Heart },
  { label: "Comments", value: "214", icon: MessageSquare },
];

export function SocialVisual() {
  return (
    <ProductFrame path="/dashboard/marketing/social/calendar" status="12 scheduled">
      <div className="space-y-3 bg-background p-3 sm:p-4">
        {/* The week */}
        <div className="rounded-panel border border-border bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <PanelLabel>September</PanelLabel>
            <span className="text-[11px] text-text-muted">Week 38</span>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-1.5">
            {DAYS.map((day, index) => {
              const posts = SCHEDULE[index] ?? [];

              return (
                <div
                  key={index}
                  className="min-h-14 rounded-btn border border-border bg-surface-secondary/50 p-1.5"
                >
                  <span className="block text-[10px] font-semibold text-text-muted">
                    {day}
                    <span className="ml-0.5 tabular-nums">{15 + index}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {posts.map((platform) => (
                      <span
                        key={platform}
                        aria-hidden
                        className={`h-1.5 w-full rounded-full ${PLATFORM_DOT[platform]}`}
                      />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* The post itself */}
          <div className="rounded-panel border border-border bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-secondary">
                <BrandIcon name="instagram" className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-text-primary">
                  MarketFlow Studio
                </span>
                <span className="block text-[10px] text-text-muted">
                  Thu 18 Sep · 09:00
                </span>
              </span>
            </div>

            <div
              aria-hidden
              className="mt-2.5 grid aspect-16/9 place-items-center rounded-btn border border-border bg-[linear-gradient(135deg,var(--color-primary-soft),var(--color-primary-subtle))] text-primary/50"
            >
              <ImageIcon className="size-6" />
            </div>

            <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-text-secondary">
              The autumn edit is live. Twelve pieces, made in Dhaka, ready to
              ship this week.
            </p>
          </div>

          {/* What it did */}
          <div className="rounded-panel border border-border bg-surface p-3">
            <PanelLabel>Performance</PanelLabel>
            <ul className="mt-2.5 space-y-2.5">
              {STATS.map((stat) => (
                <li key={stat.label} className="flex items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
                    <stat.icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-text-secondary">
                    {stat.label}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                    {stat.value}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-text-muted">
              4 accounts connected
            </p>
          </div>
        </div>
      </div>
    </ProductFrame>
  );
}
