"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_ROUTES } from "@/constants";
import {
  PLANS,
  YEARLY_DISCOUNT,
  yearlyMonthly,
  type Plan,
} from "@/constants/pricing";
import { cn } from "@/lib/utils";

/**
 * The pricing table.
 *
 * Four tiers in one row from `xl`, two-up on tablet, stacked on mobile. The
 * featured tier is raised rather than recoloured: a gradient rule across its
 * top, a badge, a gradient CTA and a faint indigo ground. Filling the whole
 * card with brand colour would make the other three look disabled, which is
 * the opposite of what a pricing page is for.
 *
 * Both prices come from one monthly number — see `constants/pricing` — so the
 * "Save 20%" claim and the yearly figure cannot drift apart.
 *
 * Just the toggle and the tiers. The capability comparison and the reassurance
 * strip are `PricingValue` and `PricingTrust`, composed by the pricing route —
 * the homepage shows the title and the cards and nothing else.
 */

type Billing = "monthly" | "yearly";

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const featured = Boolean(plan.featured);

  /* A quoted plan shows a word, not a number, so the whole price row switches
     rather than trying to format `null`. */
  const priced = plan.monthly !== null;
  const amount = priced
    ? billing === "yearly"
      ? yearlyMonthly(plan.monthly!)
      : plan.monthly!
    : null;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-card border bg-surface transition-all",
        "hover:-translate-y-0.5 hover:shadow-card-hover",
        featured
          ? "border-primary/40 bg-primary-subtle shadow-card-hover"
          : "border-border shadow-card hover:border-border-strong",
      )}
    >
      {/* The featured tier's accent: a gradient rule on the top edge. */}
      {featured ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 brand-gradient-accent"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-text-primary">{plan.name}</h3>
          {featured ? (
            <span className="shrink-0 rounded-full brand-gradient px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase">
              Most popular
            </span>
          ) : null}
        </div>

        <p className="mt-2 min-h-10 text-sm leading-relaxed text-text-muted">
          {plan.audience}
        </p>

        <p className="mt-5 flex items-baseline gap-1.5">
          {priced ? (
            <>
              <span className="font-heading text-4xl font-bold tracking-tight text-text-primary tabular-nums">
                ${amount}
              </span>
              <span className="text-sm text-text-muted">/ month</span>
            </>
          ) : (
            <span className="font-heading text-4xl font-bold tracking-tight text-text-primary">
              Custom
            </span>
          )}
        </p>

        {/* Kept as a fixed slot so the four cards' feature lists stay aligned
            whichever billing period is selected. */}
        <p className="mt-1.5 min-h-4 text-xs text-text-muted">
          {priced && billing === "yearly"
            ? `Billed yearly · $${amount! * 12} per year`
            : priced
              ? "Billed monthly · cancel anytime"
              : "Annual agreement · billed by invoice"}
        </p>

        <ButtonLink
          href={priced ? APP_ROUTES.register : APP_ROUTES.pricing}
          variant={featured ? "gradient" : "outline"}
          size="compact"
          className="mt-5 w-full"
        >
          {plan.cta}
        </ButtonLink>

        <ul className="mt-6 flex-1 space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
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
      {/* ---------------------------------------------------------- Toggle */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <SegmentedControl
          label="Billing period"
          value={billing}
          onChange={setBilling}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] transition-colors",
            billing === "yearly"
              ? "brand-gradient text-white"
              : "bg-primary-soft text-primary",
          )}
        >
          Save {Math.round(YEARLY_DISCOUNT * 100)}%
        </span>
      </div>

      {/* ----------------------------------------------------------- Plans */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} />
        ))}
      </div>
    </>
  );
}
