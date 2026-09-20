"use client";

import { useCallback } from "react";
import { ExternalLink } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { CAPABILITIES, UNAVAILABLE_REASON, listInvoices } from "@/lib/account-service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/types/account";

import { SectionError } from "../active-sessions-card";
import { SettingsSection, useServiceQuery } from "../settings-section";

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> =
  {
    paid: { label: "Paid", tone: "success" },
    open: { label: "Due", tone: "warning" },
    uncollectible: { label: "Failed", tone: "danger" },
    void: { label: "Void", tone: "neutral" },
  };

/**
 * The charges this workspace has been receipted for — recent ones, and only
 * recent ones.
 *
 * "Recent invoices" is a section on a settings page and is sized like one. The
 * service caps the list; this renders what it gets and does not paginate,
 * because a merchant looking for a fourteen-month-old charge wants an archive
 * with search and date filters, and half of one bolted under Billing contact
 * serves neither need. When that archive exists, this section's job is to link
 * to it.
 *
 * `View` is rendered only for an invoice carrying a document. A link that
 * resolves to nothing is worst exactly where it matters most, which is somebody
 * assembling records for an accountant — so the rest say plainly that no
 * document exists, and the notice above says why.
 */
export function InvoiceList() {
  const load = useCallback(() => listInvoices(), []);
  const { state, reload } = useServiceQuery(load);

  const invoices = state.data ?? [];

  return (
    <SettingsSection
      title="Recent invoices"
      description="The most recent charges against this workspace."
      bodyClassName={
        state.status === "ready" && invoices.length > 0 ? "p-0" : undefined
      }
    >
      {state.status === "loading" ? <InvoiceSkeleton /> : null}

      {state.status === "error" ? (
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
          <>
            <div className="px-5 py-1">
              <Table minWidth="38rem">
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

            {CAPABILITIES.invoices ? null : (
              /* Once, under the table, rather than as a tooltip on every row.
                 A reader who meets the same sentence six times reads it as a
                 fault rather than as a boundary. */
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

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const status = INVOICE_STATUS[invoice.status];

  return (
    <TR>
      <TD className="font-semibold text-text-primary">{invoice.number}</TD>
      <TD className="text-text-secondary tabular-nums">
        {formatDate(invoice.issuedAt)}
      </TD>
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
            <ExternalLink aria-hidden />
            View
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
