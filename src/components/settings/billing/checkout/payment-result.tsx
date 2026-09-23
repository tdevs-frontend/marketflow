"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentRequest, Subscription } from "@/types/account";

/**
 * Step 5 - what actually happened.
 *
 * Three outcomes, and they are three components rather than one with a tone
 * prop, because the *facts* each one owes the reader are different. A success
 * owes them the plan and the next billing date. A pending submission owes them
 * a reference to quote and an unambiguous statement that nothing has started.
 * A failure owes them a way back that does not lose the plan they picked.
 *
 * The distinction that matters most is the middle one. A manual payment that
 * closed on a green tick reading "Payment successful" would be the module's
 * worst lie - the merchant stops watching for the plan to start, and nothing
 * has been verified. So it is amber, it says *submitted*, and it says the plan
 * begins when somebody confirms the money arrived.
 */

function Frame({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "success" | "pending" | "error";
  icon: typeof CheckCircle2;
  title: string;
  children: React.ReactNode;
}) {
  const ring = {
    success: "bg-success-soft text-success-text",
    pending: "bg-warning-soft text-warning-text",
    error: "bg-error-soft text-error-text",
  }[tone];

  return (
    <div className="space-y-5 py-2 text-center">
      <span
        aria-hidden
        className={cn("mx-auto grid size-14 place-items-center rounded-full", ring)}
      >
        <Icon className="size-7" />
      </span>

      <h3 className="text-xl font-bold tracking-tight text-text-primary">
        {title}
      </h3>

      {children}
    </div>
  );
}

/** A `<dl>` of the facts the outcome turns on. Left-aligned inside a centred block. */
function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="mx-auto max-w-sm divide-y divide-border rounded-panel border border-border text-left">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5"
        >
          <dt className="text-sm font-medium text-text-secondary">
            {item.label}
          </dt>
          <dd className="text-sm font-semibold text-text-primary tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PaymentSuccess({
  subscription,
  planName,
}: {
  subscription: Subscription;
  planName: string;
}) {
  return (
    <Frame tone="success" icon={CheckCircle2} title="Payment successful">
      <p className="mx-auto max-w-sm text-sm text-text-secondary">
        Your {planName} subscription is now active. The new allowances apply
        straight away.
      </p>

      <Facts
        items={[
          { label: "Plan", value: planName },
          {
            label: "Amount",
            value: formatCurrency(subscription.amount, subscription.currency),
          },
          {
            label: "Billing cycle",
            value: subscription.period === "yearly" ? "Yearly" : "Monthly",
          },
          {
            label: "Next billing date",
            value: formatDate(subscription.renewsAt),
          },
        ]}
      />
    </Frame>
  );
}

export function PaymentPending({ request }: { request: PaymentRequest }) {
  return (
    <Frame tone="pending" icon={Clock} title="Payment submitted">
      <p className="mx-auto max-w-sm text-sm text-text-secondary">
        Your payment is pending verification. The {request.planName} plan starts
        once an administrator confirms the money arrived - your current plan is
        unchanged until then.
      </p>

      <Facts
        items={[
          { label: "Reference", value: request.reference },
          {
            label: "Amount submitted",
            value: formatCurrency(request.amount, request.currency),
          },
          { label: "Paid on", value: formatDate(request.paidAt) },
          { label: "Submitted", value: formatDate(request.submittedAt) },
          { label: "Status", value: "Pending verification" },
        ]}
      />
    </Frame>
  );
}

export function PaymentFailure({
  message,
  planName,
}: {
  message: string;
  planName: string;
}) {
  return (
    <Frame tone="error" icon={AlertTriangle} title="Payment failed">
      <p className="mx-auto max-w-sm text-sm text-text-secondary">
        We couldn&rsquo;t complete your payment for {planName}. Nothing has been
        charged and your current plan is unchanged.
      </p>

      {/* The provider's own words, not a rewrite of them. A merchant quoting
          the real reason to their bank or to support gets help faster than one
          quoting "something went wrong". */}
      <p className="mx-auto max-w-sm rounded-panel border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error-text">
        {message}
      </p>
    </Frame>
  );
}
