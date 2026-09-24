import Link from "next/link";
import { Globe, Megaphone, MessageCircle, PenLine, type LucideIcon } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { APP_ROUTES } from "@/constants";
import { CHANNEL_LABEL } from "@/constants/commerce";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SalesChannel } from "@/types/commerce";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

type OrderStatus = "Paid" | "Processing" | "Pending" | "Cancelled";

interface Order {
  id: string;
  customer: string;
  /** Where the order came from - the same vocabulary the Sales breakdown uses. */
  channel: SalesChannel;
  product: string;
  amount: number;
  status: OrderStatus;
  time: string;
}

/* The top two are the WhatsApp inbox customers, buying the leading product.

   `id` is the row key, so it has to stay unique - a copied row with a
   duplicate reference is React reconciling two different orders as one. */
const ORDERS: Order[] = [
  {
    id: "#MF-10248",
    customer: "Sarah Ahmed",
    channel: "whatsapp",
    product: "Premium Package",
    amount: 149,
    status: "Paid",
    time: "2 min ago",
  },
  {
    id: "#MF-10247",
    customer: "John Smith",
    channel: "whatsapp",
    product: "Starter Package",
    amount: 79,
    status: "Paid",
    time: "8 min ago",
  },
  {
    id: "#MF-10246",
    customer: "Maria",
    channel: "campaign",
    product: "Business Package",
    amount: 249,
    status: "Processing",
    time: "15 min ago",
  },
  {
    id: "#MF-10245",
    customer: "David Chen",
    channel: "website",
    product: "Growth Package",
    amount: 129,
    status: "Pending",
    time: "24 min ago",
  },
  {
    id: "#MF-10244",
    customer: "Amina Rahman",
    channel: "website",
    product: "Starter Package",
    amount: 79,
    status: "Cancelled",
    time: "38 min ago",
  },
  {
    id: "#MF-10243",
    customer: "Tomas Silva",
    channel: "campaign",
    product: "Premium Package",
    amount: 149,
    status: "Paid",
    time: "52 min ago",
  },
  {
    id: "#MF-10242",
    customer: "Priya Nair",
    channel: "manual",
    product: "Onboarding Session",
    amount: 189,
    status: "Paid",
    time: "1 hr ago",
  },
  {
    id: "#MF-10241",
    customer: "Omar Haddad",
    channel: "whatsapp",
    product: "Extra WhatsApp Seat",
    amount: 19,
    status: "Processing",
    time: "2 hr ago",
  },
  {
    id: "#MF-10240",
    customer: "Maria",
    channel: "whatsapp",
    product: "Starter Package",
    amount: 79,
    status: "Paid",
    time: "3 hr ago",
  },
  {
    id: "#MF-10239",
    customer: "David Chen",
    channel: "campaign",
    product: "Premium Package",
    amount: 149,
    status: "Cancelled",
    time: "4 hr ago",
  },
];

const STATUS_TONE: Record<OrderStatus, BadgeVariant> = {
  Paid: "success",
  Processing: "info",
  Pending: "warning",
  Cancelled: "error",
};

/* Monochrome on purpose. The channel is the row's *smallest* fact - a coloured
   mark for it would compete with the status badge, which is the one thing in
   the row a merchant has to act on. */
const CHANNEL_ICON: Record<SalesChannel, LucideIcon> = {
  whatsapp: MessageCircle,
  campaign: Megaphone,
  website: Globe,
  manual: PenLine,
  other: Globe,
};

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The latest orders, as a real table.
 *
 * The stacked three-line rows this used to use could not put two orders'
 * amounts or statuses under one another, which is the whole reason to look at a
 * list of orders. `Table` owns the horizontal scroll, so the six columns stay
 * six columns in a half-width card instead of reflowing into a paragraph. The
 * card carries `min-w-0` for the same reason: a grid item is `min-width: auto`,
 * so without it the card refuses to shrink below the table's own minimum and
 * takes the whole phone layout wide with it rather than scrolling inside.
 *
 * It sits beside the automation feed, and the two used to read as one component
 * rendered twice. The difference now is structural rather than textual: a
 * tinted header band over ruled rows, ledger figures right-aligned on tabular
 * numerals, and the reference as the row's entry point. Tabular and
 * transactional - where the card next to it is chronological.
 */
export function RecentOrders({ className }: { className?: string }) {
  return (
    <Card className={cn("flex min-w-0 flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg">Recent Orders</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Your most recent orders across every channel.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.orders}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          View All Orders
        </ButtonLink>
      </div>

      {ORDERS.length === 0 ? (
        <div className="mt-5 flex-1">
          <EmptyState
            compact
            title="No orders yet"
            description="Launch a campaign or add a product, and orders will appear here as they come in."
            action={
              <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="sm">
                Start Campaign
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="mt-4 flex-1">
          {/* Six columns in a half-width card is tight, and the thing that
              pays for tightness is the last column - Time slides under the
              scroll edge, and a status with no timestamp beside it is the half
              of the pair worth less on its own.

              So the two prose columns absorb the slack instead of the table
              overflowing. Customer and Product each take `w-1/2 max-w-0`,
              which splits whatever the four fixed columns leave between them
              and lets the text ellipsis inside its share. Below roughly 1500px
              a name or a product gets shortened - with the full string on
              hover - but no column is ever lost, no row is taller than its
              neighbour, and Amount and Time stay on their right edge. The
              `minWidth` is only what the fixed columns need, so the wrapper's
              scroll is the fallback for a genuinely narrow viewport rather
              than the resting state. */}
          <Table
            minWidth="28rem"
            className="[&_td]:px-2 [&_td]:py-3.5 [&_th]:px-2"
          >
            {/* The band is what stops the header reading as a first row. It is
                painted on the cells rather than the row so the ends can round,
                and the end cells take their padding back - the table's
                `first:pl-0 last:pr-0` rule would otherwise cut the fill flush
                against the first and last column's text. */}
            <THead className="[&>th]:bg-surface-secondary [&>th:first-child]:rounded-l-lg [&>th:first-child]:pl-3 [&>th:last-child]:rounded-r-lg [&>th:last-child]:pr-3">
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>Product</TH>
              <TH align="right">Amount</TH>
              <TH>Status</TH>
              <TH align="right">Time</TH>
            </THead>
            <TBody>
              {ORDERS.map((order) => {
                const ChannelIcon = CHANNEL_ICON[order.channel];

                return (
                  <TR key={order.id} className="group">
                    {/* The reference is the row's entry point, so it is the one
                        cell that looks like it goes somewhere. The channel
                        rides on it as a mark rather than taking a seventh
                        column: it is the same fact the Sales breakdown
                        reports, and a column of one-word labels would cost the
                        product name width it cannot spare. The label is still
                        there for a screen reader and on hover. */}
                    <TD className="whitespace-nowrap">
                      <Link
                        href={APP_ROUTES.orders}
                        title={`${order.id} · ${CHANNEL_LABEL[order.channel]}`}
                        className="inline-flex items-center gap-1.5 font-bold tabular-nums text-text-primary transition-colors hover:text-primary group-hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <ChannelIcon
                          className="size-3.5 shrink-0 text-text-muted"
                          aria-hidden
                        />
                        <span className="sr-only">
                          {CHANNEL_LABEL[order.channel]} order
                        </span>
                        {order.id}
                      </Link>
                    </TD>

                    <TD className="w-1/2 max-w-0 text-text-primary">
                      <span
                        className="block text-sm font-bold truncate"
                        title={order.customer}
                      >
                        {order.customer}
                      </span>
                    </TD>

                    {/* The elastic column. Truncating rather than wrapping: a
                        product name that wraps makes its row taller than the
                        ones around it, and a table of unequal rows is the
                        thing a table is for avoiding. */}
                    <TD className="w-1/2 max-w-0">
                      <span
                        className="block truncate text-sm font-medium text-text-muted"
                        title={order.product}
                      >
                        {order.product}
                      </span>
                    </TD>

                    <TD align="right" className="whitespace-nowrap">
                      <span className="font-bold tabular-nums text-text-primary">
                        {formatCurrency(order.amount)}
                      </span>
                    </TD>

                    <TD>
                      <Badge
                        variant={STATUS_TONE[order.status]}
                        size="sm"
                        casing="none"
                      >
                        {order.status}
                      </Badge>
                    </TD>

                    <TD align="right" className="whitespace-nowrap">
                      <span className="text-sm font-medium text-text-muted">
                        {order.time}
                      </span>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
