"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Filter,
  Layers,
  Lock,
  Pencil,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { MiniStat, StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_THEME } from "@/constants/channels";
import { SEGMENTS, SEGMENT_FIELDS, SEGMENT_OPERATORS } from "@/lib/segment-fixtures";
import { formatCount, formatNumber, formatPercent, formatRelativeTime, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketingChannel } from "@/types/marketing";
import type { Segment, SegmentField, SegmentRule } from "@/types/segment";
import { ChannelMark } from "../shared/channel-badge";

/**
 * Audience segments, shared across the channels.
 *
 * The card shows which channels a segment can actually reach, and that is the
 * point of the page: a segment built from email engagement has no phone number
 * behind most of it, so offering it as an SMS audience would produce a campaign
 * that silently fails for two-thirds of its recipients. Unusable channels are
 * greyed rather than hidden, because "why can I not text this list" is a
 * question the UI should answer rather than dodge.
 */

const ALL = "all";
const theme = CHANNEL_THEME.whatsapp;

const fieldLabel = (field: SegmentField) =>
  SEGMENT_FIELDS.find((item) => item.value === field)?.label ?? field;

const operatorLabel = (operator: SegmentRule["operator"]) =>
  SEGMENT_OPERATORS.find((item) => item.value === operator)?.label ?? operator;

/** A rule as one readable line: "Tag is Wholesale". */
const ruleText = (rule: SegmentRule) =>
  `${fieldLabel(rule.field)} ${operatorLabel(rule.operator)} ${rule.value}`;

const CHANNELS: MarketingChannel[] = ["whatsapp", "email", "sms"];

function stats(segments: Segment[]): StatItem[] {
  const total = segments.reduce((sum, segment) => sum + segment.contacts, 0);
  const growing = segments.filter((segment) => segment.growth > 0).length;
  const crossChannel = segments.filter(
    (segment) => segment.channels.length === 3,
  ).length;

  return [
    {
      label: "Segments",
      value: formatCount(segments.length),
      changePercent: 20,
      icon: Layers,
      hint: `${crossChannel} usable on all channels`,
    },
    {
      label: "Contacts Segmented",
      value: formatCount(total),
      changePercent: 12.8,
      icon: Users,
      hint: "counted once per segment",
    },
    {
      label: "Growing",
      value: formatCount(growing),
      changePercent: 8.4,
      icon: ArrowUpRight,
      hint: `of ${segments.length} segments`,
    },
    {
      label: "Largest Segment",
      value: formatCount(Math.max(...segments.map((s) => s.contacts))),
      changePercent: 12.8,
      icon: Filter,
      hint: "All Contacts",
    },
  ];
}

export function SegmentsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<MarketingChannel | typeof ALL>(ALL);
  const [sort, setSort] = useState<"contacts" | "growth" | "updated" | "name">(
    "contacts",
  );

  const [editing, setEditing] = useState<Segment | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Segment | null>(null);

  /* The builder's working copy. Rules are edited locally so the fixture is
     never mutated and Cancel genuinely cancels. */
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftRules, setDraftRules] = useState<SegmentRule[]>([]);
  /* Counter rather than a clock read — rule ids only need to be unique inside
     the open builder. */
  const nextRuleId = useRef(0);

  const activeFilters = channel === ALL ? 0 : 1;
  const allContacts = SEGMENTS.find((segment) => segment.id === "seg-all")?.contacts ?? 1;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return SEGMENTS.filter((segment) => {
      if (
        term &&
        !segment.name.toLowerCase().includes(term) &&
        !segment.description.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (channel !== ALL && !segment.channels.includes(channel)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "growth") return b.growth - a.growth;
      if (sort === "updated") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return b.contacts - a.contacts;
    });
  }, [channel, search, sort]);

  function openBuilder(segment: Segment | null) {
    setEditing(segment);
    setDraftName(segment?.name ?? "");
    setDraftDescription(segment?.description ?? "");
    setDraftRules(
      segment
        ? segment.rules.map((rule) => ({ ...rule }))
        : [{ id: "r1", field: "tag", operator: "is", value: "" }],
    );
    setBuilderOpen(true);
  }

  function updateRule(id: string, patch: Partial<SegmentRule>) {
    setDraftRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  }

  return (
    <>
      <StatsGrid
        items={stats(SEGMENTS)}
        accent={{ soft: theme.soft, text: theme.text }}
      />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search segments…"
          activeCount={activeFilters}
          onReset={() => setChannel(ALL)}
          trailing={
            <Button size="compact" onClick={() => openBuilder(null)}>
              <Plus aria-hidden />
              Create Segment
            </Button>
          }
        >
          <Select
            label="Filter by channel"
            size="sm"
            value={channel}
            onChange={(next) => setChannel(next as MarketingChannel | typeof ALL)}
            options={[
              { value: ALL, label: "Any channel" },
              ...CHANNELS.map((key) => ({
                value: key,
                label: `Usable on ${CHANNEL_THEME[key].label}`,
              })),
            ]}
            className="lg:w-48"
          />
          <Select
            label="Sort segments"
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "contacts", label: "Largest first" },
              { value: "growth", label: "Fastest growing" },
              { value: "updated", label: "Recently updated" },
              { value: "name", label: "Name A–Z" },
            ]}
            className="lg:w-44"
          />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title="No segments match those filters"
            description="Try a different search term, or clear the filters."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setChannel(ALL);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((segment) => {
              const rising = segment.growth >= 0;
              const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;
              const share = rate(segment.contacts, allContacts);

              return (
                <li key={segment.id}>
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                          <span className="truncate">{segment.name}</span>
                          {segment.system ? (
                            <Lock
                              className="size-3 shrink-0 text-text-muted"
                              aria-label="Built in"
                            />
                          ) : null}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                          {segment.description}
                        </p>
                      </div>

                      <Menu
                        label={`Actions for ${segment.name}`}
                        items={[
                          {
                            label: segment.system ? "View rules" : "Edit rules",
                            icon: <Pencil className="size-4" />,
                            onSelect: () => openBuilder(segment),
                          },
                          {
                            label: "Duplicate",
                            icon: <Copy className="size-4" />,
                            onSelect: () => toast(`${segment.name} duplicated`),
                          },
                          {
                            label: "Create campaign",
                            icon: <Send className="size-4" />,
                            onSelect: () =>
                              toast(`New campaign targeting ${segment.name}`),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="size-4" />,
                            onSelect: () => setPendingDelete(segment),
                            destructive: true,
                            disabled: segment.system,
                          },
                        ]}
                      />
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <p className="text-[1.5rem] leading-none font-bold text-text-primary tabular-nums">
                        {formatNumber(segment.contacts)}
                      </p>
                      <p
                        className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-medium",
                          rising ? "text-primary" : "text-error",
                        )}
                      >
                        <TrendIcon className="size-3.5" aria-hidden />
                        {Math.abs(segment.growth).toFixed(1)}%
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {formatPercent(share)} of all contacts
                    </p>

                    {/* Rules, spelled out. A segment you cannot read is a
                        segment nobody trusts enough to send to. */}
                    <ul className="mt-3.5 space-y-1.5">
                      {segment.rules.map((rule, index) => (
                        <li
                          key={rule.id}
                          className="flex items-start gap-2 rounded-panel bg-surface-secondary px-2.5 py-1.5"
                        >
                          <span className="mt-px shrink-0 text-[10px] font-bold tracking-[0.06em] text-text-muted uppercase">
                            {index === 0 ? "If" : "And"}
                          </span>
                          <span className="min-w-0 text-[11px] leading-snug text-text-secondary">
                            {ruleText(rule)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-4">
                      <p className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
                        Usable on
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {CHANNELS.map((key) => {
                          const usable = segment.channels.includes(key);

                          return (
                            <span
                              key={key}
                              /* Greyed rather than hidden — "why can I not text
                                 this list" deserves an answer on the card. */
                              className={cn(
                                "inline-flex",
                                !usable && "opacity-30 grayscale",
                              )}
                              title={
                                usable
                                  ? `Usable on ${CHANNEL_THEME[key].label}`
                                  : `Not enough ${CHANNEL_THEME[key].label} data on this segment`
                              }
                            >
                              <ChannelMark channel={key} size="sm" />
                            </span>
                          );
                        })}

                        <span className="ml-auto text-[11px] text-text-muted">
                          {formatRelativeTime(segment.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ------------------------------------------------------- Rule builder */}
      <Dialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title={editing ? `${editing.system ? "Rules for" : "Edit"} ${editing.name}` : "Create segment"}
        description={
          editing?.system
            ? "This segment is built in — its rules cannot be changed."
            : "Rules are combined with AND. For an OR, build a second segment."
        }
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setBuilderOpen(false)}
            >
              {editing?.system ? "Close" : "Cancel"}
            </Button>
            {editing?.system ? null : (
              <Button
                size="compact"
                onClick={() => {
                  setBuilderOpen(false);
                  toast(`${draftName || "Segment"} saved`);
                }}
              >
                Save segment
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Segment name" htmlFor="segment-name">
            <Input
              id="segment-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="High-value wholesale"
              disabled={editing?.system}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="segment-description"
            hint="What this segment is for. Whoever picks it in a campaign reads this."
          >
            <Textarea
              id="segment-description"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              className="min-h-20"
              disabled={editing?.system}
            />
          </Field>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Rules
              </h3>
              {editing?.system ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraftRules((current) => [
                      ...current,
                      {
                        id: `r-new-${(nextRuleId.current += 1)}`,
                        field: "tag",
                        operator: "is",
                        value: "",
                      },
                    ])
                  }
                >
                  <Plus aria-hidden />
                  Add rule
                </Button>
              )}
            </div>

            <ul className="mt-2.5 space-y-2.5">
              {draftRules.map((rule, index) => (
                <li
                  key={rule.id}
                  className="rounded-panel border border-border px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold tracking-[0.06em] text-text-muted uppercase">
                      {index === 0 ? "If" : "And"}
                    </p>
                    {draftRules.length > 1 && !editing?.system ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraftRules((current) =>
                            current.filter((item) => item.id !== rule.id),
                          )
                        }
                        aria-label={`Remove rule ${index + 1}`}
                        className="grid size-5 place-items-center rounded text-text-muted transition-colors hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <Select
                      label={`Rule ${index + 1} field`}
                      size="sm"
                      value={rule.field}
                      onChange={(next) =>
                        updateRule(rule.id, { field: next as SegmentField })
                      }
                      options={SEGMENT_FIELDS}
                      disabled={editing?.system}
                    />
                    <Select
                      label={`Rule ${index + 1} operator`}
                      size="sm"
                      value={rule.operator}
                      onChange={(next) =>
                        updateRule(rule.id, {
                          operator: next as SegmentRule["operator"],
                        })
                      }
                      options={SEGMENT_OPERATORS}
                      disabled={editing?.system}
                    />
                    <Input
                      value={rule.value}
                      onChange={(event) =>
                        updateRule(rule.id, { value: event.target.value })
                      }
                      placeholder="Value"
                      aria-label={`Rule ${index + 1} value`}
                      className="h-10"
                      disabled={editing?.system}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* An estimate, not a promise — the real count comes from the API. */}
          <div className="rounded-panel border border-primary-border bg-primary-subtle px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-primary-dark">
              <Users className="size-3.5" aria-hidden />
              Estimated audience
            </p>
            <p className="mt-1.5 text-lg leading-none font-bold text-text-primary tabular-nums">
              {formatNumber(editing?.contacts ?? 0)}
            </p>
            <p className="mt-1.5 text-[11px] text-text-secondary">
              Recalculated when you save. A segment&apos;s size moves on its own as
              contacts start and stop matching the rules.
            </p>
          </div>

          {editing ? (
            <div className="grid grid-cols-3 gap-2">
              <MiniStat
                label="Growth"
                value={`${editing.growth >= 0 ? "+" : ""}${editing.growth.toFixed(1)}%`}
                hint="30 days"
              />
              <MiniStat label="Rules" value={String(draftRules.length)} />
              <MiniStat
                label="Channels"
                value={String(editing.channels.length)}
                hint="of 3"
              />
            </div>
          ) : null}
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => toast(`${pendingDelete?.name} deleted`)}
        title={`Delete ${pendingDelete?.name}?`}
        confirmLabel="Delete segment"
      >
        <p className="text-sm text-text-secondary">
          The contacts stay — a segment is a saved filter, not a container. Any
          scheduled campaign or automation targeting this segment will need a new
          audience before it can send.
        </p>
      </ConfirmDialog>
    </>
  );
}
