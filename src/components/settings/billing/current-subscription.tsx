"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MeterRow } from "@/components/ui/progress";
import { PLANS } from "@/constants/pricing";
import {
  CAPABILITIES,
  UNAVAILABLE_REASON,
  cancelSubscription,
  withdrawPaymentRequest,
} from "@/lib/account-service";
import { usageMetrics } from "@/lib/account-fixtures";
import { usePaymentRequest, useSubscription } from "@/lib/account-store";
import { formatCount, formatCurrency, formatDate } from "@/lib/format";
import type { PaymentRequest, UsageMetric } from "@/types/account";

import { DetailList, SettingsSection, useSaveState } from "../settings-section";
import { STATUS, UnavailableAction } from "./shared";

/**
 * What this workspace is on, what it costs, and the two things you can do
 * about it — in one card rather than two.
 *
 * The actions used to live in a "Subscription" section of their own at the
 * bottom of the tab, which meant the plan was stated at the top of the page and
 * the controls for changing it were four cards below, with a second heading
 * repeating the same subject. A merchant reading "Growth · $49 / month ·
 * Active" and wanting to leave it had to scroll past payment, contact and
 * invoices to find out they could. The footer band is where a settings card
 * already puts its commit controls, so that is where these go.
 *
 * `Manage Plan` moves to the pricing tab rather than opening the checkout
 * directly. Choosing a tier is the first step of that flow and the tab is
 * already the place it is chosen; a modal that opens onto a plan the merchant
 * has not picked yet would be asking them to confirm a decision they have not
 * made.
 */
export function CurrentSubscription({
  canManage,
  onManagePlan,
}: {
  canManage: boolean;
  onManagePlan: () => void;
}) {
  const subscription = useSubscription();
  const pending = usePaymentRequest();

  const plan = PLANS.find((item) => item.id === subscription.planId);
  const status = STATUS[subscription.status];
  const per = subscription.period === "yearly" ? "year" : "month";

  return (
    <>
      {pending && pending.status === "pending" ? (
        <PendingPayment request={pending} canManage={canManage} />
      ) : null}

      <SettingsSection
        title="Current subscription"
        description="What this workspace subscribes to today."
        action={<Badge tone={status.tone}>{status.label}</Badge>}
        bodyClassName="space-y-5"
        footer={
          <SubscriptionActions canManage={canManage} onManagePlan={onManagePlan} />
        }
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-2xl font-bold tracking-tight">
            {plan?.name ?? subscription.planId}
          </h3>
          <p className="text-base font-semibold text-text-secondary tabular-nums">
            {formatCurrency(subscription.amount, subscription.currency)}
            <span className="font-medium text-text-muted"> / {per}</span>
          </p>
        </div>

        {plan ? (
          <p className="max-w-2xl text-sm text-text-secondary">{plan.audience}</p>
        ) : null}

        {/*
          The plan name, the price and the status are the headline and the
          badge above; they are not repeated here. A summary list that restates
          what is set in 24px type directly above it reads as a rendering bug,
          and the three facts that are genuinely only available here — the
          cycle, the next date, how long this has been running — get lost among
          the repeats.
        */}
        <DetailList
          columns={3}
          items={[
            {
              label: "Billing cycle",
              value: subscription.period === "yearly" ? "Yearly" : "Monthly",
            },
            {
              label:
                subscription.status === "cancelled"
                  ? "Access ends"
                  : "Next billing date",
              value: formatDate(subscription.renewsAt),
            },
            {
              label: "Subscribed since",
              value: formatDate(subscription.startedAt),
            },
          ]}
        />
      </SettingsSection>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Pending payment                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A manual payment that has been submitted and not yet verified.
 *
 * Above the subscription card rather than inside it, and deliberately not
 * dressed as a plan. The workspace is still on the tier below; this is a claim
 * about a *different* one, waiting on somebody. Rendering it as part of Current
 * subscription would put two plan names in one card and leave the merchant
 * reading the wrong one as theirs.
 *
 * It carries the reference, because that is the string the merchant will quote
 * when they chase it, and a withdraw control, because otherwise a mistyped
 * reference blocks every further submission until an administrator clears it.
 */
function PendingPayment({
  request,
  canManage,
}: {
  request: PaymentRequest;
  canManage: boolean;
}) {
  const { state, run } = useSaveState();
  const [confirming, setConfirming] = useState(false);

  return (
    <SettingsSection
      title="Payment awaiting verification"
      description="Submitted here. The plan starts once an administrator confirms the money arrived."
      action={
        <Badge tone="warning">
          <Clock aria-hidden />
          Pending
        </Badge>
      }
      bodyClassName="space-y-4"
      footer={
        canManage ? (
          <>
            <Button
              variant="outline"
              size="compact"
              disabled={state.status === "saving"}
              onClick={() => setConfirming(true)}
            >
              Withdraw submission
            </Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-text-muted empty:hidden"
            >
              {state.status === "error" ? (
                <span className="font-medium text-error-text">
                  {state.message}
                </span>
              ) : null}
            </p>
          </>
        ) : undefined
      }
    >
      <DetailList
        columns={3}
        items={[
          {
            label: "Plan",
            value: `${request.planName} · ${request.period === "yearly" ? "Yearly" : "Monthly"}`,
          },
          {
            label: "Amount submitted",
            value: formatCurrency(request.amount, request.currency),
          },
          { label: "Reference", value: request.reference },
          { label: "Payment method", value: request.gatewayName },
          { label: "Paid on", value: formatDate(request.paidAt) },
          { label: "Submitted", value: formatDate(request.submittedAt) },
        ]}
      />

      {request.proofName ? (
        <p className="text-sm text-text-muted">
          Proof attached: <span className="font-medium">{request.proofName}</span>
        </p>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void run(withdrawPaymentRequest)}
        title="Withdraw this payment?"
        description={`Reference ${request.reference} stops waiting for verification.`}
        confirmLabel="Withdraw submission"
        cancelLabel="Keep waiting"
      >
        <p className="text-sm text-text-secondary">
          Nothing about the current plan changes — it never did. Withdraw this
          if the details were wrong, then submit the payment again.
        </p>
      </ConfirmDialog>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The two things you can do to a subscription, in the card that states it.
 *
 * Cancel is gated twice over: it needs the billing capability to be reachable
 * at all, and a confirmation once it is. The confirmation is written now rather
 * than when a provider is connected, because the day that switch flips is the
 * worst possible day to be writing the guard on an irreversible action.
 */
function SubscriptionActions({
  canManage,
  onManagePlan,
}: {
  canManage: boolean;
  onManagePlan: () => void;
}) {
  const { state, run } = useSaveState();
  const [confirming, setConfirming] = useState(false);

  const subscription = useSubscription();
  const cancelled = subscription.status === "cancelled";
  const allowed = canManage && CAPABILITIES.planChange;

  /* Two different refusals behind one disabled button, and the reader is owed
     the one that applies to them. A viewer who is told "no payment provider is
     connected" goes looking for the integration rather than for an admin. */
  const reason = canManage
    ? UNAVAILABLE_REASON.planChange
    : "Cancelling a subscription is not available to your role.";

  return (
    <>
      <Button variant="outline" size="compact" onClick={onManagePlan}>
        Manage plan
      </Button>

      {cancelled ? (
        <p className="text-sm font-medium text-text-secondary">
          Cancelled. Access continues until {formatDate(subscription.renewsAt)}.
        </p>
      ) : allowed ? (
        <Button
          variant="ghost"
          size="compact"
          className="text-error-text"
          disabled={state.status === "saving"}
          onClick={() => setConfirming(true)}
        >
          Cancel subscription
        </Button>
      ) : (
        <UnavailableAction reason={reason}>Cancel subscription</UnavailableAction>
      )}

      <p
        role="status"
        aria-live="polite"
        className="text-sm text-text-muted empty:hidden"
      >
        {state.status === "error" ? (
          <span className="font-medium text-error-text">{state.message}</span>
        ) : allowed || cancelled ? null : (
          reason
        )}
      </p>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void run(cancelSubscription)}
        title="Cancel this subscription?"
        description={`The workspace keeps its plan until ${formatDate(subscription.renewsAt)}, then loses it.`}
        confirmLabel="Cancel subscription"
        cancelLabel="Keep subscription"
      >
        <p className="text-sm text-text-secondary">
          Campaigns, automations and contacts stay in place, but sending stops
          when the period ends. You can resubscribe before then to avoid any
          interruption.
        </p>
      </ConfirmDialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Usage                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What the plan allows against what the workspace has used.
 *
 * Kept, in a module the brief otherwise asks to trim, because it is the one
 * section here that answers a question none of the others do: *should* this
 * tier still be the tier. It duplicates nothing — no other screen in the
 * product compares contacts, sends and automations to a plan's allowances —
 * and it is the reason a merchant arrives at the pricing tab already knowing
 * whether they need it.
 */
export function PlanUsage() {
  const subscription = useSubscription();
  const metrics = usageMetrics(subscription.planId);

  return (
    <SettingsSection
      title="Plan usage"
      description="Counted from this workspace. No limits are being enforced yet."
      bodyClassName="space-y-5"
    >
      {metrics.map((metric) => (
        <UsageMeter key={metric.key} metric={metric} />
      ))}
    </SettingsSection>
  );
}

/**
 * One allowance, as a bar with the numbers beside it.
 *
 * The bar is the comparison and the digits are the fact; a percentage alone
 * cannot answer "how many more can I send this month". Colour changes only at
 * the two thresholds that mean something — approaching the limit, and over it —
 * because a bar that is amber at 40% has taught the reader to ignore its
 * colour by the time it matters.
 *
 * An unmetered entitlement gets no bar at all. A full-width bar for "unlimited"
 * reads as "you are at capacity", which is the opposite of what it means.
 */
function UsageMeter({ metric }: { metric: UsageMetric }) {
  if (metric.limit === null) {
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-text-secondary">
            {metric.label}
          </p>
          <p className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
            {formatCount(metric.used)}{" "}
            <span className="font-medium text-text-muted">/ unlimited</span>
          </p>
        </div>
        <p className="mt-1.5 text-sm text-text-muted">{metric.hint}</p>
      </div>
    );
  }

  const percent = (metric.used / metric.limit) * 100;
  const tone =
    percent >= 100 ? "bg-error" : percent >= 80 ? "bg-warning" : "bg-primary";

  return (
    <MeterRow
      label={metric.label}
      value={percent}
      display={`${formatCount(metric.used)} / ${formatCount(metric.limit)}`}
      tone={tone}
      hint={
        percent >= 100
          ? `Over the plan allowance for ${metric.unit}. ${metric.hint}`
          : metric.hint
      }
    />
  );
}
