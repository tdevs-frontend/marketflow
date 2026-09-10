"use client";

import { useState } from "react";
/* One neutral glyph for the KPI strip: the journey's real icons are per-kind
   and live on the touchpoint rows, where the channel identity matters. */
import {
  ChevronRight,
  Download,
  TrendingDown,
  Users as ActivityIconStub,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  DROP_OFFS,
  JOURNEYS,
  JOURNEY_STAGES,
  TOUCHPOINTS,
  contactById,
  contactName,
  type CustomerJourney,
} from "@/lib/customer-fixtures";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityIcon, SourceBadge } from "./customer-badges";
import { JourneyDrawer } from "./journey-drawer";

const FIRST = JOURNEY_STAGES[0].count;

function kpis(): Kpi[] {
  const byKey = (key: string) =>
    JOURNEY_STAGES.find((stage) => stage.key === key)?.count ?? 0;

  return [
    {
      label: "New Visitors",
      value: formatNumber(byKey("visitor")),
      icon: ActivityIconStub,
    },
    {
      label: "Leads",
      value: formatNumber(byKey("lead")),
      icon: ActivityIconStub,
    },
    {
      label: "Qualified",
      value: formatNumber(byKey("qualified")),
      icon: ActivityIconStub,
      tone: "brand",
    },
    {
      label: "Customers",
      value: formatNumber(byKey("customer")),
      icon: ActivityIconStub,
      tone: "success",
    },
    {
      label: "Repeat",
      value: formatNumber(byKey("repeat")),
      icon: ActivityIconStub,
      tone: "success",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Lifecycle ribbon                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The lifecycle, left to right, with the drop between each pair.
 *
 * A ribbon rather than a funnel chart: the question here is "where do people
 * fall out", and that is a property of the *gap* between two stages, not of
 * either stage's height. So the conversion sits in the connector and the
 * stages themselves stay the same size — a shrinking bar chart says the same
 * thing less precisely and takes three times the width to do it.
 *
 * Horizontally scrollable at every width. Seven stages cannot be made legible
 * inside 1100px and squeezing them is worse than scrolling.
 */
function LifecycleRibbon() {
  return (
    <Card className="p-5">
      <CardHeader
        title="Lifecycle"
        description="How many people reach each stage, and the share that carries over."
      />

      <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1">
        <ol className="flex min-w-max items-stretch gap-0">
          {JOURNEY_STAGES.map((stage, index) => {
            const previous = index > 0 ? JOURNEY_STAGES[index - 1] : null;
            const carry = previous
              ? (stage.count / previous.count) * 100
              : null;
            const drop = carry === null ? null : 100 - carry;
            const last = index === JOURNEY_STAGES.length - 1;

            return (
              <li key={stage.key} className="flex items-stretch">
                {previous ? (
                  /* The connector carries the number, because the drop belongs
                     to the transition rather than to either stage. */
                  <div className="flex w-20 shrink-0 flex-col items-center justify-center px-1">
                    <ChevronRight
                      className="size-4 text-border-strong"
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "mt-0.5 text-[11px] font-medium tabular-nums",
                        (drop ?? 0) >= 55
                          ? "text-error-text"
                          : "text-text-muted",
                      )}
                    >
                      {carry?.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-text-muted">carried</span>
                  </div>
                ) : null}

                <div
                  className={cn(
                    "flex w-36 shrink-0 flex-col rounded-panel border p-3",
                    last
                      ? "border-success/40 bg-success-soft/40"
                      : index === 0
                        ? "border-border bg-surface-secondary"
                        : "border-border bg-surface",
                  )}
                >
                  <p className="text-[11px] font-medium tracking-[0.04em] text-text-muted uppercase">
                    {stage.label}
                  </p>
                  <p className="mt-1.5 text-lg leading-none font-bold text-text-primary tabular-nums">
                    {formatNumber(stage.count)}
                  </p>
                  <p className="mt-1 text-[11px] text-text-muted tabular-nums">
                    {((stage.count / FIRST) * 100).toFixed(1)}% of visitors
                  </p>

                  {/* A bar as the secondary read, scaled against the first
                      stage so all seven are comparable at a glance. */}
                  <div
                    aria-hidden
                    className="mt-2 h-1 overflow-hidden rounded-full bg-surface-secondary"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        last ? "bg-success" : "bg-primary",
                      )}
                      style={{
                        width: `${Math.max((stage.count / FIRST) * 100, 1.5)}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Funnel and drop-offs                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The funnel proper: bar length is share of the *first* stage.
 *
 * That is what makes it a funnel — the shape is the story, and a bar measured
 * against its immediate predecessor would draw every stage at roughly the same
 * width and hide the collapse entirely. The carry-over percentage is still
 * useful, so it is printed, but labelled "from previous" rather than left
 * beside the bar to be misread as the bar's own value. An earlier draft had
 * the bar on one basis and the number on the other, which is a chart that
 * contradicts itself.
 */
function ConversionFunnel() {
  return (
    <Card className="p-5">
      <CardHeader
        title="Journey conversion funnel"
        description="Bar length is the share of all visitors who reach that stage."
      />

      <ol className="mt-4 space-y-3">
        {JOURNEY_STAGES.map((stage, index) => {
          const previous = index > 0 ? JOURNEY_STAGES[index - 1] : null;
          const carry = previous ? (stage.count / previous.count) * 100 : 100;

          return (
            <li key={stage.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-text-primary">
                  {stage.label}
                </span>
                <span className="text-xs whitespace-nowrap text-text-secondary tabular-nums">
                  {formatNumber(stage.count)}
                  <span className="ml-2 text-text-muted">
                    {index === 0
                      ? "all visitors"
                      : `${carry.toFixed(0)}% from previous`}
                  </span>
                </span>
              </div>

              <div
                aria-hidden
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-secondary"
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    index === JOURNEY_STAGES.length - 1
                      ? "bg-success"
                      : "bg-primary",
                  )}
                  style={{
                    width: `${Math.max((stage.count / FIRST) * 100, 1.5)}%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function DropOffs() {
  return (
    <Card className="p-5">
      <CardHeader
        title="Top drop-off points"
        description="Where the most people leave, and what is missing there."
      />

      <ol className="mt-4 space-y-3">
        {[...DROP_OFFS]
          .sort((a, b) => b.lost - a.lost)
          .map((item) => (
            <li
              key={`${item.from}-${item.to}`}
              className="rounded-panel border border-border p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-[13px] font-medium text-text-primary">
                  {item.from}{" "}
                  <span className="text-text-muted" aria-label="to">
                    →
                  </span>{" "}
                  {item.to}
                </p>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-error-soft px-2 py-0.5 text-[11px] font-medium text-error-text tabular-nums">
                  <TrendingDown className="size-3" aria-hidden />
                  {item.rate.toFixed(0)}%
                </span>
              </div>

              <p className="mt-1 text-[11px] text-text-muted tabular-nums">
                {formatNumber(item.lost)} people lost
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                {item.note}
              </p>
            </li>
          ))}
      </ol>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Touchpoints                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Which channels people actually meet, ordered as they meet them.
 *
 * Every row keeps its channel identity — WhatsApp green, email blue, SMS
 * purple — because the whole question this answers is which channel is doing
 * the work, and recolouring them to the brand would erase the answer.
 */
function Touchpoints() {
  return (
    <Card className="p-5">
      <CardHeader
        title="Customer touchpoints"
        description="Every interaction on the way through, by channel."
      />

      <ol className="mt-4 space-y-2.5">
        {TOUCHPOINTS.map((point) => (
          <li key={point.key} className="flex items-center gap-3">
            <ActivityIcon kind={point.kind} />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-medium text-text-primary">
                  {point.label}
                </span>
                <span className="shrink-0 text-xs text-text-secondary tabular-nums">
                  {formatNumber(point.count)}
                </span>
              </div>

              <div
                aria-hidden
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(point.share, 1.5)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The lifecycle, seen four ways: the ribbon across the top, the funnel and its
 * worst transitions side by side, the channels people meet, and then the
 * individual journeys the aggregates are made of.
 *
 * The last of those is what stops the page being a generic analytics
 * dashboard — every number above resolves to a row you can open and read as
 * one person's history.
 */
export function JourneyWorkspace() {
  const toast = useToast();
  const [range, setRange] = useState("30d");
  const [active, setActive] = useState<CustomerJourney | null>(null);

  return (
    <>
      <PageHeader
        title="Customer Journey"
        description="Understand how customers move from first interaction to conversion and retention."
        secondaryActions={
          <SegmentedControl
            label="Date range"
            value={range}
            onChange={setRange}
            options={[
              { value: "7d", label: "7 days" },
              { value: "30d", label: "30 days" },
              { value: "90d", label: "90 days" },
            ]}
          />
        }
        action={
          <Button
            variant="outline"
            onClick={() => toast("Export queued", "info")}
          >
            <Download className="size-4" />
            Export
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <div className="mt-4 space-y-4">
        <LifecycleRibbon />

        <div className="grid gap-4 xl:grid-cols-2">
          <ConversionFunnel />
          <DropOffs />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Touchpoints />

          <Card className="p-5">
            <CardHeader
              title="Recent customer journeys"
              description="Open one to see every touchpoint in order."
            />

            {JOURNEYS.length === 0 ? (
              <EmptyState
                title="Customer journeys will appear here"
                description="Once customers begin interacting with your campaigns and channels, their journeys will be visualized here."
              />
            ) : (
              <>
                <div className="mt-4 max-lg:hidden">
                  <Table minWidth="40rem">
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
                            onClick={() => setActive(journey)}
                            className="cursor-pointer"
                          >
                            <TD>
                              <AvatarLabel
                                name={contactName(contact)}
                                secondary={contact.company ?? undefined}
                                size="sm"
                              />
                            </TD>
                            <TD className="text-xs font-medium text-text-primary">
                              {journey.stage}
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
                          onClick={() => setActive(journey)}
                          className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <AvatarLabel
                              name={contactName(contact)}
                              secondary={contact.company ?? undefined}
                              size="sm"
                            />
                            <span className="shrink-0 text-xs font-medium text-text-primary">
                              {journey.stage}
                            </span>
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
              </>
            )}
          </Card>
        </div>
      </div>

      <JourneyDrawer journey={active} onClose={() => setActive(null)} />
    </>
  );
}
