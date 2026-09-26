"use client";

import { useMemo, useState } from "react";
import { Archive, Pause, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TABLE_PAGE_SIZE } from "@/constants/app";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/commerce/filter-bar";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/constants";
import {
  AUDIENCES,
  CAMPAIGNS,
  CAMPAIGN_STATUS_OPTIONS,
  rateOf,
} from "@/lib/marketing-fixtures";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { CampaignStatus } from "@/types/marketing";
import { CampaignStatusBadge } from "../campaign-status";

const ALL = "all";
/* The dashboard-wide row count. */
const PER_PAGE = TABLE_PAGE_SIZE;

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "sent", label: "Most sent" },
  { value: "readRate", label: "Best read rate" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

/** Only WhatsApp campaigns - the unified list lives at /marketing/campaigns. */
const WHATSAPP_CAMPAIGNS = CAMPAIGNS.filter((item) => item.channel === "whatsapp");

export function WhatsAppCampaignsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | typeof ALL>(ALL);
  const [audience, setAudience] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [sort, setSort] = useState<SortField>("createdAt");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeFilters =
    (status === ALL ? 0 : 1) + (audience === ALL ? 0 : 1) + (from ? 1 : 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = WHATSAPP_CAMPAIGNS.filter((campaign) => {
      if (term && !campaign.name.toLowerCase().includes(term)) return false;
      if (status !== ALL && campaign.status !== status) return false;
      if (audience !== ALL && campaign.segment !== audience) return false;
      if (from && new Date(campaign.createdAt) < new Date(from)) return false;
      return true;
    });

    return rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "sent") return b.sent - a.sent;
      if (sort === "readRate") {
        return rateOf(b.opened, b.delivered) - rateOf(a.opened, a.delivered);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [search, status, audience, from, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((item) => item.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setStatus(ALL);
    setAudience(ALL);
    setFrom("");
    setPage(1);
  }

  function runBulk(message: string) {
    toast(message);
    setSelected([]);
  }

  /*
   * The list, and nothing above it.
   *
   * This page carried a four-card stat row and a "Campaign Performance" bar
   * chart. Both were readings of the whole channel rather than of any campaign
   * in the table, both were computed from the same `whatsappTotals()` call the
   * Analytics KPIs use, and the chart plotted the five largest sends - which is
   * Analytics' "Campaign Comparison" with a different sort. A list page's job
   * is the list; the per-campaign delivery figures now live in the row they
   * belong to, including the failure count, which none of the removed cards
   * ever showed.
   */
  return (
    <>
      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search campaigns…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as CampaignStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...CAMPAIGN_STATUS_OPTIONS]}
            className="lg:w-38"
          />

          <Select
            label="Filter by audience"
            size="sm"
            value={audience}
            onChange={(next) => {
              setAudience(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All audiences" },
              ...AUDIENCES.map((item) => ({ value: item.value, label: item.label })),
            ]}
            className="lg:w-44"
          />

          <Input size="sm"
            type="date"
            aria-label="Created from"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="w-full lg:w-38"
          />

          <Select
            label="Sort campaigns"
            size="sm"
            value={sort}
            onChange={(next) => setSort(next as SortField)}
            options={[...SORT_OPTIONS]}
            className="lg:w-44"
          />
        </FilterBar>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
            <p className="text-sm font-medium text-primary-dark">
              {selected.length} selected
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} campaigns paused`)}
              >
                <Pause aria-hidden />
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} campaigns resumed`)}
              >
                <Play aria-hidden />
                Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} campaigns archived`)}
              >
                <Archive aria-hidden />
                Archive
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
                ? "No campaigns match those filters"
                : "No WhatsApp campaigns yet"
            }
            description={
              activeFilters > 0 || search
                ? "Try a different search term, or clear the filters."
                : "Create your first campaign to start reaching your audience."
            }
            action={
              activeFilters > 0 || search ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <ButtonLink href={APP_ROUTES.marketingCampaignNew} size="sm">
                  Create Campaign
                </ButtonLink>
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
                      label="Select all campaigns on this page"
                    />
                  </TH>
                  <TH>Campaign</TH>
                  <TH>Audience</TH>
                  <TH align="right">Sent</TH>
                  <TH align="right">Delivered</TH>
                  <TH align="right">Read</TH>
                  <TH align="right">Replies</TH>
                  <TH align="right">Failed</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((campaign) => {
                    const isSelected = selected.includes(campaign.id);
                    const running = campaign.status === "running";

                    return (
                      <TR key={campaign.id} selected={isSelected}>
                        <TD className="pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              setSelected((prev) =>
                                prev.includes(campaign.id)
                                  ? prev.filter((value) => value !== campaign.id)
                                  : [...prev, campaign.id],
                              )
                            }
                            label={`Select ${campaign.name}`}
                          />
                        </TD>

                        <TD>
                          <p className="max-w-56 truncate font-semibold text-text-primary">
                            {campaign.name}
                          </p>
                          {campaign.description ? (
                            <p className="max-w-56 truncate text-sm text-text-muted">
                              {campaign.description}
                            </p>
                          ) : null}
                        </TD>

                        <TD>
                          <p className="text-text-secondary">{campaign.audienceLabel}</p>
                          <p className="text-sm text-text-muted">
                            {formatNumber(campaign.audienceSize)} contacts
                          </p>
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {formatNumber(campaign.sent)}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(campaign.delivered)}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="font-semibold text-text-primary">
                            {formatNumber(campaign.opened)}
                          </span>
                          {campaign.delivered > 0 ? (
                            <span className="block text-sm text-text-muted">
                              {formatPercent(rateOf(campaign.opened, campaign.delivered))}
                            </span>
                          ) : null}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(campaign.replies)}
                        </TD>

                        {/* The only column where a number above zero is the
                            problem, so it is the only one that takes the error
                            ink - a zero stays muted rather than shouting that
                            nothing went wrong. */}
                        <TD align="right" className="tabular-nums">
                          {campaign.failed > 0 ? (
                            <span className="font-semibold text-error">
                              {formatNumber(campaign.failed)}
                            </span>
                          ) : (
                            <span className="text-text-muted">0</span>
                          )}
                        </TD>

                        <TD>
                          <CampaignStatusBadge status={campaign.status} />
                        </TD>

                        <TD className="whitespace-nowrap text-text-muted">
                          {formatDate(campaign.createdAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            label={`Actions for ${campaign.name}`}
                            items={[
                              {
                                label: running ? "Pause campaign" : "Resume campaign",
                                icon: running ? (
                                  <Pause className="size-4" />
                                ) : (
                                  <Play className="size-4" />
                                ),
                                onSelect: () =>
                                  toast(
                                    running
                                      ? `${campaign.name} paused`
                                      : `${campaign.name} resumed`,
                                  ),
                                disabled: !["running", "paused", "scheduled"].includes(
                                  campaign.status,
                                ),
                              },
                              {
                                label: "Archive",
                                icon: <Archive className="size-4" />,
                                onSelect: () => toast(`${campaign.name} archived`),
                              },
                              {
                                label: "Delete",
                                icon: <Trash2 className="size-4" />,
                                onSelect: () => {
                                  setSelected([campaign.id]);
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
              {rows.map((campaign) => {
                const isSelected = selected.includes(campaign.id);

                return (
                  <li
                    key={campaign.id}
                    className="rounded-panel border border-border p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          setSelected((prev) =>
                            prev.includes(campaign.id)
                              ? prev.filter((value) => value !== campaign.id)
                              : [...prev, campaign.id],
                          )
                        }
                        label={`Select ${campaign.name}`}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {campaign.name}
                        </p>
                        <p className="text-sm text-text-muted">
                          {campaign.audienceLabel} · {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    {/* Five cells rather than the desktop table's ten columns,
                        but the same five figures - a merchant checking a send on
                        a phone should not have to take the failure count on
                        trust. Labels drop to the metadata step to buy the width
                        the fifth cell costs. */}
                    <dl className="mt-3 grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { label: "Sent", value: campaign.sent, failed: false },
                        { label: "Delivered", value: campaign.delivered, failed: false },
                        { label: "Read", value: campaign.opened, failed: false },
                        { label: "Replies", value: campaign.replies, failed: false },
                        { label: "Failed", value: campaign.failed, failed: true },
                      ].map((cell) => (
                        <div
                          key={cell.label}
                          className="rounded-panel bg-surface-secondary px-1 py-2"
                        >
                          <dt className="text-meta font-medium text-text-muted">
                            {cell.label}
                          </dt>
                          <dd
                            className={cn(
                              "mt-0.5 text-sm font-bold tabular-nums",
                              cell.failed && cell.value > 0
                                ? "text-error"
                                : "text-text-primary",
                            )}
                          >
                            {formatNumber(cell.value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
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
                noun="campaigns"
              />
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${selected.length} campaign${selected.length === 1 ? "" : "s"}?`}
        description="Reports and message history go too. This cannot be undone."
        footer={
          <>
            <Button
              variant="cancel"
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
                runBulk(`${count} campaign${count === 1 ? "" : "s"} deleted`);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Running campaigns stop immediately. Messages already delivered are not
          recalled.
        </p>
      </Dialog>
    </>
  );
}
