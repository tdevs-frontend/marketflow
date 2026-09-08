"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Copy,
  Download,
  Eye,
  FileText,
  MousePointerClick,
  Pause,
  Play,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChartCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { ProgressBar } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { channelPair } from "@/components/dashboard/charts/chart-theme";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import {
  EMAIL_CAMPAIGNS,
  SENDER_IDENTITIES,
  emailTotals,
} from "@/lib/email-fixtures";
import { formatCount, formatDate, formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/marketing";
import { EMAIL_STATUS_OPTIONS, EmailCampaignStatusBadge } from "./campaign-row";

/**
 * Email campaign management.
 *
 * The table leads with the subject line under the campaign name, because on
 * this channel the subject *is* the campaign as far as results go — two sends
 * of the same template with different subjects are the comparison people
 * actually make. Open and click render as rate plus bar rather than raw
 * counts: nobody compares 7,046 against 2,874 in their head, but two bars
 * settle it instantly.
 */

const ALL = "all";
const PER_PAGE = 8;
const theme = CHANNEL_THEME.email;

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "sent", label: "Most sent" },
  { value: "openRate", label: "Best open rate" },
  { value: "clickRate", label: "Best click rate" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

const TOTALS = emailTotals(EMAIL_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Emails Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 14.2,
    icon: Send,
    hint: "across all campaigns",
  },
  {
    label: "Open Rate",
    value: formatPercent(rate(TOTALS.opened, TOTALS.delivered)),
    changePercent: 3.8,
    icon: FileText,
    hint: `${formatNumber(TOTALS.opened)} opens`,
  },
  {
    label: "Click Rate",
    value: formatPercent(rate(TOTALS.clicked, TOTALS.delivered)),
    changePercent: 6.2,
    icon: MousePointerClick,
    hint: `${formatNumber(TOTALS.clicked)} clicks`,
  },
  {
    label: "Bounce Rate",
    value: formatPercent(rate(TOTALS.bounced, TOTALS.sent)),
    changePercent: -1.4,
    icon: Undo2,
    hint: `${formatNumber(TOTALS.bounced)} bounced`,
    invertTrend: true,
  },
];

/** The five biggest sends, for the comparison chart. */
const TOP_FIVE = [...EMAIL_CAMPAIGNS]
  .filter((campaign) => campaign.delivered > 0)
  .sort((a, b) => b.sent - a.sent)
  .slice(0, 5);

export function EmailCampaignsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | typeof ALL>(ALL);
  const [audience, setAudience] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  /* Sending identity. Reputation and deliverability are per-identity, so
     comparing them is a real question — not just another way to slice. */
  const [sender, setSender] = useState<string>(ALL);
  const [sort, setSort] = useState<SortField>("createdAt");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeFilters =
    (status === ALL ? 0 : 1) +
    (audience === ALL ? 0 : 1) +
    (sender === ALL ? 0 : 1) +
    (from ? 1 : 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = EMAIL_CAMPAIGNS.filter((campaign) => {
      /* Subject is searched too — half the time that is what someone
         remembers about a campaign, not its internal name. */
      if (
        term &&
        !campaign.name.toLowerCase().includes(term) &&
        !campaign.subject.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (status !== ALL && campaign.status !== status) return false;
      if (audience !== ALL && campaign.segment !== audience) return false;
      if (sender !== ALL && campaign.fromEmail !== sender) return false;
      if (from && new Date(campaign.createdAt) < new Date(from)) return false;
      return true;
    });

    return rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "sent") return b.sent - a.sent;
      if (sort === "openRate") {
        return rate(b.opened, b.delivered) - rate(a.opened, a.delivered);
      }
      if (sort === "clickRate") {
        return rate(b.clicked, b.delivered) - rate(a.clicked, a.delivered);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [audience, from, search, sender, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((item) => item.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setStatus(ALL);
    setAudience(ALL);
    setSender(ALL);
    setFrom("");
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

  return (
    <>
      <StatsGrid items={STATS} accent={{ soft: theme.soft, text: theme.text }} />

      <ChartCard
        title="Campaign Comparison"
        description="Open and click rate for the five largest sends."
        legend={[
          { label: "Open rate", swatch: "bg-email" },
          { label: "Click rate", swatch: "bg-accent" },
        ]}
      >
        <BarsChart
          categories={TOP_FIVE.map((campaign) => campaign.name)}
          series={[
            {
              name: "Open rate",
              data: TOP_FIVE.map((c) => Number(rate(c.opened, c.delivered).toFixed(1))),
            },
            {
              name: "Click rate",
              data: TOP_FIVE.map((c) => Number(rate(c.clicked, c.delivered).toFixed(1))),
            },
          ]}
          colors={channelPair("email")}
          horizontal
          height={280}
          unit="%"
        />
      </ChartCard>

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name or subject…"
          activeCount={activeFilters}
          onReset={resetFilters}
          trailing={
            <Button
              variant="outline"
              size="compact"
              onClick={() => toast(`${filtered.length} campaigns exported to CSV`)}
            >
              <Download aria-hidden />
              Export
            </Button>
          }
        >
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as CampaignStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...EMAIL_STATUS_OPTIONS]}
            className="lg:w-36"
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
            className="lg:w-40"
          />

          <Select
            label="Filter by sender"
            size="sm"
            value={sender}
            onChange={(next) => {
              setSender(next);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All senders" },
              ...SENDER_IDENTITIES.map((item) => ({
                value: item.value,
                label: item.value,
                hint: item.label.split(" · ")[0],
              })),
            ]}
            className="lg:w-48"
          />

          <Input
            type="date"
            aria-label="Created from"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full lg:w-36"
          />

          <Select
            label="Sort campaigns"
            size="sm"
            value={sort}
            onChange={(next) => setSort(next as SortField)}
            options={[...SORT_OPTIONS]}
            className="lg:w-40"
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
            <p className={cn("text-sm font-medium", "text-email-dark")}>
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
                onClick={() => runBulk(`${selected.length} campaigns duplicated`)}
              >
                <Copy aria-hidden />
                Duplicate
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
                : "No email campaigns yet"
            }
            description={
              activeFilters > 0 || search
                ? "Try a different search term, or clear the filters."
                : "Start from a template — the library has nine, from welcome sequences to win-backs."
            }
            action={
              activeFilters > 0 || search ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <ButtonLink href={APP_ROUTES.emailTemplates} size="sm">
                  Browse templates
                </ButtonLink>
              )
            }
          />
        ) : (
          <>
            {/* Desktop */}
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
                      label="Select all campaigns on this page"
                    />
                  </TH>
                  <TH>Campaign</TH>
                  <TH>Audience</TH>
                  <TH align="right">Sent</TH>
                  <TH align="right">Delivered</TH>
                  <TH>Open rate</TH>
                  <TH>Click rate</TH>
                  <TH>Status</TH>
                  <TH>Date</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((campaign) => {
                    const isSelected = selected.includes(campaign.id);
                    const sending = campaign.status === "running";
                    const openRate = rate(campaign.opened, campaign.delivered);
                    const clickRate = rate(campaign.clicked, campaign.delivered);

                    return (
                      <TR key={campaign.id} selected={isSelected}>
                        <TD className="pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggle(campaign.id)}
                            label={`Select ${campaign.name}`}
                          />
                        </TD>

                        <TD>
                          <p className="max-w-56 truncate font-medium text-text-primary">
                            {campaign.name}
                          </p>
                          <p className="max-w-56 truncate text-[11px] text-text-muted">
                            {campaign.subject}
                          </p>
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
                          {campaign.bounced > 0 ? (
                            <span className="block text-[11px] text-error">
                              {formatNumber(campaign.bounced)} bounced
                            </span>
                          ) : null}
                        </TD>

                        <TD className="w-28">
                          {campaign.delivered === 0 ? (
                            <span className="text-text-muted">—</span>
                          ) : (
                            <>
                              <p className="text-xs font-medium text-text-primary tabular-nums">
                                {formatPercent(openRate)}
                              </p>
                              <ProgressBar
                                value={openRate}
                                label={`${campaign.name} open rate`}
                                tone="bg-email"
                                size="sm"
                                className="mt-1.5"
                              />
                            </>
                          )}
                        </TD>

                        <TD className="w-28">
                          {campaign.delivered === 0 ? (
                            <span className="text-text-muted">—</span>
                          ) : (
                            <>
                              <p className="text-xs font-medium text-text-primary tabular-nums">
                                {formatPercent(clickRate)}
                              </p>
                              <ProgressBar
                                value={clickRate}
                                label={`${campaign.name} click rate`}
                                tone="bg-accent"
                                size="sm"
                                className="mt-1.5"
                              />
                            </>
                          )}
                        </TD>

                        <TD>
                          <EmailCampaignStatusBadge status={campaign.status} />
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(campaign.scheduledAt ?? campaign.createdAt)}
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
                                label: sending ? "Pause sending" : "Resume sending",
                                icon: sending ? (
                                  <Pause className="size-4" />
                                ) : (
                                  <Play className="size-4" />
                                ),
                                onSelect: () =>
                                  toast(
                                    sending
                                      ? `${campaign.name} paused`
                                      : `${campaign.name} resumed`,
                                  ),
                                disabled: !["running", "paused", "scheduled"].includes(
                                  campaign.status,
                                ),
                              },
                              {
                                label: "Duplicate",
                                icon: <Copy className="size-4" />,
                                onSelect: () => toast(`${campaign.name} duplicated`),
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
              {rows.map((campaign) => (
                <li
                  key={campaign.id}
                  className="rounded-panel border border-border p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.includes(campaign.id)}
                      onCheckedChange={() => toggle(campaign.id)}
                      label={`Select ${campaign.name}`}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {campaign.name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {campaign.subject}
                      </p>
                    </div>
                    <EmailCampaignStatusBadge status={campaign.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Sent", value: formatNumber(campaign.sent) },
                      {
                        label: "Open",
                        value:
                          campaign.delivered === 0
                            ? "—"
                            : formatPercent(rate(campaign.opened, campaign.delivered)),
                      },
                      {
                        label: "Click",
                        value:
                          campaign.delivered === 0
                            ? "—"
                            : formatPercent(rate(campaign.clicked, campaign.delivered)),
                      },
                      {
                        label: "Bounce",
                        value:
                          campaign.sent === 0
                            ? "—"
                            : formatPercent(rate(campaign.bounced, campaign.sent)),
                      },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-panel bg-surface-secondary py-2"
                      >
                        <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                          {cell.label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
                          {cell.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
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
                noun="campaigns"
              />
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          const count = selected.length;
          runBulk(`${count} campaign${count === 1 ? "" : "s"} deleted`);
        }}
        title={`Delete ${selected.length} campaign${selected.length === 1 ? "" : "s"}?`}
        description="Reports and open history go too."
        confirmLabel={`Delete ${selected.length === 1 ? "campaign" : "campaigns"}`}
      >
        <p className="text-sm text-text-secondary">
          Campaigns still sending stop immediately. Emails already delivered
          cannot be recalled, and their opens stop being counted anywhere.
        </p>
      </ConfirmDialog>
    </>
  );
}
