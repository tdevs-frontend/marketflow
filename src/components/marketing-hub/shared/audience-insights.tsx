import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { SparklineChart } from "@/components/dashboard/charts/sparkline-chart";
import { formatCount, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Segment } from "@/types/segment";

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/** A signed percentage, in the one shape this card repeats three times. */
function Delta({ value, className }: { value: number; className?: string }) {
  const rising = value >= 0;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-meta font-bold tabular-nums",
        rising ? "text-primary" : "text-error",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/** One of the two readings under the headline. */
function Tile({
  label,
  value,
  footnote,
  change,
}: {
  label: string;
  value: string;
  footnote?: string;
  change?: number;
}) {
  return (
    <div className="rounded-panel bg-surface-secondary px-3.5 py-3">
      <p className="truncate text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-xl leading-none font-bold text-text-primary tabular-nums">
          {value}
        </span>
        {change === undefined ? null : <Delta value={change} />}
      </p>
      {footnote ? (
        <p className="mt-1.5 truncate text-sm text-text-muted">{footnote}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Who the campaigns can reach, and which way it is moving.
 *
 * Built around the segments rather than around a contact total, because a
 * total is a number you read and a segment is a thing you send to. The chips
 * along the bottom are the card's real payload: each one is a live audience
 * with its size, and they are the shortest path from this page to a campaign.
 *
 * The sparkline plots new contacts per week over the same twelve weeks the
 * page's other charts use, so the growth figure beside the headline has a
 * shape behind it rather than being a percentage the reader has to trust.
 */
export function AudienceInsights({
  total,
  totalChange,
  newContacts,
  newContactsChange,
  topSource,
  trend,
  segments,
  segmentsHref,
}: {
  total: number;
  totalChange: number;
  newContacts: number;
  newContactsChange: number;
  topSource: { label: string; share: number };
  /** New contacts per week, for the sparkline. */
  trend: number[];
  /** The audiences worth sending to, largest first. */
  segments: Segment[];
  segmentsHref: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-secondary">
            Total audience
          </p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl leading-none font-bold text-text-primary tabular-nums">
              {formatNumber(total)}
            </span>
            <Delta value={totalChange} />
            <span className="text-sm text-text-muted">contacts</span>
          </p>
        </div>

        {/* Fixed width, so the headline beside it keeps its measure whatever
            the figures are. The sparkline is a shape, not a reading - it has
            no axes and no tooltip, and the numbers are all stated already. */}
        <div className="w-28 shrink-0" aria-hidden>
          <SparklineChart data={trend} height={44} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="New contacts"
          value={formatCount(newContacts)}
          change={newContactsChange}
          footnote="last 90 days"
        />
        <Tile
          label="Top source"
          value={topSource.label}
          footnote={`${formatPercent(topSource.share)} of new contacts`}
        />
      </div>

      <div className="border-t border-border pt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-text-primary">
            Largest segments
          </p>
          <Link
            href={segmentsHref}
            className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
          >
            All {formatNumber(segments.length)}
          </Link>
        </div>

        {/* Chips rather than rows: a segment's name and size are the whole of
            it, and four of them on one line is a picture of the audience that
            four table rows would take a third of the card to say. */}
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {segments.slice(0, 4).map((segment) => (
            <li key={segment.id}>
              <Link
                href={segmentsHref}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-meta font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
              >
                <span className="truncate">{segment.name}</span>
                <span className="font-bold text-text-primary tabular-nums">
                  {formatCount(segment.contacts)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
