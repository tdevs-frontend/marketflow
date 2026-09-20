"use client";

import { useState } from "react";

import { PricingPlans } from "@/components/marketing/pricing-plans";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";
import { PLANS, type Plan } from "@/constants/pricing";
import { CAPABILITIES, UNAVAILABLE_REASON } from "@/lib/account-service";
import { usePaymentRequest, useSubscription } from "@/lib/account-store";
import type { BillingPeriod } from "@/types/account";

import { ServiceNotice } from "../service-notice";
import { CheckoutFlow } from "./checkout/checkout-flow";

/**
 * The pricing page's own cards, inside the dashboard.
 *
 * `PricingPlans` and nothing else: no marketing header, no navbar, no footer,
 * no sign-up call to action, no second grid, and no heading of its own — the
 * tab above is already labelled "Plans & Pricing", and a matching `<h2>` under
 * it would be the same words twice. There is one pricing component and one set
 * of tiers in this product; two would be how it ends up quoting one price to a
 * visitor and another to the customer who already pays it.
 *
 * `topSpacing={false}` for the same reason. That 40px above the billing toggle
 * exists to clear the marketing heading; with the tab strip directly above it
 * here, it is a gap between two things this page has already spaced.
 *
 * Pressing a tier's button opens the checkout. It does *not* change the plan —
 * that was the previous behaviour and it was wrong in the way that matters
 * most: a tier that switches on a single click has taken a decision about money
 * without asking how it is going to be paid, and left the merchant with no step
 * at which to stop. The button now starts a transaction; `CheckoutFlow` decides
 * whether one completes.
 */
export function PlansAndPricing({
  canManage,
  onViewBilling,
}: {
  canManage: boolean;
  /** Where the checkout's result screen sends the merchant afterwards. */
  onViewBilling: () => void;
}) {
  const subscription = useSubscription();
  const pending = usePaymentRequest();
  const permissions = useWorkspacePermissions();

  /** The tier a checkout is open for. `null` is "no transaction in progress". */
  const [checkout, setCheckout] = useState<{
    plan: Plan;
    period: BillingPeriod;
  } | null>(null);

  const awaiting = pending?.status === "pending";
  const allowed = canManage && CAPABILITIES.planChange && !awaiting;

  /*
   * Three reasons a tier's button can be off, and they are not interchangeable.
   * A viewer needs to be told about their role, a merchant with a payment in
   * flight needs to be told which one, and anybody else needs the capability's
   * own sentence. One merged message would send two of the three to the wrong
   * place looking for a fix.
   */
  const disabledReason = !canManage
    ? permissionHint("changing the plan", permissions.roleName)
    : awaiting
      ? `Payment ${pending?.reference} is waiting to be verified. It has to be settled before another plan change is started.`
      : UNAVAILABLE_REASON.planChange;

  return (
    <>
      {awaiting ? (
        <ServiceNotice tone="unavailable" title="A payment is already in review">
          {disabledReason} You can withdraw it from Billing Information if the
          details were wrong.
        </ServiceNotice>
      ) : (
        <ServiceNotice tone="session" title="How a plan change is paid for">
          Card payment needs a connected provider and this workspace has none,
          so the checkout offers manual payment: submit the transfer details and
          the plan starts once an administrator verifies them. Nothing is
          charged here.
        </ServiceNotice>
      )}

      <PricingPlans
        /* Looked up rather than cast: the subscription carries a plan id as a
           plain string, and a tier that has been retired from
           `constants/pricing` must mark nothing rather than appear to match. */
        currentPlanId={
          PLANS.find((plan) => plan.id === subscription.planId)?.id ?? null
        }
        defaultBilling={subscription.period}
        onChangePlan={
          allowed ? (plan, period) => setCheckout({ plan, period }) : undefined
        }
        changeDisabledReason={disabledReason}
        topSpacing={false}
      />

      {/*
        Mounted only while a checkout is open, so every transaction starts on a
        clean draft. Keeping it mounted would carry a half-typed reference from
        an abandoned Business upgrade into the next merchant's Starter one.
      */}
      {checkout ? (
        <CheckoutFlow
          key={`${checkout.plan.id}-${checkout.period}`}
          open
          plan={checkout.plan}
          initialPeriod={checkout.period}
          onClose={() => setCheckout(null)}
          onViewBilling={onViewBilling}
        />
      ) : null}
    </>
  );
}
