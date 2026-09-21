import { ArrowRight, MessageCircle, Package, Receipt, User } from "lucide-react";

import { PanelLabel, ProductFrame } from "./feature-section";

/**
 * Orders, and the conversation attached to one.
 *
 * Commerce is the section most at risk of reading as a separate product bolted
 * on, so the visual leads with the order list and closes with the chain that
 * only works because the two halves share a database: the customer who bought,
 * the product they bought, the order it became, and the WhatsApp follow-up that
 * went out afterwards. A standalone store dashboard cannot draw that last
 * arrow.
 *
 * The inventory strip is the second argument. A low-stock line on the same
 * screen as a campaign audience is the reason a merchant would rather have one
 * tool: the thing that stops you sending a launch campaign is knowing you have
 * six of them left.
 */

const ORDERS = [
  { id: "#MF-2841", customer: "Fatima Rahman", total: "$248.00", state: "Paid" },
  { id: "#MF-2840", customer: "Daniel Okafor", total: "$96.50", state: "Packed" },
  { id: "#MF-2839", customer: "Priya Sharma", total: "$412.00", state: "Shipped" },
];

const STATE_TONE: Record<string, string> = {
  Paid: "bg-success-soft text-success-text",
  Packed: "bg-warning-soft text-warning-text",
  Shipped: "bg-info-soft text-info-text",
};

const STOCK = [
  { name: "Linen Kurta — Ivory", left: 6, of: 40 },
  { name: "Silk Scarf — Indigo", left: 22, of: 60 },
];

const CHAIN = [
  { label: "Customer", detail: "Fatima R.", icon: User },
  { label: "Product", detail: "Linen Kurta", icon: Package },
  { label: "Order", detail: "#MF-2841", icon: Receipt },
  { label: "Follow-up", detail: "Sent · WhatsApp", icon: MessageCircle },
];

export function CommerceVisual() {
  return (
    <ProductFrame path="/dashboard/orders" status="18 today">
      <div className="space-y-3 bg-background p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* Orders */}
          <div className="rounded-panel border border-border bg-surface p-3">
            <PanelLabel>Recent orders</PanelLabel>
            <ul className="mt-2.5 divide-y divide-border">
              {ORDERS.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-text-primary">
                      {order.customer}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-text-muted">
                      {order.id}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATE_TONE[order.state]}`}
                  >
                    {order.state}
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs font-bold text-text-primary tabular-nums">
                    {order.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Inventory */}
          <div className="rounded-panel border border-border bg-surface p-3">
            <PanelLabel>Inventory</PanelLabel>
            <ul className="mt-2.5 space-y-2.5">
              {STOCK.map((item) => {
                const low = item.left / item.of < 0.2;

                return (
                  <li key={item.name}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[11px] text-text-secondary">
                        {item.name}
                      </span>
                      <span
                        className={`shrink-0 text-[11px] font-bold tabular-nums ${low ? "text-warning-text" : "text-text-primary"}`}
                      >
                        {item.left}
                      </span>
                    </div>
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                      <span
                        className={`block h-full rounded-full ${low ? "bg-warning" : "bg-primary"}`}
                        style={{ width: `${(item.left / item.of) * 100}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-text-muted">
              Low stock holds the launch campaign.
            </p>
          </div>
        </div>

        {/* The chain — the point of the section. */}
        <div className="rounded-panel border border-border bg-surface p-3">
          <PanelLabel>One record, end to end</PanelLabel>
          <ol className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {CHAIN.map((link, index) => (
              <li key={link.label} className="flex items-center gap-1.5">
                <span className="flex items-center gap-2 rounded-btn border border-border bg-surface-secondary/60 py-1.5 pr-3 pl-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-[6px] bg-surface text-primary">
                    <link.icon className="size-3" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] leading-none text-text-muted">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] leading-none font-semibold text-text-primary">
                      {link.detail}
                    </span>
                  </span>
                </span>
                {index < CHAIN.length - 1 ? (
                  <ArrowRight
                    className="size-3 shrink-0 text-text-muted/70"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ProductFrame>
  );
}
