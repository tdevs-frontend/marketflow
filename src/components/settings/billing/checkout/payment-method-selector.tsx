"use client";

import { Banknote, Check, CreditCard, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PaymentGateway } from "@/types/account";

/**
 * Step 2 - how this is going to be paid for.
 *
 * Radio cards, not a dropdown. Choosing between paying by card and submitting a
 * bank transfer for an administrator to verify is a decision with consequences
 * on both sides - one starts the plan immediately, the other starts it when
 * somebody agrees the money arrived - and a decision made from a collapsed
 * `<select>` is made without reading the line that explains it.
 *
 * Real radio inputs, visually hidden. Arrow-key movement, the roving tab stop
 * and the group semantics all come free from the platform; a card-shaped `div`
 * with `onClick` gets none of them. The markup deliberately mirrors
 * `ProviderSelector` in the Integrations module, because picking an email
 * adapter and picking a payment method are the same act and should not look
 * like two different products.
 *
 * An unconfigured gateway is **shown, marked and selectable**. Hiding it would
 * leave a merchant assuming MarketFlow does not take cards at all; listing it
 * unmarked would walk them into a step that cannot charge. Letting them select
 * it and meet a plain "not connected" at the next step is the only version that
 * answers the question they actually have.
 */

const ICONS: Record<string, typeof CreditCard> = {
  stripe: CreditCard,
  paypal: Wallet,
  manual: Banknote,
};

export function PaymentMethodSelector({
  gateways,
  value,
  onChange,
  name,
  loading = false,
}: {
  gateways: PaymentGateway[];
  value: string | null;
  onChange: (id: string) => void;
  /** Groups the radios. Must be unique if two selectors are ever mounted. */
  name: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2.5" aria-hidden>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-20 w-full rounded-panel" />
        ))}
        <span className="sr-only">Loading payment methods…</span>
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-2.5">
      {gateways.map((gateway) => {
        const selected = gateway.id === value;
        const Icon = ICONS[gateway.id] ?? CreditCard;

        return (
          <label
            key={gateway.id}
            className={cn(
              "relative flex cursor-pointer items-start gap-3 rounded-panel border p-3.5 transition-all",
              "focus-within:shadow-focus",
              selected
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
            )}
          >
            <input
              type="radio"
              name={name}
              value={gateway.id}
              checked={selected}
              onChange={() => onChange(gateway.id)}
              className="sr-only"
            />

            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border transition-colors",
                selected
                  ? "border-primary bg-primary text-white"
                  : "border-border-strong bg-surface",
              )}
            >
              {selected ? <Check className="size-3" /> : null}
            </span>

            <span
              aria-hidden
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-btn",
                selected
                  ? "bg-surface text-primary"
                  : "bg-surface-secondary text-text-secondary",
              )}
            >
              <Icon className="size-4.5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary-dark" : "text-text-primary",
                  )}
                >
                  {gateway.name}
                </span>
                {gateway.configured ? null : (
                  <Badge variant="default" size="sm" casing="none">
                    Not connected
                  </Badge>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-text-secondary">
                {gateway.description}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
