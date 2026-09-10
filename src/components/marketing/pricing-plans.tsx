"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import {
  PLANS,
  YEARLY_DISCOUNT,
  yearlyMonthly,
  type Plan,
} from "@/constants/pricing";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";

const BILLING_OPTIONS: { value: Billing; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function BillingToggle({
  value,
  onChange,
}: {
  value: Billing;
  onChange: (value: Billing) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Billing period"
      className="relative inline-grid grid-cols-2 rounded-full border border-border bg-surface-secondary p-1 shadow-btn"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-btn",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          value === "yearly" && "translate-x-full",
        )}
      />

      {BILLING_OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "relative z-1 inline-flex h-9 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap",
              "transition-colors focus-visible:shadow-focus focus-visible:outline-none",
              selected
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {option.label}

            {option.value === "yearly" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-[0.04em] transition-colors",
                  selected
                    ? "brand-gradient text-white"
                    : "bg-primary-soft text-primary",
                )}
              >
                Save {Math.round(YEARLY_DISCOUNT * 100)}%
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const featured = Boolean(plan.featured);
  const priced = plan.monthly !== null;
  const amount = priced
    ? billing === "yearly"
      ? yearlyMonthly(plan.monthly!)
      : plan.monthly!
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border bg-surface",
        "transition-all duration-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        featured
          ? [
              "border-primary/45 shadow-[0_18px_44px_-16px_rgba(79,70,229,0.3)]",
              "hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_26px_56px_-16px_rgba(79,70,229,0.38)]",
            ].join(" ")
          : [
              "border-border shadow-card",
              "hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover",
            ].join(" "),
      )}
    >
      {featured ? (
        <>
          {/* The featured tier's accent: a gradient rule on the top edge. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 brand-gradient-accent"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.09),transparent)]"
          />
        </>
      ) : null}

      {/* `relative` so the content sits above the two washes above it. */}
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-text-primary">{plan.name}</h3>
          {featured ? (
            <span className="shrink-0 rounded-full brand-gradient px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase shadow-btn">
              Most popular
            </span>
          ) : null}
        </div>
        <p className="mt-2 min-h-10 text-sm leading-relaxed text-text-muted sm:min-h-18">
          {plan.audience}
        </p>

        <p className="mt-5 flex items-baseline gap-1.5">
          {priced ? (
            <>
              <span className="font-heading text-[2.5rem] leading-none tracking-tight text-text-primary tabular-nums">
                ${amount}
              </span>
              <span className="text-sm font-medium text-text-muted">
                / month
              </span>
            </>
          ) : (
            <span className="font-heading text-[2.5rem] leading-none tracking-tight text-text-primary">
              Custom
            </span>
          )}
        </p>
        <p className="mt-2.5 min-h-4 text-xs text-text-muted">
          {priced && billing === "yearly"
            ? `Billed yearly · $${amount! * 12} per year`
            : priced
              ? "Billed monthly · cancel anytime"
              : "Annual agreement · billed by invoice"}
        </p>

        <ButtonLink
          href={priced ? APP_ROUTES.register : APP_ROUTES.pricing}
          variant={featured ? "primary" : "dark"}
          size="md"
          className="mt-6 w-full"
        >
          {plan.cta}
          {featured ? (
            <ArrowRight
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          ) : null}
        </ButtonLink>
        <ul
          className={cn(
            "mt-7 flex-1 space-y-3",
            featured ? "border-primary/15" : "border-border",
          )}
        >
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm leading-relaxed"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full",
                  featured
                    ? "brand-gradient text-white"
                    : "bg-primary-soft text-primary",
                )}
              >
                <Check className="size-2.5" strokeWidth={3.5} />
              </span>
              <span className="text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <>
      {/*Toggle */}
      <div className="mt-10 flex justify-center sm:mt-12">
        <BillingToggle value={billing} onChange={setBilling} />
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:mt-14 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} />
        ))}
      </div>
    </>
  );
}
