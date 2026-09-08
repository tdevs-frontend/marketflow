"use client";

import { useMemo, useState } from "react";
import {
  Download,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { FilterBar } from "@/components/commerce/filter-bar";
import { AGENTS } from "@/lib/marketing-fixtures";
import {
  CONTACT_STATUSES,
  CONTACT_TAGS,
  WHATSAPP_CONTACTS,
  contactName,
} from "@/lib/whatsapp-fixtures";
import { formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import type { WhatsAppContact, WhatsAppContactStatus } from "@/types/marketing";
import { MarketingStats, type MarketingStat } from "../marketing-stats";
import {
  ContactAvatar,
  ContactDetailsSheet,
  ContactFormDialog,
  ContactStatusBadge,
} from "./contact-dialogs";

const ALL = "all";
const PER_PAGE = 8;

/** "This month" is May 2026 in the fixture data. */
const MONTH_START = new Date("2026-05-01T00:00:00Z");

function stats(): MarketingStat[] {
  const active = WHATSAPP_CONTACTS.filter((item) => item.status === "active");
  const blocked = WHATSAPP_CONTACTS.filter((item) => item.status === "blocked");
  const fresh = WHATSAPP_CONTACTS.filter(
    (item) => new Date(item.createdAt) >= MONTH_START,
  );

  return [
    {
      label: "Total Contacts",
      value: formatNumber(WHATSAPP_CONTACTS.length),
      changePercent: 14.2,
      icon: Users,
      hint: "vs last month",
    },
    {
      label: "Active Contacts",
      value: formatNumber(active.length),
      changePercent: 9.6,
      icon: UserCheck,
      hint: "opted in and reachable",
    },
    {
      label: "New This Month",
      value: formatNumber(fresh.length),
      changePercent: 32.4,
      icon: UserPlus,
      hint: "added since 1 May",
    },
    {
      label: "Blocked Contacts",
      value: formatNumber(blocked.length),
      changePercent: -12.5,
      icon: UserX,
      /* A fall in blocks is the good direction. */
      invertTrend: true,
      hint: "vs last month",
    },
  ];
}

export function ContactsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string>(ALL);
  const [status, setStatus] = useState<WhatsAppContactStatus | typeof ALL>(ALL);
  const [agent, setAgent] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const [viewing, setViewing] = useState<WhatsAppContact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WhatsAppContact | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkTag, setBulkTag] = useState("");

  const activeFilters =
    (tag === ALL ? 0 : 1) + (status === ALL ? 0 : 1) + (agent === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return WHATSAPP_CONTACTS.filter((contact) => {
      if (
        term &&
        !contactName(contact).toLowerCase().includes(term) &&
        !contact.phone.includes(term) &&
        !(contact.email ?? "").toLowerCase().includes(term)
      ) {
        return false;
      }
      if (tag !== ALL && !contact.tags.includes(tag)) return false;
      if (status !== ALL && contact.status !== status) return false;
      if (agent !== ALL && (contact.assignedAgent ?? "") !== agent) return false;
      return true;
    }).sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
  }, [search, tag, status, agent]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((item) => item.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setTag(ALL);
    setStatus(ALL);
    setAgent(ALL);
    setPage(1);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function runBulk(message: string) {
    toast(message);
    setSelected([]);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const rowActions = (contact: WhatsAppContact) => [
    {
      label: "View contact",
      icon: <Users className="size-4" />,
      onSelect: () => setViewing(contact),
    },
    {
      label: "Edit contact",
      icon: <Pencil className="size-4" />,
      onSelect: () => {
        setEditing(contact);
        setFormOpen(true);
      },
    },
    {
      label: "Open conversation",
      icon: <MessageCircle className="size-4" />,
      onSelect: () => setViewing(contact),
      disabled: !contact.conversationId,
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
  ];

  return (
    <>
      {/* Header lives here — Add Contact opens a dialog. */}
      <PageHeader
        title="WhatsApp Contacts"
        description="Manage your WhatsApp contacts and customer information."
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="compact"
              onClick={() => toast("Import started — we will email you when it finishes")}
            >
              <Upload aria-hidden />
              Import
            </Button>
            <Button
              variant="outline"
              size="compact"
              onClick={() => toast(`Exporting ${filtered.length} contacts`)}
            >
              <Download aria-hidden />
              Export
            </Button>
            <Button size="compact" onClick={openCreate}>
              <Plus aria-hidden />
              Add Contact
            </Button>
          </div>
        }
      />

      <MarketingStats items={stats()} />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, phone or email…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
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
              ...CONTACT_TAGS.map((item) => ({ value: item, label: item })),
            ]}
            className="lg:w-40"
          />

          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as WhatsAppContactStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...CONTACT_STATUSES]}
            className="lg:w-38"
          />

          <Select
            label="Filter by assigned agent"
            size="sm"
            value={agent}
            onChange={(next) => {
              setAgent(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "Anyone" },
              { value: "", label: "Unassigned" },
              ...AGENTS.map((name) => ({ value: name, label: name })),
            ]}
            className="lg:w-44"
          />
        </FilterBar>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
            <p className="text-sm font-medium text-primary-dark">
              {selected.length} selected
            </p>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select
                label="Tag selected contacts"
                size="sm"
                value={bulkTag}
                onChange={(next) => {
                  setBulkTag("");
                  runBulk(`${selected.length} contacts tagged "${next}"`);
                }}
                placeholder="Add tag"
                options={CONTACT_TAGS.map((item) => ({ value: item, label: item }))}
                className="w-36"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`Exporting ${selected.length} contacts`)}
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
              activeFilters > 0 || search
                ? "No contacts match those filters"
                : "No contacts yet"
            }
            description={
              activeFilters > 0 || search
                ? "Try a different search term, or clear the filters."
                : "Import a list or add your first contact to start messaging."
            }
            action={
              activeFilters > 0 || search ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus aria-hidden />
                  Add Contact
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="mt-4 max-lg:hidden">
              <Table minWidth="78rem">
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
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH>Tags</TH>
                  <TH>Status</TH>
                  <TH>Assigned To</TH>
                  <TH>Last Activity</TH>
                  <TH>Created</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((contact) => {
                    const isSelected = selected.includes(contact.id);

                    return (
                      <TR key={contact.id} selected={isSelected}>
                        <TD className="pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(contact.id)}
                            label={`Select ${contactName(contact)}`}
                          />
                        </TD>

                        <TD>
                          <button
                            type="button"
                            onClick={() => setViewing(contact)}
                            className="flex items-center gap-3 text-left focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <ContactAvatar contact={contact} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-text-primary">
                                {contactName(contact)}
                              </span>
                              <span className="block truncate text-[11px] text-text-muted">
                                {contact.email ?? contact.phone}
                              </span>
                            </span>
                          </button>
                        </TD>

                        <TD className="whitespace-nowrap text-text-secondary">
                          {contact.phone}
                        </TD>

                        <TD className="max-w-48">
                          <p className="truncate text-text-secondary">
                            {contact.email ?? "—"}
                          </p>
                        </TD>

                        <TD>
                          <ul className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((item) => (
                              <li key={item}>
                                <Badge tone="neutral">{item}</Badge>
                              </li>
                            ))}
                            {contact.tags.length > 2 ? (
                              <li className="text-[11px] text-text-muted">
                                +{contact.tags.length - 2}
                              </li>
                            ) : null}
                          </ul>
                        </TD>

                        <TD>
                          <ContactStatusBadge status={contact.status} />
                        </TD>

                        <TD className="whitespace-nowrap text-text-secondary">
                          {contact.assignedAgent ?? (
                            <span className="text-text-muted">Unassigned</span>
                          )}
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatRelativeTime(contact.lastActivityAt)}
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(contact.createdAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            items={rowActions(contact)}
                            label={`Actions for ${contactName(contact)}`}
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
              {rows.map((contact) => (
                <li
                  key={contact.id}
                  className="rounded-panel border border-border p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.includes(contact.id)}
                      onCheckedChange={() => toggleOne(contact.id)}
                      label={`Select ${contactName(contact)}`}
                      className="mt-1"
                    />
                    <ContactAvatar contact={contact} />

                    <button
                      type="button"
                      onClick={() => setViewing(contact)}
                      className="min-w-0 flex-1 text-left focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {contactName(contact)}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {contact.phone}
                      </span>
                    </button>

                    <Menu
                      items={rowActions(contact)}
                      label={`Actions for ${contactName(contact)}`}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ContactStatusBadge status={contact.status} />
                      {contact.tags.slice(0, 2).map((item) => (
                        <Badge key={item} tone="neutral">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-[11px] text-text-muted">
                      {formatRelativeTime(contact.lastActivityAt)}
                    </span>
                  </div>
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

      <ContactDetailsSheet
        contact={viewing}
        onClose={() => setViewing(null)}
        onEdit={(contact) => {
          setViewing(null);
          setEditing(contact);
          setFormOpen(true);
        }}
      />

      <ContactFormDialog
        open={formOpen}
        contact={editing}
        onClose={() => setFormOpen(false)}
      />

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${selected.length} contact${selected.length === 1 ? "" : "s"}?`}
        description="Conversation history stays, but the contact record is removed."
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="compact"
              onClick={() => {
                const count = selected.length;
                setConfirmDelete(false);
                runBulk(`${count} contact${count === 1 ? "" : "s"} deleted`);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          They will stop receiving campaigns immediately.
        </p>
      </Dialog>
    </>
  );
}
