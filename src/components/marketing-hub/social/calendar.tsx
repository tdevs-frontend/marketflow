"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthStepper } from "@/components/ui/date-range";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PLATFORM_ORDER, PLATFORM_THEME } from "@/constants/channels";
import { CALENDAR_MONTH, POST_STATUSES, SOCIAL_POSTS } from "@/lib/social-fixtures";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PostStatus, SocialPlatform, SocialPost } from "@/types/social";
import { PlatformStack, PlatformDot } from "../shared/channel-badge";
import { PostStatusBadge, PostThumb, STATUS_RULE } from "./post-status";
import { PostComposer } from "./post-composer";

/**
 * The content calendar — the Social Planner's landing page.
 *
 * Dates are handled as local-naive strings, matching the fixtures: a content
 * calendar is read in the publisher's own timezone, and running these through
 * `new Date(iso + "Z")` would shift a 9am post into the previous day for half
 * the world.
 *
 * Three views because they answer different questions. Month is "is next week
 * covered", week is "is Tuesday too heavy", day is "what exactly goes out
 * today and in what order".
 */

const ALL = "all";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type View = "month" | "week" | "day";

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

/** `YYYY-MM-DD` for a local date, without a timezone round-trip. */
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/** A post's day, taken straight off the naive ISO string. */
const postDay = (post: SocialPost) => post.scheduledAt.slice(0, 10);

const postTime = (post: SocialPost) => post.scheduledAt.slice(11, 16);

/** Monday-first weekday index, which is how the grid is laid out. */
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

/** The 42-cell grid for a month: leading and trailing days included. */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - mondayIndex(first));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function weekGrid(anchor: Date): Date[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - mondayIndex(anchor));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

const monthLabel = (year: number, month: number) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );

const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

/**
 * A week's span, naming the month only where it changes.
 *
 * "29 Sep – 5 Oct" for a week crossing a boundary, "8 – 14 September" for one
 * inside a single month. The naive form — first date, last date, last month —
 * renders a cross-boundary week as "29–5 October", which is simply wrong.
 */
function weekLabel(from: Date, to: Date): string {
  const sameMonth = from.getMonth() === to.getMonth();
  const sameYear = from.getFullYear() === to.getFullYear();

  const short = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);

  if (sameMonth && sameYear) {
    return `${from.getDate()} – ${to.getDate()} ${monthLabel(
      to.getFullYear(),
      to.getMonth(),
    )}`;
  }

  const left = `${from.getDate()} ${short(from)}${sameYear ? "" : ` ${from.getFullYear()}`}`;
  const right = `${to.getDate()} ${short(to)} ${to.getFullYear()}`;
  return `${left} – ${right}`;
}

/**
 * Today's key, resolved on the client only.
 *
 * This page is statically prerendered, so reading the clock during render
 * yields the *build* date: the "today" ring would sit on the wrong day until
 * the next deploy, and disagree with the client on hydration. Returning an
 * empty server snapshot means no day is ringed in the prerendered HTML and the
 * real one lights up on hydration.
 *
 * `useSyncExternalStore` rather than an effect because that is exactly what it
 * is for — a value with different server and client snapshots — and it keeps
 * the component free of a state-set in an effect.
 */
const NEVER_CHANGES = () => () => {};

function useTodayKey(): string {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => dayKey(new Date()),
    () => "",
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

/** A post inside a month cell — the tightest form the card takes. */
function MonthCard({ post, onSelect }: { post: SocialPost; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-1.5 rounded border-l-2 bg-surface px-1.5 py-1 text-left transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none",
        STATUS_RULE[post.status],
      )}
    >
      <PlatformStack platforms={post.platforms} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] leading-tight font-medium text-text-primary">
          {post.title}
        </span>
        <span className="block text-[10px] text-text-muted tabular-nums">
          {postTime(post)}
        </span>
      </span>
    </button>
  );
}

/** A post in the week or day view, where there is room for the caption. */
function DetailCard({ post, onSelect }: { post: SocialPost; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-2.5 rounded-panel border border-border border-l-2 bg-surface p-2.5 text-left transition-all hover:border-border-strong hover:shadow-card focus-visible:shadow-focus focus-visible:outline-none",
        STATUS_RULE[post.status],
      )}
    >
      <PostThumb post={post} />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-medium text-text-primary">
            {post.title}
          </span>
          <span className="shrink-0 text-[10px] text-text-muted tabular-nums">
            {postTime(post)}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-text-muted">
          {post.caption}
        </span>
        <span className="mt-1.5 flex items-center gap-1.5">
          <PlatformStack platforms={post.platforms} size="sm" />
          <PostStatusBadge status={post.status} />
        </span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar                                                                   */
/* -------------------------------------------------------------------------- */

export function SocialCalendar() {
  const [view, setView] = useState<View>("month");
  /* Explicit `number`: `CALENDAR_MONTH` is `as const`, so inference would
     narrow these to the literals 2026 and 8. */
  const [year, setYear] = useState<number>(CALENDAR_MONTH.year);
  const [month, setMonth] = useState<number>(CALENDAR_MONTH.month);
  /* Anchors the week and day views. Kept apart from the month cursor so
     switching views does not lose your place. */
  const [anchor, setAnchor] = useState(
    () => new Date(CALENDAR_MONTH.year, CALENDAR_MONTH.month, 8),
  );

  const [platform, setPlatform] = useState<SocialPlatform | typeof ALL>(ALL);
  const [status, setStatus] = useState<PostStatus | typeof ALL>(ALL);
  const [selected, setSelected] = useState<SocialPost | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const posts = useMemo(
    () =>
      SOCIAL_POSTS.filter((post) => {
        if (platform !== ALL && !post.platforms.includes(platform)) return false;
        if (status !== ALL && post.status !== status) return false;
        return true;
      }),
    [platform, status],
  );

  /* Indexed by day so a cell is a lookup rather than a scan of every post. */
  const byDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const post of posts) {
      const key = postDay(post);
      map.set(key, [...(map.get(key) ?? []), post]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => postTime(a).localeCompare(postTime(b)));
    }
    return map;
  }, [posts]);

  const grid = useMemo(() => monthGrid(year, month), [year, month]);
  const week = useMemo(() => weekGrid(anchor), [anchor]);

  const todayKey = useTodayKey();
  const monthCount = posts.filter((post) => {
    const [postYear, postMonth] = postDay(post).split("-").map(Number);
    return postYear === year && postMonth === month + 1;
  }).length;

  function step(delta: number) {
    if (view === "month") {
      const next = new Date(year, month + delta, 1);
      setYear(next.getFullYear());
      setMonth(next.getMonth());
      return;
    }

    const next = new Date(anchor);
    next.setDate(anchor.getDate() + delta * (view === "week" ? 7 : 1));
    setAnchor(next);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function goToday() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setAnchor(today);
  }

  /*
   * The week label has to name both months when the week straddles them —
   * "29 Sep – 5 Oct", not "29–5 October". Same for a year boundary.
   */
  const stepperLabel =
    view === "month"
      ? monthLabel(year, month)
      : view === "week"
        ? weekLabel(week[0], week[6])
        : dayLabel(anchor);

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <MonthStepper
            label={stepperLabel}
            unit={view}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onToday={goToday}
          />

          <SegmentedControl
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "day", label: "Day" },
            ]}
          />

          <Select
            label="Filter by platform"
            size="sm"
            value={platform}
            onChange={(next) => setPlatform(next as SocialPlatform | typeof ALL)}
            options={[
              { value: ALL, label: "All platforms" },
              ...PLATFORM_ORDER.map((key) => ({
                value: key,
                label: PLATFORM_THEME[key].label,
              })),
            ]}
            className="w-full sm:w-40"
          />

          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => setStatus(next as PostStatus | typeof ALL)}
            options={[{ value: ALL, label: "All statuses" }, ...POST_STATUSES]}
            className="w-full sm:w-36"
          />

          <div className="flex items-center gap-2.5 max-lg:w-full lg:ml-auto">
            <p className="text-xs whitespace-nowrap text-text-muted">
              {formatNumber(monthCount)} posts this month
            </p>
            <Button
              size="compact"
              onClick={() => setComposeOpen(true)}
              className="max-lg:flex-1"
            >
              <Plus aria-hidden />
              Create Post
            </Button>
          </div>
        </div>

        {/* Status key. Cells carry status as a border colour, so it needs one. */}
        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3">
          {POST_STATUSES.map((item) => (
            <li
              key={item.value}
              className="inline-flex items-center gap-1.5 text-[11px] text-text-muted"
            >
              <span
                aria-hidden
                className={cn(
                  "h-3 w-0.5 rounded-full border-l-2",
                  STATUS_RULE[item.value],
                )}
              />
              {item.label}
            </li>
          ))}

          <li className="ml-auto flex items-center gap-3">
            {PLATFORM_ORDER.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[11px] text-text-muted"
              >
                <PlatformDot platform={key} />
                {PLATFORM_THEME[key].label}
              </span>
            ))}
          </li>
        </ul>
      </Card>

      {/* ------------------------------------------------------------- Month */}
      {view === "month" ? (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border bg-surface-secondary">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Six rows of seven. `auto-rows-fr` keeps cells even when one day
              holds three posts and its neighbours hold none. */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {grid.map((date, index) => {
              const key = dayKey(date);
              const inMonth = date.getMonth() === month;
              const isToday = key === todayKey;
              const dayPosts = byDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 space-y-1 border-b border-r border-border p-1.5 sm:min-h-28",
                    /* No right border on the last column, no bottom on the
                       last row — the card's own border closes the grid. */
                    (index + 1) % 7 === 0 && "border-r-0",
                    index >= 35 && "border-b-0",
                    !inMonth && "bg-surface-secondary/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full text-[11px] font-medium tabular-nums",
                        isToday
                          ? "bg-primary text-white"
                          : inMonth
                            ? "text-text-secondary"
                            : "text-text-muted",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayPosts.length > 2 ? (
                      <span className="text-[10px] text-text-muted">
                        {dayPosts.length}
                      </span>
                    ) : null}
                  </div>

                  {dayPosts.slice(0, 2).map((post) => (
                    <MonthCard
                      key={post.id}
                      post={post}
                      onSelect={() => setSelected(post)}
                    />
                  ))}

                  {dayPosts.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAnchor(date);
                        setView("day");
                      }}
                      className="w-full rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      +{dayPosts.length - 2} more
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* -------------------------------------------------------------- Week */}
      {view === "week" ? (
        <Card className="overflow-hidden p-0">
          {/* Seven columns on desktop; stacked below `lg`, where seven 100px
              columns would be unreadable. */}
          <div className="grid lg:grid-cols-7">
            {week.map((date, index) => {
              const key = dayKey(date);
              const isToday = key === todayKey;
              const dayPosts = byDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={cn(
                    "border-b border-border p-2.5 lg:border-r",
                    index === 6 && "border-b-0 lg:border-r-0",
                    isToday && "bg-primary-subtle",
                  )}
                >
                  <div className="flex items-baseline gap-1.5 pb-2">
                    <span className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
                      {WEEKDAYS[index]}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        isToday ? "text-primary" : "text-text-primary",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayPosts.length > 0 ? (
                      <span className="ml-auto text-[10px] text-text-muted">
                        {dayPosts.length}
                      </span>
                    ) : null}
                  </div>

                  {dayPosts.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setComposeOpen(true)}
                      className="w-full rounded-panel border border-dashed border-border px-2 py-3 text-[11px] text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {dayPosts.map((post) => (
                        <DetailCard
                          key={post.id}
                          post={post}
                          onSelect={() => setSelected(post)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* --------------------------------------------------------------- Day */}
      {view === "day" ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-base">{dayLabel(anchor)}</h2>
              <p className="mt-0.5 text-xs text-text-muted">
                {(byDay.get(dayKey(anchor)) ?? []).length} posts scheduled
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
              <Plus aria-hidden />
              Add to this day
            </Button>
          </div>

          {(byDay.get(dayKey(anchor)) ?? []).length === 0 ? (
            <EmptyState
              title="Nothing scheduled for this day"
              description="An empty day in a content calendar is a decision, not a gap — but if it was not deliberate, now is the time to fill it."
              action={
                <Button size="sm" onClick={() => setComposeOpen(true)}>
                  <Plus aria-hidden />
                  Create Post
                </Button>
              }
            />
          ) : (
            /* A time rail, because the day view's job is ordering. */
            <ol className="mt-4 space-y-3">
              {(byDay.get(dayKey(anchor)) ?? []).map((post) => (
                <li key={post.id} className="flex gap-3">
                  <div className="w-12 shrink-0 pt-2.5 text-right">
                    <p className="text-[11px] font-medium text-text-secondary tabular-nums">
                      {postTime(post)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <DetailCard post={post} onSelect={() => setSelected(post)} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      ) : null}

      {/* -------------------------------------------------------- Post detail */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Post"}
        description={
          selected
            ? `${selected.platforms.map((p) => PLATFORM_THEME[p].label).join(", ")} · ${selected.scheduledAt.replace("T", " at ")}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button size="compact" onClick={() => setSelected(null)}>
              Edit post
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PostThumb post={selected} size="lg" />
              <div className="min-w-0">
                <PlatformStack platforms={selected.platforms} />
                <div className="mt-1.5">
                  <PostStatusBadge status={selected.status} />
                </div>
              </div>
            </div>

            <p className="rounded-panel bg-surface-secondary px-3.5 py-3 text-[13px] leading-relaxed text-text-secondary">
              {selected.caption}
            </p>

            {selected.hashtags.length > 0 ? (
              <p className="text-[13px] text-primary">
                {selected.hashtags.join(" ")}
              </p>
            ) : null}

            {selected.failureReason ? (
              <p className="rounded-panel border border-error/25 bg-error-soft px-3 py-2.5 text-xs text-error-text">
                {selected.failureReason}
              </p>
            ) : null}

            {selected.status === "published" ? (
              <dl className="grid grid-cols-3 gap-2">
                {[
                  { label: "Reach", value: formatNumber(selected.engagement.reach) },
                  { label: "Likes", value: formatNumber(selected.engagement.likes) },
                  {
                    label: "Comments",
                    value: formatNumber(selected.engagement.comments),
                  },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-panel border border-border px-3 py-2.5 text-center"
                  >
                    <dt className="text-[10px] tracking-[0.06em] text-text-muted uppercase">
                      {cell.label}
                    </dt>
                    <dd className="mt-0.5 text-base font-bold text-text-primary tabular-nums">
                      {cell.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <CalendarDays className="size-3.5" aria-hidden />
                Engagement appears here once the post is published.
              </p>
            )}

            <p className="text-[11px] text-text-muted">Created by {selected.author}</p>
          </div>
        ) : null}
      </Dialog>

      <PostComposer open={composeOpen} onClose={() => setComposeOpen(false)} />
    </>
  );
}
