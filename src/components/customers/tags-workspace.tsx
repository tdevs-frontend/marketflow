"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Hash,
  Merge,
  Pencil,
  Tag as TagIcon,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Menu } from "@/components/ui/menu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  CONTACTS,
  CUSTOMER_TAGS,
  LEADS,
  contactName,
  type CustomerTag,
} from "@/lib/customer-fixtures";
import { formatDate, formatNumber, formatRelativeTime } from "@/lib/format";
import { DrawerFact, DrawerSection } from "./activity-timeline";
import { TagBadge, TagDot } from "./customer-badges";
import { TagFormDialog } from "./tag-dialogs";

/** How many contacts and leads actually carry a tag, counted from the data. */
const usage = (tag: CustomerTag) => ({
  contacts: CONTACTS.filter((item) => item.tags.includes(tag.name)).length,
  leads: LEADS.filter((item) => item.tags.includes(tag.name)).length,
});

const dependants = (tag: CustomerTag) =>
  tag.usedBySegments + tag.usedByAutomations + tag.usedByCampaigns;

/** "1 segment", "3 segments" — a count is read too often here to get wrong. */
const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/** The dependants of a tag as one readable line, empty parts dropped. */
const dependantSummary = (tag: CustomerTag) =>
  [
    tag.usedBySegments ? plural(tag.usedBySegments, "segment") : null,
    tag.usedByAutomations ? plural(tag.usedByAutomations, "automation") : null,
    tag.usedByCampaigns ? plural(tag.usedByCampaigns, "campaign") : null,
  ]
    .filter(Boolean)
    .join(" · ");

function kpis(): Kpi[] {
  const tagged = CONTACTS.filter((item) => item.tags.length > 0);
  const counts = CUSTOMER_TAGS.map((tag) => ({ tag, ...usage(tag) }));
  const most = [...counts].sort((a, b) => b.contacts - a.contacts)[0];
  const unused = counts.filter(
    (item) => item.contacts === 0 && item.leads === 0,
  );

  return [
    {
      label: "Total Tags",
      value: formatNumber(CUSTOMER_TAGS.length),
      icon: TagIcon,
    },
    {
      label: "Tagged Contacts",
      value: formatNumber(tagged.length),
      icon: Users,
      tone: "brand",
      hint: `of ${CONTACTS.length} contacts`,
    },
    {
      label: "Most Used",
      value: most?.tag.name ?? "—",
      icon: TrendingUp,
      tone: "success",
      hint: most ? `${most.contacts} contacts` : undefined,
    },
    {
      label: "Unused Tags",
      value: formatNumber(unused.length),
      icon: Hash,
      tone: unused.length ? "warning" : "neutral",
      hint: unused.length ? "Safe to delete" : "Every tag is in use",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Detail drawer                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One tag, and everything that depends on it.
 *
 * The dependant counts are the point of this drawer: a tag looks disposable
 * until you see that three automations branch on it. Rename is safe, delete is
 * not, and the drawer is where that difference is made visible before the
 * confirm dialog has to argue it.
 */
function TagDrawer({
  tag,
  onClose,
  onEdit,
  onDelete,
}: {
  tag: CustomerTag | null;
  onClose: () => void;
  onEdit: (tag: CustomerTag) => void;
  onDelete: (tag: CustomerTag) => void;
}) {
  const toast = useToast();
  const counts = tag ? usage(tag) : { contacts: 0, leads: 0 };
  const holders = tag
    ? CONTACTS.filter((item) => item.tags.includes(tag.name)).slice(0, 8)
    : [];

  return (
    <Drawer
      open={Boolean(tag)}
      onClose={onClose}
      title={tag?.name ?? "Tag"}
      description={tag?.description ?? undefined}
      footer={
        tag ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onEdit(tag)}>
              <Pencil className="size-4" />
              Rename
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast("Merge arrives with the API", "info")}
            >
              <Merge className="size-4" />
              Merge
            </Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(tag)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        ) : null
      }
    >
      {tag ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <TagDot color={tag.color} className="size-3" />
            <TagBadge name={tag.name} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel bg-surface-secondary p-3.5">
            <DrawerFact
              label="Contacts"
              value={formatNumber(counts.contacts)}
              strong
            />
            <DrawerFact
              label="Leads"
              value={formatNumber(counts.leads)}
              strong
            />
            <DrawerFact label="Created" value={formatDate(tag.createdAt)} />
            <DrawerFact
              label="Last used"
              value={
                tag.lastUsedAt ? formatRelativeTime(tag.lastUsedAt) : "Never"
              }
            />
          </dl>

          <DrawerSection title="Used by">
            {dependants(tag) === 0 ? (
              <p className="text-xs text-text-muted">
                Nothing depends on this tag — it is safe to delete.
              </p>
            ) : (
              <p className="text-[13px] text-text-secondary">
                {dependantSummary(tag)}
              </p>
            )}
          </DrawerSection>

          <DrawerSection title="Contacts with this tag">
            {holders.length === 0 ? (
              <p className="text-xs text-text-muted">
                No contacts carry this tag yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {holders.map((item) => (
                  <li
                    key={item.id}
                    className="truncate text-[13px] text-text-secondary"
                  >
                    {contactName(item)}
                    {item.company ? (
                      <span className="text-text-muted"> · {item.company}</span>
                    ) : null}
                  </li>
                ))}
                {counts.contacts > holders.length ? (
                  <li className="text-[11px] text-text-muted">
                    +{counts.contacts - holders.length} more
                  </li>
                ) : null}
              </ul>
            )}
          </DrawerSection>
        </div>
      ) : null}
    </Drawer>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Tag management: light on purpose.
 *
 * Tags are metadata, so this page is a table and two dialogs rather than a
 * workspace with its own layout. The one piece of real product thinking is the
 * delete path — it counts dependants first and says what will break, because a
 * tag that three automations branch on is not a label, it is a rule.
 */
export function TagsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<CustomerTag | null>(null);
  const [editing, setEditing] = useState<CustomerTag | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CustomerTag | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return CUSTOMER_TAGS;

    return CUSTOMER_TAGS.filter((tag) =>
      `${tag.name} ${tag.description ?? ""}`.toLowerCase().includes(term),
    );
  }, [search]);

  const rowActions = (tag: CustomerTag) => [
    {
      label: "Edit tag",
      icon: <Pencil className="size-4" />,
      onSelect: () => setEditing(tag),
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => toast(`${tag.name} duplicated`, "success"),
    },
    {
      label: "Merge into…",
      icon: <Merge className="size-4" />,
      onSelect: () => toast("Merge arrives with the API", "info"),
    },
    {
      label: "Delete tag",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setConfirmDelete(tag),
      destructive: true,
    },
  ];

  const blocked = confirmDelete ? dependants(confirmDelete) : 0;

  return (
    <>
      <PageHeader
        title="Tags"
        description="Organize contacts and leads with reusable labels."
        action={
          <Button onClick={() => setCreating(true)}>
            <TagIcon className="size-4" />
            Create tag
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <Card className="mt-4 p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search tags…"
        />

        {filtered.length === 0 ? (
          search ? (
            <EmptyState
              title="No tags match that search"
              description="Try a different word, or create a tag with this name."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  Create tag
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Organize your customers"
              description="Create labels to categorize contacts and leads."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <TagIcon className="size-4" />
                  Create tag
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="mt-4 max-md:hidden">
              <Table minWidth="52rem">
                <THead>
                  <TH>Tag</TH>
                  <TH align="right">Contacts</TH>
                  <TH align="right">Leads</TH>
                  <TH>Used by</TH>
                  <TH>Created</TH>
                  <TH>Last used</TH>
                  <TH align="right" />
                </THead>

                <TBody>
                  {filtered.map((tag) => {
                    const counts = usage(tag);

                    return (
                      <TR key={tag.id}>
                        <TD>
                          <button
                            type="button"
                            onClick={() => setActive(tag)}
                            className="flex items-center gap-2.5 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <TagDot color={tag.color} />
                            <span className="min-w-0">
                              <span className="block text-[13px] font-medium text-text-primary">
                                {tag.name}
                              </span>
                              {tag.description ? (
                                <span className="block max-w-64 truncate text-xs text-text-muted">
                                  {tag.description}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </TD>

                        <TD
                          align="right"
                          className="text-xs text-text-secondary tabular-nums"
                        >
                          {formatNumber(counts.contacts)}
                        </TD>

                        <TD
                          align="right"
                          className="text-xs text-text-secondary tabular-nums"
                        >
                          {formatNumber(counts.leads)}
                        </TD>

                        <TD className="text-xs text-text-muted">
                          {dependants(tag) === 0 ? "—" : dependantSummary(tag)}
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(tag.createdAt)}
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {tag.lastUsedAt
                            ? formatRelativeTime(tag.lastUsedAt)
                            : "Never"}
                        </TD>

                        <TD align="right">
                          <Menu
                            items={rowActions(tag)}
                            label={`Actions for ${tag.name}`}
                          />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            <ul className="mt-4 space-y-2.5 md:hidden">
              {filtered.map((tag) => {
                const counts = usage(tag);

                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      onClick={() => setActive(tag)}
                      className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <TagDot color={tag.color} />
                        <span className="text-[13px] font-medium text-text-primary">
                          {tag.name}
                        </span>
                        <span className="ml-auto text-[11px] text-text-muted">
                          {tag.lastUsedAt
                            ? formatRelativeTime(tag.lastUsedAt)
                            : "Never used"}
                        </span>
                      </div>

                      {tag.description ? (
                        <p className="mt-1.5 text-xs text-text-secondary">
                          {tag.description}
                        </p>
                      ) : null}

                      <p className="mt-2 text-[11px] text-text-muted">
                        {formatNumber(counts.contacts)} contacts ·{" "}
                        {formatNumber(counts.leads)} leads
                        {dependants(tag)
                          ? ` · ${dependants(tag)} dependants`
                          : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <TagDrawer
        tag={active}
        onClose={() => setActive(null)}
        onEdit={(tag) => {
          setActive(null);
          setEditing(tag);
        }}
        onDelete={(tag) => {
          setActive(null);
          setConfirmDelete(tag);
        }}
      />

      <TagFormDialog
        open={creating || Boolean(editing)}
        tag={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={(name) => {
          const wasEditing = Boolean(editing);
          setCreating(false);
          setEditing(null);
          toast(`${name} ${wasEditing ? "updated" : "created"}`, "success");
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          const name = confirmDelete?.name;
          setConfirmDelete(null);
          toast(`${name} deleted`, "success");
        }}
        title={`Delete ${confirmDelete?.name ?? "tag"}?`}
        description={
          blocked
            ? "Other things in your workspace depend on this tag."
            : "It will be removed from every contact and lead that carries it."
        }
        confirmLabel="Delete tag"
        tone="danger"
      >
        {confirmDelete ? (
          <div className="space-y-2 text-[13px] text-text-secondary">
            <p>
              Removing it from{" "}
              <span className="font-medium text-text-primary">
                {formatNumber(usage(confirmDelete).contacts)} contacts
              </span>{" "}
              and{" "}
              <span className="font-medium text-text-primary">
                {formatNumber(usage(confirmDelete).leads)} leads
              </span>
              .
            </p>

            {blocked ? (
              /* The whole reason this dialog takes children: a tag with
                 dependants breaks rules elsewhere, and the reader has to see
                 which before they confirm. */
              <div className="rounded-panel bg-warning-soft px-3 py-2.5">
                <p className="font-medium text-warning-text">
                  {plural(blocked, "thing")} branch on this tag
                </p>
                <ul className="mt-1 space-y-0.5 text-warning-text">
                  {confirmDelete.usedBySegments ? (
                    <li>
                      {plural(confirmDelete.usedBySegments, "segment")} will
                      lose a rule
                    </li>
                  ) : null}
                  {confirmDelete.usedByAutomations ? (
                    <li>
                      {plural(confirmDelete.usedByAutomations, "automation")}{" "}
                      will stop matching
                    </li>
                  ) : null}
                  {confirmDelete.usedByCampaigns ? (
                    <li>
                      {plural(confirmDelete.usedByCampaigns, "campaign")}{" "}
                      reference it
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
