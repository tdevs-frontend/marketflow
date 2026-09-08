import Link from "next/link";

import { ProgressBar } from "@/components/ui/progress";
import { CHANNEL_THEME } from "@/constants/channels";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { TopCampaignRow } from "@/lib/overview-fixtures";
import { ChannelMark } from "./channel-badge";

/**
 * Best-performing campaigns.
 *
 * Ranked by conversion rate rather than revenue, which is the ranking that
 * tells you what to do next: the highest-revenue campaign is usually just the
 * one sent to the largest list. Revenue is still shown, because a 39% rate on
 * 218 recipients and a 11% rate on 11,840 are different kinds of good.
 */
export function TopCampaigns({
  rows,
  hrefFor,
}: {
  rows: TopCampaignRow[];
  /** Where a row links. Omit for a read-only panel. */
  hrefFor?: (row: TopCampaignRow) => string;
}) {
  const best = Math.max(...rows.map((row) => row.conversionRate), 1);

  return (
    <ol className="space-y-1">
      {rows.map((row, index) => {
        const theme = CHANNEL_THEME[row.channel];
        const href = hrefFor?.(row);

        const body = (
          <>
            <span className="w-4 shrink-0 text-xs font-bold text-text-muted tabular-nums">
              {index + 1}
            </span>

            <ChannelMark channel={row.channel} size="sm" />

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-text-primary">
                {row.name}
              </span>
              <span className="mt-1 flex items-center gap-2">
                <ProgressBar
                  value={(row.conversionRate / best) * 100}
                  label={`${row.name} conversion rate`}
                  tone={theme.accent}
                  size="sm"
                  className="max-w-28"
                />
                <span className="text-[11px] text-text-muted tabular-nums">
                  {formatNumber(row.sent)} sent
                </span>
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold text-text-primary tabular-nums">
                {formatPercent(row.conversionRate)}
              </span>
              <span className="block text-[11px] text-text-muted tabular-nums">
                {formatCurrency(row.revenue)}
              </span>
            </span>
          </>
        );

        return (
          <li key={row.id}>
            {href ? (
              <Link
                href={href}
                className="flex items-center gap-3 rounded-panel px-2 py-2.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-2 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
