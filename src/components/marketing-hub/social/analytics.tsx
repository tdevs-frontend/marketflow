"use client";

import { useMemo, useState, type ComponentType } from "react";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { DEFAULT_RANGE, type DateRangeValue } from "@/components/ui/date-range";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { InfoHint } from "@/components/ui/tooltip";
import { CHART_COLORS } from "@/components/dashboard/charts/chart-theme";
import { DonutChart } from "@/components/dashboard/charts/donut-chart";
import { TrendChart } from "@/components/dashboard/charts/trend-chart";
import { PLATFORM_ORDER, PLATFORM_THEME } from "@/constants/channels";
import { INTEGRATION_ROUTES } from "@/constants/integrations";
import {
  BEST_POSTING_TIMES,
  SOCIAL_ACCOUNTS,
  SOCIAL_REACH_TRENDS,
  SOCIAL_TREND_PERIODS,
  analyticsAccounts,
} from "@/lib/social-fixtures";
import { useSocialPosts } from "@/lib/social-post-store";
import { formatCount, formatNumber, formatPercent, rate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  SocialPlatform,
  SocialPost,
  SocialTrendPeriod,
} from "@/types/social";
import { PlatformMark } from "../shared/channel-badge";
import { PostThumb } from "./post-status";

/**
 * Social analytics.
 *
 * Seven panels, and the discipline is that each answers a question the others
 * cannot: how reach moves, which platform generates it, where the audience
 * lives, which platform converts it, which posts worked, when to post, and how
 * people actually interacted. Anything that could not claim its own question
 * has gone.
 *
 * Three things went. The headline chart carried a four-way metric toggle -
 * Reach, Impressions, Engagement, Followers - and every position duplicated a
 * panel further down: Followers restated Follower Share, Engagement restated
 * Engagement by Platform, Reach restated Platform Comparison. A control whose
 * every setting repeats something else on the page is not a control, it is
 * four charts stacked in one slot. Reach owns the chart outright now, with the
 * previous period behind it, which is the comparison the toggle never offered.
 *
 * Platform Comparison was a second four-line reach chart sitting directly under
 * the first. It is a ranked list now: the question it answers - which platform
 * generates the reach - is an ordering, and an ordering does not need an axis.
 * Engagement by Platform lost its grouped bars for the same reason. Three
 * numbers across four platforms is a table, and drawing it as a chart made it
 * read as a third pass over the same trend.
 *
 * The KPI strip is one card per platform rather than four page totals. The
 * totals it used to carry were each answered better further down - engagement
 * by the engagement table, followers by Follower Share - while the strip
 * itself said nothing about which platform anything belonged to. Four platform
 * cards give the page an identity row: who we are on, how far each one
 * reaches, and which way each is moving. They read reach out of the same
 * `SOCIAL_REACH_TRENDS` record as the chart below, so a platform's card and
 * that platform's line are the same numbers.
 *
 * This is the one page in the app that uses four brand colours at once, and it
 * earns them: comparing platforms is the whole point, and a legend of four
 * greys would defeat it. Everywhere else the four-hue palette is noise.
 *
 * Engagement *rate* leads over raw engagement, because reach differs by an
 * order of magnitude between LinkedIn and Instagram - 964 interactions on
 * 18,640 reach is a better post than 1,284 on 32,480.
 */

const interactions = (post: SocialPost) =>
  post.engagement.likes + post.engagement.comments + post.engagement.shares;

/**
 * The platform marks, as KPI tile glyphs.
 *
 * Declared once at module scope rather than inline in the stat list: a
 * component built during render is a new type every render, and React would
 * unmount and remount the icon on each pass.
 */
const platformStatIcon = (platform: SocialPlatform) => {
  function PlatformStatMark({ className }: { className?: string }) {
    return <BrandIcon name={PLATFORM_THEME[platform].icon} className={className} />;
  }
  return PlatformStatMark;
};

const PLATFORM_STAT_ICONS: Record<
  SocialPlatform,
  ComponentType<{ className?: string }>
> = {
  instagram: platformStatIcon("instagram"),
  facebook: platformStatIcon("facebook"),
  linkedin: platformStatIcon("linkedin"),
  x: platformStatIcon("x"),
};

/** The chart's own window, seeded from the page range where the two agree. */
function periodFor(range: DateRangeValue): SocialTrendPeriod {
  return range.preset === "7d" || range.preset === "90d" ? range.preset : "30d";
}

/**
 * The seam the dashboard's date filter plugs into.
 *
 * The reach chart genuinely narrows now - it slices a daily record. The post
 * leaderboard still cannot, because a post's engagement is a lifetime total
 * rather than a dated series, so filtering it here would either do nothing or
 * empty the panel. This is the one function that changes when dated engagement
 * lands.
 */
function withinRange<T>(rows: T[], range: DateRangeValue): T[] {
  void range;
  return rows;
}

export interface SocialAnalyticsProps {
  /**
   * The period this page reports on.
   *
   * Supplied by the dashboard's filter rather than chosen here, and Export
   * lives in the page header where it is an action rather than a filter. The
   * period control inside the Reach card is that chart's own window, seeded
   * from this one: reading ninety days of reach is a thing you do *to* the
   * chart, and making it reset every table on the page would be heavier than
   * the question deserves.
   */
  range?: DateRangeValue;
}

export function SocialAnalytics({ range = DEFAULT_RANGE }: SocialAnalyticsProps) {
  const [period, setPeriod] = useState<SocialTrendPeriod>(() => periodFor(range));
  const [platform, setPlatform] = useState<SocialPlatform | "all">("all");

  /* The shared store, so a post retitled in the calendar is retitled in the
     leaderboard below without a reload. */
  const allPosts = useSocialPosts();
  const published = useMemo(
    () => allPosts.filter((post) => post.status === "published"),
    [allPosts],
  );

  /*
   * Only accounts that actually granted analytics.
   *
   * A figure computed over an account MarketFlow cannot read insights for is a
   * figure that is quietly wrong - the follower share would sum to 100% across
   * a set that is missing a platform. Excluding them keeps every number on this
   * page true, and the notice below says which account is missing and why.
   */
  const reportable = analyticsAccounts();
  const unreportable = SOCIAL_ACCOUNTS.filter(
    (account) => !reportable.includes(account),
  );

  /*
   * The strip follows the *page* period, not the chart's own control.
   *
   * The chart's window is something you do to the chart - reading ninety days
   * of shape without moving the page's reporting period. The four cards are
   * the page's headline, so they answer the range the dashboard filter set and
   * stay put while the chart is explored.
   */
  const pageTrend = SOCIAL_REACH_TRENDS[periodFor(range)];

  /**
   * One card per platform.
   *
   * Reach, because it is the metric this page is built around and the only one
   * with an honest previous-period comparison per platform - both slices come
   * out of the same daily record, so the change is measured rather than
   * asserted. The tile carries the platform's own tint and mark, which is what
   * makes the row scannable: four identical grey tiles would send the eye to
   * the labels to work out which card is which.
   */
  const platformStats = useMemo<StatItem[]>(
    () =>
      PLATFORM_ORDER.map((key) => {
        const now = pageTrend.byPlatform[key].reduce((sum, value) => sum + value, 0);
        const before = pageTrend.previousByPlatform[key].reduce(
          (sum, value) => sum + value,
          0,
        );

        return {
          label: PLATFORM_THEME[key].label,
          value: formatCount(now),
          changePercent: before === 0 ? 0 : ((now - before) / before) * 100,
          icon: PLATFORM_STAT_ICONS[key],
          hint: "reach vs previous period",
          tone: key,
        };
      }),
    [pageTrend],
  );

  const trend = SOCIAL_REACH_TRENDS[period];
  /* The 90-day window is bucketed weekly already, so its points are weeks and
     the short windows' points are days. */
  const daysPerPoint = period === "90d" ? 7 : 1;

  /* The selector swaps the series the chart plots; it does not add a second
     line. Four platforms at once is the comparison the ranked list below
     already makes, and making it the chart's default would put the page back
     where it started. */
  const current = platform === "all" ? trend.total : trend.byPlatform[platform];
  const previous =
    platform === "all" ? trend.previousTotal : trend.previousByPlatform[platform];

  const summary = useMemo(() => {
    const total = current.reduce((sum, value) => sum + value, 0);
    const before = previous.reduce((sum, value) => sum + value, 0);
    const days = current.length * daysPerPoint;

    return {
      total,
      change: before === 0 ? 0 : ((total - before) / before) * 100,
      /* Per week regardless of bucket, so the figure means the same thing on
         all three windows. */
      perWeek: Math.round((total / Math.max(days, 1)) * 7),
    };
  }, [current, previous, daysPerPoint]);

  /** Reach per platform over the chosen window, biggest first. */
  const platformReach = useMemo(() => {
    const days = trend.labels.length * daysPerPoint;

    return PLATFORM_ORDER.map((key) => {
      const total = trend.byPlatform[key].reduce((sum, value) => sum + value, 0);
      return {
        platform: key,
        total,
        perWeek: Math.round((total / Math.max(days, 1)) * 7),
      };
    }).sort((a, b) => b.total - a.total);
  }, [trend, daysPerPoint]);

  const leader = platformReach[0];
  /* Every platform's reach, so the share column adds to 100 even when the
     chart above is scoped to one of them. */
  const reachAcrossPlatforms = platformReach.reduce(
    (sum, row) => sum + row.total,
    0,
  );

  const followerTotal = reportable.reduce(
    (sum, account) => sum + account.followers,
    0,
  );

  const bestTime = [...BEST_POSTING_TIMES].sort((a, b) => b.rate - a.rate)[0];
  const bestPlatform = [...reportable].sort(
    (a, b) => b.engagementRate - a.engagementRate,
  )[0];

  const topPosts = useMemo(
    () =>
      [...withinRange(published, range)]
        .sort(
          (a, b) =>
            rate(interactions(b), b.engagement.reach) -
            rate(interactions(a), a.engagement.reach),
        )
        .slice(0, 5),
    [published, range],
  );

  const engagementRows = useMemo(() => {
    const rows = PLATFORM_ORDER.map((key) => {
      const posts = published.filter((post) => post.platforms.includes(key));
      const likes = posts.reduce((sum, post) => sum + post.engagement.likes, 0);
      const comments = posts.reduce((sum, post) => sum + post.engagement.comments, 0);
      const shares = posts.reduce((sum, post) => sum + post.engagement.shares, 0);

      return { key, likes, comments, shares, total: likes + comments + shares };
    }).sort((a, b) => b.total - a.total);

    return { rows, grand: rows.reduce((sum, row) => sum + row.total, 0) };
  }, [published]);

  const rising = summary.change >= 0;
  const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;
  const periodLabel =
    SOCIAL_TREND_PERIODS.find((item) => item.value === period)?.label ?? "30 days";

  return (
    <>
      {/* Four platforms, at the top, the way every other analytics page in the
          product opens. */}
      <StatsGrid items={platformStats} columns={4} />

      {/* ------------------------------------------------- 1–3. Reach anchor */}
      <ChartCard
        title="Reach"
        description="Unique accounts that saw your content over time."
        action={
          /* Both controls belong to this card: the window it plots and the
             platform it plots. They wrap rather than overflow, which is where
             a two-control card header usually breaks on a phone. */
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Reach period"
              value={period}
              onChange={setPeriod}
              options={SOCIAL_TREND_PERIODS}
            />
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
              className="w-full sm:w-40"
            />
          </div>
        }
      >
        {/* The headline sits above the plot rather than in the KPI strip, so
            the number and the shape that produced it are one object. */}
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl leading-none font-bold text-text-primary tabular-nums">
            {formatCount(summary.total)}
          </p>
          <p
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-medium",
              rising ? "text-success-text" : "text-error",
            )}
          >
            <TrendIcon className="size-3.5" aria-hidden />
            {Math.abs(summary.change).toFixed(1)}%
          </p>
          <p className="text-sm text-text-muted">
            vs previous {periodLabel.toLowerCase()}
            {platform === "all" ? "" : ` · ${PLATFORM_THEME[platform].label}`}
          </p>
        </div>

        <TrendChart
          categories={trend.labels}
          series={[
            { name: "Reach", data: current },
            { name: "Previous period", data: previous },
          ]}
          colors={[
            platform === "all" ? CHART_COLORS.primary : PLATFORM_THEME[platform].hex,
            CHART_COLORS.neutralStrong,
          ]}
          comparisonIndex={1}
          unit="accounts"
          height={280}
        />

        {/* The insight row. Four readings on one line, no cards - these are
            context for the chart above, not metrics in their own right. */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
          {[
            {
              label: "Total reach",
              value: formatCount(summary.total),
              hint: periodLabel.toLowerCase(),
            },
            {
              label: "Average reach",
              value: `${formatNumber(summary.perWeek)} / week`,
              hint: `over ${trend.labels.length} points`,
            },
            {
              label: "Growth",
              value: `${rising ? "+" : "−"}${Math.abs(summary.change).toFixed(1)}%`,
              hint: "vs previous period",
            },
            {
              label: "Best reach platform",
              value: PLATFORM_THEME[leader.platform].label,
              hint: `${formatNumber(leader.perWeek)} / week`,
            },
          ].map((cell) => (
            <div key={cell.label} className="min-w-0">
              <dt className="truncate text-sm text-text-muted">{cell.label}</dt>
              <dd className="mt-0.5 truncate text-base font-bold text-text-primary tabular-nums">
                {cell.value}
              </dd>
              <dd className="truncate text-sm text-text-muted">{cell.hint}</dd>
            </div>
          ))}
        </dl>
      </ChartCard>

      {unreportable.length > 0 ? (
        /*
         * Named, not generic.
         *
         * "Analytics unavailable" on its own sends a merchant looking for a
         * broken chart; naming the account and linking to the connection that
         * needs re-authorising is the difference between a dead end and a fix.
         */
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface-secondary px-4 py-3.5">
          <Info className="size-4 shrink-0 text-text-muted" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              Analytics unavailable for{" "}
              {unreportable.map((a) => PLATFORM_THEME[a.platform].label).join(", ")}.
            </span>{" "}
            Reconnect {unreportable.length === 1 ? "this account" : "these accounts"}{" "}
            and grant analytics access to include{" "}
            {unreportable.length === 1 ? "it" : "them"} in these figures.
          </p>
          <ButtonLink href={INTEGRATION_ROUTES.social} variant="outline" size="sm">
            Review Connection
          </ButtonLink>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {/* ----------------------------------------- 4. Platform comparison */}
        <PanelCard
          title="Platform Comparison"
          description="Which platform generates the reach, over the window above."
        >
          <ol className="divide-y divide-border">
            {platformReach.map((row, index) => (
              <li
                key={row.platform}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="w-3 shrink-0 text-xs font-bold text-text-muted tabular-nums">
                  {index + 1}
                </span>
                <PlatformMark platform={row.platform} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                  {PLATFORM_THEME[row.platform].label}
                </span>
                {/* The figure and the share it represents. No bar: the list is
                    already ordered, and a length would say a third time what
                    the position and the number have said twice. */}
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-text-primary tabular-nums">
                    {formatNumber(row.perWeek)} / week
                  </span>
                  <span className="block text-sm text-text-muted tabular-nums">
                    {formatPercent(rate(row.total, reachAcrossPlatforms || 1))} of
                    reach
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </PanelCard>

        {/* ---------------------------------------------- 5. Follower share */}
        <ChartCard
          title="Follower Share"
          description="Where the audience actually is."
          bodyClassName="mt-0 ml-0"
          footer={
            <ul className="space-y-1.5">
              {reportable.map((account) => (
                <li key={account.id} className="flex items-center gap-2 text-sm">
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
            labels={reportable.map(
              (account) => PLATFORM_THEME[account.platform].label,
            )}
            values={reportable.map((account) => account.followers)}
            colors={reportable.map(
              (account) => PLATFORM_THEME[account.platform].hex,
            )}
            centerLabel="Total followers"
            centerValue={formatNumber(followerTotal)}
            height={220}
          />
        </ChartCard>

        {/* ----------------------------------------------- 6. Best platform */}
        <PanelCard
          title="Best Platform"
          description="Engagement relative to audience size, not audience size."
          action={
            <InfoHint content="Engagement rate is likes, comments and shares as a share of reach - so a small audience that interacts beats a large one that scrolls past." />
          }
        >
          <div className="flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-subtle px-3.5 py-3">
            <PlatformMark platform={bestPlatform.platform} size="md" />
            <p className="min-w-0 flex-1 text-sm text-text-secondary">
              <span className="font-bold text-text-primary">
                {PLATFORM_THEME[bestPlatform.platform].label}
              </span>{" "}
              earns {formatPercent(bestPlatform.engagementRate)} on the smallest
              audience of the four.
            </p>
          </div>

          <ol className="mt-3 divide-y divide-border">
            {[...reportable]
              .sort((a, b) => b.engagementRate - a.engagementRate)
              .map((account) => (
                <li
                  key={account.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <PlatformMark platform={account.platform} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {PLATFORM_THEME[account.platform].label}
                    </span>
                    <span className="block text-sm text-text-muted tabular-nums">
                      {formatNumber(account.followers)} followers ·{" "}
                      {formatNumber(account.posts)} posts
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                    {formatPercent(account.engagementRate)}
                  </span>
                </li>
              ))}
          </ol>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* -------------------------------------------------- 7. Top posts */}
        <PanelCard
          title="Top Performing Posts"
          description="By engagement rate - interactions as a share of reach."
          className="xl:col-span-2"
        >
          {topPosts.length === 0 ? (
            <p className="rounded-panel border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
              No published posts in the selected period.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topPosts.map((post, index) => (
                <li
                  key={post.id}
                  className="flex items-center gap-3 rounded-panel border border-border p-2.5"
                >
                  <span className="w-3 shrink-0 text-xs font-bold text-text-muted tabular-nums">
                    {index + 1}
                  </span>

                  {/* The post's real asset - the same record the calendar, the
                      post grid and the Media Library draw. */}
                  <PostThumb post={post} size="lg" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {post.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1">
                      {post.platforms.map((key) => (
                        <PlatformMark key={key} platform={key} size="sm" />
                      ))}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-text-muted tabular-nums">
                      <span>{formatNumber(post.engagement.reach)} reach</span>
                      <span aria-hidden>·</span>
                      <span>{formatNumber(interactions(post))} interactions</span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-text-primary tabular-nums">
                      {formatPercent(
                        rate(interactions(post), post.engagement.reach),
                      )}
                    </p>
                    <p className="text-sm text-text-muted">engagement</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </PanelCard>

        {/* ------------------------------------------ 8. Best posting time */}
        <PanelCard
          title="Best Posting Time"
          description={`Engagement peaks between ${bestTime.label.replace("–", " and ")}.`}
        >
          {/* Rate and reach side by side, because they disagree and the
              disagreement is the point: the slot that reaches the most accounts
              is not the slot that earns the most from them. A badge marks the
              winner rather than five bars racing each other. */}
          <ul className="divide-y divide-border">
            {BEST_POSTING_TIMES.map((slot) => {
              const best = slot.label === bestTime.label;

              return (
                <li
                  key={slot.label}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm tabular-nums",
                        best
                          ? "font-bold text-text-primary"
                          : "font-medium text-text-secondary",
                      )}
                    >
                      {slot.label}
                    </span>
                    <span className="block text-sm text-text-muted tabular-nums">
                      {formatNumber(slot.reach)} avg reach
                    </span>
                  </span>

                  {best ? (
                    <Badge variant="primary" size="sm">
                      Best
                    </Badge>
                  ) : null}

                  <span
                    className={cn(
                      "w-12 shrink-0 text-right text-sm font-bold tabular-nums",
                      best ? "text-primary" : "text-text-primary",
                    )}
                  >
                    {formatPercent(slot.rate)}
                  </span>
                </li>
              );
            })}
          </ul>
        </PanelCard>
      </div>

      {/* --------------------------------------- 9. Engagement by platform */}
      <PanelCard
        title="Engagement by Platform"
        description="How people interacted, as opposed to how many of them saw it."
      >
        <Table minWidth="46rem">
          <THead>
            <TH>Platform</TH>
            <TH align="right">Likes</TH>
            <TH align="right">Comments</TH>
            <TH align="right">Shares</TH>
            <TH align="right">Total</TH>
            <TH align="right">Share</TH>
          </THead>

          <TBody>
            {engagementRows.rows.map((row) => (
              <TR key={row.key}>
                <TD>
                  <span className="flex items-center gap-2.5">
                    <PlatformMark platform={row.key} size="sm" />
                    <span className="font-semibold text-text-primary">
                      {PLATFORM_THEME[row.key].label}
                    </span>
                  </span>
                </TD>
                <TD align="right" className="text-text-secondary tabular-nums">
                  {formatNumber(row.likes)}
                </TD>
                <TD align="right" className="text-text-secondary tabular-nums">
                  {formatNumber(row.comments)}
                </TD>
                <TD align="right" className="text-text-secondary tabular-nums">
                  {formatNumber(row.shares)}
                </TD>
                <TD align="right" className="text-text-primary tabular-nums">
                  {formatNumber(row.total)}
                </TD>
                <TD align="right" className="text-text-secondary tabular-nums">
                  {formatPercent(rate(row.total, engagementRows.grand || 1))}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </PanelCard>
    </>
  );
}
