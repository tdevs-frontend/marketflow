"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Download,
  MailOpen,
  MousePointerClick,
  Plus,
  Tag as TagIcon,
  Trash2,
  Upload,
  UserMinus,
  Users,
} from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu } from "@/components/ui/menu";
import { MiniStat, StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TagList } from "@/components/ui/tag";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_THEME } from "@/constants/channels";
import {
  EMAIL_CAMPAIGNS,
  EMAIL_CONTACTS,
  EMAIL_CONTACT_STATUSES,
  EMAIL_SOURCES,
  EMAIL_TAGS,
  ENGAGEMENT_LEVELS,
  emailContactName,
} from "@/lib/email-fixtures";
import { formatCount, formatDate, formatNumber, formatPercent, formatRelativeTime, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  EmailContact,
  EmailContactStatus,
  EngagementLevel,
} from "@/types/email";

/**
 * Email contact management.
 *
 * The column that does not exist on the other channels is engagement, and it
 * earns its place: an email list is an asset that decays, and the difference
 * between 18,000 subscribers and 18,000 *readers* is the number that decides
 * whether the next send lands in an inbox or a spam folder. So engagement gets
 * a badge, a filter and a stat card, and the empty-state copy points at list
 * hygiene rather than at growth.
 */

const ALL = "all";
const PER_PAGE = 10;
const theme = CHANNEL_THEME.email;

const STATUS_TONES: Record<EmailContactStatus, BadgeTone> = {
  subscribed: "success",
  pending: "warning",
  unsubscribed: "neutral",
  bounced: "danger",
};

const ENGAGEMENT_TONES: Record<EngagementLevel, BadgeTone> = {
  high: "brand",
  medium: "info",
  low: "warning",
  none: "neutral",
};

const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "Never",
};

function stats(contacts: EmailContact[]): StatItem[] {
  const subscribed = contacts.filter((c) => c.status === "subscribed").length;
  const engaged = contacts.filter(
    (c) => c.engagement === "high" || c.engagement === "medium",
  ).length;
  const unsubscribed = contacts.filter((c) => c.status === "unsubscribed").length;
  const bounced = contacts.filter((c) => c.status === "bounced").length;

  return [
    {
      label: "Subscribers",
      value: formatCount(subscribed),
      changePercent: 14.6,
      icon: Users,
      hint: `of ${contacts.length} on the list`,
    },
    {
      label: "Engaged",
      value: formatPercent(rate(engaged, Math.max(subscribed, 1))),
      changePercent: 5.2,
      icon: MailOpen,
      hint: "opened in the last 90 days",
    },
    {
      label: "Unsubscribed",
      value: formatCount(unsubscribed),
      changePercent: -2.4,
      icon: UserMinus,
      hint: "in the last 30 days",
      invertTrend: true,
    },
    {
      label: "Bounced",
      value: formatCount(bounced),
      changePercent: -1.1,
      icon: Ban,
      hint: "needs cleaning",
      invertTrend: true,
    },
  ];
}

export function EmailContactsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmailContactStatus | typeof ALL>(ALL);
  const [engagement, setEngagement] = useState<EngagementLevel | typeof ALL>(ALL);
  const [source, setSource] = useState<string>(ALL);
  const [tag, setTag] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<EmailContact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  /* The add-contact form's own state. Without it the select is a control the
     user cannot actually change. */
  const [newSource, setNewSource] = useState(EMAIL_SOURCES[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeFilters =
    (status === ALL ? 0 : 1) +
    (engagement === ALL ? 0 : 1) +
    (source === ALL ? 0 : 1) +
    (tag === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return EMAIL_CONTACTS.filter((contact) => {
      const name = emailContactName(contact).toLowerCase();
      if (
        term &&
        !name.includes(term) &&
        !contact.email.toLowerCase().includes(term) &&
        !(contact.company ?? "").toLowerCase().includes(term)
      ) {
        return false;
      }
      if (status !== ALL && contact.status !== status) return false;
      if (engagement !== ALL && contact.engagement !== engagement) return false;
      if (source !== ALL && contact.source !== source) return false;
      if (tag !== ALL && !contact.tags.includes(tag)) return false;
      return true;
    }).sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
  }, [engagement, search, source, status, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((row) => row.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setStatus(ALL);
    setEngagement(ALL);
    setSource(ALL);
    setTag(ALL);
    setPage(1);
  }

  function runBulk(message: string) {
    toast(message);
    setSelected([]);
  }

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );

  /* Campaigns this contact could plausibly have received — the drawer's
     campaign history, without modelling per-recipient delivery. */
  const historyFor = (contact: EmailContact) =>
    EMAIL_CAMPAIGNS.filter((campaign) => campaign.sent > 0).slice(
      0,
      Math.min(contact.campaigns, 5),
    );

  return (
    <>
      <StatsGrid
        items={stats(EMAIL_CONTACTS)}
        accent={{ soft: theme.soft, text: theme.text }}
      />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, email or company…"
          activeCount={activeFilters}
          onReset={resetFilters}
          trailing={
            <>
              <Button
                variant="outline"
                size="compact"
                onClick={() => setImportOpen(true)}
              >
                <Upload aria-hidden />
                Import
              </Button>
              <Button
                variant="outline"
                size="compact"
                onClick={() => toast(`${filtered.length} contacts exported to CSV`)}
              >
                <Download aria-hidden />
                Export
              </Button>
              <Button size="compact" onClick={() => setAddOpen(true)}>
                <Plus aria-hidden />
                Add Contact
              </Button>
            </>
          }
        >
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as EmailContactStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...EMAIL_CONTACT_STATUSES]}
            className="lg:w-44"
          />
          <Select
            label="Filter by engagement"
            size="sm"
            value={engagement}
            onChange={(next) => {
              setEngagement(next as EngagementLevel | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "Any engagement" }, ...ENGAGEMENT_LEVELS]}
            className="lg:w-44"
          />
          <Select
            label="Filter by source"
            size="sm"
            value={source}
            onChange={(next) => {
              setSource(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All sources" },
              ...EMAIL_SOURCES.map((item) => ({ value: item, label: item })),
            ]}
            className="lg:w-40"
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
              ...EMAIL_TAGS.map((item) => ({ value: item, label: item })),
            ]}
            className="lg:w-36"
          />
        </FilterBar>

        {selected.length > 0 ? (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-3 rounded-panel border px-3.5 py-2.5",
              theme.border,
              theme.soft,
            )}
          >
            <p className="text-sm font-medium text-email-dark">
              {selected.length} selected
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`Tag added to ${selected.length} contacts`)}
              >
                <TagIcon aria-hidden />
                Add tag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} contacts unsubscribed`)}
              >
                <UserMinus aria-hidden />
                Unsubscribe
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} contacts exported`)}
              >
                <Download aria-hidden />
                Export
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title={
              search || activeFilters
                ? "No contacts match those filters"
                : "No email contacts yet"
            }
            description={
              search || activeFilters
                ? "Try a different search term, or clear the filters."
                : "Import a list or add contacts one at a time. A small engaged list outperforms a large stale one every time."
            }
            action={
              search || activeFilters ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setImportOpen(true)}>
                  <Upload aria-hidden />
                  Import contacts
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="mt-4 max-lg:hidden">
              <Table minWidth="76rem">
                <THead>
                  <TH className="w-10 pr-0">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={!allOnPage && someOnPage}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          allOnPage
                            ? prev.filter((id) => !pageIds.includes(id))
                            : [...new Set([...prev, ...pageIds])],
                        )
                      }
                      label="Select all contacts on this page"
                    />
                  </TH>
                  <TH>Contact</TH>
                  <TH>Tags</TH>
                  <TH>Status</TH>
                  <TH>Engagement</TH>
                  <TH>Source</TH>
                  <TH align="right">Opens</TH>
                  <TH align="right">Clicks</TH>
                  <TH>Last activity</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((contact) => {
                    const isSelected = selected.includes(contact.id);
                    const name = emailContactName(contact);

                    return (
                      <TR key={contact.id} selected={isSelected}>
                        <TD className="pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggle(contact.id)}
                            label={`Select ${name}`}
                          />
                        </TD>

                        <TD>
                          <button
                            type="button"
                            onClick={() => setDetail(contact)}
                            className="text-left focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <AvatarLabel
                              name={name}
                              secondary={contact.email}
                              size="sm"
                            />
                          </button>
                        </TD>

                        <TD>
                          <TagList tags={contact.tags} />
                        </TD>

                        <TD>
                          <Badge tone={STATUS_TONES[contact.status]}>
                            {contact.status}
                          </Badge>
                        </TD>

                        <TD>
                          <Badge tone={ENGAGEMENT_TONES[contact.engagement]}>
                            {ENGAGEMENT_LABELS[contact.engagement]}
                          </Badge>
                        </TD>

                        <TD className="text-xs text-text-secondary">
                          {contact.source}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="font-medium text-text-primary">
                            {formatNumber(contact.opens)}
                          </span>
                          {contact.campaigns > 0 ? (
                            <span className="block text-[11px] text-text-muted">
                              of {contact.campaigns} sends
                            </span>
                          ) : null}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(contact.clicks)}
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatRelativeTime(contact.lastActivityAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            label={`Actions for ${name}`}
                            items={[
                              {
                                label: "View profile",
                                icon: <Users className="size-4" />,
                                onSelect: () => setDetail(contact),
                              },
                              {
                                label: "Add tag",
                                icon: <TagIcon className="size-4" />,
                                onSelect: () => toast(`Tag added to ${name}`),
                              },
                              {
                                label: "Unsubscribe",
                                icon: <UserMinus className="size-4" />,
                                onSelect: () => toast(`${name} unsubscribed`),
                                disabled: contact.status === "unsubscribed",
                              },
                              {
                                label: "Delete",
                                icon: <Trash2 className="size-4" />,
                                onSelect: () => {
                                  setSelected([contact.id]);
                                  setConfirmDelete(true);
                                },
                                destructive: true,
                              },
                            ]}
                          />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            {/* Mobile */}
            <ul className="mt-4 space-y-2.5 lg:hidden">
              {rows.map((contact) => {
                const name = emailContactName(contact);

                return (
                  <li
                    key={contact.id}
                    className="rounded-panel border border-border p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.includes(contact.id)}
                        onCheckedChange={() => toggle(contact.id)}
                        label={`Select ${name}`}
                        className="mt-1"
                      />
                      <button
                        type="button"
                        onClick={() => setDetail(contact)}
                        className="min-w-0 flex-1 text-left focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <AvatarLabel name={name} secondary={contact.email} size="sm" />
                      </button>
                      <Badge tone={STATUS_TONES[contact.status]}>
                        {contact.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <TagList tags={contact.tags} />
                      <p className="shrink-0 text-[11px] text-text-muted tabular-nums">
                        {formatNumber(contact.opens)} opens ·{" "}
                        {formatNumber(contact.clicks)} clicks
                      </p>
                    </div>
                  </li>
                );
              })}
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

      {/* ------------------------------------------------------ Detail drawer */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? emailContactName(detail) : "Contact"}
        description={detail?.email}
        footer={
          detail ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="compact"
                className="flex-1"
                onClick={() => toast(`Tag added to ${emailContactName(detail)}`)}
              >
                <TagIcon aria-hidden />
                Add tag
              </Button>
              <Button
                variant="secondary"
                size="compact"
                className="flex-1"
                onClick={() => toast("Draft opened")}
              >
                <MailOpen aria-hidden />
                Send email
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <AvatarLabel
                name={emailContactName(detail)}
                secondary={detail.company ?? detail.email}
                size="lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={STATUS_TONES[detail.status]}>{detail.status}</Badge>
              <Badge tone={ENGAGEMENT_TONES[detail.engagement]}>
                {ENGAGEMENT_LABELS[detail.engagement]} engagement
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Opens" value={formatNumber(detail.opens)} />
              <MiniStat label="Clicks" value={formatNumber(detail.clicks)} />
              <MiniStat
                label="Open rate"
                value={
                  detail.campaigns === 0
                    ? "—"
                    : formatPercent(rate(detail.opens, detail.campaigns))
                }
              />
            </div>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Profile
              </h3>
              <dl className="mt-2 space-y-2 text-sm">
                {[
                  { label: "Email", value: detail.email },
                  { label: "Company", value: detail.company ?? "—" },
                  { label: "Source", value: detail.source },
                  { label: "Subscribed", value: formatDate(detail.createdAt) },
                  {
                    label: "Last activity",
                    value: formatRelativeTime(detail.lastActivityAt),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0"
                  >
                    <dt className="text-xs text-text-muted">{row.label}</dt>
                    <dd className="min-w-0 truncate text-right text-text-secondary">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Tags
              </h3>
              <div className="mt-2">
                <TagList tags={detail.tags} max={8} />
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Campaign history
              </h3>
              {detail.campaigns === 0 ? (
                <p className="mt-2 text-sm text-text-muted">
                  Nothing sent yet — this contact joined the list{" "}
                  {formatRelativeTime(detail.createdAt)}.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {historyFor(detail).map((campaign) => (
                    <li
                      key={campaign.id}
                      className="rounded-panel border border-border px-3 py-2.5"
                    >
                      <p className="truncate text-[13px] font-medium text-text-primary">
                        {campaign.name}
                      </p>
                      <p className="truncate text-[11px] text-text-muted">
                        {campaign.subject}
                      </p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {formatDate(campaign.scheduledAt ?? campaign.createdAt)} ·{" "}
                        {formatPercent(rate(campaign.opened, campaign.delivered))} open
                        rate overall
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Activity timeline
              </h3>
              <ol className="mt-2 space-y-3">
                {[
                  {
                    icon: MousePointerClick,
                    label: "Clicked a link",
                    at: detail.lastActivityAt,
                  },
                  { icon: MailOpen, label: "Opened an email", at: detail.lastActivityAt },
                  { icon: Users, label: "Joined the list", at: detail.createdAt },
                ].map((entry, index) => {
                  const Icon = entry.icon;

                  return (
                    <li key={index} className="flex gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-secondary text-text-muted">
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-text-primary">
                          {entry.label}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {formatRelativeTime(entry.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        ) : null}
      </Drawer>

      {/* -------------------------------------------------------- Add contact */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add contact"
        description="A single contact. Use Import for a list."
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setAddOpen(false);
                toast("Contact added");
              }}
            >
              Add contact
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="new-first">
              <Input id="new-first" placeholder="Sarah" />
            </Field>
            <Field label="Last name" htmlFor="new-last">
              <Input id="new-last" placeholder="Ahmed" />
            </Field>
          </div>

          <Field
            label="Email address"
            htmlFor="new-email"
            hint="The contact receives a confirmation before anything else is sent."
          >
            <Input id="new-email" type="email" placeholder="sarah@example.com" />
          </Field>

          <Field label="Company" htmlFor="new-company">
            <Input id="new-company" placeholder="Bright Retail" />
          </Field>

          <Field label="Source" htmlFor="new-source">
            <Select
              id="new-source"
              hideLabel={false}
              label="Source"
              value={newSource}
              onChange={setNewSource}
              options={EMAIL_SOURCES.map((item) => ({ value: item, label: item }))}
            />
          </Field>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- Import */}
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import contacts"
        description="CSV or TSV, up to 50,000 rows."
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setImportOpen(false);
                toast("Import started — we will email you when it finishes");
              }}
            >
              <Upload aria-hidden />
              Start import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center">
            <Upload className="mx-auto size-6 text-text-muted" aria-hidden />
            <p className="mt-2 text-sm font-medium text-text-primary">
              Drop a CSV here
            </p>
            <p className="mt-1 text-xs text-text-muted">
              First row is treated as headers. Email is the only required column.
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Choose a file
            </Button>
          </div>

          <div className="rounded-panel bg-surface-secondary px-3.5 py-3">
            <p className="text-xs font-medium text-text-primary">
              Duplicates are merged, not added
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              A row whose email already exists updates that contact&apos;s fields and
              tags. Existing engagement history is kept.
            </p>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          const count = selected.length;
          runBulk(`${count} contact${count === 1 ? "" : "s"} deleted`);
        }}
        title={`Delete ${selected.length} contact${selected.length === 1 ? "" : "s"}?`}
        description="Their open and click history is removed with them."
        confirmLabel={`Delete ${selected.length === 1 ? "contact" : "contacts"}`}
      >
        <p className="text-sm text-text-secondary">
          Deleting is not the same as unsubscribing. A deleted contact can be
          re-added by a future import, which would start sending to them again —
          unsubscribe instead if that is what you mean.
        </p>
      </ConfirmDialog>
    </>
  );
}
