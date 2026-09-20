"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, CreditCard, Download } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MeterRow } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { APP_ROUTES } from "@/constants/app";
import { PLANS } from "@/constants/pricing";
import {
  CAPABILITIES,
  UNAVAILABLE_REASON,
  cancelSubscription,
  listInvoices,
} from "@/lib/account-service";
import { usageMetrics } from "@/lib/account-fixtures";
import { useSubscription } from "@/lib/account-store";
import { formatCount, formatCurrency, formatDate } from "@/lib/format";
import { useWorkspaceSettings } from "@/lib/workspace-settings-store";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";
import type {
  Invoice,
  InvoiceStatus,
  SubscriptionStatus,
  UsageMetric,
} from "@/types/account";

import { SectionError } from "./active-sessions-card";
import { ServiceNotice } from "./service-notice";
import {
  DetailList,
  SettingsSection,
  useSaveState,
  useServiceQuery,
} from "./settings-section";

/**
 * Billing & Subscription — two tabs, and the split between them is the point.
 *
 *   **Billing Information** answers what this workspace is on, what it costs,
 *   when it is next charged and what it has been charged before. Dashboard
 *   design throughout: the same cards, rules and spacing as every other
 *   Settings page.
 *
 *   **Plans & Pricing** answers what else is available, and renders the
 *   *actual pricing page component* — `PricingPlans`, the same module
 *   `/pricing` and the homepage compose. Not a copy of it: the same file. Two
 *   pricing designs is how a product ends up quoting one price to a visitor
 *   and another to the customer who already pays it, and a second set of cards
 *   would drift on the first day somebody edited a tier.
 *
 * Which is why the two halves deliberately do *not* share a card style. The
 * pricing tab is supposed to feel like the pricing page opened inside the
 * dashboard — featured tier, gradient rule, Most popular badge, the same
 * billing toggle — while the billing tab is supposed to feel like settings.
 * Flattening the tiers into dashboard cards would have been the easy mistake.
 *
 * What is honest here, and what is not, is unchanged and still the page's
 * organising rule:
 *
 *   **Real.** The plan, its price, the renewal date and the usage. The tiers
 *   come from `constants/pricing`, so there is one answer to what MarketFlow
 *   costs; every usage figure is counted from this workspace — contacts are
 *   rows in the CRM, message counts are summed from what campaigns sent. A
 *   merchant checks a usage meter against their own knowledge of the business,
 *   and a hand-written number is the one they catch.
 *
 *   **Not real, and shown as such.** The payment method, the invoices, and any
 *   change to the subscription. No payment provider is integrated. A card
 *   ending in 4242 would be the most expensive fiction in the product —
 *   somebody who believes a card is on file believes their service cannot
 *   lapse — and a "plan changed" confirmation that changes no charge is its
 *   equal. Those are empty states and disabled controls that say why.
 *
 * The billing contact is neither: it is the workspace's own business record,
 * which Workspace Settings owns. It is shown here read-only with a link,
 * because a second editor for a legal name is a question about which screen is
 * telling the truth.
 */

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

type BillingTab = "billing" | "plans";

const TABS: TabItem<BillingTab>[] = [
  { value: "billing", label: "Billing Information" },
  { value: "plans", label: "Plans & Pricing" },
];

const STATUS: Record<SubscriptionStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  trialing: { label: "Trial", tone: "info" },
  past_due: { label: "Past due", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function BillingSettings() {
  const router = useRouter();
  const params = useSearchParams();
  const idBase = useId();

  const permissions = useWorkspacePermissions();

  const canView = permissions.can("billing", "view");
  const canManage = permissions.can("billing", "manage");

  /*
   * The tab lives in the URL, so "here is our billing" and "here are the
   * plans" are two links somebody can send. `replace` rather than `push`: two
   * tabs should not fill the history stack, and Back should leave Settings
   * rather than walk the strip. The default drops the parameter instead of
   * writing `?tab=billing`, so the clean URL and the explicit one both land on
   * Billing Information.
   */
  const tab: BillingTab = params.get("tab") === "plans" ? "plans" : "billing";

  const setTab = (value: BillingTab) => {
    const next = new URLSearchParams(params.toString());
    if (value === "billing") next.delete("tab");
    else next.set("tab", value);

    const query = next.toString();
    const base = APP_ROUTES.settingsBilling;
    router.replace(query ? `${base}?${query}` : base, { scroll: false });
  };

  if (!canView) {
    return (
      <>
        <PageHeader
          title="Billing & Subscription"
          description="Manage your subscription, billing information and available plans."
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
        description="Manage your subscription, billing information and available plans."
      />

      {/* `bleed={false}`: the strip sits on the page, not inside a card, and
          the −20px pull is measured against a `CardBody`'s padding. */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Billing sections"
        idBase={idBase}
        bleed={false}
      />

      {tab === "billing" ? (
        <TabPanel idBase={idBase} value="billing" className="space-y-6">
          <BillingInformation canManage={canManage} />
        </TabPanel>
      ) : (
        <TabPanel idBase={idBase} value="plans" className="space-y-6">
          <PlansAndPricing />
        </TabPanel>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab 1 — Billing Information                                                */
/* -------------------------------------------------------------------------- */

function BillingInformation({ canManage }: { canManage: boolean }) {
  const subscription = useSubscription();

  const plan = PLANS.find((item) => item.id === subscription.planId);
  const status = STATUS[subscription.status];
  const metrics = usageMetrics(subscription.planId);
  const per = subscription.period === "yearly" ? "year" : "month";

  return (
    <>
      {/*
        No banner across the top of this tab.

        There was one, and it said what the payment, invoice and subscription
        blocks each say for themselves a screen further down. Three sections
        that state their own boundary at the control it applies to do not need
        a fourth statement above them: a reader who meets the same sentence
        four times stops reading it, which is exactly the sentence that has to
        land.
      */}

      {/* -- Current plan --------------------------------------------------- */}
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
            <span className="font-medium text-text-muted"> / {per}</span>
          </p>
        </div>

        {plan ? (
          <p className="max-w-2xl text-sm text-text-secondary">{plan.audience}</p>
        ) : null}

        {/*
          The plan name, the price and the status are the headline and the
          badge above; they are not repeated here. A summary list that restates
          what is set in 24px type directly above it reads as a rendering bug,
          and the three facts that are genuinely only available here — the
          cycle, the next date, how long this has been running — get lost among
          the repeats.
        */}
        <DetailList
          columns={3}
          items={[
            {
              label: "Billing cycle",
              value: subscription.period === "yearly" ? "Yearly" : "Monthly",
            },
            {
              label:
                subscription.status === "cancelled"
                  ? "Access ends"
                  : "Next billing date",
              value: formatDate(subscription.renewsAt),
            },
            {
              label: "Subscribed since",
              value: formatDate(subscription.startedAt),
            },
          ]}
        />
      </SettingsSection>

      {/* -- Usage ----------------------------------------------------------- */}
      <SettingsSection
        title="Plan usage"
        description="Counted from this workspace. No limits are being enforced yet."
        bodyClassName="space-y-5"
      >
        {metrics.map((metric) => (
          <UsageMeter key={metric.key} metric={metric} />
        ))}
      </SettingsSection>

      <PaymentInformation canManage={canManage} />
      <BillingContact />
      <RecentInvoices />
      <SubscriptionActions canManage={canManage} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Payment information                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The card on file, or the honest absence of one.
 *
 * `subscription.paymentMethod` is `null` and the branch below is written
 * against a real one anyway, because the shape of this block is not in doubt —
 * brand, last four, expiry — only whether anything fills it. What is *not*
 * written is a default: no `?? { brand: "Visa", last4: "4242" }` anywhere, at
 * any point in this file.
 */
function PaymentInformation({ canManage }: { canManage: boolean }) {
  const { paymentMethod } = useSubscription();

  return (
    <SettingsSection
      title="Payment information"
      description="Charged when the subscription renews."
    >
      {paymentMethod ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
              <CreditCard className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {paymentMethod.brand} •••• {paymentMethod.last4}
              </p>
              <p className="mt-0.5 text-sm text-text-muted tabular-nums">
                Expires{" "}
                {String(paymentMethod.expiryMonth).padStart(2, "0")}/
                {String(paymentMethod.expiryYear).slice(-2)}
              </p>
            </div>
          </div>

          {canManage ? (
            <UnavailableAction reason={UNAVAILABLE_REASON.payment}>
              Update payment method
            </UnavailableAction>
          ) : null}
        </div>
      ) : (
        <EmptyState
          compact
          title="No payment method added"
          description={UNAVAILABLE_REASON.payment}
          action={
            canManage ? (
              <UnavailableAction reason={UNAVAILABLE_REASON.payment}>
                Add payment method
              </UnavailableAction>
            ) : undefined
          }
        />
      )}
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Billing contact                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Who the invoice would be addressed to — read from the record that owns it.
 *
 * The legal name, support address and business address live in Workspace
 * Settings under Business, and they stay there. This is the third place in the
 * module to make that call, and for the same reason each time: two editors for
 * one value is not a convenience, it is a question about which screen is
 * telling the truth, and the merchant has no way to answer it.
 */
function BillingContact() {
  const { business } = useWorkspaceSettings();

  const address = [business.address, business.country]
    .filter(Boolean)
    .join(", ");

  return (
    <SettingsSection
      title="Billing contact"
      description="Taken from the workspace business details, where invoices would be addressed."
      action={
        <Link
          href={APP_ROUTES.workspaceSettings}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Manage billing details
          <ArrowUpRight aria-hidden />
        </Link>
      }
    >
      <DetailList
        columns={3}
        items={[
          {
            label: "Billing name",
            value: business.legalName || "Not recorded",
          },
          {
            label: "Billing email",
            value: business.supportEmail || "Not recorded",
          },
          { label: "Billing address", value: address || "Not recorded" },
        ]}
      />
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                   */
/* -------------------------------------------------------------------------- */

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> =
  {
    paid: { label: "Paid", tone: "success" },
    open: { label: "Due", tone: "warning" },
    uncollectible: { label: "Failed", tone: "danger" },
    void: { label: "Void", tone: "neutral" },
  };

/**
 * Receipts, once there are charges to receipt.
 *
 * Loaded through the service rather than read from a store, because invoices
 * are the one thing on this page that genuinely lives somewhere else: they are
 * issued by a payment provider against charges it made, and nothing in the
 * browser can reconstruct them. That is why the unavailable state is a stated
 * boundary and not an empty table — "nothing has billed you yet" and "this
 * cannot tell you what has billed you" are different answers, and only the
 * second one is true.
 *
 * `Download` is rendered only for an invoice that carries a document URL. A
 * download button that resolves to nothing is worst exactly where it matters
 * most, which is somebody assembling records for an accountant.
 */
function RecentInvoices() {
  const load = useCallback(() => listInvoices(), []);
  const { state, reload } = useServiceQuery(load);

  const invoices = state.data ?? [];
  const unavailable =
    state.status === "error" && state.error.code === "service_unavailable";

  return (
    <SettingsSection
      title="Recent invoices"
      description="Every charge this workspace has been issued a receipt for."
      bodyClassName={state.status === "ready" && invoices.length > 0 ? "p-0" : undefined}
    >
      {state.status === "loading" ? <InvoiceSkeleton /> : null}

      {unavailable ? (
        <ServiceNotice tone="unavailable" title="No invoices yet">
          {state.status === "error" ? state.error.message : null} They will be
          listed here, newest first, once charges are being made.
        </ServiceNotice>
      ) : null}

      {state.status === "error" && !unavailable ? (
        <SectionError message={state.error.message} onRetry={() => void reload()} />
      ) : null}

      {state.status === "ready" ? (
        invoices.length === 0 ? (
          <EmptyState
            compact
            title="No invoices yet"
            description="Invoices will appear here after your first billing event."
          />
        ) : (
          <div className="px-5 py-1">
            <Table minWidth="40rem">
              <THead>
                <TH>Invoice</TH>
                <TH>Date</TH>
                <TH>Amount</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </THead>
              <TBody>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </TBody>
            </Table>
          </div>
        )
      ) : null}
    </SettingsSection>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const status = INVOICE_STATUS[invoice.status];

  return (
    <TR>
      <TD className="font-semibold text-text-primary">{invoice.number}</TD>
      <TD className="text-text-secondary">{formatDate(invoice.issuedAt)}</TD>
      <TD className="text-text-secondary tabular-nums">
        {formatCurrency(invoice.amount, invoice.currency)}
      </TD>
      <TD>
        <Badge tone={status.tone} size="sm">
          {status.label}
        </Badge>
      </TD>
      <TD className="text-right">
        {invoice.documentUrl ? (
          <a
            href={invoice.documentUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Download aria-hidden />
            Download
          </a>
        ) : (
          <span className="text-sm text-text-muted">No document</span>
        )}
      </TD>
    </TR>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-4">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-3.5 w-28 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
          <Skeleton className="ms-auto h-6 w-16 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading your invoices…</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subscription actions                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The two things you can do to a subscription, in one place and only one.
 *
 * They used to sit inside the Current plan card, which is where a merchant
 * looks for facts rather than for controls, and "Change plan" pointed at the
 * public pricing page — out of the dashboard entirely. It now moves to the
 * tab beside it, which is the whole reason that tab exists.
 *
 * Cancel is gated twice over: it needs the billing capability to be reachable
 * at all, and a confirmation once it is. The confirmation is written now
 * rather than when the capability opens, because the day that switch flips is
 * the worst possible day to be writing the guard on an irreversible action.
 */
function SubscriptionActions({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const { state, run } = useSaveState();
  const [confirming, setConfirming] = useState(false);

  const subscription = useSubscription();
  const cancelled = subscription.status === "cancelled";
  const allowed = canManage && CAPABILITIES.planChange;

  return (
    <SettingsSection
      title="Subscription"
      description="Move between plans, or end the subscription at the end of the paid period."
      bodyClassName="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="compact"
          onClick={() =>
            router.replace(`${APP_ROUTES.settingsBilling}?tab=plans`, {
              scroll: false,
            })
          }
        >
          Change plan
        </Button>

        {cancelled ? (
          <p className="text-sm font-medium text-text-secondary">
            Cancelled. Access continues until{" "}
            {formatDate(subscription.renewsAt)}.
          </p>
        ) : allowed ? (
          <Button
            variant="ghost"
            size="compact"
            className="text-error-text"
            disabled={state.status === "saving"}
            onClick={() => setConfirming(true)}
          >
            Cancel subscription
          </Button>
        ) : (
          <UnavailableAction
            reason={
              canManage
                ? UNAVAILABLE_REASON.planChange
                : "Cancelling a subscription is not available to your role."
            }
          >
            Cancel subscription
          </UnavailableAction>
        )}
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-sm text-text-muted empty:hidden"
      >
        {state.status === "error" ? (
          <span className="font-medium text-error-text">{state.message}</span>
        ) : allowed || cancelled ? null : (
          UNAVAILABLE_REASON.planChange
        )}
      </p>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void run(cancelSubscription)}
        title="Cancel this subscription?"
        description={`The workspace keeps its plan until ${formatDate(subscription.renewsAt)}, then loses it.`}
        confirmLabel="Cancel subscription"
        cancelLabel="Keep subscription"
      >
        <p className="text-sm text-text-secondary">
          Campaigns, automations and contacts stay in place, but sending stops
          when the period ends. You can resubscribe before then to avoid any
          interruption.
        </p>
      </ConfirmDialog>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab 2 — Plans & Pricing                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The pricing page's own cards, inside the dashboard.
 *
 * `PricingPlans` and nothing else: no marketing header, no navbar, no footer,
 * no sign-up call to action, no second grid. The section heading, the eyebrow
 * and the page background belong to `PricingSection`, which is the marketing
 * wrapper, and the dashboard supplies its own heading already.
 *
 * One notice above it, because the tiers are buttons and the buttons cannot do
 * anything yet. Stated once here rather than as a tooltip on each of three
 * disabled controls — a merchant who meets the same sentence three times reads
 * it as a fault rather than as a boundary.
 */
function PlansAndPricing() {
  const subscription = useSubscription();

  return (
    <>
      <ServiceNotice tone="unavailable" title="Plan changes are not live yet">
        {UNAVAILABLE_REASON.planChange} The plans and prices below are the same
        ones the public pricing page shows, and your current tier is marked.
      </ServiceNotice>

      <PricingPlans
        /* Looked up rather than cast: the subscription carries a plan id as a
           plain string, and a tier that has been retired from
           `constants/pricing` must mark nothing rather than appear to match. */
        currentPlanId={
          PLANS.find((plan) => plan.id === subscription.planId)?.id ?? null
        }
        defaultBilling={subscription.period}
        changeDisabledReason={UNAVAILABLE_REASON.planChange}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared controls                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A button that is off, with the reason attached.
 *
 * The tooltip is on a wrapper because a disabled button fires no pointer
 * events of its own, which is the detail that turns "greyed out for no reason"
 * into an explanation. Hiding the control instead would send a merchant
 * hunting for where cancellation lives; wiring it to a toast would claim
 * something happened.
 */
function UnavailableAction({
  reason,
  children,
}: {
  reason: string;
  children: string;
}) {
  return (
    <Tooltip content={reason}>
      <span className="inline-flex">
        {/* Always `outline`. It is the one variant whose disabled state the
            design system actually draws — a muted label inside a firm border.
            `ghost` keeps `text-primary` when disabled, so at 50% opacity it
            reads as a link somebody has not tried clicking yet. */}
        <Button variant="outline" size="compact" disabled>
          {children}
        </Button>
      </span>
    </Tooltip>
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
