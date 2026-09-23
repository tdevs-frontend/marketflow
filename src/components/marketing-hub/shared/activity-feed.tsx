import {
  AlertTriangle,
  FileText,
  Megaphone,
  TrendingUp,
  UserPlus,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CHANNEL_THEME } from "@/constants/channels";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEntry, ActivityKind } from "@/lib/overview-fixtures";

/**
 * What the icon means, per kind. Neutral grey for the routine entries and the
 * error tint only for `alert`, so a feed of twenty rows has exactly as many
 * red marks as there are things actually wrong.
 */
const KINDS: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  campaign: { icon: Megaphone, tone: "bg-surface-secondary text-text-secondary" },
  automation: { icon: Workflow, tone: "bg-surface-secondary text-text-secondary" },
  contact: { icon: UserPlus, tone: "bg-surface-secondary text-text-secondary" },
  template: { icon: FileText, tone: "bg-surface-secondary text-text-secondary" },
  conversion: { icon: TrendingUp, tone: "bg-primary-soft text-primary" },
  alert: { icon: AlertTriangle, tone: "bg-error-soft text-error" },
};

/**
 * The workspace activity feed.
 *
 * A timeline rather than a table: these entries have no columns in common, and
 * the only ordering that matters is recency. The connector line is drawn on the
 * list item rather than as a border on the icon, so the last row does not trail
 * a stub below it.
 */
export function ActivityFeed({
  entries,
  titleSize = "base",
  className,
}: {
  entries: ActivityEntry[];
  /**
   * The entry title's step on the type scale.
   *
   * `base` is the default and what the Marketing workspace uses, where the feed
   * is a half-width panel beside a ranked list set at the same step. `sm` is
   * for a panel sharing a row with `RecentConversations` or an automation list,
   * both of which title their rows at 14px - three panels side by side with two
   * title sizes between them reads as a mistake, because it is one.
   *
   * Same escape hatch as `RankedList.labelSize`, for the same reason.
   */
  titleSize?: "sm" | "base";
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0", className)}>
      {entries.map((entry, index) => {
        const { icon: Icon, tone } = KINDS[entry.kind];
        const last = index === entries.length - 1;
        const channel = entry.channel ? CHANNEL_THEME[entry.channel] : undefined;

        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  tone,
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              {last ? null : <span aria-hidden className="w-px flex-1 bg-border" />}
            </div>

            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
              <p
                className={cn(
                  "leading-snug font-semibold text-text-primary",
                  titleSize === "base" ? "text-base" : "text-sm",
                )}
              >
                {entry.title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
                {entry.detail}
              </p>

              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-meta font-medium text-text-secondary">
                {channel ? (
                  <span className="inline-flex items-center gap-1">
                    <span
                      aria-hidden
                      className={cn("size-1.5 rounded-full", channel.accent)}
                    />
                    {channel.label}
                  </span>
                ) : null}
                <span>{entry.actor}</span>
                <span aria-hidden>·</span>
                <time dateTime={entry.at}>{formatRelativeTime(entry.at)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
