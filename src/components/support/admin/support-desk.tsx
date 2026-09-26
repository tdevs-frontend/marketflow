"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  PanelRight,
  Timer,
  UserPlus,
  UserX,
} from "lucide-react";

import { ActiveFilterChips, type FilterChip } from "@/components/customers/customer-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { ServiceNotice } from "@/components/settings/service-notice";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/dialog";
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
import { SUPPORT_AGENTS, SUPPORT_WORKSPACES } from "@/lib/support-fixtures";
import {
  CURRENT_AGENT,
  assignTicket,
  isActive,
  useAgentTickets,
} from "@/lib/support-service";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import type { AgentTicketView } from "@/types/support";
import { DATE_RANGES, withinDays } from "../support-center";
import { PriorityBadge, TicketStatusBadge } from "../support-badges";
import { useSupportEffects } from "../use-support";

/**
 * The Admin Support Desk: every workspace's tickets, one queue.
 *
 * The same composition as every table in the product - KPI strip, one card,
 * `FilterBar`, the shared `Table`, stacked cards below `lg` - with the two
 * filters only a desk needs: agent and workspace. The quick view is the shared
 * right-hand `Drawer`, for triage; the conversation itself is a full page.
 */

const FILTERS = ["status", "priority", "category", "agent", "workspace", "date"] as const;
type FilterKey = (typeof FILTERS)[number];
const UNASSIGNED = "unassigned";

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function SupportDesk() {
  const router = useRouter();
  const tickets = useAgentTickets(CURRENT_AGENT);
  const { toast } = useSupportEffects();
  const table = useTableState<FilterKey>(FILTERS);
  const { filters } = table;
  const [preview, setPreview] = useState<AgentTicketView | null>(null);

  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 250);
  /* The URL follows the debounced draft - in an effect, because writing it
     updates the router, which must not happen while this component renders. */
  const { search: urlSearch, setSearch } = table;
  useEffect(() => {
    if (debounced !== urlSearch) setSearch(debounced);
  }, [debounced, urlSearch, setSearch]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase().replace(/^#/, "");
    return tickets.filter((ticket) => {
      if (term) {
        const haystack = `${ticket.ticketNumber} ${ticket.merchantName} ${ticket.merchantEmail} ${ticket.workspace?.name ?? ""} ${ticket.subject}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.status !== "all" && ticket.status !== filters.status) return false;
      if (filters.priority !== "all" && ticket.priority !== filters.priority) return false;
      if (filters.category !== "all" && ticket.category !== filters.category) return false;
      if (filters.agent !== "all") {
        if (filters.agent === UNASSIGNED ? ticket.assignedTo : ticket.assignedTo !== filters.agent) return false;
      }
      if (filters.workspace !== "all" && ticket.workspaceId !== filters.workspace) return false;
      if (!withinDays(ticket.createdAt, filters.date)) return false;
      return true;
    });
  }, [tickets, debounced, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const current = Math.min(table.page, totalPages);
  const rows = filtered.slice((current - 1) * table.pageSize, current * table.pageSize);

  const kpis = useMemo<Kpi[]>(() => {
    const active = tickets.filter((ticket) => isActive(ticket.status));
    const responded = tickets.filter((ticket) => ticket.firstResponseAt);
    const average = responded.length
      ? responded.reduce((sum, ticket) => sum + (new Date(ticket.firstResponseAt!).getTime() - new Date(ticket.createdAt).getTime()), 0) / responded.length
      : 0;
    return [
      { label: "Open Tickets", value: String(active.length), icon: Inbox, tone: "brand", hint: "Not yet resolved" },
      { label: "Unassigned", value: String(active.filter((ticket) => !ticket.assignedTo).length), icon: UserX, tone: "neutral", hint: "Nobody has it" },
      { label: "Urgent", value: String(active.filter((ticket) => ticket.priority === "urgent").length), icon: AlertTriangle, tone: "warning", hint: "Open and urgent" },
      { label: "Waiting for Support", value: String(tickets.filter((ticket) => ["open", "waiting_support"].includes(ticket.status)).length), icon: Clock, tone: "info", hint: "Our move" },
      {
        label: "Resolved Today",
        value: String(tickets.filter((ticket) => ticket.resolvedAt && WORKSPACE_NOW_MS - new Date(ticket.resolvedAt).getTime() <= 86_400_000).length),
        icon: CheckCircle2,
        tone: "success",
        hint: "Last 24 hours",
      },
      {
        label: "Avg. Response Time",
        value: responded.length ? formatDuration(average) : "-",
        icon: Timer,
        tone: "accent",
        hint: `First reply, ${responded.length} tickets`,
        info: "Time from a ticket being opened to the first reply the merchant can see. Internal notes do not count.",
      },
    ];
  }, [tickets]);

  const agentOptions = [
    { value: "all", label: "All agents" },
    { value: UNASSIGNED, label: "Unassigned" },
    ...SUPPORT_AGENTS.map((agent) => ({ value: agent.id, label: agent.name })),
  ];
  const workspaceOptions = [
    { value: "all", label: "All workspaces" },
    ...SUPPORT_WORKSPACES.map((workspace) => ({ value: workspace.id, label: workspace.name })),
  ];

  const labelIn = (list: { value: string; label: string }[], value: string) =>
    list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.status !== "all" ? { key: "status", label: "Status", value: labelIn(TICKET_STATUSES, filters.status) } : null,
    filters.priority !== "all" ? { key: "priority", label: "Priority", value: labelIn(TICKET_PRIORITIES, filters.priority) } : null,
    filters.category !== "all" ? { key: "category", label: "Category", value: labelIn(TICKET_CATEGORIES, filters.category) } : null,
    filters.agent !== "all" ? { key: "agent", label: "Agent", value: labelIn(agentOptions, filters.agent) } : null,
    filters.workspace !== "all" ? { key: "workspace", label: "Workspace", value: labelIn(workspaceOptions, filters.workspace) } : null,
    filters.date !== "all" ? { key: "date", label: "Created", value: labelIn(DATE_RANGES, filters.date) } : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  function takeIt(ticket: AgentTicketView) {
    const result = assignTicket(CURRENT_AGENT, ticket.ticketNumber, CURRENT_AGENT.agentId);
    toast(result.ok ? `${ticket.ticketNumber} assigned to you` : result.error, result.ok ? "success" : "error");
  }

  const open = (ticket: AgentTicketView) => router.push(SUPPORT_ROUTES.deskTicket(ticket.ticketNumber));
  const menu = (ticket: AgentTicketView) => [
    { label: "Open ticket", icon: <Eye className="size-4" />, onSelect: () => open(ticket) },
    { label: "Quick view", icon: <PanelRight className="size-4" />, onSelect: () => setPreview(ticket) },
    {
      label: "Assign to me",
      icon: <UserPlus className="size-4" />,
      onSelect: () => takeIt(ticket),
      disabled: ticket.assignedTo === CURRENT_AGENT.agentId,
    },
  ];

  return (
    <>
      <PageHeader
        title="Support Desk"
        description="Every merchant ticket across MarketFlow - triage, assign, reply and resolve."
      />

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
          <Select label="Filter by assigned agent" size="sm" value={filters.agent} onChange={(next) => table.setFilter("agent", next)} options={agentOptions} className="lg:w-36" />
          <Select label="Filter by workspace" size="sm" value={filters.workspace} onChange={(next) => table.setFilter("workspace", next)} options={workspaceOptions} className="lg:w-44" />
          <Select label="Filter by created date" size="sm" value={filters.date} onChange={(next) => table.setFilter("date", next)} options={[{ value: "all", label: "Any date" }, ...DATE_RANGES]} className="lg:w-36" />
        </FilterBar>

        <ActiveFilterChips chips={chips} onRemove={(key) => table.clearFilter(key as FilterKey)} onClearAll={clearEverything} className="mt-3" />

        {rows.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No tickets match these filters."
            description="Try a different search, or clear the filters to see the whole queue."
            action={
              <Button size="sm" variant="outline" onClick={clearEverything}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <Table minWidth="74rem" className="mt-4 max-lg:hidden">
              <THead>
                <TH>Ticket ID</TH>
                <TH>Merchant</TH>
                <TH>Workspace</TH>
                <TH>Subject</TH>
                <TH>Category</TH>
                <TH>Priority</TH>
                <TH>Status</TH>
                <TH>Assigned To</TH>
                <TH>Last Activity</TH>
                <TH>Created</TH>
                <TH align="right" />
              </THead>
              <TBody>
                {rows.map((ticket) => (
                  <TR key={ticket.id}>
                    <TD className="whitespace-nowrap font-mono text-text-secondary">#{ticket.ticketNumber}</TD>
                    <TD className="max-w-40 truncate text-text-primary">{ticket.merchantName}</TD>
                    <TD className="max-w-40 truncate text-text-secondary">{ticket.workspace?.name ?? ticket.workspaceId}</TD>
                    <TD className="max-w-64">
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
                    <TD className="whitespace-nowrap text-text-secondary">
                      {ticket.assignee?.name ?? <span className="text-text-muted">Unassigned</span>}
                    </TD>
                    <TD className="whitespace-nowrap text-text-muted">{formatDateTime(ticket.lastActivityAt)}</TD>
                    <TD className="whitespace-nowrap text-text-muted">{formatDate(ticket.createdAt)}</TD>
                    <TD align="right">
                      <Menu items={menu(ticket)} label={`Actions for ${ticket.ticketNumber}`} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((ticket) => (
                <li key={ticket.id} className="rounded-panel border border-border p-3.5">
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => open(ticket)} className="min-w-0 flex-1 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none">
                      <span className="block font-mono text-sm text-text-muted">#{ticket.ticketNumber} · {ticket.workspace?.name}</span>
                      <span className="block text-sm font-semibold text-text-primary">{ticket.subject}</span>
                    </button>
                    <Menu items={menu(ticket)} label={`Actions for ${ticket.ticketNumber}`} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <TicketStatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-sm text-text-muted">{ticket.assignee?.name ?? "Unassigned"}</span>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={current} totalPages={totalPages} total={filtered.length} perPage={table.pageSize} onChange={table.setPage} noun="tickets" />
          </>
        )}
      </Card>

      <ServiceNotice tone="session" title="Mock support service">
        The desk and the merchant Support Center share one support service in
        this build, running over session data. Its checks - workspace scoping,
        internal-note filtering, file validation, rate limits - are the API&apos;s
        contract and move to the server when the support API exists.
      </ServiceNotice>

      <Drawer
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview ? `#${preview.ticketNumber}` : "Ticket"}
        description={preview?.subject}
        footer={
          preview ? (
            <ButtonLink href={SUPPORT_ROUTES.deskTicket(preview.ticketNumber)} className="w-full">
              Open conversation
            </ButtonLink>
          ) : null
        }
      >
        {preview ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              <TicketStatusBadge status={preview.status} />
              <PriorityBadge priority={preview.priority} />
            </div>
            <dl className="divide-y divide-border">
              <SummaryRow label="Merchant" value={preview.merchantName} />
              <SummaryRow label="Email" value={<span className="break-all">{preview.merchantEmail}</span>} />
              <SummaryRow label="Workspace" value={preview.workspace?.name ?? preview.workspaceId} />
              <SummaryRow label="Plan" value={preview.planName} />
              <SummaryRow label="Category" value={categoryLabel(preview.category)} />
              <SummaryRow label="Assigned to" value={preview.assignee?.name ?? "Unassigned"} />
              <SummaryRow label="Created" value={formatDateTime(preview.createdAt)} />
            </dl>
            <div>
              <p className="text-sm font-bold text-text-primary">Latest message</p>
              <p className="mt-1.5 line-clamp-6 rounded-panel border border-border px-3.5 py-3 text-sm whitespace-pre-wrap text-text-secondary">
                {preview.messages.filter((message) => !message.isInternalNote).at(-1)?.body}
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
