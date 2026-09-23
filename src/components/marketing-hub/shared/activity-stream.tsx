import {
  Plug,
  Rocket,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CHANNEL_THEME } from "@/constants/channels";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ActivityCategory,
  ActivityEntry,
  ActivityKind,
  ActivityState,
} from "@/lib/overview-fixtures";

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The four groups, in the order a marketer works through them: what went out,
 * what ran itself, who it went to, and what carried it.
 */
const CATEGORIES: {
  key: ActivityCategory;
  label: string;
  icon: LucideIcon;
  /** Chip colours for the group heading. */
  chip: string;
}[] = [
  {
    key: "campaign",
    label: "Campaigns",
    icon: Rocket,
    chip: "border-primary-border bg-primary-soft text-primary-dark",
  },
  {
    key: "automation",
    label: "Automation",
    icon: Zap,
    chip: "border-sms-border bg-sms-soft text-sms-dark",
  },
  {
    key: "audience",
    label: "Audience",
    icon: Users,
    chip: "border-info/20 bg-info-soft text-info-text",
  },
  {
    key: "channel",
    label: "Channel",
    icon: Plug,
    chip: "border-border bg-surface-secondary text-text-secondary",
  },
];

/**
 * Where an entry lands when it does not name its own category.
 *
 * A fallback, not the rule: `kind` describes how a row should *look* and
 * `category` what it is *about*, and the two part company on exactly the rows
 * that matter - a failed campaign is an alert and belongs under Campaigns.
 * Entries that set `category` bypass this entirely.
 */
const KIND_CATEGORY: Record<ActivityKind, ActivityCategory> = {
  campaign: "campaign",
  conversion: "campaign",
  automation: "automation",
  contact: "audience",
  template: "channel",
  alert: "channel",
};

const STATES: Record<ActivityState, { label: string; tone: BadgeTone }> = {
  running: { label: "Running", tone: "info" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  completed: { label: "Completed", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  attention: { label: "Action needed", tone: "warning" },
};

/* -------------------------------------------------------------------------- */
/* Stream                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The Marketing workspace's activity stream.
 *
 * Grouped by what the event is about rather than listed by when it happened,
 * which is the one thing that separates it from the merchant overview's
 * Automation Activity and from `ActivityFeed`, the plain timeline the WhatsApp
 * module still uses. A timeline answers "what happened last"; this answers
 * "what is going on with my campaigns", and a marketer scanning for a failed
 * send should not have to read six automation rows to find it.
 *
 * There is deliberately no connector line. A vertical rail says these rows are
 * one sequence, and once the list is grouped they are four short sequences -
 * the rail would be drawing a relationship that is no longer there.
 *
 * Colour comes from the *channel*, not the category: the icon tile takes the
 * hue of whatever carried the event, so WhatsApp rows are green and Email rows
 * blue down the whole stream, while the glyph inside stays the category's. The
 * group chip is the only place a category colour appears, which keeps four
 * tints in the panel instead of eight.
 */
export function ActivityStream({
  entries,
  className,
}: {
  entries: ActivityEntry[];
  className?: string;
}) {
  const groups = CATEGORIES.map((category) => ({
    ...category,
    entries: entries.filter(
      (entry) => (entry.category ?? KIND_CATEGORY[entry.kind]) === category.key,
    ),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className={cn("space-y-5", className)}>
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-meta font-bold",
                group.chip,
              )}
            >
              <group.icon className="size-3" aria-hidden />
              {group.label}
            </span>
            <span className="text-meta font-medium text-text-muted tabular-nums">
              {group.entries.length}
            </span>
            {/* The rule fills the rest of the line so the chip reads as a
                divider between groups rather than as a loose badge. */}
            <span aria-hidden className="h-px flex-1 bg-border" />
          </h3>

          <ul className="mt-2.5 space-y-0.5">
            {group.entries.map((entry) => {
              const channel = entry.channel
                ? CHANNEL_THEME[entry.channel]
                : undefined;
              const state = entry.state ? STATES[entry.state] : undefined;

              return (
                <li
                  key={entry.id}
                  className="-mx-2 flex items-start gap-3 rounded-panel px-2 py-2 transition-colors hover:bg-surface-secondary"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-panel",
                      channel
                        ? cn(channel.soft, channel.text)
                        : "bg-surface-secondary text-text-muted",
                    )}
                  >
                    <group.icon className="size-4" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-semibold text-text-primary">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-text-secondary">
                      {channel ? (
                        <>
                          <span className="font-medium">{channel.label}</span>
                          <span aria-hidden>•</span>
                        </>
                      ) : null}
                      <span className="min-w-0">{entry.detail}</span>
                    </p>
                  </div>

                  {/* Status over time, right-aligned: the badge is the thing
                      being scanned for and the timestamp qualifies it. */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {state ? (
                      <Badge tone={state.tone} size="sm">
                        {state.label}
                      </Badge>
                    ) : null}
                    <time
                      dateTime={entry.at}
                      className="text-meta font-medium text-text-muted"
                    >
                      {formatRelativeTime(entry.at)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
