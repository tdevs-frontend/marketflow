"use client";

import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_ROUTES } from "@/constants";
import {
  CAPABILITIES,
  PLANS,
  PRICING_ASSURANCES,
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
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 brand-gradient-accent" />
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

        <p className="mt-2 min-h-10 text-xs leading-relaxed text-text-muted">
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
        <p className="mt-1.5 min-h-4 text-[11px] text-text-muted">
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

      {/* ------------------------------------------------ Value comparison */}
      <div className="mt-16">
        <h3 className="text-center font-heading text-2xl font-bold tracking-tight text-text-primary text-balance sm:text-3xl">
          Built for every stage of your growth
        </h3>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CAPABILITIES.map((capability) => (
            <li
              key={capability.title}
              className="rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-btn bg-primary-soft text-primary"
              >
                <Icon name={capability.icon} className="size-4" />
              </span>
              <h4 className="mt-3.5 text-sm font-semibold text-text-primary">
                {capability.title}
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                {capability.description}
              </p>
              {/* One short accent rule per block, tying the four together. */}
              <span
                aria-hidden
                className="mt-4 block h-0.5 w-8 rounded-full brand-gradient-accent"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------------------ Trust strip */}
      <div className="mt-14 rounded-card border border-border bg-surface-secondary px-6 py-7">
        <p className="text-center text-sm font-semibold text-text-primary">
          Everything you need to run your customer growth engine
        </p>

        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {PRICING_ASSURANCES.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-2 text-xs text-text-secondary"
            >
              <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-text-muted">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
          Self-hosted on your own infrastructure — your customer data stays
          yours.
        </p>
      </div>
    </>
  );
}
