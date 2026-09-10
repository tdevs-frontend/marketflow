"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  Layers,
  Tag as TagIcon,
  Target,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  UserRoundPlus,
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
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  CONTACTS,
  CONTACT_SOURCES,
  LIFECYCLES,
  TAG_NAMES,
  contactName,
  type ContactSource,
  type CustomerContact,
  type Lifecycle,
} from "@/lib/customer-fixtures";
import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import { ContactDrawer } from "./contact-drawer";
import { ContactFormDialog, TagPickerDialog, SegmentPickerDialog } from "./contact-dialogs";
import {
  ContactStatusBadge,
  LifecycleBadge,
  SourceBadge,
  TagBadges,
} from "./customer-badges";

const ALL = "all";
const PER_PAGE = 10;

/**
 * The four numbers a reader wants before they touch a filter.
 *
 * Derived from the list rather than stored, so a filter change and a KPI can
 * never disagree — and so the counts stay honest when this is swapped for a
 * paginated endpoint that only ever returns ten rows.
 */
function kpis(): Kpi[] {
  const customers = CONTACTS.filter((item) =>
    ["customer", "repeat"].includes(item.lifecycle),
  );
  const thisMonth = CONTACTS.filter(
    (item) => new Date(item.createdAt) >= new Date("2026-09-01T00:00:00Z"),
  );
  const subscribed = CONTACTS.filter((item) => item.optedInChannels.length > 0);

  return [
    { label: "Total Contacts", value: formatNumber(CONTACTS.length), icon: Users },
    {
      label: "Active Customers",
      value: formatNumber(customers.length),
      icon: UserCheck,
      tone: "success",
      hint: "Customers and repeat customers",
    },
    {
      label: "New This Month",
      value: formatNumber(thisMonth.length),
      icon: UserRoundPlus,
      tone: "brand",
    },
    {
      label: "Subscribed",
      value: formatNumber(subscribed.length),
      icon: TagIcon,
      hint: "Opted in on at least one channel",
    },
  ];
}

/**
 * The contact database: filter, select, inspect, act.
 *
 * Built on the same composition every other workspace in this dashboard uses —
 * `KpiStrip`, then a single `Card` holding a `FilterBar` and a `Table`, with a
 * stacked card list taking over below `lg` and a `Drawer` for detail. Nothing
 * here is a new pattern; the module's job is to look like it was always part
 * of the product.
 */
export function ContactsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [lifecycle, setLifecycle] = useState<Lifecycle | typeof ALL>(ALL);
  const [source, setSource] = useState<ContactSource | typeof ALL>(ALL);
  const [tag, setTag] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<CustomerContact | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [tagPicker, setTagPicker] = useState<CustomerContact[] | null>(null);
  const [segmentPicker, setSegmentPicker] = useState<CustomerContact[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomerContact[] | null>(null);

  const activeFilters =
    (lifecycle === ALL ? 0 : 1) + (source === ALL ? 0 : 1) + (tag === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return CONTACTS.filter((item) => {
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
      if (lifecycle !== ALL && item.lifecycle !== lifecycle) return false;
      if (source !== ALL && item.source !== source) return false;
      if (tag !== ALL && !item.tags.includes(tag)) return false;
      return true;
    });
  }, [search, lifecycle, source, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  /* Selection is scoped to the rows on screen: a "select all" that silently
     picks up 14 contacts the reader cannot see is how bulk deletes go wrong. */
  const allOnPage = rows.length > 0 && rows.every((row) => selected.includes(row.id));
  const someOnPage = rows.some((row) => selected.includes(row.id));

  const selectedContacts = CONTACTS.filter((item) => selected.includes(item.id));

  function resetFilters() {
    setLifecycle(ALL);
    setSource(ALL);
    setTag(ALL);
    setPage(1);
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
      label: "Add tag",
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
      onSelect: () =>
        toast(`Lead drafted for ${contactName(item)}`, "success"),
    },
    {
      label: "Delete contact",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setConfirmDelete([item]),
      destructive: true,
    },
  ];

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Manage customers, leads and subscribers across all channels."
        secondaryActions={
          <Button
            variant="outline"
            onClick={() => toast("CSV import arrives with the API", "info")}
          >
            <Upload className="size-4" />
            Import CSV
          </Button>
        }
        action={
          <Button onClick={() => setFormOpen(true)}>
            <UserPlus className="size-4" />
            Add contact
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <Card className="mt-4 p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, email, phone or company…"
          activeCount={activeFilters}
          onReset={resetFilters}
          trailing={
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast("Export queued", "info")}
            >
              <Download className="size-4" />
              Export
            </Button>
          }
        >
          <Select
            label="Filter by lifecycle stage"
            size="sm"
            value={lifecycle}
            onChange={(next) => {
              setLifecycle(next as Lifecycle | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All stages" }, ...LIFECYCLES]}
            className="lg:w-40"
          />
          <Select
            label="Filter by source"
            size="sm"
            value={source}
            onChange={(next) => {
              setSource(next as ContactSource | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All sources" }, ...CONTACT_SOURCES]}
            className="lg:w-36"
          />
          <Select
            label="Filter by tag"
            size="sm"
            value={tag}
            onChange={(next) => {
              setTag(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All tags" },
              ...TAG_NAMES.map((name) => ({ value: name, label: name })),
            ]}
            className="lg:w-40"
          />
        </FilterBar>

        {/* Bulk bar. Only present when there is a selection to act on. */}
        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-panel bg-primary-soft px-3.5 py-2.5">
            <p className="text-[13px] font-medium text-primary-dark">
              {selected.length} selected
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
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
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          activeFilters > 0 || search ? (
            <EmptyState
              title="No contacts match those filters"
              description="Adjust the stage, source or tag, or clear the filters to see everyone."
              action={
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No contacts yet"
              description="Import your customer list or add your first contact to start building your audience."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast("CSV import coming from the API", "info")}
                  >
                    Import CSV
                  </Button>
                  <Button size="sm" onClick={() => setFormOpen(true)}>
                    <UserPlus className="size-4" />
                    Add contact
                  </Button>
                </div>
              }
            />
          )
        ) : (
          <>
            <div className="mt-4 max-lg:hidden">
              <Table minWidth="66rem">
                <THead>
                  <TH className="w-9">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={someOnPage && !allOnPage}
                      onCheckedChange={togglePage}
                      label="Select all contacts on this page"
                    />
                  </TH>
                  <TH>Contact</TH>
                  <TH>Email</TH>
                  <TH>Phone</TH>
                  <TH>Stage</TH>
                  <TH>Tags</TH>
                  <TH>Source</TH>
                  <TH align="right">Value</TH>
                  <TH>Last activity</TH>
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
                          className="rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          <AvatarLabel
                            name={contactName(item)}
                            secondary={item.company ?? item.jobTitle ?? undefined}
                            size="sm"
                          />
                        </button>
                      </TD>

                      <TD className="text-xs text-text-secondary">
                        <span className="block max-w-40 truncate">
                          {item.email ?? "—"}
                        </span>
                      </TD>

                      <TD className="text-xs whitespace-nowrap text-text-secondary">
                        {item.phone ?? "—"}
                      </TD>

                      <TD>
                        <span className="flex flex-wrap items-center gap-1">
                          <LifecycleBadge lifecycle={item.lifecycle} />
                          <ContactStatusBadge status={item.status} />
                        </span>
                      </TD>

                      <TD>
                        <TagBadges tags={item.tags} />
                      </TD>

                      <TD>
                        <SourceBadge source={item.source} />
                      </TD>

                      <TD align="right" className="text-xs font-medium text-text-primary tabular-nums">
                        {item.lifetimeValue ? formatCurrency(item.lifetimeValue) : "—"}
                      </TD>

                      <TD className="text-xs whitespace-nowrap text-text-muted">
                        {item.lastContactedAt
                          ? formatRelativeTime(item.lastContactedAt)
                          : formatDate(item.createdAt)}
                      </TD>

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
            </div>

            {/* Below `lg` the ten columns become a card each — a horizontally
                scrolling table on a phone is a table nobody reads. */}
            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActive(item)}
                    className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <AvatarLabel
                        name={contactName(item)}
                        secondary={item.company ?? item.email ?? undefined}
                        size="sm"
                      />
                      <LifecycleBadge lifecycle={item.lifecycle} />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <TagBadges tags={item.tags} max={3} />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <SourceBadge source={item.source} />
                      {item.lifetimeValue ? (
                        <span className="text-xs font-medium text-text-primary tabular-nums">
                          {formatCurrency(item.lifetimeValue)}
                        </span>
                      ) : null}
                      <span className="ml-auto text-[11px] text-text-muted">
                        {item.lastContactedAt
                          ? formatRelativeTime(item.lastContactedAt)
                          : formatDate(item.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onChange={setPage}
                noun="contacts"
              />
            </div>
          </>
        )}
      </Card>

      <ContactDrawer
        contact={active}
        onClose={() => setActive(null)}
        onAddTag={(item) => setTagPicker([item])}
        onAddToSegment={(item) => setSegmentPicker([item])}
        onCreateLead={(item) =>
          toast(`Lead drafted for ${contactName(item)}`, "success")
        }
      />

      <ContactFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(name) => {
          setFormOpen(false);
          toast(`${name} added`, "success");
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
