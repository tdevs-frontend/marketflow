"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Download,
  MessageSquare,
  Phone,
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
import { LEAD_STAGES } from "@/constants/app";
import {
  SMS_CAMPAIGNS,
  SMS_CONTACTS,
  SMS_CONTACT_STATUSES,
  SMS_COUNTRIES,
  SMS_TAGS,
  smsContactName,
} from "@/lib/sms-fixtures";
import { formatCount, formatDate, formatNumber, formatPercent, formatRelativeTime, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SmsContact, SmsContactStatus } from "@/types/sms";

/**
 * SMS contact management.
 *
 * The column no other channel has is Country, and it is not decoration: SMS is
 * billed per destination, so "which countries is this list in" is a cost
 * question as much as a demographic one. Invalid numbers get their own status
 * rather than being folded into failures — an invalid number is a data problem
 * you can fix, where a failure is usually a carrier problem you cannot.
 */

const ALL = "all";
const PER_PAGE = 10;
const theme = CHANNEL_THEME.sms;

const STATUS_TONES: Record<SmsContactStatus, BadgeTone> = {
  subscribed: "success",
  "opted-out": "neutral",
  invalid: "danger",
};

function stats(contacts: SmsContact[]): StatItem[] {
  const subscribed = contacts.filter((c) => c.status === "subscribed").length;
  const optedOut = contacts.filter((c) => c.status === "opted-out").length;
  const invalid = contacts.filter((c) => c.status === "invalid").length;
  const replies = contacts.reduce((sum, c) => sum + c.replies, 0);
  const messages = contacts.reduce((sum, c) => sum + c.messages, 0);

  return [
    {
      label: "Subscribers",
      value: formatCount(subscribed),
      changePercent: 9.4,
      icon: Users,
      hint: `of ${contacts.length} numbers`,
    },
    {
      label: "Reply Rate",
      value: formatPercent(rate(replies, Math.max(messages, 1))),
      changePercent: 12.6,
      icon: MessageSquare,
      hint: `${formatNumber(replies)} replies`,
    },
    {
      label: "Opted Out",
      value: formatCount(optedOut),
      changePercent: -3.2,
      icon: UserMinus,
      hint: "replied STOP",
      invertTrend: true,
    },
    {
      label: "Invalid Numbers",
      value: formatCount(invalid),
      changePercent: -1.8,
      icon: Ban,
      hint: "billed but undeliverable",
      invertTrend: true,
    },
  ];
}

export function SmsContactsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SmsContactStatus | typeof ALL>(ALL);
  const [country, setCountry] = useState<string>(ALL);
  const [leadStatus, setLeadStatus] = useState<string>(ALL);
  const [tag, setTag] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<SmsContact | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  /* The add-contact form's own state, so the select is a real control. */
  const [newStage, setNewStage] = useState<string>(LEAD_STAGES[0].value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeFilters =
    (status === ALL ? 0 : 1) +
    (country === ALL ? 0 : 1) +
    (leadStatus === ALL ? 0 : 1) +
    (tag === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return SMS_CONTACTS.filter((contact) => {
      const name = smsContactName(contact).toLowerCase();
      /* Digits only when matching a phone number, so "+880 1711" and
         "8801711" both find the same contact. */
      const digits = term.replace(/\D/g, "");
      const phoneDigits = contact.phone.replace(/\D/g, "");

      if (
        term &&
        !name.includes(term) &&
        !(digits.length > 0 && phoneDigits.includes(digits))
      ) {
        return false;
      }
      if (status !== ALL && contact.status !== status) return false;
      if (country !== ALL && contact.country !== country) return false;
      if (leadStatus !== ALL && contact.leadStatus !== leadStatus) return false;
      if (tag !== ALL && !contact.tags.includes(tag)) return false;
      return true;
    }).sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
  }, [country, leadStatus, search, status, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((row) => row.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setStatus(ALL);
    setCountry(ALL);
    setLeadStatus(ALL);
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

  const historyFor = (contact: SmsContact) =>
    SMS_CAMPAIGNS.filter((campaign) => campaign.sent > 0).slice(
      0,
      Math.min(Math.ceil(contact.messages / 8), 5),
    );

  /* Lead statuses actually present on the list, so the filter never offers a
     stage that matches nothing. */
  const leadStatuses = [...new Set(SMS_CONTACTS.map((c) => c.leadStatus))].sort();

  return (
    <>
      <StatsGrid
        items={stats(SMS_CONTACTS)}
        accent={{ soft: theme.soft, text: theme.text }}
      />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name or phone number…"
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
              setStatus(next as SmsContactStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...SMS_CONTACT_STATUSES]}
            className="lg:w-40"
          />
          <Select
            label="Filter by country"
            size="sm"
            value={country}
            onChange={(next) => {
              setCountry(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All countries" },
              ...SMS_COUNTRIES.map((item) => ({ value: item, label: item })),
            ]}
            className="lg:w-44"
          />
          <Select
            label="Filter by lead status"
            size="sm"
            value={leadStatus}
            onChange={(next) => {
              setLeadStatus(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "Any lead status" },
              ...leadStatuses.map((item) => ({ value: item, label: item })),
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
              ...SMS_TAGS.map((item) => ({ value: item, label: item })),
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
            <p className="text-sm font-medium text-sms-dark">
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
                onClick={() => runBulk(`${selected.length} contacts opted out`)}
              >
                <UserMinus aria-hidden />
                Opt out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} numbers queued for validation`)}
              >
                <Phone aria-hidden />
                Validate
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
                : "No SMS contacts yet"
            }
            description={
              search || activeFilters
                ? "Try a different search term, or clear the filters."
                : "Import numbers in international format — a number without a country code cannot be routed, and gets billed as a failure."
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
                  <TH>Country</TH>
                  <TH>Tags</TH>
                  <TH>Lead status</TH>
                  <TH>Opt-in</TH>
                  <TH align="right">Messages</TH>
                  <TH align="right">Replies</TH>
                  <TH>Last activity</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((contact) => {
                    const isSelected = selected.includes(contact.id);
                    const name = smsContactName(contact);

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
                              secondary={contact.phone}
                              size="sm"
                            />
                          </button>
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-secondary">
                          {contact.country}
                        </TD>

                        <TD>
                          <TagList tags={contact.tags} />
                        </TD>

                        <TD className="text-xs text-text-secondary">
                          {contact.leadStatus}
                        </TD>

                        <TD>
                          <Badge tone={STATUS_TONES[contact.status]}>
                            {contact.status === "opted-out"
                              ? "Opted out"
                              : contact.status}
                          </Badge>
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(contact.messages)}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="font-medium text-text-primary">
                            {formatNumber(contact.replies)}
                          </span>
                          {contact.messages > 0 ? (
                            <span className="block text-[11px] text-text-muted">
                              {formatPercent(rate(contact.replies, contact.messages))}
                            </span>
                          ) : null}
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
                                label: "Send message",
                                icon: <MessageSquare className="size-4" />,
                                onSelect: () => toast(`Draft opened for ${name}`),
                                disabled: contact.status !== "subscribed",
                              },
                              {
                                label: "Add tag",
                                icon: <TagIcon className="size-4" />,
                                onSelect: () => toast(`Tag added to ${name}`),
                              },
                              {
                                label: "Opt out",
                                icon: <UserMinus className="size-4" />,
                                onSelect: () => toast(`${name} opted out`),
                                disabled: contact.status === "opted-out",
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
                const name = smsContactName(contact);

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
                        <AvatarLabel name={name} secondary={contact.phone} size="sm" />
                      </button>
                      <Badge tone={STATUS_TONES[contact.status]}>
                        {contact.status === "opted-out" ? "Opted out" : contact.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <TagList tags={contact.tags} />
                      <p className="shrink-0 text-[11px] text-text-muted tabular-nums">
                        {formatNumber(contact.messages)} sent ·{" "}
                        {formatNumber(contact.replies)} replies
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
        title={detail ? smsContactName(detail) : "Contact"}
        description={detail?.phone}
        footer={
          detail ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="compact"
                className="flex-1"
                onClick={() => toast(`Tag added to ${smsContactName(detail)}`)}
              >
                <TagIcon aria-hidden />
                Add tag
              </Button>
              <Button
                variant="secondary"
                size="compact"
                className="flex-1"
                onClick={() => toast("Draft opened")}
                disabled={detail.status !== "subscribed"}
              >
                <MessageSquare aria-hidden />
                Send SMS
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-5">
            <AvatarLabel
              name={smsContactName(detail)}
              secondary={`${detail.phone} · ${detail.country}`}
              size="lg"
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={STATUS_TONES[detail.status]}>
                {detail.status === "opted-out" ? "Opted out" : detail.status}
              </Badge>
              <Badge tone="neutral">{detail.leadStatus}</Badge>
            </div>

            {detail.status === "invalid" ? (
              <p className="rounded-panel border border-error/25 bg-error-soft px-3 py-2.5 text-xs text-error-text">
                This number is not routable. Messages to it are billed and never
                delivered — correct the number or delete the contact.
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Messages" value={formatNumber(detail.messages)} />
              <MiniStat label="Replies" value={formatNumber(detail.replies)} />
              <MiniStat
                label="Reply rate"
                value={
                  detail.messages === 0
                    ? "—"
                    : formatPercent(rate(detail.replies, detail.messages))
                }
              />
            </div>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Profile
              </h3>
              <dl className="mt-2 space-y-2 text-sm">
                {[
                  { label: "Phone", value: detail.phone },
                  { label: "Country", value: detail.country },
                  { label: "Lead status", value: detail.leadStatus },
                  { label: "Added", value: formatDate(detail.createdAt) },
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
              {detail.messages === 0 ? (
                <p className="mt-2 text-sm text-text-muted">
                  Nothing sent to this number yet.
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
                      <p className="mt-0.5 line-clamp-2 font-mono text-[11px] text-text-muted">
                        {campaign.message}
                      </p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {formatDate(campaign.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </Drawer>

      {/* -------------------------------------------------------- Add contact */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add contact"
        description="Numbers must be in international format."
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
            <Field label="First name" htmlFor="sms-new-first">
              <Input id="sms-new-first" placeholder="Sarah" />
            </Field>
            <Field label="Last name" htmlFor="sms-new-last">
              <Input id="sms-new-last" placeholder="Ahmed" />
            </Field>
          </div>

          <Field
            label="Phone number"
            htmlFor="sms-new-phone"
            hint="Include the country code — +880 1711 223344, not 01711 223344."
          >
            <Input id="sms-new-phone" type="tel" placeholder="+880 1711 223344" />
          </Field>

          <Field label="Lead status" htmlFor="sms-new-stage">
            <Select
              id="sms-new-stage"
              hideLabel={false}
              label="Lead status"
              value={newStage}
              onChange={setNewStage}
              options={LEAD_STAGES.map((stage) => ({
                value: stage.value,
                label: stage.label,
              }))}
            />
          </Field>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- Import */}
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import contacts"
        description="CSV with a phone column, up to 50,000 rows."
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
                toast("Import started — numbers are validated as they load");
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
              Phone is the only required column. First row is treated as headers.
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Choose a file
            </Button>
          </div>

          <div className="rounded-panel bg-sms-soft px-3.5 py-3">
            <p className="text-xs font-medium text-sms-dark">
              Numbers are validated on import
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Anything without a resolvable country code is flagged Invalid rather
              than imported as subscribed — a number you cannot route still costs
              you a segment every time you try.
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
        description="Message and reply history is removed with them."
        confirmLabel={`Delete ${selected.length === 1 ? "contact" : "contacts"}`}
      >
        <p className="text-sm text-text-secondary">
          Deleting is not the same as opting out. A deleted number can come back
          in the next import and start receiving messages again — opt them out
          instead if they asked you to stop.
        </p>
      </ConfirmDialog>
    </>
  );
}
