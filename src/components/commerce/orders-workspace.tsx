"use client";

import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clock,
  Eye,
  MessageCircle,
  Package,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { ORDERS_PER_PAGE, ORDER_STATUSES, PAYMENT_STATUSES } from "@/constants/commerce";
import { ORDERS, PRODUCTS } from "@/lib/commerce-fixtures";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Order, OrderStatus, PaymentStatus } from "@/types/commerce";
import { CommerceKpis, type CommerceKpi } from "./commerce-kpis";
import { OrderStatusBadge, PaymentStatusBadge } from "./commerce-badges";
import { FilterBar } from "./filter-bar";
import { OrderDrawer } from "./order-drawer";

const ALL = "all";

function kpis(): CommerceKpi[] {
  const pending = ORDERS.filter((item) => item.status === "pending");
  const processing = ORDERS.filter((item) =>
    ["processing", "shipped"].includes(item.status),
  );
  const completed = ORDERS.filter((item) => item.status === "delivered");
  /* Cancelled and refunded orders never counted as revenue. */
  const revenue = ORDERS.filter(
    (item) => !["cancelled", "refunded"].includes(item.status),
  ).reduce((sum, item) => sum + item.total, 0);

  return [
    { label: "Total Orders", value: formatNumber(ORDERS.length), icon: ShoppingCart },
    {
      label: "Pending",
      value: formatNumber(pending.length),
      icon: Clock,
      tone: pending.length ? "warning" : "neutral",
    },
    { label: "Processing", value: formatNumber(processing.length), icon: RefreshCw },
    { label: "Completed", value: formatNumber(completed.length), icon: Package },
    {
      label: "Revenue",
      value: formatCurrency(revenue),
      icon: CircleDollarSign,
      tone: "brand",
      hint: "Excludes cancelled and refunded",
    },
  ];
}

export function OrdersWorkspace() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | typeof ALL>(ALL);
  const [payment, setPayment] = useState<PaymentStatus | typeof ALL>(ALL);
  const [productId, setProductId] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<Order | null>(null);

  const activeFilters =
    (status === ALL ? 0 : 1) +
    (payment === ALL ? 0 : 1) +
    (productId === ALL ? 0 : 1) +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return ORDERS.filter((item) => {
      if (
        term &&
        !item.reference.toLowerCase().includes(term) &&
        !item.customer.name.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (status !== ALL && item.status !== status) return false;
      if (payment !== ALL && item.paymentStatus !== payment) return false;
      if (
        productId !== ALL &&
        !item.lines.some((line) => line.productId === productId)
      ) {
        return false;
      }
      if (from && new Date(item.placedAt) < new Date(from)) return false;
      /* `to` is a date, so compare against the end of that day. */
      if (to && new Date(item.placedAt) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [search, status, payment, productId, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice(
    (current - 1) * ORDERS_PER_PAGE,
    current * ORDERS_PER_PAGE,
  );

  function resetFilters() {
    setStatus(ALL);
    setPayment(ALL);
    setProductId(ALL);
    setFrom("");
    setTo("");
    setPage(1);
  }

  const rowActions = (order: Order) => [
    {
      label: "View order",
      icon: <Eye className="size-4" />,
      onSelect: () => setActive(order),
    },
    {
      label: "Contact on WhatsApp",
      icon: <MessageCircle className="size-4" />,
      onSelect: () => {},
      disabled: !order.customer.whatsappNumber,
    },
    { label: "Download invoice", icon: <Package className="size-4" />, onSelect: () => {} },
    {
      label: "Refund order",
      icon: <RefreshCw className="size-4" />,
      onSelect: () => {},
      destructive: true,
      disabled: order.paymentStatus !== "paid",
    },
  ];

  return (
    <>
      <CommerceKpis items={kpis()} />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search order or customer…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          <Select
            label="Filter by order status"
            value={status}
            onChange={(next) => {
              setStatus(next as OrderStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...ORDER_STATUSES]}
            className="lg:w-36"
          />

          <Select
            label="Filter by payment status"
            value={payment}
            onChange={(next) => {
              setPayment(next as PaymentStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All payments" }, ...PAYMENT_STATUSES]}
            className="lg:w-36"
          />

          <Select
            label="Filter by product"
            value={productId}
            onChange={(next) => {
              setProductId(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All products" },
              ...PRODUCTS.map((item) => ({ value: item.id, label: item.name })),
            ]}
            className="lg:w-44"
          />

          <Input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full lg:w-36"
          />
          <Input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full lg:w-36"
          />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title="No orders match those filters"
            description="Adjust the date range or clear the filters to see every order."
            action={
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="mt-4 max-lg:hidden">
              <Table minWidth="66rem">
                <THead>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Products</TH>
                  <TH align="right">Items</TH>
                  <TH align="right">Total</TH>
                  <TH>Payment</TH>
                  <TH>Status</TH>
                  <TH>Date</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((order) => {
                    const items = order.lines.reduce(
                      (sum, line) => sum + line.quantity,
                      0,
                    );
                    const [first, ...rest] = order.lines;

                    return (
                      <TR key={order.id}>
                        <TD>
                          <button
                            type="button"
                            onClick={() => setActive(order)}
                            className="font-mono text-xs font-medium text-primary hover:underline focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            {order.reference}
                          </button>
                        </TD>

                        <TD>
                          <p className="font-medium text-text-primary">
                            {order.customer.name}
                          </p>
                          {order.sourceCampaign ? (
                            <p className="text-[11px] text-text-muted">
                              via {order.sourceCampaign}
                            </p>
                          ) : null}
                        </TD>

                        <TD className="max-w-52">
                          <p className="truncate text-text-secondary">
                            {first.productName}
                            {rest.length > 0 ? (
                              <span className="text-text-muted">
                                {" "}
                                +{rest.length} more
                              </span>
                            ) : null}
                          </p>
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {items}
                        </TD>

                        <TD align="right" className="font-medium text-text-primary tabular-nums">
                          {formatCurrency(order.total)}
                        </TD>

                        <TD>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </TD>

                        <TD>
                          <OrderStatusBadge status={order.status} />
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(order.placedAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            items={rowActions(order)}
                            label={`Actions for ${order.reference}`}
                          />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setActive(order)}
                    className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-primary">
                        {order.reference}
                      </span>
                      <span className="text-sm font-bold text-text-primary tabular-nums">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-text-primary">
                      {order.customer.name}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {order.lines[0].productName}
                      {order.lines.length > 1
                        ? ` +${order.lines.length - 1} more`
                        : ""}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                      <span className="ml-auto text-[11px] text-text-muted">
                        {formatDate(order.placedAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={ORDERS_PER_PAGE}
                onChange={setPage}
                noun="orders"
              />
            </div>
          </>
        )}
      </Card>

      <OrderDrawer
        order={active}
        onClose={() => setActive(null)}
        onStatusChange={() => {
          /* Wire to `useUpdateOrderStatusMutation`. */
        }}
      />
    </>
  );
}
