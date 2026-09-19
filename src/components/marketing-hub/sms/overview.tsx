"use client";

/*
 * Still a client module although nothing here holds state any more: `StatsGrid`
 * takes a Lucide component per stat, and a function prop cannot cross a server
 * boundary. The Volume/Rates toggle that used to justify the directive is gone.
 */

import {
  CheckCheck,
  DollarSign,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import {
  CHANNEL_SERIES,
  CHART_COLORS,
} from "@/components/dashboard/charts/chart-theme";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import {
  SMS_CAMPAIGNS,
  SMS_DAY_LABELS,
  SMS_SERIES,
  SMS_TEMPLATES,
  smsTotals,
} from "@/lib/sms-fixtures";
import {
  formatCount,
  formatCurrency,
  formatNumber,
  formatPercent,
  rate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { countSmsSegments } from "@/types/sms";
import { RankedList } from "../shared/ranked-list";
import { SmsCampaignStatusBadge } from "./campaign-row";

/**
 * The SMS module's landing page.
 *
 * It answers one question — what is happening on this channel right now — and
 * stops. Everything that answers "and why" lives on Analytics: this page used
 * to carry a second volume chart on a Volume/Rates toggle, a spend-by-country
 * donut, a cost-per-reply pair and a handset preview of a template, all of
 * which exist on Analytics or Templates in a form you can actually act on.
 * Four panels' worth of duplication came off, and what is left is the shape of
 * an operational summary: five numbers, one chart, one outcome breakdown, and
 * the two lists that say what to open next.
 *
 * The outcome breakdown is rows rather than meters. A delivery rate of 98.2%,
 * a reply rate of 2.1% and an opt-out rate of 0.3% drawn as four bars makes
 * the two that matter look like nothing at all, because they are being scaled
 * against a hundred. Ink and count carry it instead, and colour is spent only
 * where it means something: green delivered, red failed, amber opted out.
 */

const theme = CHANNEL_THEME.sms;
const ACCENT = { soft: theme.soft, text: theme.text };
const TOTALS = smsTotals(SMS_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Messages Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 11.4,
    icon: Send,
    hint: "vs last 30 days",
  },
  {
    label: "Delivery Rate",
    value: formatPercent(rate(TOTALS.delivered, TOTALS.sent)),
    changePercent: 0.4,
    icon: CheckCheck,
    hint: `${formatNumber(TOTALS.delivered)} delivered`,
  },
  {
    label: "Replies",
    value: formatCount(TOTALS.replies),
    changePercent: 18.6,
    icon: MessageSquare,
    hint: `${formatPercent(rate(TOTALS.replies, TOTALS.delivered))} reply rate`,
  },
  {
    label: "Failed",
    value: formatCount(TOTALS.failed),
    changePercent: -4.2,
    icon: XCircle,
    hint: `${formatPercent(rate(TOTALS.failed, TOTALS.sent))} of sent`,
    invertTrend: true,
  },
  {
    label: "Spend",
    value: formatCurrency(TOTALS.cost),
    changePercent: 9.8,
    icon: DollarSign,
    hint: `${formatCurrency(TOTALS.cost / Math.max(TOTALS.delivered, 1))} per delivered`,
  },
];

/**
 * Where the period's messages ended up.
 *
 * Four outcomes of one send, each with the denominator it is honestly measured
 * against: delivery and failure against what was sent, replies and opt-outs
 * against what actually arrived — nobody answers or leaves over a message that
 * never landed.
 */
const OUTCOMES = [
  {
    label: "Delivered",
    count: TOTALS.delivered,
    share: rate(TOTALS.delivered, TOTALS.sent),
    dot: "bg-success",
    hint: "of messages sent",
  },
  {
    label: "Failed",
    count: TOTALS.failed,
    share: rate(TOTALS.failed, TOTALS.sent),
    dot: "bg-error",
    hint: "invalid or unreachable, billed anyway",
  },
  {
    label: "Replied",
    count: TOTALS.replies,
    share: rate(TOTALS.replies, TOTALS.delivered),
    dot: "bg-accent",
    hint: "of messages delivered",
  },
  {
    label: "Opted out",
    count: TOTALS.optOuts,
    share: rate(TOTALS.optOuts, TOTALS.delivered),
    dot: "bg-warning",
    hint: "replied STOP",
  },
];

/** The composer's own counter, applied to the live campaigns. */
const MULTIPART = SMS_CAMPAIGNS.filter(
  (campaign) => countSmsSegments(campaign.message).segments > 1,
);

const RECENT = [...SMS_CAMPAIGNS]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);

/* Ranked by how often they are reached for, which is the Overview's question.
   Analytics ranks the same library by reply rate — that one asks which of them
   earned their sends, and the two orders are deliberately different. */
const TOP_TEMPLATES = [...SMS_TEMPLATES]
  .sort((a, b) => b.usageCount - a.usageCount)
  .slice(0, 6);

export function SmsOverview() {
  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={5} />

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Message Volume"
          description="Sent, delivered and replies over the last four weeks."
          className="xl:col-span-2"
          legend={[
            {
              label: "Sent",
              swatch: "bg-sms",
              value: formatNumber(SMS_SERIES.sent.at(-1) ?? 0),
            },
            {
              label: "Delivered",
              swatch: "bg-success",
              value: formatNumber(SMS_SERIES.delivered.at(-1) ?? 0),
            },
            {
              label: "Replies",
              swatch: "bg-accent",
              value: formatNumber(SMS_SERIES.replies.at(-1) ?? 0),
            },
          ]}
        >
          {/* The channel ramp — purple, light purple, grey — drew delivered
              and replies as two shades of the same idea, and it put this chart
              at odds with the panel beside it, where delivered is green. One
              vocabulary across the module instead: the channel's own hue for
              the raw send, green for the carrier accepting it, cyan for a
              human answering. The same three colours Analytics uses. */}
          <TrendChart
            categories={SMS_DAY_LABELS}
            series={[
              { name: "Sent", data: SMS_SERIES.sent },
              { name: "Delivered", data: SMS_SERIES.delivered },
              { name: "Replies", data: SMS_SERIES.replies },
            ]}
            colors={[
              CHANNEL_SERIES.sms[0],
              CHART_COLORS.success,
              CHART_COLORS.accent,
            ]}
            unit="messages"
          />
        </ChartCard>

        <PanelCard
          title="Delivery Outcomes"
          description="Where the last 30 days of messages ended up."
          /* A column, so the multi-part note below can be pushed to the foot of
             the card and sit level with the chart's x-axis beside it. */
          bodyClassName="flex flex-col"
        >
          <ul className="divide-y divide-border">
            {OUTCOMES.map((outcome) => (
              <li key={outcome.label} className="py-3 first:pt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-full", outcome.dot)}
                    />
                    <span className="truncate text-sm font-medium text-text-secondary">
                      {outcome.label}
                    </span>
                  </p>
                  <p className="shrink-0 text-base font-bold text-text-primary tabular-nums">
                    {formatPercent(outcome.share)}
                  </p>
                </div>
                <p className="mt-1 pl-4 text-sm text-text-muted tabular-nums">
                  {formatNumber(outcome.count)} · {outcome.hint}
                </p>
              </li>
            ))}
          </ul>

          {/* The one operational warning this page owes a reader: a multi-part
              campaign is billed per part, and nothing else on the Overview
              would say so. */}
          <div className="mt-auto border-t border-border pt-4">
            <p className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-text-secondary">
                Multi-part campaigns
              </span>
              <span className="font-bold text-text-primary tabular-nums">
                {MULTIPART.length} of {SMS_CAMPAIGNS.length}
              </span>
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Each part is billed separately.
            </p>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Recent Campaigns"
          description="The last five, newest first."
          className="xl:col-span-2"
          action={
            <ButtonLink href={APP_ROUTES.smsCampaigns} variant="ghost" size="sm">
              View all
            </ButtonLink>
          }
        >
          <ul className="divide-y divide-border">
            {RECENT.map((campaign) => {
              const { segments } = countSmsSegments(campaign.message);

              return (
                <li
                  key={campaign.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-40 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {campaign.name}
                    </p>
                    <p className="truncate font-mono text-sm text-text-muted">
                      {campaign.message}
                    </p>
                  </div>

                  <dl className="flex shrink-0 items-center gap-4 text-right">
                    <div>
                      <dt className="text-sm font-medium text-text-muted">Sent</dt>
                      <dd className="text-sm font-bold text-text-primary tabular-nums">
                        {formatNumber(campaign.sent)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-text-muted">Parts</dt>
                      <dd className="text-sm font-bold text-text-primary tabular-nums">
                        {segments}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-text-muted">Cost</dt>
                      <dd className="text-sm font-bold text-text-primary tabular-nums">
                        {campaign.cost === 0 ? "—" : formatCurrency(campaign.cost)}
                      </dd>
                    </div>
                  </dl>

                  <SmsCampaignStatusBadge status={campaign.status} />
                </li>
              );
            })}
          </ul>
        </PanelCard>

        <PanelCard
          title="Popular SMS Templates"
          description="The messages this workspace reaches for most."
          action={
            <ButtonLink href={APP_ROUTES.smsTemplates} variant="ghost" size="sm">
              Library
            </ButtonLink>
          }
        >
          <RankedList
            tone={theme.accent}
            items={TOP_TEMPLATES.map((template) => {
              const { segments } = countSmsSegments(template.body);

              return {
                id: template.id,
                label: template.name,
                secondary: `${formatPercent(template.deliveryRate)} delivered · ${segments} segment${segments === 1 ? "" : "s"}`,
                display: `${formatNumber(template.usageCount)} sends`,
                share: template.usageCount,
              };
            })}
          />
        </PanelCard>
      </div>
    </>
  );
}
