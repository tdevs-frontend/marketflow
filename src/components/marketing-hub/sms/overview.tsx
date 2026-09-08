"use client";

import { useState } from "react";
import {
  CheckCheck,
  DollarSign,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { MeterRow } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MiniStat, StatsGrid, type StatItem } from "@/components/ui/stats-card";
import {
  CHANNEL_SERIES,
  RATE_COLORS,
  SPEND_RAMP,
} from "@/components/dashboard/charts/chart-theme";
import { DonutChart } from "@/components/dashboard/charts/donut-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import {
  SMS_CAMPAIGNS,
  SMS_COST_BY_COUNTRY,
  SMS_DAY_LABELS,
  SMS_SERIES,
  SMS_TEMPLATES,
  smsTotals,
} from "@/lib/sms-fixtures";
import { formatCount, formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import { countSmsSegments } from "@/types/sms";
import { RankedList } from "../shared/ranked-list";
import { SmsPreview } from "./composer";
import { SmsCampaignStatusBadge } from "./campaign-row";

/**
 * The SMS module's landing page.
 *
 * SMS is the channel where every message costs money, so this page is
 * organised around spend as much as around delivery: cost per country, cost
 * per conversion and the segment count all sit above the fold. Nothing else in
 * the product needs a spend panel; this channel would be irresponsible without
 * one.
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

type VolumeView = "volume" | "rates";

/** The composer's own counter, applied to the live campaigns. */
const MULTIPART = SMS_CAMPAIGNS.filter(
  (campaign) => countSmsSegments(campaign.message).segments > 1,
);

export function SmsOverview() {
  const [view, setView] = useState<VolumeView>("volume");

  const recent = [...SMS_CAMPAIGNS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const costTotal = SMS_COST_BY_COUNTRY.reduce((sum, item) => sum + item.value, 0);
  const featured = SMS_TEMPLATES[0];

  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={5} />

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Message Volume"
          description={
            view === "volume"
              ? "Sent, delivered and replies over the last four weeks."
              : "Delivery rate against opt-out rate. Both are read against the left axis."
          }
          className="xl:col-span-2"
          action={
            <SegmentedControl
              label="Volume metric"
              value={view}
              onChange={setView}
              options={[
                { value: "volume", label: "Volume" },
                { value: "rates", label: "Rates" },
              ]}
            />
          }
          legend={
            view === "volume"
              ? [
                  { label: "Sent", swatch: "bg-sms", value: formatNumber(SMS_SERIES.sent.at(-1) ?? 0) },
                  { label: "Delivered", swatch: "bg-accent", value: formatNumber(SMS_SERIES.delivered.at(-1) ?? 0) },
                  { label: "Replies", swatch: "bg-border-strong", value: formatNumber(SMS_SERIES.replies.at(-1) ?? 0) },
                ]
              : [
                  { label: "Delivery rate", swatch: "bg-sms" },
                  { label: "Opt-out rate", swatch: "bg-error" },
                ]
          }
        >
          {view === "volume" ? (
            <TrendChart
              categories={SMS_DAY_LABELS}
              series={[
                { name: "Sent", data: SMS_SERIES.sent },
                { name: "Delivered", data: SMS_SERIES.delivered },
                { name: "Replies", data: SMS_SERIES.replies },
              ]}
              colors={CHANNEL_SERIES.sms}
              unit="messages"
            />
          ) : (
            <TrendChart
              categories={SMS_DAY_LABELS}
              series={[
                { name: "Delivery rate", data: SMS_SERIES.deliveryRate },
                { name: "Opt-out rate", data: SMS_SERIES.optOutRate },
              ]}
              colors={[CHANNEL_SERIES.sms[0], RATE_COLORS.bad]}
              variant="line"
              format="percent"
              yAxisMax={100}
            />
          )}
        </ChartCard>

        <PanelCard
          title="Delivery Outcomes"
          description="Where the last 30 days of messages ended up."
        >
          <div className="space-y-4">
            <MeterRow
              label="Delivered"
              value={rate(TOTALS.delivered, TOTALS.sent)}
              display={formatPercent(rate(TOTALS.delivered, TOTALS.sent))}
              tone="bg-sms"
              hint={`${formatNumber(TOTALS.delivered)} of ${formatNumber(TOTALS.sent)} sent`}
            />
            <MeterRow
              label="Replied"
              value={rate(TOTALS.replies, TOTALS.delivered)}
              display={formatPercent(rate(TOTALS.replies, TOTALS.delivered))}
              tone="bg-accent"
              hint={`${formatNumber(TOTALS.replies)} replies received`}
            />
            <MeterRow
              label="Failed"
              value={rate(TOTALS.failed, TOTALS.sent)}
              display={formatPercent(rate(TOTALS.failed, TOTALS.sent))}
              tone="bg-error"
              hint="Mostly invalid or unreachable numbers"
            />
            <MeterRow
              label="Opted out"
              value={rate(TOTALS.optOuts, TOTALS.delivered)}
              display={formatPercent(rate(TOTALS.optOuts, TOTALS.delivered))}
              tone="bg-warning"
              hint={`${formatNumber(TOTALS.optOuts)} replied STOP`}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <MiniStat
              label="Clicks"
              value={formatNumber(TOTALS.clicks)}
              hint={`${formatPercent(rate(TOTALS.clicks, TOTALS.delivered))} of delivered`}
            />
            <MiniStat
              label="Multi-part"
              value={formatNumber(MULTIPART.length)}
              hint={`of ${SMS_CAMPAIGNS.length} campaigns`}
            />
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Spend by Destination"
          description="Rates vary by country, so volume and cost do not track."
          bodyClassName="mt-0 ml-0"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <MiniStat
                label="Per message"
                value={formatCurrency(TOTALS.cost / Math.max(TOTALS.sent, 1))}
                hint="blended"
              />
              <MiniStat
                label="Per reply"
                value={formatCurrency(TOTALS.cost / Math.max(TOTALS.replies, 1))}
              />
            </div>
          }
        >
          <DonutChart
            labels={SMS_COST_BY_COUNTRY.map((item) => item.label)}
            values={SMS_COST_BY_COUNTRY.map((item) => item.value)}
            colors={SPEND_RAMP}
            centerLabel="Total spend"
            centerValue={formatCurrency(costTotal)}
            height={220}
          />
        </ChartCard>

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
            {recent.map((campaign) => {
              const { segments } = countSmsSegments(campaign.message);

              return (
                <li
                  key={campaign.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-40 flex-1">
                    <p className="truncate text-[13px] font-medium text-text-primary">
                      {campaign.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-text-muted">
                      {campaign.message}
                    </p>
                  </div>

                  <dl className="flex shrink-0 items-center gap-4 text-right">
                    <div>
                      <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                        Sent
                      </dt>
                      <dd className="text-[13px] font-bold text-text-primary tabular-nums">
                        {formatNumber(campaign.sent)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                        Parts
                      </dt>
                      <dd className="text-[13px] font-bold text-text-primary tabular-nums">
                        {segments}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                        Cost
                      </dt>
                      <dd className="text-[13px] font-bold text-text-primary tabular-nums">
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
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard
          title="Top Templates"
          description="By delivery rate, across every send."
          action={
            <ButtonLink href={APP_ROUTES.smsTemplates} variant="ghost" size="sm">
              Library
            </ButtonLink>
          }
        >
          <RankedList
            tone={theme.accent}
            items={[...SMS_TEMPLATES]
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 6)
              .map((template) => {
                const { segments } = countSmsSegments(template.body);

                return {
                  id: template.id,
                  label: template.name,
                  secondary: `${formatNumber(template.usageCount)} sends · ${segments} segment${segments === 1 ? "" : "s"}`,
                  display: formatPercent(template.deliveryRate),
                  share: template.deliveryRate,
                };
              })}
          />
        </PanelCard>

        <PanelCard
          title="Message Preview"
          description={`How "${featured.name}" arrives on a handset.`}
          action={
            <ButtonLink href={APP_ROUTES.smsTemplates} variant="ghost" size="sm">
              Edit
            </ButtonLink>
          }
        >
          <SmsPreview message={featured.body} />

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat
              label="Characters"
              value={formatNumber(countSmsSegments(featured.body).characters)}
              hint="expanded"
            />
            <MiniStat
              label="Segments"
              value={String(countSmsSegments(featured.body).segments)}
            />
            <MiniStat
              label="Delivery"
              value={formatPercent(featured.deliveryRate)}
            />
          </div>
        </PanelCard>
      </div>
    </>
  );
}
