"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  CalendarClock,
  Copy,
  Download,
  Eye,
  Pause,
  Play,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TABLE_PAGE_SIZE } from "@/constants/app";
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
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import {
  SMS_CAMPAIGNS,
  SMS_RATE_PER_SEGMENT,
  SMS_SENDERS,
  SMS_SENDER_IDS,
  SMS_SUBSTITUTIONS,
} from "@/lib/sms-fixtures";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  rate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types/marketing";
import { canReceiveReplies, countSmsSegments } from "@/types/sms";
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
 * No KPI row. This page used to open on Messages Sent, Delivered, Replies and
 * Total Spend - the same four figures, from the same totals, that the module
 * Overview shows one click away. A number that appears twice is a number that
 * can disagree with itself, and neither copy is the one anyone came here for:
 * this is where campaigns are found, filtered and started, and the table is
 * the page.
 *
 * Compose opens a dialog rather than a page. An SMS is one message and a
 * schedule - routing that through the seven-step campaign wizard would be
 * ceremony. What the dialog does owe the reader is the chain that decides the
 * bill, in the order it resolves: the message sets the segment count, the
 * audience sets the recipients, and the two multiply into a cost that is
 * committed the moment it is scheduled. So it is numbered, and the running
 * total sits above the buttons rather than being something to work out.
 */

const ALL = "all";
/* The dashboard-wide row count. */
const PER_PAGE = TABLE_PAGE_SIZE;
const theme = CHANNEL_THEME.sms;

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "sent", label: "Most sent" },
  { value: "cost", label: "Highest spend" },
  { value: "replyRate", label: "Best reply rate" },
] as const;

type SortField = (typeof SORT_OPTIONS)[number]["value"];

/**
 * One numbered section of the compose dialog.
 *
 * A heading and a rule rather than a collapsible panel: the four steps have to
 * stay readable at once, because what this dialog is trying to make obvious is
 * that steps 2 and 3 multiply into the figure in the review line.
 */
function ComposeStep({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start gap-2.5 border-b border-border pb-2.5">
        <span
          aria-hidden
          className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-sms-soft text-xs font-bold text-sms-dark tabular-nums"
        >
          {index}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-0.5 text-sm text-text-muted">{hint}</p>
        </div>
      </div>

      <div className="mt-3.5">{children}</div>
    </section>
  );
}

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
  /* Real state rather than an uncontrolled pair of inputs, because the review
     line has to say what will actually happen - "Send now" and "9:00 AM on the
     14th" are different promises and the button used to make both at once. */
  const [schedule, setSchedule] = useState<"now" | "later">("later");
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("09:00");

  const recipients =
    AUDIENCES.find((item) => item.value === draftSegment)?.size ?? 0;

  /* The same counter the composer draws, so the review line and the counter
     above it can never disagree about what is being billed. */
  const draftSegments = countSmsSegments(draftMessage, SMS_SUBSTITUTIONS).segments;
  const draftCost = recipients * draftSegments * SMS_RATE_PER_SEGMENT;
  const draftSenderRecord = SMS_SENDERS.find(
    (sender) => sender.value === draftSender,
  );
  const scheduleLabel =
    schedule === "now"
      ? "Send now"
      : draftDate
        ? /* The midnight suffix keeps the parse local. A bare "2026-09-20" is
             read as UTC, which renders as the 19th for anyone west of it - and
             a send date that is off by one is the worst kind of wrong. */
          `${formatDate(`${draftDate}T00:00:00`)} at ${draftTime}`
        : "No date set";

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
          <Input size="sm"
            type="date"
            aria-label="Created from"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="w-full lg:w-36"
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
                            <p className="truncate font-bold text-text-primary">
                              {campaign.name}
                            </p>
                            <p className="truncate font-mono text-sm text-text-muted">
                              {campaign.message}
                            </p>
                          </button>
                        </TD>

                        <TD>
                          <p className="text-text-secondary">{campaign.audienceLabel}</p>
                          <p className="text-sm text-text-muted">
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
                            <span className="block text-sm text-text-muted">
                              {formatPercent(rate(campaign.delivered, campaign.sent))}
                            </span>
                          ) : null}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          <span className="font-bold text-text-primary">
                            {formatNumber(campaign.replies)}
                          </span>
                          {campaign.optOuts > 0 ? (
                            <span className="block text-sm text-warning-text">
                              {formatNumber(campaign.optOuts)} opted out
                            </span>
                          ) : null}
                        </TD>

                        <TD align="center">
                          <Badge tone={segments > 1 ? "warning" : "neutral"}>
                            {segments}
                          </Badge>
                        </TD>

                        <TD align="right" className="font-bold text-text-primary tabular-nums">
                          {campaign.cost === 0 ? (
                            <span className="font-normal text-text-muted">-</span>
                          ) : (
                            formatCurrency(campaign.cost)
                          )}
                        </TD>

                        <TD>
                          <SmsCampaignStatusBadge status={campaign.status} />
                        </TD>

                        <TD className="text-sm whitespace-nowrap text-text-muted">
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
                        <p className="line-clamp-2 font-mono text-sm text-text-muted">
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
                            campaign.cost === 0 ? "-" : formatCurrency(campaign.cost),
                        },
                      ].map((cell) => (
                        <div
                          key={cell.label}
                          className="rounded-panel bg-surface-secondary py-2"
                        >
                          <dt className="text-sm font-medium text-text-muted">
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
                  schedule === "now"
                    ? `${draftName || "Campaign"} sending to ${formatNumber(recipients)} recipients`
                    : `${draftName || "Campaign"} scheduled · ${scheduleLabel} · ${formatNumber(recipients)} recipients`,
                );
              }}
            >
              {schedule === "now" ? (
                <>
                  <Send aria-hidden />
                  Send now
                </>
              ) : (
                <>
                  <CalendarClock aria-hidden />
                  Schedule
                </>
              )}
            </Button>
          </>
        }
      >
        {/* Numbered, because the four sections are a chain rather than a form:
            the message decides the segment count, the audience decides the
            recipients, and those two multiply into the figure in the review
            line. Steps rather than a wizard - every step stays on screen, so
            editing the message and watching the cost move is one motion. */}
        <div className="space-y-5">
          <ComposeStep
            index={1}
            title="Campaign"
            hint="An internal name, and what the handset shows as the sender."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Campaign name" htmlFor="sms-name">
                <Input
                  id="sms-name"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Weekend Flash Sale"
                />
              </Field>

              <Field
                label="Sender ID"
                htmlFor="sms-sender"
                hint={
                  draftSenderRecord && !canReceiveReplies(draftSenderRecord.type)
                    ? "Alphanumeric - replies to this campaign go nowhere."
                    : "Replies come back to this number."
                }
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
          </ComposeStep>

          <ComposeStep
            index={2}
            title="Message"
            hint="The counter measures what the gateway bills, personalisation expanded."
          >
            <SmsComposer
              value={draftMessage}
              onChange={setDraftMessage}
              recipients={recipients}
            />

            <div className="mt-4">
              <p className="text-sm font-medium text-text-muted capitalize">
                Preview
              </p>
              <SmsPreview
                message={draftMessage}
                senderId={draftSender}
                className="mt-2"
              />
            </div>
          </ComposeStep>

          <ComposeStep
            index={3}
            title="Recipients"
            hint="Opted-out and invalid numbers are excluded when it sends."
          >
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
          </ComposeStep>

          <ComposeStep
            index={4}
            title="Schedule"
            hint="Sending starts immediately, or at the time you set."
          >
            <SegmentedControl
              label="When to send"
              value={schedule}
              onChange={setSchedule}
              options={[
                { value: "now", label: "Send now" },
                { value: "later", label: "Schedule" },
              ]}
            />

            {schedule === "later" ? (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Send date" htmlFor="sms-date">
                  <Input
                    id="sms-date"
                    type="date"
                    value={draftDate}
                    onChange={(event) => setDraftDate(event.target.value)}
                  />
                </Field>
                <Field label="Send time" htmlFor="sms-time">
                  <Input
                    id="sms-time"
                    type="time"
                    value={draftTime}
                    onChange={(event) => setDraftTime(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </ComposeStep>

          {/* The review. Four figures and no controls: this is what the button
              underneath commits to, and the cost is the one nobody can work
              out in their head - segments times recipients times the rate. */}
          <div
            className={cn(
              "rounded-panel border px-3.5 py-3",
              theme.border,
              theme.soft,
            )}
          >
            <p className="text-sm font-medium text-text-muted capitalize">Review</p>

            <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Segments", value: `${draftSegments} per message` },
                { label: "Recipients", value: formatNumber(recipients) },
                { label: "Estimated cost", value: formatCurrency(draftCost) },
                { label: "Schedule", value: scheduleLabel },
              ].map((cell) => (
                <div key={cell.label} className="min-w-0">
                  <dt className="text-sm text-text-muted">{cell.label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-bold text-text-primary tabular-nums">
                    {cell.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-2.5 text-sm font-medium text-text-secondary">
              Projected at the blended rate. The final bill follows the
              destination rates, so an international audience lands higher.
            </p>
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
                      ? "-"
                      : formatPercent(rate(preview.delivered, preview.sent)),
                },
                {
                  label: "Replies",
                  value: `${formatNumber(preview.replies)}`,
                },
                {
                  label: "Total cost",
                  value: preview.cost === 0 ? "-" : formatCurrency(preview.cost),
                },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-sm text-text-muted">{row.label}</dt>
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
