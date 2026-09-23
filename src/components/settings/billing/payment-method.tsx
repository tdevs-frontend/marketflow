"use client";

import { CreditCard } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { UNAVAILABLE_REASON } from "@/lib/account-service";
import { useSubscription } from "@/lib/account-store";

import { SettingsSection } from "../settings-section";
import { UnavailableAction } from "./shared";

/**
 * The instrument on file, or the honest absence of one.
 *
 * `subscription.paymentMethod` is `null` and the branch below is written
 * against a real one anyway, because the shape of this block is not in doubt -
 * brand, last four, expiry - only whether anything fills it. What is *not*
 * written is a default: no `?? { brand: "Visa", last4: "4242" }` anywhere, at
 * any point in this module. Somebody who believes a card is on file believes
 * their service cannot lapse, and that is the single most expensive thing a
 * billing screen can get wrong.
 *
 * Note what this section is *not*: the checkout's payment method step. That one
 * asks how a merchant wants to pay for a change they are making now, and is
 * answered per transaction. This one is the standing instrument a renewal would
 * be charged against, and it is stored. Two different questions, which is why
 * they are two components and not one reused twice.
 */
export function PaymentMethod({ canManage }: { canManage: boolean }) {
  const { paymentMethod } = useSubscription();

  return (
    <SettingsSection
      title="Payment method"
      description="Charged when the subscription renews."
    >
      {paymentMethod ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
              <CreditCard className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {paymentMethod.brand} •••• {paymentMethod.last4}
              </p>
              <p className="mt-0.5 text-sm text-text-muted tabular-nums">
                Expires {String(paymentMethod.expiryMonth).padStart(2, "0")}/
                {String(paymentMethod.expiryYear).slice(-2)}
              </p>
            </div>
          </div>

          {canManage ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <UnavailableAction reason={UNAVAILABLE_REASON.payment}>
                Change payment method
              </UnavailableAction>
              <UnavailableAction reason={UNAVAILABLE_REASON.payment}>
                Remove payment method
              </UnavailableAction>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          compact
          title="No payment method added"
          description={UNAVAILABLE_REASON.payment}
          action={
            canManage ? (
              <UnavailableAction reason={UNAVAILABLE_REASON.payment}>
                Add payment method
              </UnavailableAction>
            ) : undefined
          }
        />
      )}
    </SettingsSection>
  );
}
