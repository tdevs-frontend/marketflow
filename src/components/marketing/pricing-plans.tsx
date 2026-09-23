"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import {
  PLANS,
  YEARLY_DISCOUNT,
  yearlyMonthly,
  type Plan,
  type PlanTier,
} from "@/constants/pricing";
import { cn } from "@/lib/utils";

/**
 * The tiers, the billing toggle and the cards - the part of the pricing page
 * that is *the pricing*, with none of the marketing page around it.
 *
 * Shared, deliberately and in one direction. `/pricing` and the homepage
 * compose it under `PricingSection`'s heading; the dashboard's Billing
 * settings render it on its own inside a tab. There is no second set of cards
 * and no second copy of the prices, because two pricing designs is how a
 * product ends up quoting one number to a visitor and another to the customer
 * who already pays it.
 *
 * `currentPlanId` is what makes the signed-in rendering different, and it is
 * the *only* thing that does. Given it, the tier the workspace is on says so
 * and offers nothing to buy, and every other tier's call to action becomes a
 * plan change rather than a sign-up. The card design does not change: same
 * border, same radius, same price type, same Most popular treatment, same
 * responsive behaviour.
 */

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
              "relative z-1 inline-flex h-9 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold whitespace-nowrap",
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
                  "rounded-full px-1.5 py-0.5 text-xs font-bold tracking-[0.04em] transition-colors",
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

function PlanCard({
  plan,
  billing,
  account,
  current,
  onChangePlan,
  changeDisabledReason,
  changeBusy = false,
}: {
  plan: Plan;
  billing: Billing;
  /** Rendered for a signed-in account rather than for a visitor. */
  account: boolean;
  current: boolean;
  onChangePlan?: (plan: Plan, billing: Billing) => void;
  changeDisabledReason?: string;
  changeBusy?: boolean;
}) {
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

          {/*
            One badge, never two stacked.

            The workspace is quite likely on the featured tier, and a second
            badge below the first makes that one card's header a row taller -
            which pushes its price, its button and its whole feature list out
            of line with the three beside it. Most popular keeps the slot when
            both apply, because the card is not left ambiguous: its call to
            action reads "Current plan" in place of a button.
          */}
          {featured ? (
            <span className="shrink-0 rounded-full brand-gradient px-2.5 py-1 text-xs font-bold text-white uppercase shadow-btn">
              Most popular
            </span>
          ) : current ? (
            <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-dark uppercase">
              Current
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
        <p className="mt-2.5 min-h-4 text-sm text-text-muted">
          {priced && billing === "yearly"
            ? `Billed yearly · $${amount! * 12} per year`
            : priced
              ? "Billed monthly · cancel anytime"
              : "Annual agreement · billed by invoice"}
        </p>

        {current ? (
          /*
           * Not a disabled button. There is no action here to be temporarily
           * unavailable - this is a statement about the account - and a greyed
           * "Current plan" button invites somebody to hunt for why they cannot
           * press it. Set at the button's exact height so every card's feature
           * list still starts on the same line.
           */
          <p className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-btn border border-primary/45 bg-primary-soft text-sm font-semibold text-primary-dark">
            <Check className="size-4" strokeWidth={3} aria-hidden />
            Current plan
          </p>
        ) : account && priced ? (
          <Button
            /*
             * The tier's own variant - the same `primary` on the featured card
             * and `dark` on the rest that a visitor sees on the pricing page.
             * One set of cards has to look like one set of cards; a grid that
             * swaps to `outline` buttons once you sign in is a second pricing
             * design arriving through the back door, which is the thing
             * sharing this component prevents.
             *
             * The label is the one thing that does change. A merchant already
             * paying for Growth is not "Starting Free" - they are moving
             * between tiers, and the button has to name the act it performs.
             */
            variant={featured ? "primary" : "dark"}
            size="md"
            className="mt-6 w-full"
            /* Off for a role that may not change the plan, and for the moment
               a change is in flight - four live buttons during one round trip
               is how a merchant ends up on the tier they clicked second. */
            disabled={!onChangePlan || changeBusy}
            title={onChangePlan ? undefined : changeDisabledReason}
            onClick={
              onChangePlan ? () => onChangePlan(plan, billing) : undefined
            }
          >
            Change plan
          </Button>
        ) : account ? (
          /*
           * A quoted tier has nothing to self-serve - there is no price for
           * `changePlan` to move the workspace onto - so it stays a link, as
           * it is for a visitor, rather than a button that would refuse.
           */
          <ButtonLink
            href={APP_ROUTES.pricing}
            variant="dark"
            size="md"
            className="mt-6 w-full"
          >
            Talk to sales
          </ButtonLink>
        ) : (
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
        )}
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
              <span className="text-text-secondary font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingPlans({
  /**
   * The tier the signed-in workspace is on. `null` is a visitor, which is
   * what the marketing pages pass by leaving it out.
   */
  currentPlanId = null,
  /** Where the toggle starts - an account opens on the cycle it is billed on. */
  defaultBilling = "monthly",
  /**
   * Called for a priced tier the account is not on, with the period the
   * billing toggle is currently showing - the caller needs both to know what
   * it is being asked to switch to. Absent means the control is off.
   */
  onChangePlan,
  /** Why it is off, for the disabled control's own tooltip. */
  changeDisabledReason,
  /** A change is in flight; hold every tier's control until it settles. */
  changeBusy,
  /**
   * The gap above the billing toggle.
   *
   * On by default, because `PricingSection` sets a heading, an eyebrow and a
   * paragraph above it and the toggle has to clear them. An app surface brings
   * its own heading and its own rhythm, and inherits that 40px as dead space
   * between two things it has already spaced - so it turns this off.
   */
  topSpacing = true,
  className,
}: {
  currentPlanId?: PlanTier | null;
  defaultBilling?: Billing;
  onChangePlan?: (plan: Plan, billing: Billing) => void;
  changeDisabledReason?: string;
  changeBusy?: boolean;
  topSpacing?: boolean;
  className?: string;
} = {}) {
  const [billing, setBilling] = useState<Billing>(defaultBilling);

  return (
    /*
     * A container, so the grid answers to the width it is actually given.
     *
     * The two breakpoints are the pixel widths `custom-container` reaches at
     * `sm` and `xl` - 540 and 1140 - so /pricing and the homepage fold at
     * exactly the viewport sizes they always have. What changes is that the
     * same cards, rendered inside the Settings content column, fold on that
     * column's width instead of the window's. Four 270px cards crushed into an
     * 850px panel was the one way this component could be reused badly.
     */
    <div className={cn("@container", className)}>
      {/*Toggle */}
      <div
        className={cn(
          "flex justify-center",
          topSpacing && "mt-10 sm:mt-12",
        )}
      >
        <BillingToggle value={billing} onChange={setBilling} />
      </div>
      <div className="mt-10 grid gap-6 @min-[540px]:grid-cols-2 @min-[1140px]:mt-14 @min-[1140px]:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            account={currentPlanId !== null}
            current={plan.id === currentPlanId}
            onChangePlan={onChangePlan}
            changeDisabledReason={changeDisabledReason}
            changeBusy={changeBusy}
          />
        ))}
      </div>
    </div>
  );
}
