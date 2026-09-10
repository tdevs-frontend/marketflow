"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  Layers,
  Lock,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Field, Input, Textarea } from "@/components/ui/input";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Menu } from "@/components/ui/menu";
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
import { TabCount, TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import {
  CUSTOMER_SEGMENTS,
  contactName,
  countConditions,
  emptyGroup,
  ownerName,
  segmentMembers,
  segmentUsageCount,
  type CustomerSegment,
  type RuleGroup,
} from "@/lib/customer-fixtures";
import { formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import { ContactStatusBadge, LifecycleBadge } from "./customer-badges";
import {
  ActiveFilterChips,
  RowsPerPage,
  type FilterChip,
} from "./customer-toolbar";
import {
  AudiencePreview,
  RuleGroupEditor,
  describeGroup,
  newGroup,
} from "./segment-rule-builder";

const FILTERS = ["type", "usage"] as const;
type FilterKey = (typeof FILTERS)[number];

const TYPES = [
  { value: "dynamic", label: "Dynamic" },
  { value: "static", label: "Static" },
];

const USAGE = [
  { value: "used", label: "In use" },
  { value: "unused", label: "Not used" },
];

/** Dynamic re-evaluates, static is frozen — a tone difference, not a colour. */
function TypeBadge({ type }: { type: CustomerSegment["type"] }) {
  return type === "dynamic" ? (
    <Badge tone="info">
      <Zap className="size-3" aria-hidden />
      Dynamic
    </Badge>
  ) : (
    <Badge tone="neutral">
      <Lock className="size-3" aria-hidden />
      Static
    </Badge>
  );
}

function kpis(segments: CustomerSegment[]): Kpi[] {
  const covered = new Set<string>();
  for (const segment of segments) {
    for (const member of segmentMembers(segment)) covered.add(member.id);
  }
  const unused = segments.filter((segment) => segmentUsageCount(segment) === 0);

  return [
    { label: "Segments", value: formatNumber(segments.length), icon: Layers },
    {
      label: "Contacts covered",
      value: formatNumber(covered.size),
      icon: Users,
      tone: "brand",
      hint: "Counted once, across all segments",
    },
    {
      label: "Dynamic",
      value: formatNumber(segments.filter((s) => s.type === "dynamic").length),
      icon: Zap,
      hint: "Re-evaluated on every send",
    },
    {
      label: "Not used yet",
      value: formatNumber(unused.length),
      icon: Send,
      tone: unused.length ? "warning" : undefined,
      hint: "No campaign or automation targets these",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Builder dialog                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Create or edit a segment.
 *
 * The audience count sits directly under the rules and updates as they are
 * edited, because "how many people is this" is the question the whole screen
 * exists to answer — putting it behind a Save button makes the builder a
 * guessing game.
 */
function SegmentBuilderDialog({
  open,
  segment,
  onClose,
  onSaved,
}: {
  open: boolean;
  segment: CustomerSegment | null;
  onClose: () => void;
  onSaved: (name: string, wasEdit: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CustomerSegment["type"]>("dynamic");
  const [rule, setRule] = useState<RuleGroup>(emptyGroup("g-draft"));
  const [submitted, setSubmitted] = useState(false);

  /* Keyed on the subject so opening a different segment reloads the draft,
     during render rather than in an effect — the house convention. */
  const subject = open ? (segment?.id ?? "new") : null;
  const [loaded, setLoaded] = useState<string | null>(null);
  if (subject !== loaded) {
    setLoaded(subject);
    if (subject) {
      setName(segment?.name ?? "");
      setDescription(segment?.description ?? "");
      setType(segment?.type ?? "dynamic");
      setRule(
        segment
          ? structuredClone(segment.rule)
          : { ...newGroup("all"), id: "g-draft" },
      );
      setSubmitted(false);
    }
  }

  const readOnly = Boolean(segment?.system);
  const errors = {
    name: name.trim() ? null : "Give the segment a name.",
    rule:
      type === "static" || countConditions(rule) > 0
        ? null
        : "Add at least one condition, or make this a static segment.",
  };
  const show = (key: keyof typeof errors) =>
    submitted ? (errors[key] ?? undefined) : undefined;

  function submit() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onSaved(name.trim(), Boolean(segment));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        segment
          ? readOnly
            ? segment.name
            : `Edit ${segment.name}`
          : "New segment"
      }
      description={
        readOnly
          ? "A built-in segment. Its rules are shown for reference and cannot be changed."
          : "Segments are saved filters. Contacts are never copied into them."
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {readOnly ? null : (
            <Button onClick={submit}>
              {segment ? "Save changes" : "Create segment"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Segment name" htmlFor="segment-name" error={show("name")}>
          <Input
            id="segment-name"
            value={name}
            error={Boolean(show("name"))}
            onChange={(event) => setName(event.target.value)}
            placeholder="High-value wholesale"
            disabled={readOnly}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="segment-description"
          hint="Whoever picks this segment in a campaign reads this line."
        >
          <Textarea
            id="segment-description"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Type" htmlFor="segment-type">
          <Select
            id="segment-type"
            hideLabel
            label="Type"
            value={type}
            onChange={(next) => setType(next as CustomerSegment["type"])}
            options={[
              {
                value: "dynamic",
                label: "Dynamic — re-evaluated on every send",
              },
              { value: "static", label: "Static — a fixed list of contacts" },
            ]}
            disabled={readOnly}
          />
        </Field>

        {type === "dynamic" ? (
          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Conditions
              </h3>
            </div>
            <div className="mt-2">
              <RuleGroupEditor
                rule={rule}
                onChange={setRule}
                disabled={readOnly}
              />
            </div>
            {show("rule") ? (
              <p role="alert" className="mt-2 text-xs font-medium text-error">
                {show("rule")}
              </p>
            ) : null}
          </section>
        ) : (
          <p className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-xs text-text-secondary">
            A static segment holds the contacts you add to it. Add members from
            the Contacts table using <strong>Add to segment</strong>, or import
            a list.
          </p>
        )}

        <AudiencePreview
          rule={rule}
          type={type}
          staticCount={segment ? segmentMembers(segment).length : 0}
        />
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Details drawer                                                             */
/* -------------------------------------------------------------------------- */

type DetailTab = "members" | "conditions" | "usage";

function SegmentDrawer({
  segment,
  onClose,
  onEdit,
}: {
  segment: CustomerSegment | null;
  onClose: () => void;
  onEdit: (segment: CustomerSegment) => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<DetailTab>("members");

  const [subject, setSubject] = useState(segment?.id ?? null);
  if ((segment?.id ?? null) !== subject) {
    setSubject(segment?.id ?? null);
    setTab("members");
  }

  const members = segment ? segmentMembers(segment) : [];
  const lines = segment ? describeGroup(segment.rule) : [];
  const usage = segment ? segmentUsageCount(segment) : 0;

  const tabs: TabItem<DetailTab>[] = [
    {
      value: "members",
      label: "Members",
      badge: members.length ? <TabCount value={members.length} /> : undefined,
    },
    {
      value: "conditions",
      label: "Conditions",
      badge: lines.length ? <TabCount value={lines.length} /> : undefined,
    },
    {
      value: "usage",
      label: "Usage",
      badge: usage ? <TabCount value={usage} /> : undefined,
    },
  ];

  return (
    <Drawer
      open={Boolean(segment)}
      onClose={onClose}
      title={segment?.name ?? "Segment"}
      description={segment?.description}
      footer={
        segment ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => onEdit(segment)}
              disabled={segment.system}
            >
              <Pencil className="size-4" />
              Edit rules
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast(`New campaign targeting ${segment.name}`, "info")
              }
            >
              <Send className="size-4" />
              Create campaign
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                toast(`Exporting ${members.length} members as CSV`, "info")
              }
            >
              <Download className="size-4" />
              Export
            </Button>
          </div>
        ) : null
      }
    >
      {segment ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={segment.type} />
            <span className="text-xs text-text-muted">
              {formatNumber(members.length)} member
              {members.length === 1 ? "" : "s"} · updated{" "}
              {formatRelativeTime(segment.updatedAt)}
            </span>
          </div>

          <Tabs
            tabs={tabs}
            value={tab}
            onChange={setTab}
            label="Segment details"
            idBase="segment-drawer"
          />

          {tab === "members" ? (
            <TabPanel idBase="segment-drawer" value="members">
              {members.length ? (
                <ul className="divide-y divide-border">
                  {members.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <AvatarLabel
                        name={contactName(contact)}
                        secondary={contact.email ?? contact.phone ?? undefined}
                        size="sm"
                      />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <LifecycleBadge lifecycle={contact.lifecycle} />
                        <ContactStatusBadge status={contact.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No contacts match yet"
                  description={
                    segment.type === "dynamic"
                      ? "Nobody matches these conditions right now. Loosen them, or wait for contacts to qualify."
                      : "This static segment has no members. Add them from the Contacts table."
                  }
                />
              )}
            </TabPanel>
          ) : null}

          {tab === "conditions" ? (
            <TabPanel
              idBase="segment-drawer"
              value="conditions"
              className="space-y-3"
            >
              {lines.length ? (
                <>
                  <p className="text-xs text-text-secondary">
                    A contact is a member when{" "}
                    <strong className="font-semibold text-text-primary">
                      {segment.rule.match === "all" ? "all" : "any"}
                    </strong>{" "}
                    of these are true.
                  </p>
                  <ul className="space-y-1.5">
                    {lines.map((line) => (
                      <li
                        key={line}
                        className="rounded-panel border border-border px-3 py-2 text-xs text-text-primary"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState
                  title="No conditions"
                  description="Static segments hold a fixed list instead of rules."
                />
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-panel bg-surface-secondary p-3.5 text-xs">
                <div>
                  <dt className="text-text-muted">Created by</dt>
                  <dd className="mt-0.5 font-medium text-text-primary">
                    {ownerName(segment.createdBy)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Last updated</dt>
                  <dd className="mt-0.5 font-medium text-text-primary">
                    {formatDate(segment.updatedAt)}
                  </dd>
                </div>
              </dl>
            </TabPanel>
          ) : null}

          {tab === "usage" ? (
            <TabPanel
              idBase="segment-drawer"
              value="usage"
              className="space-y-4"
            >
              {usage === 0 ? (
                <EmptyState
                  title="Not used anywhere"
                  description="No campaign or automation targets this segment, so deleting it is safe."
                />
              ) : (
                <>
                  <section>
                    <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                      Campaigns
                    </h3>
                    {segment.usage.campaigns.length ? (
                      <ul className="mt-2 space-y-1.5">
                        {segment.usage.campaigns.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 rounded-panel border border-border px-3 py-2 text-xs text-text-primary"
                          >
                            <Send
                              className="size-3.5 text-text-muted"
                              aria-hidden
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">
                        No campaigns.
                      </p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                      Automations
                    </h3>
                    {segment.usage.automations.length ? (
                      <ul className="mt-2 space-y-1.5">
                        {segment.usage.automations.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 rounded-panel border border-border px-3 py-2 text-xs text-text-primary"
                          >
                            <Zap
                              className="size-3.5 text-text-muted"
                              aria-hidden
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">
                        No automations.
                      </p>
                    )}
                  </section>
                </>
              )}
            </TabPanel>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Segments, under Customers.
 *
 * A table rather than the card grid the Marketing module uses, because the
 * question here is comparative — which segments exist, how big are they, what
 * still uses them — and cards make you read twelve boxes to answer it. Both
 * read the same segments; only the framing differs.
 */
export function CustomerSegmentsWorkspace() {
  const toast = useToast();
  const table = useTableState<FilterKey>(FILTERS, { defaultPageSize: 20 });

  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 300);
  const [lastPushed, setLastPushed] = useState(table.search);
  if (debounced !== lastPushed) {
    setLastPushed(debounced);
    table.setSearch(debounced);
  }

  const [active, setActive] = useState<CustomerSegment | null>(null);
  const [editing, setEditing] = useState<CustomerSegment | null | "new">(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerSegment | null>(
    null,
  );

  const { filters } = table;

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();

    const rows = CUSTOMER_SEGMENTS.filter((segment) => {
      if (
        term &&
        !segment.name.toLowerCase().includes(term) &&
        !segment.description.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (filters.type !== "all" && segment.type !== filters.type) return false;
      if (filters.usage !== "all") {
        const used = segmentUsageCount(segment) > 0;
        if (filters.usage === "used" && !used) return false;
        if (filters.usage === "unused" && used) return false;
      }
      return true;
    });

    const field = table.sortField ?? "members";
    const factor = table.sortDirection === "asc" ? 1 : -1;

    return rows.sort((a, b) => {
      if (field === "name") return a.name.localeCompare(b.name) * factor;
      if (field === "updated") {
        return (
          (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) *
          factor
        );
      }
      if (field === "conditions") {
        return (countConditions(a.rule) - countConditions(b.rule)) * factor;
      }
      return (segmentMembers(a).length - segmentMembers(b).length) * factor;
    });
  }, [debounced, filters, table.sortField, table.sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const page = Math.min(table.page, totalPages);
  const rows = filtered.slice(
    (page - 1) * table.pageSize,
    page * table.pageSize,
  );

  const label = (list: { value: string; label: string }[], value: string) =>
    list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.type !== "all"
      ? { key: "type", label: "Type", value: label(TYPES, filters.type) }
      : null,
    filters.usage !== "all"
      ? { key: "usage", label: "Usage", value: label(USAGE, filters.usage) }
      : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  const filtersOn = chips.length > 0 || debounced.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Segments"
        description="Group customers with behaviour, profile and engagement conditions, then reuse them anywhere."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            New segment
          </Button>
        }
      />

      <KpiStrip items={kpis(CUSTOMER_SEGMENTS)} />

      <Card className="mt-4 p-5">
        <FilterBar
          search={searchDraft}
          onSearchChange={setSearchDraft}
          placeholder="Search segments…"
          activeCount={chips.length}
          onReset={clearEverything}
        >
          <Select
            label="Filter by type"
            size="sm"
            value={filters.type}
            onChange={(next) => table.setFilter("type", next)}
            options={[{ value: "all", label: "All types" }, ...TYPES]}
            className="lg:w-36"
          />
          <Select
            label="Filter by usage"
            size="sm"
            value={filters.usage}
            onChange={(next) => table.setFilter("usage", next)}
            options={[{ value: "all", label: "Used and unused" }, ...USAGE]}
            className="lg:w-44"
          />
        </FilterBar>

        <ActiveFilterChips
          chips={chips}
          onRemove={(key) => table.clearFilter(key as FilterKey)}
          onClearAll={clearEverything}
          className="mt-3"
        />

        {rows.length === 0 ? (
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
              title="No segments yet"
              description="A segment is a saved set of conditions. Build one and every campaign can target it."
              action={
                <Button size="sm" onClick={() => setEditing("new")}>
                  <Plus className="size-4" />
                  New segment
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table minWidth="64rem" className="mt-4 max-lg:hidden">
              <THead>
                <SortableTH
                  field="name"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Segment
                </SortableTH>
                <TH>Type</TH>
                <SortableTH
                  field="members"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                  align="right"
                >
                  Members
                </SortableTH>
                <SortableTH
                  field="conditions"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                  align="right"
                >
                  Conditions
                </SortableTH>
                <SortableTH
                  field="updated"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Last updated
                </SortableTH>
                <TH>Used in</TH>
                <TH align="right" />
              </THead>
              <TBody>
                {rows.map((segment) => {
                  const members = segmentMembers(segment).length;
                  const conditions = countConditions(segment.rule);
                  const used = segmentUsageCount(segment);

                  return (
                    <TR key={segment.id}>
                      <TD>
                        <button
                          type="button"
                          onClick={() => setActive(segment)}
                          className="block max-w-72 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          <span className="flex items-center gap-1.5 text-[13px] font-medium text-text-primary">
                            <span className="truncate">{segment.name}</span>
                            {segment.system ? (
                              <Lock
                                className="size-3 shrink-0 text-text-muted"
                                aria-label="Built in"
                              />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-text-muted">
                            {segment.description}
                          </span>
                        </button>
                      </TD>
                      <TD>
                        <TypeBadge type={segment.type} />
                      </TD>
                      <TD
                        align="right"
                        className="text-xs font-medium text-text-primary tabular-nums"
                      >
                        {formatNumber(members)}
                      </TD>
                      <TD
                        align="right"
                        className="text-xs text-text-secondary tabular-nums"
                      >
                        {conditions || "—"}
                      </TD>
                      <TD className="text-xs whitespace-nowrap text-text-muted">
                        {formatRelativeTime(segment.updatedAt)}
                      </TD>
                      <TD>
                        {used ? (
                          <span className="text-xs whitespace-nowrap text-text-secondary">
                            {[
                              segment.usage.campaigns.length
                                ? `${segment.usage.campaigns.length} campaign${segment.usage.campaigns.length === 1 ? "" : "s"}`
                                : null,
                              segment.usage.automations.length
                                ? `${segment.usage.automations.length} automation${segment.usage.automations.length === 1 ? "" : "s"}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Not used
                          </span>
                        )}
                      </TD>
                      <TD align="right">
                        <Menu
                          label={`Actions for ${segment.name}`}
                          items={[
                            {
                              label: "View members",
                              icon: <Users className="size-4" />,
                              onSelect: () => setActive(segment),
                            },
                            {
                              label: segment.system
                                ? "View rules"
                                : "Edit rules",
                              icon: <Pencil className="size-4" />,
                              onSelect: () => setEditing(segment),
                            },
                            {
                              label: "Duplicate",
                              icon: <Copy className="size-4" />,
                              onSelect: () =>
                                toast(`${segment.name} duplicated`, "success"),
                            },
                            {
                              label: "Create campaign",
                              icon: <Send className="size-4" />,
                              onSelect: () =>
                                toast(
                                  `New campaign targeting ${segment.name}`,
                                  "info",
                                ),
                            },
                            {
                              label: "Export members",
                              icon: <Download className="size-4" />,
                              onSelect: () =>
                                toast(
                                  `Exporting ${members} members as CSV`,
                                  "info",
                                ),
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="size-4" />,
                              onSelect: () => setPendingDelete(segment),
                              destructive: true,
                              disabled: segment.system,
                            },
                          ]}
                        />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>

            {/* Below `lg` the same rows as cards — a seven-column table on a
                phone is a horizontal scroll nobody completes. */}
            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((segment) => {
                const members = segmentMembers(segment).length;

                return (
                  <li
                    key={segment.id}
                    className="rounded-panel border border-border p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActive(segment)}
                        className="min-w-0 flex-1 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <span className="block truncate text-[13px] font-medium text-text-primary">
                          {segment.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-muted">
                          {segment.description}
                        </span>
                      </button>
                      <Menu
                        label={`Actions for ${segment.name}`}
                        items={[
                          {
                            label: "View members",
                            icon: <Users className="size-4" />,
                            onSelect: () => setActive(segment),
                          },
                          {
                            label: segment.system ? "View rules" : "Edit rules",
                            icon: <Pencil className="size-4" />,
                            onSelect: () => setEditing(segment),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="size-4" />,
                            onSelect: () => setPendingDelete(segment),
                            destructive: true,
                            disabled: segment.system,
                          },
                        ]}
                      />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <TypeBadge type={segment.type} />
                      <span className="text-xs text-text-secondary tabular-nums">
                        {`${formatNumber(members)} member${members === 1 ? "" : "s"}`}
                      </span>
                      <span className="text-xs text-text-muted">
                        · {formatRelativeTime(segment.updatedAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <RowsPerPage
                value={table.pageSize}
                onChange={table.setPageSize}
              />
              <p className="text-xs text-text-muted">
                {formatNumber(filtered.length)} segment
                {filtered.length === 1 ? "" : "s"}
              </p>
            </div>
          </>
        )}
      </Card>

      <SegmentDrawer
        segment={active}
        onClose={() => setActive(null)}
        onEdit={(segment) => {
          setActive(null);
          setEditing(segment);
        }}
      />

      <SegmentBuilderDialog
        open={editing !== null}
        segment={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={(name, wasEdit) => {
          setEditing(null);
          toast(wasEdit ? `${name} saved` : `${name} created`, "success");
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          toast(`${pendingDelete?.name} deleted`, "success");
          setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.name}?`}
        confirmLabel="Delete segment"
      >
        <p className="text-sm text-text-secondary">
          The contacts stay — a segment is a saved filter, not a container.
        </p>

        {/* The dependency warning. Deleting a segment two automations target is
            a decision somebody has to make knowingly, so what breaks is listed
            rather than summarised as a count. */}
        {pendingDelete && segmentUsageCount(pendingDelete) > 0 ? (
          <div className="mt-3 rounded-panel border border-warning-border bg-warning-soft px-3.5 py-3">
            <p className="text-xs font-semibold text-warning-text">
              This segment is still in use
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-warning-text">
              {pendingDelete.usage.campaigns.map((item) => (
                <li key={item}>· {item} (campaign)</li>
              ))}
              {pendingDelete.usage.automations.map((item) => (
                <li key={item}>· {item} (automation)</li>
              ))}
            </ul>
            <p className="mt-1.5 text-xs text-warning-text">
              Each will need a new audience before it can send again.
            </p>
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
