import { ButtonLink } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

/* The top two are the WhatsApp inbox customers, buying the leading product. */
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

export function RecentOrders({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base">Recent Orders</h2>

        <ButtonLink
          href={APP_ROUTES.orders}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          View All
        </ButtonLink>
      </div>

      {/* The scan is who bought what, for how much, is it paid — the id and
          timestamp only confirm, so they take the quieter line. */}
      <ul className="mt-3 divide-y divide-border">
        {ORDERS.map((order) => (
          <li key={order.id} className="py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-text-primary">
                {order.customer}
              </p>
              <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                {formatCurrency(order.amount)}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-text-secondary">{order.product}</p>
              <Badge tone={STATUS_TONE[order.status]} className="shrink-0 normal-case">
                {order.status}
              </Badge>
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
              <span className="font-medium tabular-nums">{order.id}</span>
              <span aria-hidden>·</span>
              {order.time}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
