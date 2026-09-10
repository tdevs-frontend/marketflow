"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  MessageCircle,
  Search,
  ShoppingBag,
  Target,
  UserRound,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import {
  CONTACTS,
  FIXTURE_NOW,
  JOURNEYS,
  JOURNEY_EVENT_GROUPS,
  LIFECYCLES,
  LIFECYCLE_PATH,
  activityForContact,
  activityGroup,
  contactById,
  contactName,
  journeyForContact,
  ownerName,
  type CustomerContact,
  type JourneyEventGroup,
} from "@/lib/customer-fixtures";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityTimeline } from "./activity-timeline";
import {
  ChannelConsentBadges,
  LifecycleBadge,
  SourceBadge,
  TagBadges,
} from "./customer-badges";
import { ActiveFilterChips, type FilterChip } from "./customer-toolbar";

const FILTERS = ["contact", "events", "range"] as const;
type FilterKey = (typeof FILTERS)[number];

const RANGES = [
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "365d", label: "Last 12 months", days: 365 },
  { value: "all", label: "All time", days: Infinity },
];

/* -------------------------------------------------------------------------- */
/* Customer picker                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Search, then pick.
 *
 * A journey is one person's story, so the page cannot start until somebody is
 * chosen — which makes the picker the page's first control rather than a
 * filter tucked into a toolbar. It is a search box over a result list, not a
 * dropdown: with a real customer database a 20,000-option select is unusable,
 * and typing a name is what everybody tries first anyway.
 */
function CustomerPicker({
  onSelect,
  className,
}: {
  onSelect: (contact: CustomerContact) => void;
  className?: string;
}) {
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 200);

  const matches = useMemo(() => {
    const query = debounced.trim().toLowerCase();
    const pool = query
      ? CONTACTS.filter((contact) =>
          [contact.firstName, contact.lastName, contact.email, contact.company]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : /* No query: the people with the most history, since those are the
           journeys worth reading. */
        [...CONTACTS]
          .sort(
            (a, b) =>
              activityForContact(b.id).length - activityForContact(a.id).length,
          )
          .slice(0, 6);
    return pool.slice(0, 8);
  }, [debounced]);

  return (
    <div className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search customers by name, email or company…"
          aria-label="Search customers"
          className="h-11 pl-9"
        />
      </div>

      <p className="mt-3 text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
        {debounced.trim() ? `${matches.length} matching` : "Most active"}
      </p>

      {matches.length ? (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {matches.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                onClick={() => onSelect(contact)}
                className="flex w-full items-center gap-3 rounded-panel border border-border p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
              >
                <AvatarLabel
                  name={contactName(contact)}
                  secondary={contact.company ?? contact.email ?? undefined}
                  size="sm"
                />
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  <LifecycleBadge lifecycle={contact.lifecycle} />
                  <ChevronRight
                    className="size-4 text-text-muted"
                    aria-hidden
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No customers match that search"
          description="Try part of a name, an email address or a company."
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lifecycle tracker                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Where this one person is, not where the funnel is.
 *
 * Compact and horizontal: five stages, the reached ones filled, the current
 * one ringed. Stage identity is carried by a tick and a label as well as the
 * fill, so it does not depend on colour alone. Churned sits outside the path —
 * it is an exit, not a sixth step — so it is stated in words rather than drawn
 * as a stage nobody progresses to.
 */
function LifecycleTracker({ contact }: { contact: CustomerContact }) {
  const churned = contact.lifecycle === "churned";
  const index = LIFECYCLE_PATH.indexOf(contact.lifecycle);
  /* A churned contact still got as far as customer, so the path is drawn
     complete-to-customer rather than empty. */
  const reachedTo = churned ? LIFECYCLE_PATH.indexOf("customer") : index;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
          Lifecycle
        </h3>
        {churned ? (
          <span className="rounded-full bg-error-soft px-2 py-0.5 text-[11px] font-medium text-error-text">
            Churned
          </span>
        ) : null}
      </div>

      <ol className="mt-2.5 flex items-start">
        {LIFECYCLE_PATH.map((stage, position) => {
          const label =
            LIFECYCLES.find((item) => item.value === stage)?.label ?? stage;
          const done = position < reachedTo;
          const current = !churned && position === reachedTo;
          const last = position === LIFECYCLE_PATH.length - 1;

          return (
            <li
              key={stage}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex w-full items-center">
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 flex-1",
                    position === 0
                      ? "opacity-0"
                      : position <= reachedTo
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold",
                    done && "border-primary bg-primary text-white",
                    current &&
                      "border-primary bg-surface text-primary ring-3 ring-primary-soft",
                    !done &&
                      !current &&
                      "border-border bg-surface text-text-muted",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    position + 1
                  )}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 flex-1",
                    last
                      ? "opacity-0"
                      : position < reachedTo
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
              </div>
              <span
                className={cn(
                  "mt-1.5 text-center text-[11px] leading-tight",
                  current
                    ? "font-semibold text-primary"
                    : done
                      ? "text-text-secondary"
                      : "text-text-muted",
                )}
              >
                {label}
                {/* The tick and the fill are visual; the state has to be
                    readable too, so it is said in words as well. */}
                {done ? <span className="sr-only"> (completed)</span> : null}
                {current ? (
                  <span className="sr-only"> (current stage)</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

function kpis(contact: CustomerContact): Kpi[] {
  const journey = journeyForContact(contact.id);
  const activity = activityForContact(contact.id);

  return [
    {
      /* The recorded events, not the journey fixture's touchpoint total: the
         number has to match the rows below it or the page contradicts itself. */
      label: "Touchpoints",
      value: formatNumber(activity.length),
      icon: MessageCircle,
      hint: "Every recorded interaction",
    },
    {
      label: "Journey length",
      value: journey ? `${journey.durationDays} days` : "—",
      icon: Target,
      hint: journey
        ? `First seen ${formatDate(journey.firstSeenAt)}`
        : undefined,
    },
    {
      label: "Orders",
      value: formatNumber(contact.orders),
      icon: ShoppingBag,
      hint: contact.lastOrderAt
        ? `Last ${formatRelativeTime(contact.lastOrderAt)}`
        : "No orders yet",
    },
    {
      label: "Lifetime value",
      value: formatCurrency(contact.lifetimeValue),
      icon: UserRound,
      tone: "brand",
    },
  ];
}

/**
 * One customer's lifecycle, end to end.
 *
 * The page is deliberately not the aggregate funnel — that lives in Marketing
 * analytics. What a support or sales person needs here is a single person's
 * history in order, filtered to the kind of event they are chasing, which is
 * the one view no other page in the module gives.
 *
 * The chosen customer lives in the URL, so a journey can be linked to from the
 * Contacts table, a lead drawer, or a chat with a colleague.
 */
export function JourneyWorkspace() {
  const toast = useToast();
  const table = useTableState<FilterKey>(FILTERS);
  const { filters } = table;

  const selected =
    filters.contact === "all" ? undefined : contactById(filters.contact);

  const range =
    RANGES.find((item) => item.value === filters.range) ?? RANGES[3];
  /* Memoised because it is a fresh array every render otherwise, which would
     re-run the timeline memo on every keystroke elsewhere on the page. */
  const groups = useMemo<JourneyEventGroup[]>(
    () =>
      filters.events === "all"
        ? []
        : (filters.events.split(",") as JourneyEventGroup[]),
    [filters.events],
  );

  const timeline = useMemo(() => {
    if (!selected) return [];
    /* `activityForContact` is newest first; a journey reads forwards. */
    const events = [...activityForContact(selected.id)].reverse();
    /* Measured from the fixture clock, not `Date.now()`, so the demo data
       does not drift out of every range as it ages. */
    const cutoff =
      range.days === Infinity
        ? 0
        : new Date(FIXTURE_NOW).getTime() - range.days * 86_400_000;

    return events.filter((event) => {
      if (groups.length && !groups.includes(activityGroup(event.kind)))
        return false;
      if (range.days !== Infinity && new Date(event.at).getTime() < cutoff) {
        return false;
      }
      return true;
    });
  }, [selected, groups, range.days]);

  const total = selected ? activityForContact(selected.id).length : 0;

  function toggleGroup(group: JourneyEventGroup) {
    const next = groups.includes(group)
      ? groups.filter((item) => item !== group)
      : [...groups, group];
    if (next.length) table.setFilter("events", next.join(","));
    else table.clearFilter("events");
  }

  const chips: FilterChip[] = [
    ...groups.map((group) => ({
      key: `events:${group}`,
      label: "Event",
      value:
        JOURNEY_EVENT_GROUPS.find((item) => item.value === group)?.label ??
        group,
    })),
    filters.range !== "all"
      ? { key: "range", label: "Range", value: range.label }
      : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  return (
    <>
      <PageHeader
        title="Customer Journey"
        description="Follow one customer from first touch through every message, campaign and order."
        action={
          selected ? (
            <Button
              variant="outline"
              onClick={() =>
                toast(`Exporting ${contactName(selected)}'s journey`, "info")
              }
            >
              <Download className="size-4" />
              Export journey
            </Button>
          ) : undefined
        }
      />

      {selected ? (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar name={contactName(selected)} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-text-primary">
                      {contactName(selected)}
                    </h2>
                    <LifecycleBadge lifecycle={selected.lifecycle} />
                    <SourceBadge source={selected.source} />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {[selected.company, selected.email, selected.phone]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TagBadges tags={selected.tags} max={3} />
                    <ChannelConsentBadges channels={selected.optedInChannels} />
                    <span className="text-[11px] text-text-muted">
                      Owner {ownerName(selected.ownerId)}
                    </span>
                  </div>
                </div>
              </div>

              <Tooltip content="Choose a different customer">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.clearFilter("contact")}
                >
                  <X className="size-4" />
                  Change customer
                </Button>
              </Tooltip>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <LifecycleTracker contact={selected} />
            </div>
          </Card>

          <KpiStrip items={kpis(selected)} className="mt-4" />

          <Card className="mt-4 p-5">
            <CardHeader
              title="Journey timeline"
              description="Oldest first, so the story reads forwards."
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Multi-select pills rather than a single-choice segmented
                  control: "messages and orders" is a question people actually
                  ask, and a one-of-seven switch cannot answer it. */}
              <button
                type="button"
                aria-pressed={groups.length === 0}
                onClick={() => table.clearFilter("events")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                  groups.length === 0
                    ? "border-primary bg-primary-soft text-primary-dark"
                    : "border-border text-text-secondary hover:border-border-strong",
                )}
              >
                All
              </button>
              {JOURNEY_EVENT_GROUPS.map((group) => {
                const on = groups.includes(group.value);

                return (
                  <button
                    key={group.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleGroup(group.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      on
                        ? "border-primary bg-primary-soft text-primary-dark"
                        : "border-border text-text-secondary hover:border-border-strong",
                    )}
                  >
                    {group.label}
                  </button>
                );
              })}

              <div className="ml-auto">
                <Select
                  label="Date range"
                  hideLabel
                  size="sm"
                  value={filters.range === "all" ? "all" : range.value}
                  onChange={(next) => {
                    if (next === "all") table.clearFilter("range");
                    else table.setFilter("range", next);
                  }}
                  options={RANGES.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  className="w-40"
                />
              </div>
            </div>

            <ActiveFilterChips
              chips={chips}
              onRemove={(key) => {
                if (key.startsWith("events:")) {
                  toggleGroup(key.slice("events:".length) as JourneyEventGroup);
                  return;
                }
                table.clearFilter(key as FilterKey);
              }}
              onClearAll={() => table.clearFilters(["events", "range"])}
              className="mt-3"
            />

            <p className="mt-3 text-xs text-text-muted">
              Showing {formatNumber(timeline.length)} of {formatNumber(total)}{" "}
              event{total === 1 ? "" : "s"}
            </p>

            <div className="mt-3">
              <ActivityTimeline
                entries={timeline}
                emptyTitle="Nothing in this view"
                emptyDescription="No events of these kinds in the selected period. Widen the range or clear the event filters."
              />
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card className="p-5">
            <CardHeader
              title="Choose a customer"
              description="Every journey belongs to one person, so start by finding them."
            />
            <CustomerPicker
              className="mt-4"
              onSelect={(contact) => table.setFilter("contact", contact.id)}
            />
          </Card>

          <Card className="mt-4 p-5">
            <CardHeader
              title="Recent journeys"
              description="The customers who moved most recently. Open one to read it in order."
            />

            <div className="mt-4 max-lg:hidden">
              <Table minWidth="44rem">
                <THead>
                  <TH>Customer</TH>
                  <TH>Stage</TH>
                  <TH>Entry source</TH>
                  <TH align="right">Touchpoints</TH>
                  <TH align="right">Duration</TH>
                  <TH>Last activity</TH>
                </THead>
                <TBody>
                  {JOURNEYS.map((journey) => {
                    const contact = contactById(journey.contactId);
                    if (!contact) return null;

                    return (
                      <TR
                        key={journey.contactId}
                        onClick={() => table.setFilter("contact", contact.id)}
                        className="cursor-pointer"
                      >
                        <TD>
                          <AvatarLabel
                            name={contactName(contact)}
                            secondary={contact.company ?? undefined}
                            size="sm"
                          />
                        </TD>
                        <TD>
                          <LifecycleBadge lifecycle={contact.lifecycle} />
                        </TD>
                        <TD>
                          <SourceBadge source={journey.entrySource} />
                        </TD>
                        <TD
                          align="right"
                          className="text-xs text-text-secondary tabular-nums"
                        >
                          {journey.touchpoints}
                        </TD>
                        <TD
                          align="right"
                          className="text-xs whitespace-nowrap text-text-secondary tabular-nums"
                        >
                          {journey.durationDays}d
                        </TD>
                        <TD className="text-xs whitespace-nowrap text-text-muted">
                          {formatRelativeTime(journey.lastActivityAt)}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            <ul className="mt-4 space-y-2.5 lg:hidden">
              {JOURNEYS.map((journey) => {
                const contact = contactById(journey.contactId);
                if (!contact) return null;

                return (
                  <li key={journey.contactId}>
                    <button
                      type="button"
                      onClick={() => table.setFilter("contact", contact.id)}
                      className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <AvatarLabel
                          name={contactName(contact)}
                          secondary={contact.company ?? undefined}
                          size="sm"
                        />
                        <LifecycleBadge lifecycle={contact.lifecycle} />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <SourceBadge source={journey.entrySource} />
                        <span className="text-[11px] text-text-muted tabular-nums">
                          {journey.touchpoints} touchpoints ·{" "}
                          {journey.durationDays}d
                        </span>
                        <span className="ml-auto text-[11px] text-text-muted">
                          {formatRelativeTime(journey.lastActivityAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
