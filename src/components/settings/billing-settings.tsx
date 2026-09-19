"use client";

import Link from "next/link";
import {
  Check,
  CreditCard,
  FileText,
  Megaphone,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { APP_ROUTES } from "@/constants/app";
import { PLANS, YEARLY_DISCOUNT, yearlyMonthly } from "@/constants/pricing";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { CONTACTS } from "@/lib/customer-fixtures";
import { formatNumber } from "@/lib/format";
import { WORKFLOWS } from "@/lib/workflow-fixtures";
import { WORKSPACE_MEMBERS } from "@/lib/workspace-fixtures";

import { ServiceNotice } from "./service-notice";

/**
 * Billing — real plans, honest subscription.
 *
 * This route did not exist. The sidebar has linked "Billing & Subscription" at
 * `/dashboard/settings/billing` for as long as the Settings section has been
 * there, and `next build` never emitted a page for it, so the link 404'd.
 *
 * What it shows is split down one line: the *plans* are real — they come from
 * `constants/pricing`, the same tiers and prices the public pricing page
 * renders, so there is one answer to what MarketFlow costs — and the
 * *subscription* is not, because there is no payment provider integrated.
 *
 * So there is no current plan badge, no card ending in 4242, no PDF invoices
 * and no "Cancel subscription". Inventing a payment method is the one fake
 * state on this page that could cost a merchant actual money: somebody who
 * believes a card is on file believes their service will not lapse.
 *
 * Usage is real. Those are counts of what is in this workspace right now, and
 * they are worth showing on their own — a merchant deciding between Starter
 * and Growth needs to know they already hold 27 contacts, not a bar chart of a
 * limit nothing is enforcing.
 */

const usage: Kpi[] = [
  {
    label: "Contacts",
    value: formatNumber(CONTACTS.length),
    icon: Users,
    tone: "brand",
    hint: "People in the CRM",
  },
  {
    label: "Campaigns",
    value: formatNumber(CAMPAIGNS.length),
    icon: Megaphone,
    tone: "info",
    hint: "Across every channel",
  },
  {
    label: "Automations",
    value: formatNumber(WORKFLOWS.length),
    icon: Workflow,
    tone: "success",
    hint: "Built in the workflow canvas",
  },
  {
    label: "Team members",
    value: formatNumber(
      WORKSPACE_MEMBERS.filter((member) => member.status !== "invited").length,
    ),
    icon: UserCog,
    tone: "neutral",
    hint: "Excluding open invitations",
  },
];

function PlanCard({ plan }: { plan: (typeof PLANS)[number] }) {
  const featured = Boolean(plan.featured);

  return (
    <Card
      className="flex flex-col p-5"
      selected={featured}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base sm:text-lg">{plan.name}</h3>
        {featured ? <Badge tone="brand">Most popular</Badge> : null}
      </div>

      <p className="mt-1 text-sm font-medium text-text-secondary">
        {plan.audience}
      </p>

      <p className="mt-4 flex items-baseline gap-1.5">
        {plan.monthly === null ? (
          <span className="text-2xl font-bold text-text-primary">
            Custom
          </span>
        ) : (
          <>
            <span className="text-2xl font-bold text-text-primary tabular-nums">
              ${plan.monthly}
            </span>
            <span className="text-sm font-medium text-text-muted">/ month</span>
          </>
        )}
      </p>

      {plan.monthly === null ? (
        <p className="mt-1 text-sm text-text-muted">Quoted per organisation.</p>
      ) : (
        <p className="mt-1 text-sm text-text-muted tabular-nums">
          ${yearlyMonthly(plan.monthly)} / month billed yearly
        </p>
      )}

      {/* Five, not all ten. A plan card is for choosing between tiers, and the
          pricing page is where the full list already lives. */}
      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.slice(0, 5).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={APP_ROUTES.pricing}
        className={buttonVariants({
          variant: featured ? "primary" : "outline",
          size: "compact",
          className: "mt-5 w-full",
        })}
      >
        Compare on pricing
      </Link>
    </Card>
  );
}

export function BillingSettings() {
  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="What this workspace uses, what MarketFlow costs, and where payment will be set up."
      />

      <div className="mt-6 space-y-6">
        <ServiceNotice
          tone="unavailable"
          title="No payment provider is connected"
          action={
            <Link
              href={APP_ROUTES.pricing}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              See pricing
            </Link>
          }
        >
          This workspace has no subscription, no payment method and no invoice
          history, because nothing has been integrated to hold them. The plans
          below are MarketFlow&rsquo;s real tiers; the usage figures are this
          workspace&rsquo;s real counts. Everything a provider would own is
          shown as the empty state it actually is.
        </ServiceNotice>

        <Card className="p-5">
          <h2 className="text-base sm:text-lg">Current usage</h2>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            What this workspace holds today. No plan limits are being enforced.
          </p>
          <KpiStrip className="mt-4" items={usage} />
        </Card>

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base sm:text-lg">Plans</h2>
            <p className="text-sm font-medium text-text-secondary">
              Save {Math.round(YEARLY_DISCOUNT * 100)}% billed yearly
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Payment method"
              description="Charged when a subscription starts."
            />
            <CardBody>
              <EmptyState
                compact
                title="No payment method"
                description="A card can be added once a payment provider is connected. Nothing is stored in the dashboard."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Invoices"
              description="Receipts for every charge, once there are charges."
            />
            <CardBody>
              <EmptyState
                compact
                title="No invoices yet"
                description="Invoices are issued by the payment provider. None exist for this workspace."
              />
            </CardBody>
          </Card>
        </div>

        {/* Two glyphs, purely so the empty pair above reads as a section that
            will fill rather than two things that failed to load. */}
        <p className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <CreditCard className="size-4" aria-hidden />
          <FileText className="size-4" aria-hidden />
          Billing records appear here once a provider is connected.
        </p>
      </div>
    </>
  );
}
