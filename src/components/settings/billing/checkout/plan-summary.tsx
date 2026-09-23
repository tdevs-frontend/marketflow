"use client";

import { Check } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { YEARLY_DISCOUNT, planPrice, type Plan } from "@/constants/pricing";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BillingPeriod } from "@/types/account";

/**
 * Step 1 - the tier that was chosen, stated back.
 *
 * Not a second pricing grid. The merchant has already compared four cards and
 * pressed one; reopening the comparison inside the checkout invites them to
 * re-decide at the point they came to confirm, and the tab behind the modal is
 * where a different tier is picked. So this is one plan, its price, and what it
 * includes.
 *
 * The cycle *is* editable here, because monthly and yearly are the one part of
 * the decision the pricing card's toggle may have been left on by accident, and
 * the difference is twelve times the number about to be charged.
 *
 * `planPrice` rather than arithmetic: the per-month figure a yearly plan is
 * advertised at and the sum actually taken are different numbers, and this is
 * the screen where confusing them costs the most.
 */
export function PlanSummary({
  plan,
  period,
  onPeriodChange,
  currency,
}: {
  plan: Plan;
  period: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
  currency: string;
}) {
  const total = planPrice(plan, period);
  /* The per-month figure a yearly plan is advertised at, shown only when the
     cycle is yearly - for a monthly plan it would be the same number divided
     by twelve, which is not a price anybody is quoted. */
  const perMonth =
    period === "yearly" && total !== null ? Math.round(total / 12) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-panel border border-primary/45 bg-primary-subtle p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
          {total === null ? (
            <p className="text-lg font-bold text-text-primary">Custom pricing</p>
          ) : (
            <p className="text-lg font-bold text-text-primary tabular-nums">
              {formatCurrency(total, currency)}
              <span className="text-sm font-medium text-text-muted">
                {period === "yearly" ? " / year" : " / month"}
              </span>
            </p>
          )}
        </div>

        <p className="mt-1.5 text-sm text-text-secondary">{plan.audience}</p>

        {perMonth !== null ? (
          <p className="mt-2 text-sm font-medium text-primary-dark tabular-nums">
            {formatCurrency(perMonth, currency)} / month, billed once a year.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-text-secondary">Billing cycle</p>
        <SegmentedControl
          label="Billing cycle"
          value={period}
          onChange={onPeriodChange}
          options={[
            { value: "monthly", label: "Monthly" },
            {
              value: "yearly",
              label: `Yearly · save ${Math.round(YEARLY_DISCOUNT * 100)}%`,
            },
          ]}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-text-secondary">
          What {plan.name} includes
        </p>
        {/* The tier's own feature list, from `constants/pricing`. A shortened
            copy written for the modal is a second answer to what a plan
            includes, and the merchant would be agreeing to that one. */}
        <ul className="grid gap-2 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm leading-relaxed"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                  "bg-primary-soft text-primary",
                )}
              >
                <Check className="size-2.5" strokeWidth={3.5} />
              </span>
              <span className="font-medium text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
