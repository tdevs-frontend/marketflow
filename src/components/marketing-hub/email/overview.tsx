"use client";

import { useState } from "react";
import {
  Monitor,
  MousePointerClick,
  Send,
  Smartphone,
  Tablet,
  UserMinus,
  Undo2,
  MailOpen,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { MeterRow } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, MiniStat, type StatItem } from "@/components/ui/stats-card";
import {
  CHANNEL_SERIES,
  RATE_COLORS,
} from "@/components/dashboard/charts/chart-theme";
import { DonutChart } from "@/components/dashboard/charts/donut-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { CHANNEL_THEME } from "@/constants/channels";
import { APP_ROUTES } from "@/constants";
import {
  EMAIL_CAMPAIGNS,
  EMAIL_DAY_LABELS,
  EMAIL_DEVICE_SPLIT,
  EMAIL_SEND_TIMES,
  EMAIL_SERIES,
  EMAIL_TEMPLATES,
  emailTotals,
} from "@/lib/email-fixtures";
import { formatCount, formatCurrency, formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RankedList } from "../shared/ranked-list";
import { EmailCampaignStatusBadge } from "./campaign-row";

/**
 * The Email module's landing page.
 *
 * Where WhatsApp is organised around conversations, email is organised around
 * the *list*: what share of it opens, what share clicks, and what share is
 * quietly rotting. So deliverability gets a card of its own — bounce and
 * unsubscribe rates are the two numbers that decide whether the channel keeps
 * working at all, and they belong above the fold rather than in an analytics
 * tab nobody opens.
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
  {
    label: "Bounce Rate",
    value: formatPercent(rate(TOTALS.bounced, TOTALS.sent)),
    changePercent: -1.4,
    icon: Undo2,
    hint: `${formatNumber(TOTALS.bounced)} bounced`,
    invertTrend: true,
  },
  {
    label: "Unsubscribe Rate",
    value: formatPercent(rate(TOTALS.unsubscribed, TOTALS.delivered)),
    changePercent: -0.6,
    icon: UserMinus,
    hint: `${formatNumber(TOTALS.unsubscribed)} opted out`,
    invertTrend: true,
  },
];

type EngagementView = "volume" | "rates";

/**
 * Device label to icon. `Monitor` is the fallback rather than an index-signature
 * lookup returning `undefined` — rendering `<undefined />` throws, so a label
 * this map has not seen must not be able to take the page down.
 */
const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  Mobile: Smartphone,
  Desktop: Monitor,
  Tablet: Tablet,
};

export function EmailOverview() {
  const [view, setView] = useState<EngagementView>("volume");

  const recent = [...EMAIL_CAMPAIGNS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const deviceTotal = EMAIL_DEVICE_SPLIT.reduce((sum, item) => sum + item.value, 0);
  const bestTime = [...EMAIL_SEND_TIMES].sort((a, b) => b.rate - a.rate)[0];

  return (
    <>
      <StatsGrid items={STATS} accent={ACCENT} columns={5} />

      <ChartCard
        title="Engagement Over Time"
        description={
          view === "volume"
            ? "Sends, opens and clicks across the last four weeks."
            : "Open, click and bounce rate. Each is a share of delivered."
        }
        action={
          <SegmentedControl
            label="Engagement metric"
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
                { label: "Sent", swatch: "bg-email", value: formatNumber(EMAIL_SERIES.sent.at(-1) ?? 0) },
                { label: "Opened", swatch: "bg-accent", value: formatNumber(EMAIL_SERIES.opened.at(-1) ?? 0) },
                { label: "Clicked", swatch: "bg-border-strong", value: formatNumber(EMAIL_SERIES.clicked.at(-1) ?? 0) },
              ]
            : [
                { label: "Open rate", swatch: "bg-email" },
                { label: "Click rate", swatch: "bg-accent" },
                { label: "Bounce rate", swatch: "bg-error" },
              ]
        }
      >
        {view === "volume" ? (
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
        ) : (
          <TrendChart
            categories={EMAIL_DAY_LABELS}
            series={[
              { name: "Open rate", data: EMAIL_SERIES.openRate },
              { name: "Click rate", data: EMAIL_SERIES.clickRate },
              { name: "Bounce rate", data: EMAIL_SERIES.bounceRate },
            ]}
            colors={[
                CHANNEL_SERIES.email[0],
                RATE_COLORS.warn,
                RATE_COLORS.bad,
              ]}
            variant="line"
            format="percent"
            yAxisMax={60}
          />
        )}
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Deliverability"
          description="The two numbers that decide whether this channel keeps working."
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
              label="Revenue"
              value={formatCurrency(TOTALS.revenue)}
              hint="attributed"
            />
            <MiniStat
              label="Per email"
              value={formatCurrency(TOTALS.revenue / Math.max(TOTALS.delivered, 1))}
              hint="delivered"
            />
          </div>
        </PanelCard>

        <ChartCard
          title="Where Opens Happen"
          description="Two-thirds of this list reads on a phone."
          bodyClassName="mt-0 ml-0"
          footer={
            <ul className="grid grid-cols-3 gap-2">
              {EMAIL_DEVICE_SPLIT.map((item) => {
                const Icon = DEVICE_ICONS[item.label] ?? Monitor;

                return (
                  <li key={item.label} className="text-center">
                    <Icon
                      className="mx-auto size-4 text-text-muted"
                      aria-hidden
                    />
                    <p className="mt-1.5 text-[13px] font-bold text-text-primary tabular-nums">
                      {formatPercent(rate(item.value, deviceTotal))}
                    </p>
                    <p className="text-[11px] text-text-muted">{item.label}</p>
                  </li>
                );
              })}
            </ul>
          }
        >
          <DonutChart
            labels={EMAIL_DEVICE_SPLIT.map((item) => item.label)}
            values={EMAIL_DEVICE_SPLIT.map((item) => item.value)}
            colors={CHANNEL_SERIES.email}
            centerLabel="Total opens"
            centerValue={formatNumber(deviceTotal)}
            height={220}
          />
        </ChartCard>

        <PanelCard
          title="Best Send Time"
          description={`Opens peak between ${bestTime.label.replace("–", " and ")}.`}
        >
          <ul className="space-y-3">
            {EMAIL_SEND_TIMES.map((slot) => {
              const best = slot.label === bestTime.label;

              return (
                <li key={slot.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "text-[13px]",
                        best
                          ? "font-bold text-email"
                          : "font-medium text-text-secondary",
                      )}
                    >
                      {slot.label}
                    </p>
                    <p className="text-[13px] font-bold text-text-primary tabular-nums">
                      {formatPercent(slot.rate)}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        best ? "bg-email" : "bg-border-strong",
                      )}
                      style={{ width: `${(slot.rate / bestTime.rate) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 rounded-panel bg-email-soft px-3 py-2.5 text-[11px] text-email-dark">
            Scheduling the September Newsletter into the 09:00 slot would have
            reached roughly 1,760 more opens.
          </p>
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
                  <p className="truncate text-[13px] font-medium text-text-primary">
                    {campaign.name}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">
                    {campaign.subject}
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
                      Open
                    </dt>
                    <dd className="text-[13px] font-bold text-text-primary tabular-nums">
                      {campaign.delivered === 0
                        ? "—"
                        : formatPercent(rate(campaign.opened, campaign.delivered))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                      Click
                    </dt>
                    <dd className="text-[13px] font-bold text-text-primary tabular-nums">
                      {campaign.delivered === 0
                        ? "—"
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
          title="Top Templates"
          description="By average open rate, among templates actually used."
          action={
            <ButtonLink href={APP_ROUTES.emailTemplates} variant="ghost" size="sm">
              Library
            </ButtonLink>
          }
        >
          <RankedList
            tone={theme.accent}
            items={EMAIL_TEMPLATES.filter((template) => template.usageCount > 0)
              .sort((a, b) => b.openRate - a.openRate)
              .slice(0, 6)
              .map((template) => ({
                id: template.id,
                label: template.name,
                secondary: `used in ${template.usageCount} campaigns`,
                display: formatPercent(template.openRate),
                share: template.openRate,
              }))}
          />
        </PanelCard>
      </div>
    </>
  );
}
