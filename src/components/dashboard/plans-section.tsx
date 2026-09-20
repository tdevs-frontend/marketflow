"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PricingPlans } from "@/components/marketing/pricing-plans";
import { buttonVariants } from "@/components/ui/button";
import { useWorkspacePermissions } from "@/components/workspace/use-workspace-permissions";
import { APP_ROUTES } from "@/constants/app";
import { PLANS } from "@/constants/pricing";
import { useSubscription } from "@/lib/account-store";

/**
 * The plans, on the merchant overview.
 *
 * The same `PricingPlans` the landing page renders, the same one `/pricing`
 * renders, the same one Billing's Plans & Pricing tab renders — one component,
 * one set of tiers, one set of prices. Four surfaces cannot disagree about
 * what MarketFlow costs, because there is only one place that says.
 *
 * What this file adds is the *context*, which is the only part that differs
 * between those four. On the dashboard that means three things:
 *
 *   The tier the workspace is on is marked, so the block reads as "here is
 *   where you are" rather than as an advertisement aimed at somebody who is
 *   already paying.
 *
 *   The calls to action go to Billing rather than nowhere. On the Billing page
 *   itself they are disabled with a reason, because that is where a plan would
 *   actually be changed and where the missing payment provider has to be
 *   stated. Here they are a real navigation to that screen — which is what a
 *   Change plan button does in any product, and it does it honestly.
 *
 *   It is not shown at all to a role that cannot see billing. Pricing plus a
 *   link into a screen that will refuse them is worse than nothing.
 *
 * Position matters and is the page's decision, not this component's: it goes
 * last, under the six business widgets, so it never sits between a merchant
 * and their numbers.
 */

export function PlansSection({ className }: { className?: string }) {
  const router = useRouter();
  const subscription = useSubscription();
  const permissions = useWorkspacePermissions();

  /* A role without billing visibility gets no plans block. Not a disabled
     one — there is nothing here for them to act on, and a section that exists
     only to refuse is noise on the page they open every morning. */
  if (!permissions.can("billing", "view")) return null;

  const plan = PLANS.find((item) => item.id === subscription.planId);

  return (
    <section aria-labelledby="dashboard-plans" className={className}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 id="dashboard-plans" className="text-lg font-bold tracking-tight">
            Plans &amp; pricing
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            {plan
              ? `This workspace is on ${plan.name}. Here is everything MarketFlow offers.`
              : "Everything MarketFlow offers, and what each tier includes."}
          </p>
        </div>

        <Link
          href={APP_ROUTES.settingsBilling}
          className={buttonVariants({ variant: "outline", size: "compact" })}
        >
          Manage billing
          <ArrowUpRight aria-hidden />
        </Link>
      </div>

      {/*
        Rendered exactly as the landing page renders it — no props that change
        how a card looks, only which tier is marked and where its button goes.
        The grid folds on the width this column actually has, which on the
        dashboard is wider than in Settings and narrower than on the marketing
        pages; the cards themselves are identical on all three.
      */}
      <PricingPlans
        currentPlanId={plan?.id ?? null}
        defaultBilling={subscription.period}
        /* The toggle's top margin clears `PricingSection`'s heading on the
           marketing pages. Here the heading above is this file's, already
           spaced, so it would only be a gap. */
        topSpacing={false}
        onChangePlan={() =>
          router.push(`${APP_ROUTES.settingsBilling}?tab=plans`)
        }
      />
    </section>
  );
}
