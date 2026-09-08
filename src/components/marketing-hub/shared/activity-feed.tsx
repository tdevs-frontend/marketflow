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
  className,
}: {
  entries: ActivityEntry[];
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
              <p className="text-[13px] leading-snug font-medium text-text-primary">
                {entry.title}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">{entry.detail}</p>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-muted">
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
