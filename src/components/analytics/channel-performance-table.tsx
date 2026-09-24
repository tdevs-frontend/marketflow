import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import type { ChannelPerformance } from "@/types/analytics";

const COLUMNS = ["Channel", "Sent", "Delivered", "Open rate", "Click rate", "Revenue"];

export function ChannelPerformanceTable({ rows }: { rows: ChannelPerformance[] }) {
  return (
    <Card className="px-5 py-2">
      <Table minWidth="40rem">
        <THead>
          {COLUMNS.map((column) => (
            <TH key={column}>{column}</TH>
          ))}
        </THead>
        <TBody>
          {rows.map((row) => (
            <TR key={row.channel}>
              <TH scope="row" className="capitalize text-text-primary">
                {row.channel}
              </TH>
              <TD>{formatNumber(row.sent)}</TD>
              <TD>{formatNumber(row.delivered)}</TD>
              <TD>{formatPercent(rate(row.opened, row.delivered))}</TD>
              <TD>{formatPercent(rate(row.clicked, row.delivered))}</TD>
              <TD>{formatCurrency(row.revenue)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
