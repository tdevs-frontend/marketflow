import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { CHANNEL_THEME } from "@/constants/channels";
import { formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChannelRow } from "@/lib/overview-fixtures";
import { ChannelBadge } from "./channel-badge";

/**
 * The four-way channel comparison.
 *
 * Social is in the same table as the messaging channels but not measuring the
 * same thing — 742 posts against 317,800 messages — so the volume column is
 * labelled by the row rather than by the header, and revenue is what makes the
 * four rows genuinely comparable.
 */
export function ChannelPerformanceTable({ rows }: { rows: ChannelRow[] }) {
  const topRevenue = Math.max(...rows.map((row) => row.revenue), 1);

  return (
    <Table minWidth="46rem">
      <THead>
        <TH>Channel</TH>
        <TH align="right">Volume</TH>
        <TH align="right">Engaged</TH>
        <TH align="right">Conversions</TH>
        <TH align="right">Revenue</TH>
        <TH>Share of revenue</TH>
      </THead>

      <TBody>
        {rows.map((row) => {
          const theme = CHANNEL_THEME[row.channel];
          const rising = row.change >= 0;
          const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

          return (
            <TR key={row.channel}>
              <TD>
                <ChannelBadge channel={row.channel} />
              </TD>

              <TD align="right" className="tabular-nums">
                <span className="font-medium text-text-primary">
                  {formatNumber(row.sent)}
                </span>
                <span className="block text-[11px] text-text-muted">
                  {row.channel === "social" ? "posts" : "messages"}
                </span>
              </TD>

              <TD align="right" className="tabular-nums">
                {row.engaged === 0 ? (
                  /* SMS has no read receipt, so this is genuinely unavailable
                     rather than zero — an em dash says so, a 0 would not. */
                  <span className="text-text-muted">—</span>
                ) : (
                  <>
                    <span className="text-text-secondary">
                      {formatNumber(row.engaged)}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {row.channel === "social"
                        ? "impressions"
                        : formatPercent(rate(row.engaged, row.delivered))}
                    </span>
                  </>
                )}
              </TD>

              <TD align="right" className="tabular-nums">
                <span className="font-medium text-text-primary">
                  {formatNumber(row.conversions)}
                </span>
                <span
                  className={cn(
                    "flex items-center justify-end gap-0.5 text-[11px] font-medium",
                    rising ? "text-primary" : "text-error",
                  )}
                >
                  <TrendIcon className="size-3" aria-hidden />
                  {Math.abs(row.change).toFixed(1)}%
                </span>
              </TD>

              <TD align="right" className="font-medium text-text-primary tabular-nums">
                {formatCurrency(row.revenue)}
              </TD>

              <TD className="w-40">
                <ProgressBar
                  value={rate(row.revenue, topRevenue)}
                  label={`${theme.label} revenue share`}
                  tone={theme.accent}
                />
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
