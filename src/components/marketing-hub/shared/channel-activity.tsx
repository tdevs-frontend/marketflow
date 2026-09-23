import { ProgressBar } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { CHANNEL_THEME } from "@/constants/channels";
import { formatCount, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChannelActivityRow, ChannelMetric } from "@/lib/overview-fixtures";
import { ChannelMark } from "./channel-badge";

/** A metric's figure, in the form its `kind` calls for. */
function metricValue(metric: ChannelMetric): string {
  return metric.kind === "rate"
    ? formatPercent(metric.value, 0)
    : formatNumber(metric.value);
}

/**
 * One channel: what it sent, then how well it did.
 *
 * A bordered panel rather than a bare column. Four channels side by side with
 * nothing but a gutter between them read as one long row of numbers that
 * happens to have names in it; the border is what makes each one a thing being
 * compared. Flat and on the card's own surface - no shadow, no tint - so the
 * card stays the only card.
 */
function ChannelTile({ row }: { row: ChannelActivityRow }) {
  const theme = CHANNEL_THEME[row.channel];

  return (
    <li className="rounded-panel border border-border p-4">
      <div className="flex items-center gap-2">
        <ChannelMark channel={row.channel} size="sm" />
        <p className="truncate text-sm font-bold text-text-primary">
          {theme.label}
        </p>
      </div>

      {/*
        The volume, which is the half of this card that used to be a chart of
        its own. Compact in the tile and exact in the tooltip: a dashboard tile
        is glanced at, and "45.2K" is the form that survives being glanced at.
      */}
      <Tooltip
        side="bottom"
        content={
          <span className="block text-left">
            <span className="block font-bold">{theme.label}</span>
            <span className="mt-1 block">
              Volume: {formatCount(row.volume)} {row.unit}
            </span>
            <span className="mt-1 block font-bold">Performance</span>
            {row.metrics.map((metric) => (
              <span key={metric.label} className="block">
                {metric.label} {metricValue(metric)}
              </span>
            ))}
          </span>
        }
      >
        {/*
          A button because the shared `Tooltip` opens on focus as well as
          hover, and only a focusable trigger reaches that path. It does
          nothing on click by design - the tooltip is all of its behaviour.
        */}
        <button
          type="button"
          className="mt-3 cursor-default rounded-xs text-left focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span className="block text-xl leading-none font-bold text-text-primary tabular-nums">
            {formatNumber(row.volume)}
          </span>
          <span className="mt-1 block text-sm text-text-muted">{row.unit}</span>
        </button>
      </Tooltip>

      <dl className="mt-4 space-y-2.5 border-t border-border pt-3.5">
        {row.metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="truncate text-sm text-text-secondary">
                {metric.label}
              </dt>
              <dd className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                {metricValue(metric)}
              </dd>
            </div>
            {/*
              Only rates get a bar. A count has no denominator on this card -
              4,200 clicks is not 4,200% of anything - so drawing one would be
              inventing a scale to make the tile look consistent.
            */}
            {metric.kind === "rate" ? (
              <ProgressBar
                value={metric.value}
                label={`${theme.label} ${metric.label.toLowerCase()} rate`}
                tone={theme.accent}
                size="sm"
                className="mt-1.5"
              />
            ) : null}
          </div>
        ))}
      </dl>
    </li>
  );
}

/**
 * The four-way channel comparison: activity and effectiveness in one card.
 *
 * Replaces `shared/channel-performance`, which drew the same four channels as
 * a table with shared columns. That shape is right where every channel is read
 * against the same measures and revenue is the common denominator; it cannot
 * express three metrics that differ per channel without a column of em dashes
 * per row. The old component is still exported from the module barrel and has
 * no caller left - the Analytics page's `ChannelPerformanceTable` is a
 * different file under `components/analytics` that happens to share the name.
 */
export function ChannelActivity({
  rows,
  className,
}: {
  rows: ChannelActivityRow[];
  className?: string;
}) {
  return (
    <ul
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      {rows.map((row) => (
        <ChannelTile key={row.channel} row={row} />
      ))}
    </ul>
  );
}
