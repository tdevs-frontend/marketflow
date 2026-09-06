import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import type { ChannelPerformance } from "@/types/analytics";

const COLUMNS = ["Channel", "Sent", "Delivered", "Open rate", "Click rate", "Revenue"];

export function ChannelPerformanceTable({ rows }: { rows: ChannelPerformance[] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <thead className="border-b border-border bg-surface-secondary/60 text-left text-[11px] uppercase tracking-[0.08em] text-text-muted">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className="px-5 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.channel} className="transition-colors hover:bg-primary-subtle">
              <th scope="row" className="px-5 py-3 text-left font-semibold capitalize text-text-primary">
                {row.channel}
              </th>
              <td className="px-5 py-3">{formatNumber(row.sent)}</td>
              <td className="px-5 py-3">{formatNumber(row.delivered)}</td>
              <td className="px-5 py-3">{formatPercent(rate(row.opened, row.delivered))}</td>
              <td className="px-5 py-3">{formatPercent(rate(row.clicked, row.delivered))}</td>
              <td className="px-5 py-3">{formatCurrency(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
