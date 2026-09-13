import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { APP_ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

type OrderStatus = "Paid" | "Processing" | "Pending" | "Cancelled";

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderStatus;
  time: string;
}

/* The top two are the WhatsApp inbox customers, buying the leading product.

   `id` is the row key, so it has to stay unique — a copied row with a
   duplicate reference is React reconciling two different orders as one. */
const ORDERS: Order[] = [
  {
    id: "#MF-10248",
    customer: "Sarah Ahmed",
    product: "Premium Package",
    amount: 149,
    status: "Paid",
    time: "2 min ago",
  },
  {
    id: "#MF-10247",
    customer: "John Smith",
    product: "Starter Package",
    amount: 79,
    status: "Paid",
    time: "8 min ago",
  },
  {
    id: "#MF-10246",
    customer: "Maria",
    product: "Business Package",
    amount: 249,
    status: "Processing",
    time: "15 min ago",
  },
  {
    id: "#MF-10245",
    customer: "David Chen",
    product: "Growth Package",
    amount: 129,
    status: "Pending",
    time: "24 min ago",
  },
  {
    id: "#MF-10244",
    customer: "Amina Rahman",
    product: "Starter Package",
    amount: 79,
    status: "Cancelled",
    time: "38 min ago",
  },
  {
    id: "#MF-10243",
    customer: "Tomas Silva",
    product: "Premium Package",
    amount: 149,
    status: "Paid",
    time: "52 min ago",
  },
];

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  Paid: "success",
  Processing: "info",
  Pending: "warning",
  Cancelled: "danger",
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
 * six columns in a half-width card instead of reflowing into a paragraph.
 */
export function RecentOrders({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base">Recent Orders</h2>
          <p className="mt-1 text-sm text-text-secondary">
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
        <div className="mt-3 flex-1">
          <Table minWidth="34rem">
            <THead>
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>Product</TH>
              <TH align="right">Amount</TH>
              <TH>Status</TH>
              <TH align="right">Time</TH>
            </THead>
            <TBody>
              {ORDERS.map((order) => (
                <TR key={order.id}>
                  <TD className="whitespace-nowrap text-text-secondary tabular-nums">
                    {order.id}
                  </TD>
                  <TD className="text-text-primary">{order.customer}</TD>
                  <TD className="font-normal text-text-secondary">{order.product}</TD>
                  <TD align="right" className="font-bold text-text-primary tabular-nums">
                    {formatCurrency(order.amount)}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[order.status]} className="normal-case">
                      {order.status}
                    </Badge>
                  </TD>
                  <TD
                    align="right"
                    className="font-normal whitespace-nowrap text-text-muted"
                  >
                    {order.time}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
