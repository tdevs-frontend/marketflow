"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  Layers,
  MessageCircle,
  Pencil,
  Route,
  Tag as TagIcon,
  Target,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
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
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import {
  CONSENT_CHANNELS,
  CONTACTS,
  CONTACT_SOURCES,
  CONTACT_STATUSES,
  CUSTOMER_SEGMENTS,
  LIFECYCLES,
  TAG_NAMES,
  contactName,
  segmentById,
  segmentMembers,
  type CustomerContact,
} from "@/lib/customer-fixtures";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import type { ContactChannel } from "@/types/contact";
import { ContactDrawer } from "./contact-drawer";
import {
  ContactFormDialog,
  TagPickerDialog,
  SegmentPickerDialog,
} from "./contact-dialogs";
import {
  ActiveFilterChips,
  BulkActionBar,
  ColumnsMenu,
  RowsPerPage,
  type ColumnOption,
  type FilterChip,
} from "./customer-toolbar";
import {
  ChannelConsentBadges,
  ContactStatusBadge,
  LifecycleBadge,
  SourceBadge,
  TagBadges,
} from "./customer-badges";

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

type Column =
  | "phone"
  | "channels"
  | "status"
  | "tags"
  | "source"
  | "value"
  | "activity"
  | "created";

/** Contact and Actions are not listed: they are the row's identity and its
    controls, and a table without either is not a table. */
const COLUMNS: ColumnOption<Column>[] = [
  { value: "phone", label: "Phone" },
  { value: "channels", label: "Channels" },
  { value: "status", label: "Status" },
  { value: "tags", label: "Tags" },
  { value: "source", label: "Source" },
  { value: "value", label: "Lifetime value" },
  { value: "activity", label: "Last activity" },
  { value: "created", label: "Created" },
];

/* `created` is off by default — it is the least-read column and the one whose
   absence buys the most room for tags. */
const HIDDEN_BY_DEFAULT: Column[] = ["created"];

type SortField = "name" | "value" | "activity" | "created";

const FILTERS = [
  "status",
  "lifecycle",
  "source",
  "tag",
  "segment",
  "channel",
] as const;
type FilterKey = (typeof FILTERS)[number];

/* -------------------------------------------------------------------------- */
/* KPIs                                                                       */
/* -------------------------------------------------------------------------- */

function kpis(): Kpi[] {
  const thisMonth = CONTACTS.filter(
    (item) => new Date(item.createdAt) >= new Date("2026-09-01T00:00:00Z"),
  );
  const subscribed = CONTACTS.filter((item) => item.optedInChannels.length > 0);
  const inactive = CONTACTS.filter(
    (item) => item.status !== "active" || item.optedInChannels.length === 0,
  );

  return [
    {
      label: "Total contacts",
      value: formatNumber(CONTACTS.length),
      icon: Users,
    },
    {
      label: "New this month",
      value: formatNumber(thisMonth.length),
      icon: UserRoundPlus,
      tone: "brand",
    },
    {
      label: "Subscribed",
      value: formatNumber(subscribed.length),
      icon: UserCheck,
      tone: "success",
      hint: "Opted in on at least one channel",
    },
    {
      label: "Unsubscribed or inactive",
      value: formatNumber(inactive.length),
      icon: TagIcon,
      tone: inactive.length ? "warning" : "neutral",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The contact database: filter, sort, select, inspect, act.
 *
 * Built on the composition every other workspace in this dashboard uses —
 * `KpiStrip`, then one `Card` holding a `FilterBar` and a `Table`, with a
 * stacked card list taking over below `lg` and a `Drawer` for detail.
 *
 * All of the table's state lives in the URL through `useTableState`, so a
 * filtered view is linkable and Back from a contact returns to it. Search is
 * debounced through the existing `useDebounce` so typing does not re-filter
 * 24 rows on every keystroke — and, more importantly, does not write to the
 * router on every keystroke either.
 */
export function ContactsWorkspace() {
  const toast = useToast();
  const table = useTableState<FilterKey, Column>(FILTERS, {
    columns: COLUMNS.map((column) => column.value),
    hiddenByDefault: HIDDEN_BY_DEFAULT,
  });

  /* Local mirror so the input stays responsive; the URL follows behind it. */
  const [searchDraft, setSearchDraft] = useState(table.search);
  const debouncedDraft = useDebounce(searchDraft, 300);
  const [lastPushed, setLastPushed] = useState(table.search);
  if (debouncedDraft !== lastPushed) {
    setLastPushed(debouncedDraft);
    table.setSearch(debouncedDraft);
  }

  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<CustomerContact | null>(null);

  const [formFor, setFormFor] = useState<CustomerContact | null | "new">(null);
  const [tagPicker, setTagPicker] = useState<CustomerContact[] | null>(null);
  const [segmentPicker, setSegmentPicker] = useState<CustomerContact[] | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<CustomerContact[] | null>(
    null,
  );

  const { filters } = table;

  const filtered = useMemo(() => {
    const term = debouncedDraft.trim().toLowerCase();

    /*
     * Segment membership is asked of the segment, not of the contact.
     *
     * A dynamic segment is its rules, so `contact.segmentIds` only records the
     * static ones — filtering on that made this page and the Segments page
     * disagree about how many people are in VIP Customers.
     */
    const segment =
      filters.segment === "all" ? null : segmentById(filters.segment);
    const members = segment
      ? new Set(segmentMembers(segment).map((member) => member.id))
      : null;

    const rows = CONTACTS.filter((item) => {
      if (term) {
        const haystack = [
          contactName(item),
          item.email ?? "",
          item.phone ?? "",
          item.company ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.status !== "all" && item.status !== filters.status)
        return false;
      if (filters.lifecycle !== "all" && item.lifecycle !== filters.lifecycle) {
        return false;
      }
      if (filters.source !== "all" && item.source !== filters.source)
        return false;
      if (filters.tag !== "all" && !item.tags.includes(filters.tag))
        return false;
      if (members && !members.has(item.id)) return false;
      if (
        filters.channel !== "all" &&
        !item.optedInChannels.includes(filters.channel as ContactChannel)
      ) {
        return false;
      }
      return true;
    });

    const field = (table.sortField ?? "activity") as SortField;
    const factor = table.sortDirection === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      switch (field) {
        case "name":
          return contactName(a).localeCompare(contactName(b)) * factor;
        case "value":
          return (a.lifetimeValue - b.lifetimeValue) * factor;
        case "created":
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            factor
          );
        default: {
          /* Never contacted sorts as the oldest possible, so a descending
             "last activity" puts real activity first rather than blanks. */
          const at = (item: CustomerContact) =>
            item.lastContactedAt ? new Date(item.lastContactedAt).getTime() : 0;
          return (at(a) - at(b)) * factor;
        }
      }
    });
  }, [debouncedDraft, filters, table.sortField, table.sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const current = Math.min(table.page, totalPages);
  const rows = filtered.slice(
    (current - 1) * table.pageSize,
    current * table.pageSize,
  );

  /* Selection is scoped to the rows on screen: a "select all" that silently
     picks up contacts the reader cannot see is how bulk deletes go wrong. */
  const allOnPage =
    rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const someOnPage = rows.some((row) => selected.includes(row.id));
  const selectedContacts = CONTACTS.filter((item) =>
    selected.includes(item.id),
  );

  const label = (
    list: readonly { value: string; label: string }[],
    value: string,
  ) => list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.status !== "all"
      ? {
          key: "status",
          label: "Status",
          value: label(CONTACT_STATUSES, filters.status),
        }
      : null,
    filters.lifecycle !== "all"
      ? {
          key: "lifecycle",
          label: "Stage",
          value: label(LIFECYCLES, filters.lifecycle),
        }
      : null,
    filters.source !== "all"
      ? {
          key: "source",
          label: "Source",
          value: label(CONTACT_SOURCES, filters.source),
        }
      : null,
    filters.tag !== "all"
      ? { key: "tag", label: "Tag", value: filters.tag }
      : null,
    filters.segment !== "all"
      ? {
          key: "segment",
          label: "Segment",
          value: segmentById(filters.segment)?.name ?? filters.segment,
        }
      : null,
    filters.channel !== "all"
      ? {
          key: "channel",
          label: "Consent",
          value: label(CONSENT_CHANNELS, filters.channel),
        }
      : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function togglePage(checked: boolean) {
    const ids = rows.map((row) => row.id);
    setSelected((prev) =>
      checked
        ? [...new Set([...prev, ...ids])]
        : prev.filter((item) => !ids.includes(item)),
    );
  }

  const rowActions = (item: CustomerContact) => [
    {
      label: "View contact",
      icon: <Eye className="size-4" />,
      onSelect: () => setActive(item),
    },
    {
      label: "Edit contact",
      icon: <Pencil className="size-4" />,
      onSelect: () => setFormFor(item),
    },
    {
      label: "Send message",
      icon: <MessageCircle className="size-4" />,
      onSelect: () => toast(`Composer for ${contactName(item)}`, "info"),
      disabled: item.optedInChannels.length === 0,
    },
    {
      label: "Add or remove tags",
      icon: <TagIcon className="size-4" />,
      onSelect: () => setTagPicker([item]),
    },
    {
      label: "Add to segment",
      icon: <Layers className="size-4" />,
      onSelect: () => setSegmentPicker([item]),
    },
    {
      label: "Create lead",
      icon: <Target className="size-4" />,
      onSelect: () => toast(`Lead drafted for ${contactName(item)}`, "success"),
    },
    {
      label: "View customer journey",
      icon: <Route className="size-4" />,
      onSelect: () => toast(`Opening journey for ${contactName(item)}`, "info"),
    },
    {
      label: "Delete contact",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setConfirmDelete([item]),
      destructive: true,
    },
  ];

  const filtersOn = chips.length > 0 || debouncedDraft.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Every person in your workspace, with consent tracked per channel."
        secondaryActions={
          <>
            <Button
              variant="outline"
              onClick={() => toast("CSV import arrives with the API", "info")}
            >
              <Upload className="size-4" />
              Import contacts
            </Button>
            <Button
              variant="outline"
              onClick={() => toast("Export queued", "info")}
              className="max-sm:hidden"
            >
              <Download className="size-4" />
              Export
            </Button>
          </>
        }
        action={
          <Button onClick={() => setFormFor("new")}>
            <UserPlus className="size-4" />
            Add contact
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <Card className="mt-4 p-5">
        <FilterBar
          search={searchDraft}
          onSearchChange={setSearchDraft}
          placeholder="Search contacts…"
          activeCount={chips.length}
          onReset={clearEverything}
          trailing={
            <ColumnsMenu
              columns={COLUMNS}
              isVisible={table.isVisible}
              onToggle={table.toggleColumn}
              onReset={table.resetColumns}
            />
          }
        >
          <Select
            label="Filter by status"
            size="sm"
            value={filters.status}
            onChange={(next) => table.setFilter("status", next)}
            options={[
              { value: "all", label: "All statuses" },
              ...CONTACT_STATUSES,
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by lifecycle stage"
            size="sm"
            value={filters.lifecycle}
            onChange={(next) => table.setFilter("lifecycle", next)}
            options={[{ value: "all", label: "All stages" }, ...LIFECYCLES]}
            className="lg:w-36"
          />
          <Select
            label="Filter by source"
            size="sm"
            value={filters.source}
            onChange={(next) => table.setFilter("source", next)}
            options={[
              { value: "all", label: "All sources" },
              ...CONTACT_SOURCES,
            ]}
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
            label="Filter by segment"
            size="sm"
            value={filters.segment}
            onChange={(next) => table.setFilter("segment", next)}
            options={[
              { value: "all", label: "All segments" },
              ...CUSTOMER_SEGMENTS.filter((item) => !item.system).map(
                (item) => ({
                  value: item.id,
                  label: item.name,
                }),
              ),
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by channel consent"
            size="sm"
            value={filters.channel}
            onChange={(next) => table.setFilter("channel", next)}
            options={[
              { value: "all", label: "Any consent" },
              ...CONSENT_CHANNELS,
            ]}
            className="lg:w-32"
          />
        </FilterBar>

        <ActiveFilterChips
          chips={chips}
          onRemove={(key) => table.clearFilter(key as FilterKey)}
          onClearAll={clearEverything}
          className="mt-3"
        />

        <BulkActionBar
          count={selected.length}
          noun="contact"
          onClear={() => setSelected([])}
          className="mt-4"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTagPicker(selectedContacts)}
          >
            <TagIcon className="size-4" />
            Add tag
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSegmentPicker(selectedContacts)}
          >
            <Layers className="size-4" />
            Add to segment
          </Button>
          <Select
            label="Change status for selected contacts"
            hideLabel
            size="sm"
            value="all"
            onChange={(next) => {
              toast(
                `${selected.length} contact${selected.length === 1 ? "" : "s"} set to ${label(CONTACT_STATUSES, next)}`,
                "success",
              );
              setSelected([]);
            }}
            options={[
              { value: "all", label: "Change status" },
              ...CONTACT_STATUSES,
            ]}
            className="w-40"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast(`Exporting ${selected.length} contacts`, "info")
            }
          >
            <Download className="size-4" />
            Export
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirmDelete(selectedContacts)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </BulkActionBar>

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
              title="No contacts yet"
              description="Import a CSV or add contacts one at a time to start building your audience."
              action={
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" onClick={() => setFormFor("new")}>
                      <UserPlus className="size-4" />
                      Add contact
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toast("CSV import arrives with the API", "info")
                      }
                    >
                      <Upload className="size-4" />
                      Import CSV
                    </Button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    CSV needs a name column plus an email or phone column.
                  </p>
                </div>
              }
            />
          )
        ) : (
          <>
            <Table minWidth="60rem" className="mt-4 max-lg:hidden">
              <THead>
                <TH className="w-9">
                  <Checkbox
                    checked={allOnPage}
                    indeterminate={someOnPage && !allOnPage}
                    onCheckedChange={togglePage}
                    label="Select all contacts on this page"
                  />
                </TH>
                <SortableTH
                  field="name"
                  activeField={table.sortField}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Contact
                </SortableTH>
                {table.isVisible("phone") ? <TH>Phone</TH> : null}
                {table.isVisible("channels") ? <TH>Channels</TH> : null}
                {table.isVisible("status") ? <TH>Status</TH> : null}
                {table.isVisible("tags") ? <TH>Tags</TH> : null}
                {table.isVisible("source") ? <TH>Source</TH> : null}
                {table.isVisible("value") ? (
                  <SortableTH
                    field="value"
                    activeField={table.sortField}
                    direction={table.sortDirection}
                    onSort={table.toggleSort}
                    align="right"
                  >
                    Value
                  </SortableTH>
                ) : null}
                {table.isVisible("activity") ? (
                  <SortableTH
                    field="activity"
                    activeField={table.sortField}
                    direction={table.sortDirection}
                    onSort={table.toggleSort}
                  >
                    Last activity
                  </SortableTH>
                ) : null}
                {table.isVisible("created") ? (
                  <SortableTH
                    field="created"
                    activeField={table.sortField}
                    direction={table.sortDirection}
                    onSort={table.toggleSort}
                  >
                    Created
                  </SortableTH>
                ) : null}
                <TH align="right" />
              </THead>

              <TBody>
                {rows.map((item) => (
                  <TR key={item.id} selected={selected.includes(item.id)}>
                    <TD>
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        label={`Select ${contactName(item)}`}
                      />
                    </TD>

                    <TD>
                      <button
                        type="button"
                        onClick={() => setActive(item)}
                        className="max-w-56 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <AvatarLabel
                          name={contactName(item)}
                          secondary={item.email ?? item.phone ?? undefined}
                          size="sm"
                        />
                      </button>
                    </TD>

                    {table.isVisible("phone") ? (
                      <TD className="text-xs whitespace-nowrap text-text-secondary">
                        {item.phone ?? "—"}
                      </TD>
                    ) : null}

                    {table.isVisible("channels") ? (
                      <TD>
                        <ChannelConsentBadges channels={item.optedInChannels} />
                      </TD>
                    ) : null}

                    {table.isVisible("status") ? (
                      <TD>
                        <span className="flex flex-wrap items-center gap-1">
                          <LifecycleBadge lifecycle={item.lifecycle} />
                          <ContactStatusBadge status={item.status} />
                        </span>
                      </TD>
                    ) : null}

                    {table.isVisible("tags") ? (
                      <TD>
                        <TagBadges tags={item.tags} />
                      </TD>
                    ) : null}

                    {table.isVisible("source") ? (
                      <TD>
                        <SourceBadge source={item.source} />
                      </TD>
                    ) : null}

                    {table.isVisible("value") ? (
                      <TD
                        align="right"
                        className="text-xs font-medium whitespace-nowrap text-text-primary tabular-nums"
                      >
                        {item.lifetimeValue
                          ? formatCurrency(item.lifetimeValue)
                          : "—"}
                      </TD>
                    ) : null}

                    {table.isVisible("activity") ? (
                      <TD className="text-xs whitespace-nowrap text-text-muted">
                        {item.lastContactedAt
                          ? formatRelativeTime(item.lastContactedAt)
                          : "Never"}
                      </TD>
                    ) : null}

                    {table.isVisible("created") ? (
                      <TD className="text-xs whitespace-nowrap text-text-muted">
                        {formatDate(item.createdAt)}
                      </TD>
                    ) : null}

                    <TD align="right">
                      <Menu
                        items={rowActions(item)}
                        label={`Actions for ${contactName(item)}`}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            {/* Below `lg` the columns become a card each. The brief's priority
                order — contact, status, tags, action — is what survives. */}
            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((item) => (
                <li key={item.id}>
                  <div className="rounded-panel border border-border p-3.5">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        label={`Select ${contactName(item)}`}
                        className="mt-1"
                      />

                      <button
                        type="button"
                        onClick={() => setActive(item)}
                        className="min-w-0 flex-1 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <AvatarLabel
                          name={contactName(item)}
                          secondary={item.email ?? item.phone ?? undefined}
                          size="sm"
                        />
                      </button>

                      <Menu
                        items={rowActions(item)}
                        label={`Actions for ${contactName(item)}`}
                      />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <LifecycleBadge lifecycle={item.lifecycle} />
                      <ContactStatusBadge status={item.status} />
                      <TagBadges tags={item.tags} max={2} />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <ChannelConsentBadges channels={item.optedInChannels} />
                      <span className="ml-auto text-[11px] text-text-muted">
                        {item.lastContactedAt
                          ? formatRelativeTime(item.lastContactedAt)
                          : "Never contacted"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <RowsPerPage
                value={table.pageSize}
                onChange={table.setPageSize}
              />
              <div className="min-w-0 flex-1">
                <Pagination
                  page={current}
                  totalPages={totalPages}
                  total={filtered.length}
                  perPage={table.pageSize}
                  onChange={table.setPage}
                  noun="contacts"
                />
              </div>
            </div>
          </>
        )}
      </Card>

      <ContactDrawer
        contact={active}
        onClose={() => setActive(null)}
        onEdit={(item) => {
          setActive(null);
          setFormFor(item);
        }}
        onAddTag={(item) => setTagPicker([item])}
        onAddToSegment={(item) => setSegmentPicker([item])}
        onCreateLead={(item) =>
          toast(`Lead drafted for ${contactName(item)}`, "success")
        }
      />

      <ContactFormDialog
        open={formFor !== null}
        contact={formFor === "new" ? null : formFor}
        onClose={() => setFormFor(null)}
        onSaved={(name, wasEdit) => {
          setFormFor(null);
          toast(`${name} ${wasEdit ? "updated" : "added"}`, "success");
        }}
      />

      <TagPickerDialog
        contacts={tagPicker}
        onClose={() => setTagPicker(null)}
        onApply={(names, count) => {
          setTagPicker(null);
          toast(
            `${names.join(", ")} added to ${count} contact${count === 1 ? "" : "s"}`,
            "success",
          );
        }}
      />

      <SegmentPickerDialog
        contacts={segmentPicker}
        onClose={() => setSegmentPicker(null)}
        onApply={(name, count) => {
          setSegmentPicker(null);
          toast(
            `${count} contact${count === 1 ? "" : "s"} added to ${name}`,
            "success",
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          const count = confirmDelete?.length ?? 0;
          setConfirmDelete(null);
          setSelected([]);
          setActive(null);
          toast(`${count} contact${count === 1 ? "" : "s"} deleted`, "success");
        }}
        title={
          confirmDelete && confirmDelete.length > 1
            ? `Delete ${confirmDelete.length} contacts?`
            : "Delete this contact?"
        }
        description="Their conversation history, tags and segment membership are removed with them. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
