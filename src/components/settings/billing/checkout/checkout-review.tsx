"use client";

import { TAX_RATE, taxOn } from "@/constants/billing";
import type { Plan } from "@/constants/pricing";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BillingPeriod, PaymentGateway } from "@/types/account";

import type { ManualForm } from "./payment-details";

/**
 * Step 4 — everything that is about to happen, on one screen.
 *
 * The last place a merchant can leave, so it repeats rather than summarises:
 * tier, cycle, amount, tax, total and how it will be paid, all stated in full.
 * A review that says "Growth — confirm?" saves a reader four lines and costs
 * them the only chance to notice the cycle is yearly.
 *
 * Tax is a row even at zero. A total that silently equals the plan price leaves
 * the reader unable to tell whether tax is included, exempt, or simply not
 * calculated — and the first thing they do about that is email support.
 *
 * For a manual payment the review also shows what was entered, because the
 * reference and the date are the two fields a mistype makes worthless, and this
 * is the last screen before an administrator is asked to match them.
 */
export function CheckoutReview({
  plan,
  period,
  amount,
  currency,
  gateway,
  manual,
}: {
  plan: Plan;
  period: BillingPeriod;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  /** Present only when the chosen method is manual. */
  manual?: ManualForm;
}) {
  const tax = taxOn(amount);
  const total = amount + tax;

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-text-secondary">Subscription</h3>
        <dl className="divide-y divide-border rounded-panel border border-border">
          <Row label="Plan" value={plan.name} />
          <Row
            label="Billing cycle"
            value={period === "yearly" ? "Yearly" : "Monthly"}
          />
          <Row label="Payment method" value={gateway.name} />
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-text-secondary">Amount</h3>
        <dl className="divide-y divide-border rounded-panel border border-border">
          <Row
            label="Plan amount"
            value={formatCurrency(amount, currency)}
            numeric
          />
          <Row
            label={TAX_RATE === 0 ? "Tax" : `Tax (${TAX_RATE * 100}%)`}
            value={formatCurrency(tax, currency)}
            numeric
          />
          <Row
            label="Total"
            value={formatCurrency(total, currency)}
            numeric
            strong
          />
        </dl>
        {TAX_RATE === 0 ? (
          <p className="text-sm text-text-muted">
            No tax is applied. A tax rate is not configured for this workspace.
          </p>
        ) : null}
      </section>

      {manual ? (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-secondary">
            Payment details you entered
          </h3>
          <dl className="divide-y divide-border rounded-panel border border-border">
            <Row label="Reference" value={manual.reference} />
            <Row
              label="Paid on"
              value={manual.paidAt ? formatDate(manual.paidAt) : "Not set"}
            />
            {manual.sender ? <Row label="Sender" value={manual.sender} /> : null}
            <Row
              label="Proof attached"
              value={manual.proofName ?? "None attached"}
            />
          </dl>
          {manual.note ? (
            <p className="text-sm text-text-secondary">
              <span className="font-semibold">Note: </span>
              {manual.note}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  numeric = false,
  strong = false,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
      <dt
        className={
          strong
            ? "text-sm font-bold text-text-primary"
            : "text-sm font-medium text-text-secondary"
        }
      >
        {label}
      </dt>
      <dd
        className={[
          strong
            ? "text-base font-bold text-text-primary"
            : "text-sm font-semibold text-text-primary",
          numeric ? "tabular-nums" : "min-w-0 truncate",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
