"use client";

import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  GripVertical,
  Percent,
  Plus,
  Target,
  Trophy,
  Upload,
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
import {
  SortableTH,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import {
  LEADS,
  LEAD_SOURCES,
  OWNERS,
  PIPELINES,
  PIPELINE_STAGES,
  TAG_NAMES,
  contactById,
  contactName,
  ownerName,
  stageLabel,
  type PipelineLead,
} from "@/lib/customer-fixtures";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";
import type { LeadStage } from "@/types/lead";
import { cn } from "@/lib/utils";
import { ActiveFilterChips, type FilterChip } from "./customer-toolbar";
import { LeadDrawer } from "./lead-drawer";
import { NewLeadDialog } from "./lead-dialogs";
import { SourceBadge, StageBadge, TagBadges } from "./customer-badges";

const FILTERS = [
  "pipeline",
  "owner",
  "stage",
  "source",
  "tag",
  "value",
] as const;
type FilterKey = (typeof FILTERS)[number];

/** Compact money, so a column header can carry a total without wrapping. */
const compactMoney = (value: number) =>
  value >= 1000
    ? `$${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`
    : `$${value}`;

const VALUE_BANDS: {
  value: string;
  label: string;
  min: number;
  max: number;
}[] = [
  { value: "under-2k", label: "Under $2K", min: 0, max: 2000 },
  { value: "2k-5k", label: "$2K – $5K", min: 2000, max: 5000 },
  { value: "5k-10k", label: "$5K – $10K", min: 5000, max: 10000 },
  { value: "over-10k", label: "Over $10K", min: 10000, max: Infinity },
];

function kpis(leads: PipelineLead[]): Kpi[] {
  const open = leads.filter((item) => !["won", "lost"].includes(item.stage));
  const won = leads.filter((item) => item.stage === "won");
  const closed = leads.filter((item) => ["won", "lost"].includes(item.stage));

  return [
    { label: "Total leads", value: formatNumber(leads.length), icon: Target },
    {
      label: "Pipeline value",
      value: formatCurrency(open.reduce((sum, item) => sum + item.value, 0)),
      icon: CircleDollarSign,
      tone: "brand",
      hint: "Open deals only",
    },
    {
      label: "Won this month",
      value: formatCurrency(won.reduce((sum, item) => sum + item.value, 0)),
      icon: Trophy,
      tone: "success",
      hint: `${won.length} deal${won.length === 1 ? "" : "s"}`,
    },
    {
      label: "Conversion rate",
      value: closed.length
        ? `${((won.length / closed.length) * 100).toFixed(1)}%`
        : "—",
      icon: Percent,
      hint: "Won as a share of closed",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Card                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One deal on the board.
 *
 * Six facts and no more: who, where they work, how much, where it came from,
 * which tags, and when they last did something. A card that also carries
 * probability and close date is a card nobody can scan a column of.
 *
 * Draggable through the native HTML5 API — no library, per the project's
 * no-unnecessary-dependencies rule. `dataTransfer` carries the lead id so a
 * column's drop handler needs no shared state, and `effectAllowed = "move"`
 * is what gives the cursor the right affordance.
 *
 * Dragging is pointer-only by nature, so the same move is always available
 * from the card's menu. That is not a fallback for tidiness — it is the only
 * route for a keyboard or a touch screen.
 */
function LeadCard({
  lead,
  dragging,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}: {
  lead: PipelineLead;
  dragging: boolean;
  onOpen: () => void;
  onMove: (stage: LeadStage) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const contact = contactById(lead.contactId);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", lead.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group/lead rounded-panel border border-border bg-surface p-3 transition-shadow hover:shadow-card-hover",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-0.5 shrink-0 cursor-grab text-border-strong transition-colors group-hover/lead:text-text-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </span>

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
          label={`Move ${lead.title} to another stage`}
          items={PIPELINE_STAGES.filter(
            (item) => item.stage !== lead.stage,
          ).map((item) => ({
            label: `Move to ${item.label}`,
            onSelect: () => onMove(item.stage),
          }))}
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
 * Stage changes are optimistic: the move lands in local state the moment it
 * happens and the column counters and totals are derived from that same state,
 * so they update together. Swap `moves` for `useUpdateLeadMutation` and this
 * becomes ordinary optimistic-update bookkeeping with a rollback on failure.
 *
 * The board scrolls horizontally at every width — six stages cannot be made
 * legible inside 1100px, and squeezing them is worse than scrolling.
 */
export function LeadsBoard() {
  const toast = useToast();
  const table = useTableState<FilterKey>(FILTERS);

  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 300);
  const [lastPushed, setLastPushed] = useState(table.search);
  if (debounced !== lastPushed) {
    setLastPushed(debounced);
    table.setSearch(debounced);
  }

  const [view, setView] = useState<"board" | "list">("board");
  const [active, setActive] = useState<PipelineLead | null>(null);
  const [creating, setCreating] = useState<LeadStage | null>(null);

  /* Optimistic stage overrides, keyed by lead id. */
  const [moves, setMoves] = useState<Record<string, LeadStage>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStage | null>(null);

  const leads = useMemo(
    () =>
      LEADS.map((item) => ({ ...item, stage: moves[item.id] ?? item.stage })),
    [moves],
  );

  const { filters } = table;
  const pipelineId =
    filters.pipeline === "all" ? PIPELINES[0].id : filters.pipeline;

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    const band = VALUE_BANDS.find((item) => item.value === filters.value);

    return leads.filter((item) => {
      if (item.pipelineId !== pipelineId) return false;
      if (term) {
        const contact = contactById(item.contactId);
        const haystack = [
          item.title,
          contact ? contactName(contact) : "",
          contact?.company ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.owner !== "all" && item.ownerId !== filters.owner)
        return false;
      if (filters.stage !== "all" && item.stage !== filters.stage) return false;
      if (filters.source !== "all" && item.source !== filters.source)
        return false;
      if (filters.tag !== "all" && !item.tags.includes(filters.tag))
        return false;
      if (band && (item.value < band.min || item.value >= band.max))
        return false;
      return true;
    });
  }, [leads, debounced, filters, pipelineId]);

  /* The list view sorts; the board is ordered by stage and does not. */
  const listRows = useMemo(() => {
    const field = table.sortField ?? "activity";
    const factor = table.sortDirection === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (field === "value") return (a.value - b.value) * factor;
      if (field === "title") return a.title.localeCompare(b.title) * factor;
      return (
        (new Date(a.lastActivityAt).getTime() -
          new Date(b.lastActivityAt).getTime()) *
        factor
      );
    });
  }, [filtered, table.sortField, table.sortDirection]);

  const columns = PIPELINE_STAGES.map((column) => {
    const items = filtered.filter((item) => item.stage === column.stage);
    return {
      ...column,
      items,
      value: items.reduce((sum, item) => sum + item.value, 0),
    };
  });

  const label = (
    list: readonly { value: string; label: string }[],
    value: string,
  ) => list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.owner !== "all"
      ? {
          key: "owner",
          label: "Owner",
          value:
            OWNERS.find((o) => o.id === filters.owner)?.name ?? filters.owner,
        }
      : null,
    filters.stage !== "all"
      ? {
          key: "stage",
          label: "Stage",
          value: stageLabel(filters.stage as LeadStage),
        }
      : null,
    filters.source !== "all"
      ? {
          key: "source",
          label: "Source",
          value: label(LEAD_SOURCES, filters.source),
        }
      : null,
    filters.tag !== "all"
      ? { key: "tag", label: "Tag", value: filters.tag }
      : null,
    filters.value !== "all"
      ? {
          key: "value",
          label: "Value",
          value: label(VALUE_BANDS, filters.value),
        }
      : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  function move(lead: PipelineLead, stage: LeadStage) {
    if (lead.stage === stage) return;
    setMoves((prev) => ({ ...prev, [lead.id]: stage }));
    setActive((current) =>
      current?.id === lead.id ? { ...current, stage } : current,
    );
    toast(`${lead.title} moved to ${stageLabel(stage)}`, "success");
  }

  function dropOn(stage: LeadStage, event: React.DragEvent) {
    event.preventDefault();
    setDropTarget(null);
    setDragging(null);
    const id = event.dataTransfer.getData("text/plain");
    const lead = leads.find((item) => item.id === id);
    if (lead) move(lead, stage);
  }

  const filtersOn = chips.length > 0 || debounced.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Track deals through your pipeline from first touch to closed won."
        secondaryActions={
          <Button
            variant="outline"
            onClick={() => toast("Import arrives with the API", "info")}
          >
            <Upload className="size-4" />
            Import
          </Button>
        }
        action={
          <Button onClick={() => setCreating("new")}>
            <Target className="size-4" />
            New lead
          </Button>
        }
      />

      <KpiStrip items={kpis(filtered)} />

      <Card className="mt-4 p-5">
        <FilterBar
          search={searchDraft}
          onSearchChange={setSearchDraft}
          placeholder="Search leads…"
          activeCount={chips.length}
          onReset={clearEverything}
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
            label="Pipeline"
            size="sm"
            value={pipelineId}
            onChange={(next) => table.setFilter("pipeline", next)}
            options={PIPELINES.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            className="lg:w-40"
          />
          <Select
            label="Filter by owner"
            size="sm"
            value={filters.owner}
            onChange={(next) => table.setFilter("owner", next)}
            options={[
              { value: "all", label: "All owners" },
              ...OWNERS.map((item) => ({ value: item.id, label: item.name })),
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by stage"
            size="sm"
            value={filters.stage}
            onChange={(next) => table.setFilter("stage", next)}
            options={[
              { value: "all", label: "All stages" },
              ...PIPELINE_STAGES.map((item) => ({
                value: item.stage,
                label: item.label,
              })),
              { value: "lost", label: "Lost" },
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by source"
            size="sm"
            value={filters.source}
            onChange={(next) => table.setFilter("source", next)}
            options={[{ value: "all", label: "All sources" }, ...LEAD_SOURCES]}
            className="lg:w-32"
          />
          <Select
            label="Filter by tag"
            size="sm"
            value={filters.tag}
            onChange={(next) => table.setFilter("tag", next)}
            options={[
              { value: "all", label: "All tags" },
              ...TAG_NAMES.map((name) => ({ value: name, label: name })),
            ]}
            className="lg:w-32"
          />
          <Select
            label="Filter by deal value"
            size="sm"
            value={filters.value}
            onChange={(next) => table.setFilter("value", next)}
            options={[{ value: "all", label: "Any value" }, ...VALUE_BANDS]}
            className="lg:w-36"
          />
        </FilterBar>

        <ActiveFilterChips
          chips={chips}
          onRemove={(key) => table.clearFilter(key as FilterKey)}
          onClearAll={clearEverything}
          className="mt-3"
        />

        {filtered.length === 0 ? (
          filtersOn ? (
            <EmptyState
              title="No results found"
              description="Try changing your search or filters."
              action={
                <Button size="sm" variant="outline" onClick={clearEverything}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No leads in this pipeline"
              description="Leads created from forms, campaigns, or by hand will show up on this board."
              action={
                <Button size="sm" onClick={() => setCreating("new")}>
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
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTarget(column.stage);
                  }}
                  onDragLeave={() =>
                    setDropTarget((current) =>
                      current === column.stage ? null : current,
                    )
                  }
                  onDrop={(event) => dropOn(column.stage, event)}
                  className={cn(
                    "flex w-64 shrink-0 flex-col rounded-card border border-transparent bg-surface-secondary p-2.5 transition-colors",
                    /* The drop state has to be unmistakable while a card is
                       mid-air — a 1px border change is invisible to someone
                       watching the cursor. */
                    dropTarget === column.stage &&
                      "border-primary bg-primary-soft",
                  )}
                >
                  <header className="px-1 pb-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-semibold text-text-primary">
                        {column.label}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                            column.stage === "won"
                              ? "bg-success-soft text-success-text"
                              : "bg-surface text-text-secondary",
                          )}
                        >
                          {column.items.length}
                        </span>
                        <Tooltip content={`New lead in ${column.label}`}>
                          <button
                            type="button"
                            aria-label={`New lead in ${column.label}`}
                            onClick={() => setCreating(column.stage)}
                            className="grid size-5 place-items-center rounded-btn text-text-muted transition-colors hover:bg-surface hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    {/* The badge already carries the count, so this line carries
                        only the money — the two together are the "stage counter"
                        and "pipeline value" that have to move when a card does. */}
                    <p className="mt-0.5 text-[11px] text-text-muted tabular-nums">
                      {column.value
                        ? compactMoney(column.value)
                        : "No value yet"}
                    </p>
                  </header>

                  <div className="flex flex-col gap-2.5">
                    {column.items.length === 0 ? (
                      <p className="rounded-panel border border-dashed border-border px-3 py-6 text-center text-[11px] text-text-muted">
                        {dropTarget === column.stage
                          ? "Drop here"
                          : "Nothing here"}
                      </p>
                    ) : (
                      column.items.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          dragging={dragging === lead.id}
                          onOpen={() => setActive(lead)}
                          onMove={(stage) => move(lead, stage)}
                          onDragStart={() => setDragging(lead.id)}
                          onDragEnd={() => {
                            setDragging(null);
                            setDropTarget(null);
                          }}
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
            <Table minWidth="58rem">
              <THead>
                <SortableTH
                  field="title"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Lead
                </SortableTH>
                <TH>Contact</TH>
                <TH>Stage</TH>
                <SortableTH
                  field="value"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                  align="right"
                >
                  Value
                </SortableTH>
                <TH>Source</TH>
                <TH>Owner</TH>
                <SortableTH
                  field="activity"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Last activity
                </SortableTH>
              </THead>
              <TBody>
                {listRows.map((lead) => {
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
                        <StageBadge
                          stage={lead.stage}
                          label={stageLabel(lead.stage)}
                        />
                      </TD>
                      <TD
                        align="right"
                        className="text-xs font-medium whitespace-nowrap text-text-primary tabular-nums"
                      >
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
        onDelete={(lead) => {
          setActive(null);
          toast(`${lead.title} deleted`, "success");
        }}
      />

      <NewLeadDialog
        open={creating !== null}
        defaultStage={creating ?? "new"}
        onClose={() => setCreating(null)}
        onCreated={(title) => {
          setCreating(null);
          toast(`${title} created`, "success");
        }}
      />
    </>
  );
}
