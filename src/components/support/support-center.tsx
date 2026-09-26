"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Eye, Inbox, Plus, UserRound } from "lucide-react";

import { ActiveFilterChips, type FilterChip } from "@/components/customers/customer-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  SUPPORT_ROUTES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  categoryLabel,
} from "@/constants/support";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import { formatDate, formatDateTime } from "@/lib/format";
import { useSupportTickets } from "@/lib/support-service";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import type { SupportTicketDetail } from "@/types/support";
import { PriorityBadge, TicketStatusBadge } from "./support-badges";
import { useMerchantActor } from "./use-support";

/**
 * The merchant's Support Center: this workspace's tickets, and nothing else.
 *
 * `useSupportTickets` is the service's workspace-scoped read - the list below
 * never sees another merchant's ticket to filter out. Filters live in the URL
 * and run before pagination, like every table in the dashboard.
 */

const FILTERS = ["status", "priority", "category", "date"] as const;
type FilterKey = (typeof FILTERS)[number];

export const DATE_RANGES = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

/** Against the workspace clock, like every fixture date - see `lib/workspace-clock`. */
export function withinDays(at: string, days: string) {
  if (days === "all") return true;
  return WORKSPACE_NOW_MS - new Date(at).getTime() <= Number(days) * 86_400_000;
}

const DONE = new Set(["resolved", "closed"]);

export function SupportCenter() {
  const router = useRouter();
  const actor = useMerchantActor();
  const tickets = useSupportTickets(actor);
  const table = useTableState<FilterKey>(FILTERS);
  const { filters } = table;

  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 250);
  /* The URL follows the debounced draft - in an effect, because writing it
     updates the router, which must not happen while this component renders. */
  const { search: urlSearch, setSearch } = table;
  useEffect(() => {
    if (debounced !== urlSearch) setSearch(debounced);
  }, [debounced, urlSearch, setSearch]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (term && !`${ticket.ticketNumber} ${ticket.subject}`.toLowerCase().includes(term)) return false;
      if (filters.status !== "all" && ticket.status !== filters.status) return false;
      if (filters.priority !== "all" && ticket.priority !== filters.priority) return false;
      if (filters.category !== "all" && ticket.category !== filters.category) return false;
      if (!withinDays(ticket.createdAt, filters.date)) return false;
      return true;
    });
  }, [tickets, debounced, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const current = Math.min(table.page, totalPages);
  const rows = filtered.slice((current - 1) * table.pageSize, current * table.pageSize);

  const kpis: Kpi[] = [
    {
      label: "Open Tickets",
      value: String(tickets.filter((ticket) => !DONE.has(ticket.status)).length),
      icon: Inbox,
      tone: "brand",
      hint: "Everything not yet resolved",
    },
    {
      label: "Waiting for Support",
      value: String(
        tickets.filter((ticket) => ["open", "in_progress", "waiting_support"].includes(ticket.status)).length,
      ),
      icon: Clock,
      tone: "warning",
      hint: "Our move",
    },
    {
      label: "Waiting for You",
      value: String(tickets.filter((ticket) => ticket.status === "waiting_merchant").length),
      icon: UserRound,
      tone: "info",
      hint: "Support needs a reply",
    },
    {
      label: "Resolved",
      value: String(tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length),
      icon: CheckCircle2,
      tone: "success",
      hint: "Resolved or closed",
    },
  ];

  const labelIn = (list: { value: string; label: string }[], value: string) =>
    list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.status !== "all" ? { key: "status", label: "Status", value: labelIn(TICKET_STATUSES, filters.status) } : null,
    filters.priority !== "all" ? { key: "priority", label: "Priority", value: labelIn(TICKET_PRIORITIES, filters.priority) } : null,
    filters.category !== "all" ? { key: "category", label: "Category", value: labelIn(TICKET_CATEGORIES, filters.category) } : null,
    filters.date !== "all" ? { key: "date", label: "Created", value: labelIn(DATE_RANGES, filters.date) } : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  const open = (ticket: SupportTicketDetail) => router.push(SUPPORT_ROUTES.ticket(ticket.ticketNumber));
  const lastReply = (ticket: SupportTicketDetail) =>
    `${formatDateTime(ticket.lastReplyAt)} · ${ticket.lastReplyBy === "support" ? "Support" : "You"}`;

  return (
    <>
      <PageHeader
        title="Support Center"
        description="Get help from the MarketFlow support team and track your support requests."
        action={
          <ButtonLink href={SUPPORT_ROUTES.create}>
            <Plus className="size-4" />
            Create Ticket
          </ButtonLink>
        }
      />

      {tickets.length === 0 ? (
        <EmptyState
          title="No support tickets yet"
          description="Need help with MarketFlow? Create a ticket and our support team will assist you."
          action={
            <ButtonLink href={SUPPORT_ROUTES.create} size="sm">
              <Plus className="size-4" />
              Create Ticket
            </ButtonLink>
          }
        />
      ) : (
        <>
          <KpiStrip items={kpis} />

          <Card className="p-5">
            <FilterBar
              search={searchDraft}
              onSearchChange={setSearchDraft}
              placeholder="Search tickets…"
              activeCount={chips.length}
              onReset={clearEverything}
            >
              <Select label="Filter by status" size="sm" value={filters.status} onChange={(next) => table.setFilter("status", next)} options={[{ value: "all", label: "All statuses" }, ...TICKET_STATUSES]} className="lg:w-44" />
              <Select label="Filter by priority" size="sm" value={filters.priority} onChange={(next) => table.setFilter("priority", next)} options={[{ value: "all", label: "All priorities" }, ...TICKET_PRIORITIES]} className="lg:w-36" />
              <Select label="Filter by category" size="sm" value={filters.category} onChange={(next) => table.setFilter("category", next)} options={[{ value: "all", label: "All categories" }, ...TICKET_CATEGORIES]} className="lg:w-40" />
              <Select label="Filter by created date" size="sm" value={filters.date} onChange={(next) => table.setFilter("date", next)} options={[{ value: "all", label: "Any date" }, ...DATE_RANGES]} className="lg:w-36" />
            </FilterBar>

            <ActiveFilterChips chips={chips} onRemove={(key) => table.clearFilter(key as FilterKey)} onClearAll={clearEverything} className="mt-3" />

            {rows.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="No tickets match those filters"
                description="Try a different search, or clear the filters to see every ticket."
                action={
                  <Button size="sm" variant="outline" onClick={clearEverything}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <Table minWidth="60rem" className="mt-4 max-lg:hidden">
                  <THead>
                    <TH>Ticket</TH>
                    <TH>Subject</TH>
                    <TH>Category</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH>Last Reply</TH>
                    <TH>Created</TH>
                    <TH align="right" />
                  </THead>
                  <TBody>
                    {rows.map((ticket) => (
                      <TR key={ticket.id}>
                        <TD className="whitespace-nowrap font-mono text-text-secondary">#{ticket.ticketNumber}</TD>
                        <TD className="max-w-80">
                          <button
                            type="button"
                            onClick={() => open(ticket)}
                            className="block max-w-full truncate rounded-btn text-left font-semibold text-text-primary hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            {ticket.subject}
                          </button>
                        </TD>
                        <TD className="whitespace-nowrap text-text-secondary">{categoryLabel(ticket.category)}</TD>
                        <TD><PriorityBadge priority={ticket.priority} /></TD>
                        <TD><TicketStatusBadge status={ticket.status} /></TD>
                        <TD className="whitespace-nowrap text-text-muted">{lastReply(ticket)}</TD>
                        <TD className="whitespace-nowrap text-text-muted">{formatDate(ticket.createdAt)}</TD>
                        <TD align="right">
                          <Menu
                            label={`Actions for ${ticket.ticketNumber}`}
                            items={[{ label: "View ticket", icon: <Eye className="size-4" />, onSelect: () => open(ticket) }]}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>

                <ul className="mt-4 space-y-2.5 lg:hidden">
                  {rows.map((ticket) => (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        onClick={() => open(ticket)}
                        className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block font-mono text-sm text-text-muted">#{ticket.ticketNumber}</span>
                            <span className="block text-sm font-semibold text-text-primary">{ticket.subject}</span>
                          </span>
                          <TicketStatusBadge status={ticket.status} />
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                          <PriorityBadge priority={ticket.priority} />
                          {categoryLabel(ticket.category)} · {lastReply(ticket)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <Pagination page={current} totalPages={totalPages} total={filtered.length} perPage={table.pageSize} onChange={table.setPage} noun="tickets" />
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}
