"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MeterRow } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { APP_ROUTES } from "@/constants/app";
import { PLANS } from "@/constants/pricing";
import { UNAVAILABLE_REASON } from "@/lib/account-service";
import { usageMetrics } from "@/lib/account-fixtures";
import { useSubscription } from "@/lib/account-store";
import { formatCount, formatCurrency, formatDate } from "@/lib/format";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";
import type { SubscriptionStatus, UsageMetric } from "@/types/account";

import { ServiceNotice } from "./service-notice";
import { DetailList, SettingsSection } from "./settings-section";

/**
 * Billing & Subscription — what this workspace pays for, and what it is using.
 *
 * The page divides on one line, and it is the line that decides what is honest
 * to draw:
 *
 *   **Real.** The plan, its price and the usage. The tiers come from
 *   `constants/pricing` — the same ones the public pricing page renders, so
 *   there is one answer to what MarketFlow costs — and every usage figure is
 *   counted from this workspace: contacts are the rows in the CRM, message
 *   counts are summed from what the campaigns actually sent. A merchant checks
 *   a usage meter against their own knowledge of their business, and a
 *   hand-written number is the one they catch.
 *
 *   **Not real, and shown as such.** The payment method and the invoices. No
 *   payment provider is integrated, and a card ending in 4242 would be the most
 *   expensive fiction in the product: somebody who believes a card is on file
 *   believes their service cannot lapse. Those two blocks are empty states that
 *   say why, not placeholders waiting to be swapped.
 *
 * No charts. Five allowances against five limits is a list of bars, and a
 * donut of "plan usage" would be decoration standing where a number belongs.
 */

const STATUS: Record<SubscriptionStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  trialing: { label: "Trial", tone: "info" },
  past_due: { label: "Past due", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function BillingSettings() {
  const subscription = useSubscription();
  const permissions = useWorkspacePermissions();

  const canView = permissions.can("billing", "view");
  const canManage = permissions.can("billing", "manage");

  const plan = PLANS.find((item) => item.id === subscription.planId);
  const status = STATUS[subscription.status];
  const metrics = usageMetrics(subscription.planId);

  if (!canView) {
    return (
      <>
        <PageHeader
          title="Billing & Subscription"
          description="What this workspace subscribes to."
        />
        <Card>
          <EmptyState
            title="Billing is not visible to your role"
            description={permissionHint("access to billing", permissions.roleName)}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="Your plan, what it costs and what this workspace is using."
        action={
          <Link
            href={APP_ROUTES.pricing}
            className={buttonVariants({ variant: "outline" })}
          >
            Compare plans
            <ArrowUpRight aria-hidden />
          </Link>
        }
      />

      <div className="space-y-6">
        <ServiceNotice tone="unavailable" title="No payment provider is connected">
          The plan and the usage below are this workspace&rsquo;s own. Nothing
          is integrated to hold a card or issue an invoice, so those two
          sections show what is actually there — nothing — rather than a
          placeholder card that would suggest your subscription is paid for.
        </ServiceNotice>

        {/* -- Current plan -------------------------------------------------- */}
        <SettingsSection
          title="Current plan"
          description="What this workspace subscribes to today."
          action={<Badge tone={status.tone}>{status.label}</Badge>}
          bodyClassName="space-y-5"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-2xl font-bold tracking-tight">
              {plan?.name ?? subscription.planId}
            </h3>
            <p className="text-base font-semibold text-text-secondary tabular-nums">
              {formatCurrency(subscription.amount, subscription.currency)}
              <span className="font-medium text-text-muted">
                {" "}
                / {subscription.period === "yearly" ? "year" : "month"}
              </span>
            </p>
          </div>

          {plan ? (
            <p className="max-w-2xl text-sm text-text-secondary">
              {plan.audience}
            </p>
          ) : null}

          <DetailList
            columns={3}
            items={[
              {
                label: "Billing period",
                value: subscription.period === "yearly" ? "Yearly" : "Monthly",
              },
              {
                label: subscription.status === "cancelled" ? "Ends" : "Renews",
                value: formatDate(subscription.renewsAt),
              },
              {
                label: "Subscribed since",
                value: formatDate(subscription.startedAt),
              },
            ]}
          />

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={APP_ROUTES.pricing}
              className={buttonVariants({ variant: "outline", size: "compact" })}
            >
              Change plan
            </Link>

            {/*
              Disabled with the reason attached, rather than hidden or wired to
              a toast. Hiding it makes a merchant hunt for where cancellation
              lives; a toast would claim something happened. The tooltip is on
              a wrapper because a disabled button fires no pointer events of
              its own.
            */}
            <Tooltip content={UNAVAILABLE_REASON.payment}>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="compact"
                  disabled
                  aria-describedby={undefined}
                >
                  Cancel subscription
                </Button>
              </span>
            </Tooltip>
          </div>
        </SettingsSection>

        {/* -- Usage --------------------------------------------------------- */}
        <SettingsSection
          title="Usage"
          description="Counted from this workspace. No limits are being enforced yet."
          bodyClassName="space-y-5"
        >
          {metrics.map((metric) => (
            <UsageMeter key={metric.key} metric={metric} />
          ))}
        </SettingsSection>

        {/* -- Provider-owned ------------------------------------------------ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SettingsSection
            title="Payment method"
            description="Charged when the subscription renews."
          >
            <EmptyState
              compact
              title="No payment method"
              description={UNAVAILABLE_REASON.payment}
              action={
                canManage ? (
                  <Tooltip content={UNAVAILABLE_REASON.payment}>
                    <span className="inline-flex">
                      <Button variant="outline" size="compact" disabled>
                        Add payment method
                      </Button>
                    </span>
                  </Tooltip>
                ) : undefined
              }
            />
          </SettingsSection>

          <SettingsSection
            title="Invoices"
            description="Receipts for every charge, once there are charges."
          >
            <EmptyState
              compact
              title="No invoices yet"
              description={UNAVAILABLE_REASON.invoices}
            />
          </SettingsSection>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Usage meter                                                                */
/* -------------------------------------------------------------------------- */

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
