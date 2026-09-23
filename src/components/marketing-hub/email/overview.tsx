"use client";

import { CheckCheck, MailOpen, MousePointerClick, Send } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { MeterRow } from "@/components/ui/progress";
import { StatsGrid, MiniStat, type StatItem } from "@/components/ui/stats-card";
import { CHANNEL_SERIES } from "@/components/dashboard/charts/chart-theme";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import {
  EMAIL_ACTIVITY,
  EMAIL_CAMPAIGNS,
  EMAIL_DAY_LABELS,
  EMAIL_SERIES,
  emailTotals,
} from "@/lib/email-fixtures";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";
import { ActivityFeed } from "../shared/activity-feed";
import { EmailCampaignStatusBadge } from "./campaign-row";

/**
 * The Email module's landing page.
 *
 * Four numbers, one chart, two lists. Everything on it answers "is the channel
 * working, and what happened today" - a different question from the one
 * Analytics answers, and the reason this page no longer carries a rate chart, a
 * device donut and a send-time panel that the analytics tab drew a second time.
 * A metric rendered on two tabs is a metric nobody trusts, because the two
 * eventually disagree.
 *
 * Volume here, rates there. The chart below plots counts over time - the shape
 * of the sending programme; the rate trend that diagnoses *why* a number moved
 * lives on Analytics, beside the funnel that explains it.
 *
 * No revenue. Email's contribution to the money is a cross-channel question,
 * and the Marketing workspace is where four channels can actually be compared;
 * inside the channel it would only ever be email measured against itself.
 */

const theme = CHANNEL_THEME.email;
const ACCENT = { soft: theme.soft, text: theme.text };

const TOTALS = emailTotals(EMAIL_CAMPAIGNS);

const STATS: StatItem[] = [
  {
    label: "Emails Sent",
    value: formatCount(TOTALS.sent),
    changePercent: 14.2,
    icon: Send,
    hint: "vs last 30 days",
  },
  {
    label: "Delivery Rate",
    value: formatPercent(rate(TOTALS.delivered, TOTALS.sent)),
    changePercent: 1.1,
    icon: CheckCheck,
    hint: `${formatNumber(TOTALS.delivered)} delivered`,
  },
  {
    label: "Open Rate",
    value: formatPercent(rate(TOTALS.opened, TOTALS.delivered)),
    changePercent: 3.8,
    icon: MailOpen,
    hint: `${formatNumber(TOTALS.opened)} opens`,
  },
  {
    label: "Click Rate",
    value: formatPercent(rate(TOTALS.clicked, TOTALS.delivered)),
    changePercent: 6.2,
    icon: MousePointerClick,
    hint: `${formatNumber(TOTALS.clicked)} clicks`,
  },
];

export function EmailOverview() {
  const recent = [...EMAIL_CAMPAIGNS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={4} />

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Sending Volume"
          description="Sends, opens and clicks across the last four weeks."
          className="xl:col-span-2"
          legend={[
            {
              label: "Sent",
              swatch: "bg-email",
              value: formatNumber(EMAIL_SERIES.sent.at(-1) ?? 0),
            },
            {
              label: "Opened",
              swatch: "bg-accent",
              value: formatNumber(EMAIL_SERIES.opened.at(-1) ?? 0),
            },
            {
              label: "Clicked",
              swatch: "bg-border-strong",
              value: formatNumber(EMAIL_SERIES.clicked.at(-1) ?? 0),
            },
          ]}
        >
          <TrendChart
            categories={EMAIL_DAY_LABELS}
            series={[
              { name: "Sent", data: EMAIL_SERIES.sent },
              { name: "Opened", data: EMAIL_SERIES.opened },
              { name: "Clicked", data: EMAIL_SERIES.clicked },
            ]}
            colors={CHANNEL_SERIES.email}
            unit="emails"
          />
        </ChartCard>

        {/* The summary the KPI row cannot give: one population thinning, so a
            healthy open rate sitting on a poor delivery rate reads as the
            problem it is rather than as a healthy open rate. */}
        <PanelCard
          title="Email Performance"
          description="Each stage as a share of the one above it."
        >
          <div className="space-y-4">
            <MeterRow
              label="Delivered"
              value={rate(TOTALS.delivered, TOTALS.sent)}
              display={formatPercent(rate(TOTALS.delivered, TOTALS.sent))}
              tone="bg-email"
              hint={`${formatNumber(TOTALS.delivered)} of ${formatNumber(TOTALS.sent)} sent`}
            />
            <MeterRow
              label="Opened"
              value={rate(TOTALS.opened, TOTALS.delivered)}
              display={formatPercent(rate(TOTALS.opened, TOTALS.delivered))}
              tone="bg-accent"
              hint="of delivered"
            />
            <MeterRow
              label="Clicked"
              value={rate(TOTALS.clicked, TOTALS.delivered)}
              display={formatPercent(rate(TOTALS.clicked, TOTALS.delivered))}
              tone="bg-info"
              hint={`${formatPercent(rate(TOTALS.clicked, Math.max(TOTALS.opened, 1)))} of opens`}
            />
            <MeterRow
              label="Bounced"
              value={rate(TOTALS.bounced, TOTALS.sent)}
              display={formatPercent(rate(TOTALS.bounced, TOTALS.sent))}
              tone="bg-error"
              hint="Above 2% risks the sending domain"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <MiniStat
              label="Unsubscribed"
              value={formatNumber(TOTALS.unsubscribed)}
              hint={`${formatPercent(rate(TOTALS.unsubscribed, TOTALS.delivered))} of delivered`}
            />
            <MiniStat
              label="Spam reports"
              value={formatNumber(TOTALS.complained)}
              hint={`${formatPercent(rate(TOTALS.complained, TOTALS.delivered))} of delivered`}
            />
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Recent Campaigns"
          description="The last six campaigns you created."
          className="xl:col-span-2"
          action={
            <ButtonLink href={APP_ROUTES.emailCampaigns} variant="ghost" size="sm">
              View all
            </ButtonLink>
          }
        >
          <ul className="divide-y divide-border">
            {recent.map((campaign) => (
              <li
                key={campaign.id}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-40 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {campaign.name}
                  </p>
                  <p className="truncate text-sm text-text-muted">
                    {campaign.subject}
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
                    <dt className="text-sm font-medium text-text-muted">Open</dt>
                    <dd className="text-sm font-bold text-text-primary tabular-nums">
                      {campaign.delivered === 0
                        ? "-"
                        : formatPercent(rate(campaign.opened, campaign.delivered))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-muted">Click</dt>
                    <dd className="text-sm font-bold text-text-primary tabular-nums">
                      {campaign.delivered === 0
                        ? "-"
                        : formatPercent(rate(campaign.clicked, campaign.delivered))}
                    </dd>
                  </div>
                </dl>

                <EmailCampaignStatusBadge status={campaign.status} />
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          title="Email Activity"
          description="Sends, template changes and anything that needs a look."
        >
          <ActivityFeed entries={EMAIL_ACTIVITY} titleSize="sm" />
        </PanelCard>
      </div>
    </>
  );
}
