"use client";

import { useCallback } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listPlanHistory } from "@/lib/account-service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PlanPeriod, PlanPeriodStatus } from "@/types/account";

import { SectionError } from "../active-sessions-card";
import { SettingsSection, useServiceQuery } from "../settings-section";

/** Two states a period can be in, and the badge each one wears. */
const PERIOD_STATUS: Record<
  PlanPeriodStatus,
  { label: string; tone: BadgeTone }
> = {
  active: { label: "Active", tone: "success" },
  ended: { label: "Ended", tone: "neutral" },
};

/**
 * What this workspace has been on, period by period.
 *
 * A table, not cards. The pricing tab one along is four tiers laid out to be
 * *compared*, which is why it gets the full landing-page treatment; this is a
 * ledger, read down a column — was I on Growth in March, what did it cost, when
 * did it end. Repeating the pricing card design here would make a record of the
 * past look like an offer, and the two tabs would stop being distinguishable at
 * a glance.
 *
 * Six columns and no more, because they are the six a merchant reconciles a
 * bank statement against. No invoice number: that belongs to the receipt, and
 * Recent invoices on the first tab is where a receipt is looked up.
 *
 * The rows come from `listPlanHistory`, already ordered newest first — the
 * panel renders what the service hands it and sorts nothing, so there is one
 * place the order is decided. In this build they are the demo workspace's own
 * records from `lib/account-fixtures`, derived from the same tiers and prices
 * the pricing page reads; a real endpoint replaces that one function body.
 */
export function PlanHistory() {
  const load = useCallback(() => listPlanHistory(), []);
  const { state, reload } = useServiceQuery(load);

  const periods = state.data ?? [];

  return (
    <SettingsSection
      title="Plan history"
      description="View your previous plans and subscription changes."
      bodyClassName={
        state.status === "ready" && periods.length > 0 ? "p-0" : undefined
      }
    >
      {state.status === "loading" ? <PlanHistorySkeleton /> : null}

      {state.status === "error" ? (
        <SectionError message={state.error.message} onRetry={() => void reload()} />
      ) : null}

      {state.status === "ready" ? (
        periods.length === 0 ? (
          <EmptyState
            compact
            title="No plan history yet"
            description="Each period this workspace is billed for will be listed here, from the day it subscribes."
          />
        ) : (
          <div className="px-5 py-1">
            <Table minWidth="44rem">
              <THead>
                <TH>Plan</TH>
                <TH>Billing cycle</TH>
                <TH>Amount</TH>
                <TH>Started</TH>
                <TH>Ended</TH>
                <TH>Status</TH>
              </THead>
              <TBody>
                {periods.map((period) => (
                  <PlanPeriodRow key={period.id} period={period} />
                ))}
              </TBody>
            </Table>
          </div>
        )
      ) : null}
    </SettingsSection>
  );
}

function PlanPeriodRow({ period }: { period: PlanPeriod }) {
  const status = PERIOD_STATUS[period.status];

  return (
    <TR>
      <TD className="font-semibold text-text-primary">{period.planName}</TD>
      <TD className="text-text-secondary">
        {period.period === "yearly" ? "Yearly" : "Monthly"}
      </TD>
      <TD className="text-text-secondary tabular-nums">
        {formatCurrency(period.amount, period.currency)}
        <span className="text-text-muted">
          {period.period === "yearly" ? " / year" : " / month"}
        </span>
      </TD>
      <TD className="text-text-secondary tabular-nums">
        {formatDate(period.startedAt)}
      </TD>
      <TD>
        {period.endedAt ? (
          <span className="text-text-secondary tabular-nums">
            {formatDate(period.endedAt)}
          </span>
        ) : (
          /* "Current", not a date and not a dash. This period has not ended,
             and the next renewal is when it would be charged again rather than
             when it stopped — a date in the Ended column is read as one that
             has passed. */
          <span className="font-medium text-text-muted">Current</span>
        )}
      </TD>
      <TD>
        <Badge tone={status.tone} size="sm">
          {status.label}
        </Badge>
      </TD>
    </TR>
  );
}

function PlanHistorySkeleton() {
  return (
    <>
      <div aria-hidden>
        <SkeletonTable rows={4} columns={6} />
      </div>
      <span className="sr-only">Loading your plan history…</span>
    </>
  );
}
