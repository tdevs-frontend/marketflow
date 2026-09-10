"use client";

import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Percent,
  Target,
  Upload,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Menu } from "@/components/ui/menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  LEADS,
  LEAD_SOURCES,
  OWNERS,
  PIPELINE_STAGES,
  contactById,
  contactName,
  ownerName,
  stageLabel,
  type PipelineLead,
} from "@/lib/customer-fixtures";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";
import type { LeadSource, LeadStage } from "@/types/lead";
import { cn } from "@/lib/utils";
import { LeadDrawer } from "./lead-drawer";
import { SourceBadge, StageBadge, TagBadges } from "./customer-badges";

const ALL = "all";

/** Compact money, so a column header can carry a total without wrapping. */
const compactMoney = (value: number) =>
  value >= 1000
    ? `$${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`
    : `$${value}`;

function kpis(leads: PipelineLead[]): Kpi[] {
  const open = leads.filter((item) => !["won", "lost"].includes(item.stage));
  const qualified = leads.filter((item) =>
    ["qualified", "proposal"].includes(item.stage),
  );
  const won = leads.filter((item) => item.stage === "won");
  const closed = leads.filter((item) => ["won", "lost"].includes(item.stage));

  return [
    { label: "Total Leads", value: formatNumber(leads.length), icon: Target },
    {
      label: "Pipeline Value",
      value: formatCurrency(open.reduce((sum, item) => sum + item.value, 0)),
      icon: CircleDollarSign,
      tone: "brand",
      hint: "Open deals only",
    },
    {
      label: "Qualified",
      value: formatNumber(qualified.length),
      icon: UserCheck,
      tone: "success",
    },
    {
      label: "Conversion Rate",
      value: closed.length
        ? `${((won.length / closed.length) * 100).toFixed(1)}%`
        : "—",
      icon: Percent,
      hint: "Won as a share of closed",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One deal on the board.
 *
 * Six facts and no more: who, where they work, how much, where it came from,
 * which tags, and when they last did something. A card that also carries
 * probability and close date is a card nobody can scan a column of.
 */
function LeadCard({
  lead,
  onOpen,
  onMove,
}: {
  lead: PipelineLead;
  onOpen: () => void;
  onMove: (stage: LeadStage) => void;
}) {
  const contact = contactById(lead.contactId);

  return (
    <div className="group/lead rounded-panel border border-border bg-surface p-3 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
        >
          <AvatarLabel
            name={contact ? contactName(contact) : lead.title}
            secondary={contact?.company ?? undefined}
            size="sm"
          />
        </button>

        <Menu
          label={`Move ${lead.title}`}
          items={PIPELINE_STAGES.filter((item) => item.stage !== lead.stage).map(
            (item) => ({
              label: `Move to ${item.label}`,
              onSelect: () => onMove(item.stage),
            }),
          )}
        />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-2.5 block w-full rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
      >
        <p className="text-base leading-none font-bold text-text-primary tabular-nums">
          {formatCurrency(lead.value)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <SourceBadge source={lead.source} />
          {lead.ownerId ? (
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Avatar name={ownerName(lead.ownerId)} size="xs" />
              {ownerName(lead.ownerId).split(" ")[0]}
            </span>
          ) : null}
        </div>

        {lead.tags.length ? (
          <div className="mt-2">
            <TagBadges tags={lead.tags} max={2} />
          </div>
        ) : null}

        <p className="mt-2 truncate text-[11px] text-text-muted">
          {lead.lastActivity} · {formatRelativeTime(lead.lastActivityAt)}
        </p>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Board                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The sales pipeline, as a board by default and a table on request.
 *
 * Stage changes are a menu on each card rather than drag-and-drop: this
 * project has no drag library, and the brief is explicit that one should not be
 * added for this alone. A menu is also the only version that works from a
 * keyboard and on a phone, which a pointer-only drag never does.
 *
 * The board scrolls horizontally on purpose at every width — six stages cannot
 * be made legible inside 1100px, and squeezing them is worse than scrolling.
 */
export function LeadsBoard() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState<string>(ALL);
  const [source, setSource] = useState<LeadSource | typeof ALL>(ALL);
  const [view, setView] = useState<"board" | "list">("board");
  const [active, setActive] = useState<PipelineLead | null>(null);

  /* Stage lives in component state so the menu actually moves a card. Swap for
     `useUpdateLeadMutation` and this becomes optimistic-update bookkeeping. */
  const [stages, setStages] = useState<Record<string, LeadStage>>({});
  const leads = useMemo(
    () => LEADS.map((item) => ({ ...item, stage: stages[item.id] ?? item.stage })),
    [stages],
  );

  const activeFilters = (owner === ALL ? 0 : 1) + (source === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter((item) => {
      if (term) {
        const contact = contactById(item.contactId);
        const haystack = [item.title, contact ? contactName(contact) : "", contact?.company ?? ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (owner !== ALL && item.ownerId !== owner) return false;
      if (source !== ALL && item.source !== source) return false;
      return true;
    });
  }, [leads, search, owner, source]);

  const columns = PIPELINE_STAGES.map((column) => {
    const items = filtered.filter((item) => item.stage === column.stage);
    return {
      ...column,
      items,
      value: items.reduce((sum, item) => sum + item.value, 0),
    };
  });

  function resetFilters() {
    setOwner(ALL);
    setSource(ALL);
  }

  function move(lead: PipelineLead, stage: LeadStage) {
    setStages((prev) => ({ ...prev, [lead.id]: stage }));
    setActive((current) => (current?.id === lead.id ? { ...current, stage } : current));
    toast(`${lead.title} moved to ${stageLabel(stage)}`, "success");
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Track prospects from first interaction to conversion."
        secondaryActions={
          <Button variant="outline" onClick={() => toast("Import arrives with the API", "info")}>
            <Upload className="size-4" />
            Import
          </Button>
        }
        action={
          <Button onClick={() => toast("New lead form arrives with the API", "info")}>
            <Target className="size-4" />
            New lead
          </Button>
        }
      />

      <KpiStrip items={kpis(leads)} />

      <Card className="mt-4 p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search lead, contact or company…"
          activeCount={activeFilters}
          onReset={resetFilters}
          trailing={
            <SegmentedControl
              label="Pipeline view"
              value={view}
              onChange={(next) => setView(next as "board" | "list")}
              options={[
                { value: "board", label: "Board" },
                { value: "list", label: "List" },
              ]}
            />
          }
        >
          <Select
            label="Filter by pipeline"
            size="sm"
            value="pipe-sales"
            onChange={() => {
              /* One pipeline in the fixture; the control is here because the
                 shape of the page depends on it existing. */
            }}
            options={[{ value: "pipe-sales", label: "Sales Pipeline" }]}
            className="lg:w-40"
          />
          <Select
            label="Filter by owner"
            size="sm"
            value={owner}
            onChange={setOwner}
            options={[
              { value: ALL, label: "All owners" },
              ...OWNERS.map((item) => ({ value: item.id, label: item.name })),
            ]}
            className="lg:w-40"
          />
          <Select
            label="Filter by source"
            size="sm"
            value={source}
            onChange={(next) => setSource(next as LeadSource | typeof ALL)}
            options={[{ value: ALL, label: "All sources" }, ...LEAD_SOURCES]}
            className="lg:w-36"
          />
        </FilterBar>

        {filtered.length === 0 ? (
          activeFilters > 0 || search ? (
            <EmptyState
              title="No leads match those filters"
              description="Adjust the owner or source, or clear the filters to see the whole pipeline."
              action={
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Build your first sales pipeline"
              description="Track prospects and move them from first interaction to customer."
              action={
                <Button size="sm" onClick={() => toast("New lead form arrives with the API", "info")}>
                  <Target className="size-4" />
                  New lead
                </Button>
              }
            />
          )
        ) : view === "board" ? (
          <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1">
            <div className="flex min-w-max gap-3">
              {columns.map((column) => (
                <section
                  key={column.stage}
                  aria-label={`${column.label}, ${column.items.length} leads`}
                  className="flex w-64 shrink-0 flex-col rounded-card bg-surface-secondary p-2.5"
                >
                  <header className="px-1 pb-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-semibold text-text-primary">
                        {column.label}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                          column.stage === "won"
                            ? "bg-success-soft text-success-text"
                            : "bg-surface text-text-secondary",
                        )}
                      >
                        {column.items.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-text-muted tabular-nums">
                      {column.items.length} lead{column.items.length === 1 ? "" : "s"}
                      {column.value ? ` · ${compactMoney(column.value)}` : ""}
                    </p>
                  </header>

                  <div className="flex flex-col gap-2.5">
                    {column.items.length === 0 ? (
                      <p className="rounded-panel border border-dashed border-border px-3 py-6 text-center text-[11px] text-text-muted">
                        Nothing here
                      </p>
                    ) : (
                      column.items.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onOpen={() => setActive(lead)}
                          onMove={(stage) => move(lead, stage)}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Table minWidth="62rem">
              <THead>
                <TH>Lead</TH>
                <TH>Contact</TH>
                <TH>Stage</TH>
                <TH align="right">Value</TH>
                <TH>Source</TH>
                <TH>Owner</TH>
                <TH>Last activity</TH>
              </THead>
              <TBody>
                {filtered.map((lead) => {
                  const contact = contactById(lead.contactId);

                  return (
                    <TR
                      key={lead.id}
                      onClick={() => setActive(lead)}
                      className="cursor-pointer"
                    >
                      <TD className="text-[13px] font-medium text-text-primary">
                        {lead.title}
                      </TD>
                      <TD className="text-xs text-text-secondary">
                        {contact ? contactName(contact) : "—"}
                      </TD>
                      <TD>
                        <StageBadge stage={lead.stage} label={stageLabel(lead.stage)} />
                      </TD>
                      <TD align="right" className="text-xs font-medium text-text-primary tabular-nums">
                        {formatCurrency(lead.value)}
                      </TD>
                      <TD>
                        <SourceBadge source={lead.source} />
                      </TD>
                      <TD className="text-xs whitespace-nowrap text-text-secondary">
                        {ownerName(lead.ownerId)}
                      </TD>
                      <TD className="text-xs whitespace-nowrap text-text-muted">
                        {formatRelativeTime(lead.lastActivityAt)}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        )}
      </Card>

      <LeadDrawer
        lead={active}
        onClose={() => setActive(null)}
        onStageChange={move}
        onWon={(lead) => move(lead, "won")}
        onLost={(lead) => move(lead, "lost")}
      />
    </>
  );
}
