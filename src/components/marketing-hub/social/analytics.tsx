"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  Heart,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import {
  DateRangePicker,
  DEFAULT_RANGE,
  type DateRangeValue,
} from "@/components/ui/date-range";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MiniStat, StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { InfoHint } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_SERIES } from "@/components/dashboard/charts/chart-theme";
import { BarsChart } from "@/components/dashboard/charts/bars-chart";
import { DonutChart } from "@/components/dashboard/charts/donut-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import {
  PLATFORM_HEXES,
  PLATFORM_ORDER,
  PLATFORM_THEME,
} from "@/constants/channels";
import {
  BEST_POSTING_TIMES,
  PLATFORM_REACH,
  SOCIAL_ACCOUNTS,
  SOCIAL_POSTS,
  SOCIAL_SERIES,
  SOCIAL_TOTALS,
  SOCIAL_WEEK_LABELS,
} from "@/lib/social-fixtures";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SocialPlatform, SocialPost } from "@/types/social";
import { PlatformMark } from "../shared/channel-badge";
import { RankedList } from "../shared/ranked-list";
import { PostThumb } from "./post-status";

/**
 * Social analytics.
 *
 * The one place in the app that uses four brand colours at once, and it earns
 * them: the whole point of this page is comparing platforms, and a legend of
 * four greys would defeat it. Everywhere else the four-hue palette would just
 * be noise.
 *
 * Engagement *rate* leads over raw engagement, because reach differs by an
 * order of magnitude between LinkedIn and Instagram here — 964 interactions on
 * 18,640 reach is a better post than 1,284 on 32,480.
 */

const PUBLISHED = SOCIAL_POSTS.filter((post) => post.status === "published");

const interactions = (post: SocialPost) =>
  post.engagement.likes + post.engagement.comments + post.engagement.shares;

const STATS: StatItem[] = [
  {
    label: "Reach",
    value: formatCount(SOCIAL_TOTALS.reach),
    changePercent: SOCIAL_TOTALS.reachChange,
    icon: Eye,
    hint: "unique accounts",
  },
  {
    label: "Impressions",
    value: formatCount(SOCIAL_TOTALS.impressions),
    changePercent: SOCIAL_TOTALS.impressionsChange,
    icon: TrendingUp,
    hint: `${(SOCIAL_TOTALS.impressions / SOCIAL_TOTALS.reach).toFixed(1)}× per account`,
  },
  {
    label: "Engagement",
    value: formatCount(SOCIAL_TOTALS.engagement),
    changePercent: SOCIAL_TOTALS.engagementChange,
    icon: Heart,
    hint: `${formatPercent(rate(SOCIAL_TOTALS.engagement, SOCIAL_TOTALS.reach))} of reach`,
  },
  {
    label: "Followers",
    value: formatCount(SOCIAL_TOTALS.followers),
    changePercent: SOCIAL_TOTALS.followersChange,
    icon: Users,
    hint: "across 4 accounts",
  },
  {
    label: "Posts Published",
    value: formatCount(SOCIAL_TOTALS.published),
    changePercent: SOCIAL_TOTALS.publishedChange,
    icon: Send,
    hint: "in the period",
  },
];

type Metric = "reach" | "impressions" | "engagement" | "followers";

const METRIC_META: Record<Metric, { label: string; description: string }> = {
  reach: {
    label: "Reach",
    description: "Unique accounts that saw a post, per week.",
  },
  impressions: {
    label: "Impressions",
    description: "Total views, including repeat views by the same account.",
  },
  engagement: {
    label: "Engagement",
    description: "Likes, comments and shares combined, per week.",
  },
  followers: {
    label: "Follower growth",
    description: "Total followers across all four accounts.",
  },
};

export function SocialAnalytics() {
  const toast = useToast();
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);
  const [platform, setPlatform] = useState<SocialPlatform | "all">("all");
  const [metric, setMetric] = useState<Metric>("reach");

  const meta = METRIC_META[metric];
  const bestTime = [...BEST_POSTING_TIMES].sort((a, b) => b.rate - a.rate)[0];
  const bestPlatform = [...SOCIAL_ACCOUNTS].sort(
    (a, b) => b.engagementRate - a.engagementRate,
  )[0];

  /* Posts filtered by the platform selector, so the leaderboard obeys the
     toolbar rather than ignoring it. */
  const scoped =
    platform === "all"
      ? PUBLISHED
      : PUBLISHED.filter((post) => post.platforms.includes(platform));

  const followerTotal = SOCIAL_ACCOUNTS.reduce(
    (sum, account) => sum + account.followers,
    0,
  );

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker value={range} onChange={setRange} />

          <Select
            label="Filter by platform"
            size="sm"
            value={platform}
            onChange={(next) => setPlatform(next as SocialPlatform | "all")}
            options={[
              { value: "all", label: "All platforms" },
              ...PLATFORM_ORDER.map((key) => ({
                value: key,
                label: PLATFORM_THEME[key].label,
              })),
            ]}
            className="w-full lg:w-40"
          />

          <Button
            variant="outline"
            size="compact"
            onClick={() => toast("Report queued — we will email the CSV when it is ready")}
            className="lg:ml-auto"
          >
            <Download aria-hidden />
            Export
          </Button>
        </div>
      </Card>

      <StatsGrid items={STATS} columns={5} />

      <ChartCard
        title={meta.label}
        description={meta.description}
        action={
          <SegmentedControl
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "reach", label: "Reach" },
              { value: "impressions", label: "Impressions" },
              { value: "engagement", label: "Engagement" },
              { value: "followers", label: "Followers" },
            ]}
            className="max-lg:-mx-1 max-lg:overflow-x-auto"
          />
        }
        legend={[
          {
            label: meta.label,
            swatch: "bg-social",
            value: formatNumber(SOCIAL_SERIES[metric].at(-1) ?? 0),
          },
        ]}
      >
        <TrendChart
          categories={SOCIAL_WEEK_LABELS}
          series={[{ name: meta.label, data: SOCIAL_SERIES[metric] }]}
          colors={[CHANNEL_SERIES.social[0]]}
        />
      </ChartCard>

      <ChartCard
        title="Platform Comparison"
        description="Reach per week, per platform. Instagram carries the volume; LinkedIn converts."
        legend={PLATFORM_ORDER.map((key) => ({
          label: PLATFORM_THEME[key].label,
          /* The platforms' own brand hues, from the theme table. */
          swatch: PLATFORM_THEME[key].swatch,
          value: formatNumber(PLATFORM_REACH[key].at(-1) ?? 0),
        }))}
      >
        <TrendChart
          categories={SOCIAL_WEEK_LABELS}
          series={PLATFORM_ORDER.map((key) => ({
            name: PLATFORM_THEME[key].label,
            data: PLATFORM_REACH[key],
          }))}
          colors={PLATFORM_HEXES}
          variant="line"
          unit="reach"
        />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Follower Share"
          description="Where the audience actually is."
          bodyClassName="mt-0 ml-0"
          footer={
            <ul className="space-y-1.5">
              {SOCIAL_ACCOUNTS.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <PlatformMark platform={account.platform} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-text-secondary">
                    {PLATFORM_THEME[account.platform].label}
                  </span>
                  <span className="shrink-0 font-medium text-text-primary tabular-nums">
                    {formatPercent(rate(account.followers, followerTotal))}
                  </span>
                </li>
              ))}
            </ul>
          }
        >
          <DonutChart
            labels={SOCIAL_ACCOUNTS.map(
              (account) => PLATFORM_THEME[account.platform].label,
            )}
            values={SOCIAL_ACCOUNTS.map((account) => account.followers)}
            colors={SOCIAL_ACCOUNTS.map(
              (account) => PLATFORM_THEME[account.platform].hex,
            )}
            centerLabel="Total followers"
            centerValue={formatNumber(followerTotal)}
            height={220}
          />
        </ChartCard>

        <PanelCard
          title="Best Platform"
          description="Ranked by engagement rate, not follower count."
          className="xl:col-span-2"
          action={
            <InfoHint content="Engagement rate is likes, comments and shares as a share of reach — so a small audience that interacts beats a large one that scrolls past." />
          }
        >
          <div className="flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-subtle px-3.5 py-3">
            <PlatformMark platform={bestPlatform.platform} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-primary">
                {PLATFORM_THEME[bestPlatform.platform].label}
              </p>
              <p className="text-xs text-text-secondary">
                {formatPercent(bestPlatform.engagementRate)} engagement on{" "}
                {formatNumber(bestPlatform.followers)} followers — the smallest
                audience doing the most work.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <RankedList
              tone="bg-social"
              numbered={false}
              renderMark={(item) => (
                <PlatformMark
                  platform={item.id as SocialPlatform}
                  size="sm"
                />
              )}
              items={[...SOCIAL_ACCOUNTS]
                .sort((a, b) => b.engagementRate - a.engagementRate)
                .map((account) => ({
                  id: account.platform,
                  label: PLATFORM_THEME[account.platform].label,
                  secondary: `${formatNumber(account.followers)} followers · ${formatNumber(account.posts)} posts`,
                  display: formatPercent(account.engagementRate),
                  share: account.engagementRate,
                }))}
            />
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Top Performing Posts"
          description={
            platform === "all"
              ? "By engagement rate — interactions as a share of reach."
              : `${PLATFORM_THEME[platform].label} only, by engagement rate.`
          }
          className="xl:col-span-2"
        >
          {scoped.length === 0 ? (
            <p className="rounded-panel border border-dashed border-border px-3 py-6 text-center text-xs text-text-muted">
              No published posts on this platform in the selected period.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {[...scoped]
                .sort(
                  (a, b) =>
                    rate(interactions(b), b.engagement.reach) -
                    rate(interactions(a), a.engagement.reach),
                )
                .slice(0, 5)
                .map((post, index) => {
                  const engagementRate = rate(
                    interactions(post),
                    post.engagement.reach,
                  );

                  return (
                    <li
                      key={post.id}
                      className="flex items-center gap-3 rounded-panel border border-border px-3 py-2.5"
                    >
                      <span className="w-4 shrink-0 text-xs font-bold text-text-muted tabular-nums">
                        {index + 1}
                      </span>

                      <PostThumb post={post} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-text-primary">
                          {post.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-text-muted">
                          <span className="flex items-center gap-1">
                            {post.platforms.map((key) => (
                              <PlatformMark key={key} platform={key} size="sm" />
                            ))}
                          </span>
                          <span className="tabular-nums">
                            {formatNumber(post.engagement.reach)} reach
                          </span>
                          <span aria-hidden>·</span>
                          <span className="tabular-nums">
                            {formatNumber(interactions(post))} interactions
                          </span>
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-text-primary tabular-nums">
                          {formatPercent(engagementRate)}
                        </p>
                        <p className="text-[11px] text-text-muted">engagement</p>
                      </div>
                    </li>
                  );
                })}
            </ol>
          )}
        </PanelCard>

        <PanelCard
          title="Best Posting Time"
          description={`Engagement peaks between ${bestTime.label.replace("–", " and ")}.`}
        >
          <ul className="space-y-3">
            {BEST_POSTING_TIMES.map((slot) => {
              const best = slot.label === bestTime.label;

              return (
                <li key={slot.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "text-[13px]",
                        best
                          ? "font-bold text-primary"
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
                        best ? "bg-primary" : "bg-border-strong",
                      )}
                      style={{ width: `${(slot.rate / bestTime.rate) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <MiniStat
              label="Avg reach"
              value={formatNumber(
                Math.round(
                  PUBLISHED.reduce((sum, post) => sum + post.engagement.reach, 0) /
                    Math.max(PUBLISHED.length, 1),
                ),
              )}
              hint="per post"
            />
            <MiniStat
              label="Avg engagement"
              value={formatPercent(
                PUBLISHED.reduce(
                  (sum, post) => sum + rate(interactions(post), post.engagement.reach),
                  0,
                ) / Math.max(PUBLISHED.length, 1),
              )}
              hint="per post"
            />
          </div>
        </PanelCard>
      </div>

      <ChartCard
        title="Engagement by Platform"
        description="Likes, comments and shares across the period."
        legend={[
          { label: "Likes", swatch: "bg-social" },
          { label: "Comments", swatch: "bg-accent" },
          { label: "Shares", swatch: "bg-border-strong" },
        ]}
      >
        <BarsChart
          categories={PLATFORM_ORDER.map((key) => PLATFORM_THEME[key].label)}
          series={[
            {
              name: "Likes",
              data: PLATFORM_ORDER.map((key) =>
                PUBLISHED.filter((post) => post.platforms.includes(key)).reduce(
                  (sum, post) => sum + post.engagement.likes,
                  0,
                ),
              ),
            },
            {
              name: "Comments",
              data: PLATFORM_ORDER.map((key) =>
                PUBLISHED.filter((post) => post.platforms.includes(key)).reduce(
                  (sum, post) => sum + post.engagement.comments,
                  0,
                ),
              ),
            },
            {
              name: "Shares",
              data: PLATFORM_ORDER.map((key) =>
                PUBLISHED.filter((post) => post.platforms.includes(key)).reduce(
                  (sum, post) => sum + post.engagement.shares,
                  0,
                ),
              ),
            },
          ]}
          colors={CHANNEL_SERIES.social}
          height={280}
          unit="interactions"
        />
      </ChartCard>
    </>
  );
}
