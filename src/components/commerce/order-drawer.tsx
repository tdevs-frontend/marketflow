"use client";

import {
  Check,
  Download,
  MessageCircle,
  RotateCcw,
  User,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { APP_ROUTES } from "@/constants";
import { ORDER_STATUSES } from "@/constants/commerce";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/commerce";
import { OrderStatusBadge, PaymentStatusBadge, ProductThumb } from "./commerce-badges";

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={strong ? "font-medium text-text-primary" : "text-text-secondary"}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "font-bold text-text-primary" : "text-text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Order detail.
 *
 * A drawer rather than a route: an order is read alongside the list — you scan,
 * open one, act, close and carry on — and a full page would lose the list
 * position each time.
 */
export function OrderDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  return (
    <Drawer
      open={Boolean(order)}
      onClose={onClose}
      title={order ? `Order ${order.reference}` : "Order"}
      description={order ? formatDateTime(order.placedAt) : undefined}
      footer={
        order ? (
          <div className="flex flex-wrap gap-2.5">
            {/* WhatsApp first: it is the channel this business actually
                replies on, and the reason the order exists. */}
            <ButtonLink
              href={APP_ROUTES.whatsapp}
              variant="secondary"
              size="compact"
              className="flex-1"
            >
              <MessageCircle aria-hidden />
              Contact Customer
            </ButtonLink>
            <Button variant="outline" size="compact">
              <Download aria-hidden />
              Invoice
            </Button>
            <Button variant="outline" size="compact">
              <RotateCcw aria-hidden />
              Refund
            </Button>
          </div>
        ) : null
      }
    >
      {order ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
            {order.sourceCampaign ? (
              <span className="text-xs text-text-muted">
                from{" "}
                <span className="font-medium text-text-secondary">
                  {order.sourceCampaign}
                </span>
              </span>
            ) : null}
          </div>

          {/* Customer */}
          <section>
            <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Customer
            </h3>
            <div className="mt-2.5 flex items-start gap-3 rounded-panel border border-border p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
                {order.customer.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {order.customer.name}
                </p>
                {order.customer.email ? (
                  <p className="truncate text-xs text-text-muted">
                    {order.customer.email}
                  </p>
                ) : null}
                {order.customer.whatsappNumber ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary">
                    <MessageCircle className="size-3" aria-hidden />
                    {order.customer.whatsappNumber}
                  </p>
                ) : null}
              </div>
              <ButtonLink href={APP_ROUTES.contacts} variant="ghost" size="sm">
                <User aria-hidden />
                Profile
              </ButtonLink>
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Items
            </h3>
            <ul className="mt-2.5 divide-y divide-border rounded-panel border border-border">
              {order.lines.map((line) => (
                <li key={line.productId} className="flex items-center gap-3 p-3">
                  <ProductThumb size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {line.productName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {line.quantity} × {formatCurrency(line.unitPrice)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-text-primary tabular-nums">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Totals */}
          <section className="space-y-2 rounded-panel bg-surface-secondary p-3.5">
            <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
            {order.discount > 0 ? (
              <Row
                label={order.discountCode ? `Discount · ${order.discountCode}` : "Discount"}
                value={`−${formatCurrency(order.discount)}`}
              />
            ) : null}
            <Row label="Tax" value={formatCurrency(order.tax)} />
            <div className="border-t border-border-strong pt-2">
              <Row label="Total" value={formatCurrency(order.total)} strong />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Payment
            </h3>
            <div className="mt-2.5 rounded-panel border border-border p-3.5">
              <Row label="Method" value={order.paymentMethod} />
              <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-text-secondary">Status</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Timeline
            </h3>
            <ol className="mt-3">
              {order.timeline.map((event, index) => {
                const done = Boolean(event.at);
                const last = index === order.timeline.length - 1;

                return (
                  <li key={event.status} className="relative flex gap-3 pb-4 last:pb-0">
                    {last ? null : (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-6 bottom-0 left-2.75 w-px",
                          done ? "bg-primary/30" : "bg-border",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border",
                        done
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface-secondary text-text-muted",
                      )}
                    >
                      {done ? (
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={cn(
                          "text-[13px] font-medium",
                          done ? "text-text-primary" : "text-text-muted",
                        )}
                      >
                        {event.label}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {event.at ? formatDateTime(event.at) : "Pending"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Status control */}
          <section>
            <label
              htmlFor="order-status"
              className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase"
            >
              Update Status
            </label>
            <Select
              id="order-status"
              label="Update Status"
              hideLabel={false}
              value={order.status}
              onChange={(next) => onStatusChange(order.id, next as OrderStatus)}
              options={ORDER_STATUSES}
              className="mt-2.5"
            />
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
