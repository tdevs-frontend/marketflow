"use client";

import { useCallback } from "react";
import { ExternalLink } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  CAPABILITIES,
  UNAVAILABLE_REASON,
  listPurchaseHistory,
} from "@/lib/account-service";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  Purchase,
  PurchasePaymentState,
  PurchasePlanState,
} from "@/types/account";

import { SectionError } from "../active-sessions-card";
import { SettingsSection, useServiceQuery } from "../settings-section";

/**
 * Everything this workspace has bought, in one table.
 *
 * This replaced two - a Plan History tab listing periods and a Recent Invoices
 * section listing charges - and the merge is the point rather than a tidy-up.
 * The two tables were the same events at different resolutions: a period said
 * "Business, April to July, $99"; three invoices said what that meant month by
 * month. A merchant reconciling a bank statement had to hold both open and
 * join them by date, which is work the product was in a better position to do.
 *
 * So there is one row per charge, carrying the tier it bought. No event appears
 * twice, because periods are what is *stored* and charges are derived from them
 * - see `listPurchaseHistory`. A plan cannot appear without its payments, and a
 * payment cannot appear without the plan it was for.
 *
 * Six columns, and they are the six a merchant reconciles a statement against:
 * what was bought, on what cycle, for how much, when, how it stands, and the
 * reference to quote. Nothing here is decorative.
 */

/** What the plan a charge bought is doing now. */
const PLAN_STATE: Record<
  PurchasePlanState,
  { label: string; tone: BadgeVariant }
> = {
  active: { label: "Active", tone: "success" },
  ended: { label: "Ended", tone: "default" },
  cancelled: { label: "Cancelled", tone: "default" },
  pending: { label: "Pending", tone: "warning" },
};

/** What became of the money. */
const PAYMENT_STATE: Record<
  PurchasePaymentState,
  { label: string; tone: BadgeVariant }
> = {
  paid: { label: "Paid", tone: "info" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "error" },
  refunded: { label: "Refunded", tone: "default" },
};

export function PurchasedHistory() {
  const load = useCallback(() => listPurchaseHistory(), []);
  const { state, reload } = useServiceQuery(load);

  const purchases = state.data ?? [];
  const filled = state.status === "ready" && purchases.length > 0;

  return (
    <SettingsSection
      title="Purchased History"
      description="Every plan this workspace has bought, and the billing record behind each one."
      bodyClassName={filled ? "-mx-5" : undefined}
    >
      {state.status === "loading" ? <PurchasedHistorySkeleton /> : null}

      {state.status === "error" ? (
        <SectionError message={state.error.message} onRetry={() => void reload()} />
      ) : null}

      {state.status === "ready" ? (
        purchases.length === 0 ? (
          <EmptyState
            compact
            title="No purchases yet"
            description="Your plan purchases and billing records will appear here."
          />
        ) : (
          <>
            <div className="px-5 py-1">
              <Table minWidth="48rem">
                <THead>
                  <TH>Plan</TH>
                  <TH>Billing cycle</TH>
                  <TH>Amount</TH>
                  <TH>Purchase date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Invoice</TH>
                </THead>
                <TBody>
                  {purchases.map((purchase) => (
                    <PurchaseRow key={purchase.id} purchase={purchase} />
                  ))}
                </TBody>
              </Table>
            </div>

            {CAPABILITIES.invoices ? null : (
              /* Once, under the table, rather than as a tooltip on every row.
                 A reader who meets the same sentence fourteen times reads it as
                 a fault rather than as a boundary. */
              <p className="border-t border-border px-5 py-3 text-sm text-text-muted">
                {UNAVAILABLE_REASON.invoices}
              </p>
            )}
          </>
        )
      ) : null}
    </SettingsSection>
  );
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const plan = PLAN_STATE[purchase.planState];
  const payment = PAYMENT_STATE[purchase.paymentState];

  return (
    <TR>
      <TD className="font-semibold text-text-primary">{purchase.planName}</TD>
      <TD className="text-text-secondary">
        {purchase.period === "yearly" ? "Yearly" : "Monthly"}
      </TD>
      <TD className="text-text-secondary tabular-nums">
        {formatCurrency(purchase.amount, purchase.currency)}
      </TD>
      <TD className="text-text-secondary tabular-nums">
        {formatDate(purchase.purchasedAt)}
      </TD>
      <TD>
        {/*
          Two facts, two badges, one column - §5's "Active · Paid". They are
          genuinely different questions: what the plan is doing, and what
          happened to the money. A row can be Ended and Paid, or Active and
          Pending, and collapsing them into one word makes the second
          indistinguishable from a plan the merchant already has.

          Deduplicated, because a pending payment on a pending plan would
          otherwise read "Pending · Pending", which says nothing twice.
        */}
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant={plan.tone} size="sm">
            {plan.label}
          </Badge>
          {payment.label === plan.label ? null : (
            <Badge variant={payment.tone} size="sm">
              {payment.label}
            </Badge>
          )}
        </span>
      </TD>
      <TD className="text-right">
        {purchase.invoiceNumber === null ? (
          /* A payment awaiting verification has no invoice, and an invented
             number against it would imply a document somebody could ask for. */
          <span className="text-sm text-text-muted">Not issued</span>
        ) : purchase.invoiceUrl ? (
          <a
            href={purchase.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ExternalLink aria-hidden />
            {purchase.invoiceNumber}
          </a>
        ) : (
          /* The reference without a link. It is the string a merchant quotes
             when they chase a charge, and it is useful whether or not a PDF
             exists - which is why it is text here rather than a dead button. */
          <span className="text-sm font-medium text-text-secondary tabular-nums">
            {purchase.invoiceNumber}
          </span>
        )}
      </TD>
    </TR>
  );
}

function PurchasedHistorySkeleton() {
  return (
    <>
      <div aria-hidden>
        <SkeletonTable rows={5} columns={6} />
      </div>
      <span className="sr-only">Loading your purchased history…</span>
    </>
  );
}
