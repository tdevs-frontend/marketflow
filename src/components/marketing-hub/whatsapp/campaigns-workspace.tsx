"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCheck,
  Eye,
  MessageSquare,
  Pause,
  Play,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { APP_ROUTES } from "@/constants";
import {
  AUDIENCES,
  CAMPAIGNS,
  CAMPAIGN_STATUS_OPTIONS,
  rateOf,
} from "@/lib/marketing-fixtures";
import { whatsappTotals } from "@/lib/whatsapp-fixtures";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { CampaignStatus } from "@/types/marketing";
import { CampaignStatusBadge } from "../campaign-status";
import { MarketingStats, type MarketingStat } from "../marketing-stats";
import { ChannelPerformanceChart } from "../channel-performance-chart";

const ALL = "all";
const PER_PAGE = 8;

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "sent", label: "Most sent" },
  { value: "readRate", label: "Best read rate" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

/** Only WhatsApp campaigns — the unified list lives at /marketing/campaigns. */
const WHATSAPP_CAMPAIGNS = CAMPAIGNS.filter((item) => item.channel === "whatsapp");

const TOTALS = whatsappTotals(WHATSAPP_CAMPAIGNS);

const STATS: MarketingStat[] = [
  {
    label: "Messages Sent",
    value: formatNumber(TOTALS.sent),
    changePercent: 12.5,
    icon: Send,
    hint: "vs last month",
  },
  {
    label: "Delivered",
    value: formatNumber(TOTALS.delivered),
    changePercent: 9.8,
    icon: CheckCheck,
    hint: `${formatPercent(rateOf(TOTALS.delivered, TOTALS.sent))} of sent`,
  },
  {
    label: "Read",
    value: formatNumber(TOTALS.read),
    changePercent: 16.2,
    icon: Eye,
    hint: `${formatPercent(rateOf(TOTALS.read, TOTALS.delivered))} of delivered`,
  },
  {
    label: "Replies",
    value: formatNumber(TOTALS.replies),
    changePercent: 24.6,
    icon: MessageSquare,
    hint: `${formatPercent(rateOf(TOTALS.replies, TOTALS.delivered))} reply rate`,
  },
];

/**
 * The funnel as a chart: each campaign's sent → delivered → read → replies,
 * which is the shape a WhatsApp marketer reads a campaign by.
 */
const TOP_FIVE = [...WHATSAPP_CAMPAIGNS]
  .filter((item) => item.sent > 0)
  .sort((a, b) => b.sent - a.sent)
  .slice(0, 5);

const CHART_SERIES = [
  { name: "Delivered", data: TOP_FIVE.map((item) => item.delivered) },
  { name: "Read", data: TOP_FIVE.map((item) => item.opened) },
  { name: "Replies", data: TOP_FIVE.map((item) => item.replies) },
];

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

  return (
    <>
      <MarketingStats items={STATS} />

      <Card className="p-5">
        <div>
          <h2 className="text-base">Campaign Performance</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Delivered, read and replies for your five largest sends.
          </p>
        </div>

        <div className="mt-2 -ml-2.5">
          <ChannelPerformanceChart
            categories={TOP_FIVE.map((item) => item.name)}
            series={CHART_SERIES}
            height={280}
          />
        </div>
      </Card>

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

          <Input
            type="date"
            aria-label="Created from"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full lg:w-38"
          />

          <Select
            label="Sort campaigns"
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
              <Table minWidth="72rem">
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
                          <p className="max-w-56 truncate font-medium text-text-primary">
                            {campaign.name}
                          </p>
                          {campaign.description ? (
                            <p className="max-w-56 truncate text-[11px] text-text-muted">
                              {campaign.description}
                            </p>
                          ) : null}
                        </TD>

                        <TD>
                          <p className="text-text-secondary">{campaign.audienceLabel}</p>
                          <p className="text-[11px] text-text-muted">
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
                          <span className="font-medium text-text-primary">
                            {formatNumber(campaign.opened)}
                          </span>
                          {campaign.delivered > 0 ? (
                            <span className="block text-[11px] text-text-muted">
                              {formatPercent(rateOf(campaign.opened, campaign.delivered))}
                            </span>
                          ) : null}
                        </TD>

                        <TD align="right" className="text-text-secondary tabular-nums">
                          {formatNumber(campaign.replies)}
                        </TD>

                        <TD>
                          <CampaignStatusBadge status={campaign.status} />
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(campaign.createdAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            label={`Actions for ${campaign.name}`}
                            items={[
                              {
                                label: "View report",
                                icon: <Eye className="size-4" />,
                                onSelect: () => {},
                              },
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
                        <p className="text-xs text-text-muted">
                          {campaign.audienceLabel} · {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "Sent", value: campaign.sent },
                        { label: "Delivered", value: campaign.delivered },
                        { label: "Read", value: campaign.opened },
                        { label: "Replies", value: campaign.replies },
                      ].map((cell) => (
                        <div
                          key={cell.label}
                          className="rounded-panel bg-surface-secondary py-2"
                        >
                          <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                            {cell.label}
                          </dt>
                          <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
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
