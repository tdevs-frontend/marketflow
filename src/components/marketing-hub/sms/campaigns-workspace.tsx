"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCheck,
  Copy,
  DollarSign,
  Download,
  Eye,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import { SMS_CAMPAIGNS, SMS_SENDER_IDS, smsTotals } from "@/lib/sms-fixtures";
import { formatCount, formatCurrency, formatDate, formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/marketing";
import { countSmsSegments } from "@/types/sms";
import { SMS_STATUS_OPTIONS, SmsCampaignStatusBadge } from "./campaign-row";
import { SmsComposer, SmsPreview } from "./composer";

/**
 * SMS campaign management.
 *
 * The two columns this table has that no other channel needs are Parts and
 * Cost, and they sit next to each other on purpose: the segment count is
 * *why* the cost is what it is, and putting them apart would make a two-part
 * campaign look simply expensive rather than fixable.
 *
 * Compose opens a dialog rather than a page. An SMS is one field and a
 * schedule — routing that through the seven-step wizard would be ceremony.
 */

const ALL = "all";
const PER_PAGE = 8;
const theme = CHANNEL_THEME.sms;

const TOTALS = smsTotals(SMS_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Messages Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 11.4,
    icon: Send,
    hint: "across all campaigns",
  },
  {
    label: "Delivered",
    value: formatCount(TOTALS.delivered),
    changePercent: 11.8,
    icon: CheckCheck,
    hint: `${formatPercent(rate(TOTALS.delivered, TOTALS.sent))} delivery rate`,
  },
  {
    label: "Replies",
    value: formatCount(TOTALS.replies),
    changePercent: 18.6,
    icon: MessageSquare,
    hint: `${formatPercent(rate(TOTALS.replies, TOTALS.delivered))} reply rate`,
  },
  {
    label: "Total Spend",
    value: formatCurrency(TOTALS.cost),
    changePercent: 9.8,
    icon: DollarSign,
    hint: `${formatCurrency(TOTALS.cost / Math.max(TOTALS.sent, 1))} per message`,
  },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "sent", label: "Most sent" },
  { value: "cost", label: "Highest spend" },
  { value: "replyRate", label: "Best reply rate" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

export function SmsCampaignsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | typeof ALL>(ALL);
  const [audience, setAudience] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [sort, setSort] = useState<SortField>("createdAt");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [preview, setPreview] = useState<(typeof SMS_CAMPAIGNS)[number] | null>(null);

  /* Compose state. Seeded with the appointment example, which is the message
     everyone tries first and the one that shows personalisation working. */
  const [draftName, setDraftName] = useState("");
  const [draftSegment, setDraftSegment] = useState(AUDIENCES[0].value as string);
  const [draftSender, setDraftSender] = useState(SMS_SENDER_IDS[0].value);
  const [draftMessage, setDraftMessage] = useState(
    "Hi {{first_name}}, your appointment is scheduled for {{appointment_date}}.",
  );

  const recipients =
    AUDIENCES.find((item) => item.value === draftSegment)?.size ?? 0;

  const activeFilters =
    (status === ALL ? 0 : 1) + (audience === ALL ? 0 : 1) + (from ? 1 : 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return SMS_CAMPAIGNS.filter((campaign) => {
      if (
        term &&
        !campaign.name.toLowerCase().includes(term) &&
        !campaign.message.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (status !== ALL && campaign.status !== status) return false;
      if (audience !== ALL && campaign.segment !== audience) return false;
      if (from && new Date(campaign.createdAt) < new Date(from)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "sent") return b.sent - a.sent;
      if (sort === "cost") return b.cost - a.cost;
      if (sort === "replyRate") {
        return rate(b.replies, b.delivered) - rate(a.replies, a.delivered);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [audience, from, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((row) => row.id);
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

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );

  return (
    <>
      <StatsGrid items={STATS} accent={{ soft: theme.soft, text: theme.text }} />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name or message…"
          activeCount={activeFilters}
          onReset={resetFilters}
          trailing={
            <>
              <Button
                variant="outline"
                size="compact"
                onClick={() => toast(`${filtered.length} campaigns exported to CSV`)}
              >
                <Download aria-hidden />
                Export
              </Button>
              <Button size="compact" onClick={() => setComposeOpen(true)}>
                <Plus aria-hidden />
                Create Campaign
              </Button>
            </>
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
            options={[{ value: ALL, label: "All statuses" }, ...SMS_STATUS_OPTIONS]}
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
            <p className="text-sm font-medium text-sms-dark">
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
                : "No SMS campaigns yet"
            }
            description={
              activeFilters > 0 || search
                ? "Try a different search term, or clear the filters."
                : "SMS gets read within minutes, which makes it the right channel for reminders and the wrong one for newsletters."
            }
            action={
              activeFilters > 0 || search ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setComposeOpen(true)}>
                  <Plus aria-hidden />
                  Create Campaign
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="mt-4 max-lg:hidden">
              <Table minWidth="80rem">
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
                  <TH align="right">Replies</TH>
                  <TH align="center">Parts</TH>
                  <TH align="right">Cost</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((campaign) => {
                    const isSelected = selected.includes(campaign.id);
                    const sending = campaign.status === "running";
                    const { segments } = countSmsSegments(campaign.message);

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
                          <button
                            type="button"
                            onClick={() => setPreview(campaign)}
                            className="max-w-56 text-left focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <p className="truncate font-medium text-text-primary">
                              {campaign.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-text-muted">
                              {campaign.message}
                            </p>
                          </button>
                        </TD>

                        <TD>
                          <p className="text-text-secondary">{campaign.audienceLabel}</p>
                          <p className="text-[11px] text-text-muted">
                            {campaign.audienceSize === 0
                              ? "Transactional"
                              : `${formatNumber(campaign.audienceSize)} contacts`}
                          </p>
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {formatNumber(campaign.sent)}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="text-text-secondary">
                            {formatNumber(campaign.delivered)}
                          </span>
                          {campaign.sent > 0 ? (
                            <span className="block text-[11px] text-text-muted">
                              {formatPercent(rate(campaign.delivered, campaign.sent))}
                            </span>
                          ) : null}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="font-medium text-text-primary">
                            {formatNumber(campaign.replies)}
                          </span>
                          {campaign.optOuts > 0 ? (
                            <span className="block text-[11px] text-warning-text">
                              {formatNumber(campaign.optOuts)} opted out
                            </span>
                          ) : null}
                        </TD>

                        <TD align="center">
                          <Badge tone={segments > 1 ? "warning" : "neutral"}>
                            {segments}
                          </Badge>
                        </TD>

                        <TD align="right" className="font-medium text-text-primary tabular-nums">
                          {campaign.cost === 0 ? (
                            <span className="font-normal text-text-muted">—</span>
                          ) : (
                            formatCurrency(campaign.cost)
                          )}
                        </TD>

                        <TD>
                          <SmsCampaignStatusBadge status={campaign.status} />
                        </TD>

                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatDate(campaign.createdAt)}
                        </TD>

                        <TD align="right">
                          <Menu
                            label={`Actions for ${campaign.name}`}
                            items={[
                              {
                                label: "Preview message",
                                icon: <Eye className="size-4" />,
                                onSelect: () => setPreview(campaign),
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
                const { segments } = countSmsSegments(campaign.message);

                return (
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
                        <p className="line-clamp-2 font-mono text-[11px] text-text-muted">
                          {campaign.message}
                        </p>
                      </div>
                      <SmsCampaignStatusBadge status={campaign.status} />
                    </div>

                    <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "Sent", value: formatNumber(campaign.sent) },
                        { label: "Delivered", value: formatNumber(campaign.delivered) },
                        { label: "Parts", value: String(segments) },
                        {
                          label: "Cost",
                          value:
                            campaign.cost === 0 ? "—" : formatCurrency(campaign.cost),
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

      {/* ------------------------------------------------------------ Compose */}
      <Dialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Create SMS campaign"
        description="One message, one audience, one schedule."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setComposeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="compact"
              onClick={() => {
                setComposeOpen(false);
                toast(`${draftName || "Untitled campaign"} saved as a draft`);
              }}
            >
              Save draft
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setComposeOpen(false);
                toast(
                  `${draftName || "Campaign"} scheduled for ${formatNumber(recipients)} recipients`,
                );
              }}
            >
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign name" htmlFor="sms-name">
              <Input
                id="sms-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="September Appointment Reminders"
              />
            </Field>

            <Field
              label="Sender ID"
              htmlFor="sms-sender"
              hint="Alphanumeric senders cannot receive replies."
            >
              <Select
                id="sms-sender"
                hideLabel={false}
                label="Sender ID"
                value={draftSender}
                onChange={setDraftSender}
                options={SMS_SENDER_IDS}
              />
            </Field>
          </div>

          <Field
            label="Audience"
            htmlFor="sms-audience"
            hint={`${formatNumber(recipients)} contacts will receive this.`}
          >
            <Select
              id="sms-audience"
              hideLabel={false}
              label="Audience"
              value={draftSegment}
              onChange={setDraftSegment}
              options={AUDIENCES.map((item) => ({
                value: item.value,
                label: item.label,
                hint: `${formatNumber(item.size)} contacts · ${item.hint}`,
              }))}
            />
          </Field>

          <SmsComposer
            value={draftMessage}
            onChange={setDraftMessage}
            recipients={recipients}
          />

          <div>
            <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Preview
            </p>
            <SmsPreview
              message={draftMessage}
              senderId={draftSender}
              className="mt-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Send date" htmlFor="sms-date">
              <Input id="sms-date" type="date" />
            </Field>
            <Field label="Send time" htmlFor="sms-time">
              <Input id="sms-time" type="time" defaultValue="09:00" />
            </Field>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------ Preview */}
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Message"}
        description={preview ? `Sent from ${preview.senderId}` : undefined}
        footer={
          <Button variant="outline" size="compact" onClick={() => setPreview(null)}>
            Close
          </Button>
        }
      >
        {preview ? (
          <div className="space-y-4">
            <SmsPreview message={preview.message} senderId={preview.senderId} />

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Audience", value: preview.audienceLabel },
                {
                  label: "Segments per message",
                  value: String(countSmsSegments(preview.message).segments),
                },
                { label: "Sent", value: formatNumber(preview.sent) },
                {
                  label: "Delivery rate",
                  value:
                    preview.sent === 0
                      ? "—"
                      : formatPercent(rate(preview.delivered, preview.sent)),
                },
                {
                  label: "Replies",
                  value: `${formatNumber(preview.replies)}`,
                },
                {
                  label: "Total cost",
                  value: preview.cost === 0 ? "—" : formatCurrency(preview.cost),
                },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-text-muted">{row.label}</dt>
                  <dd className="font-medium text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          const count = selected.length;
          runBulk(`${count} campaign${count === 1 ? "" : "s"} deleted`);
        }}
        title={`Delete ${selected.length} campaign${selected.length === 1 ? "" : "s"}?`}
        description="Delivery receipts and reply history go too."
        confirmLabel={`Delete ${selected.length === 1 ? "campaign" : "campaigns"}`}
      >
        <p className="text-sm text-text-secondary">
          Campaigns still sending stop immediately, but messages already handed to
          the gateway are billed whether or not this campaign still exists.
        </p>
      </ConfirmDialog>
    </>
  );
}
