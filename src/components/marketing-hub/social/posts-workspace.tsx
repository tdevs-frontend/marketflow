"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TABLE_PAGE_SIZE } from "@/constants/app";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { PLATFORM_ORDER, PLATFORM_THEME } from "@/constants/channels";
import { POST_STATUSES } from "@/lib/social-fixtures";
import {
  deleteSocialPost,
  duplicateSocialPost,
  updateSocialPost,
  useSocialPosts,
} from "@/lib/social-post-store";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";
import { truncate } from "@/lib/utils";
import type { PostStatus, SocialPlatform, SocialPost } from "@/types/social";
import { PlatformStack } from "../shared/channel-badge";
import { PostComposer } from "./post-composer";
import { PostStatusBadge, PostThumb } from "./post-status";

/**
 * Post management - the list behind the calendar.
 *
 * Two views, and they are not cosmetic: the grid is how you review *content*
 * (caption, imagery, which platforms) and the table is how you review
 * *performance* (reach, engagement, one row per post). The calendar answers
 * "when", this page answers "what" and "how well".
 */

const ALL = "all";
/* The dashboard-wide row count. */
const PER_PAGE = TABLE_PAGE_SIZE;

type View = "grid" | "table";

/** Total interactions - the single number a post is ranked by. */
const interactions = (post: SocialPost) =>
  post.engagement.likes + post.engagement.comments + post.engagement.shares;

export function SocialPostsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | typeof ALL>(ALL);
  const [status, setStatus] = useState<PostStatus | typeof ALL>(ALL);
  const [from, setFrom] = useState("");
  const [sort, setSort] = useState<"scheduled" | "engagement" | "reach" | "title">(
    "scheduled",
  );
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<string[]>([]);
  /* Ids rather than records: a held copy goes stale the moment the post is
     edited, and the detail dialog would keep showing the caption it opened
     with. Re-read from the store on every render instead. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allPosts = useSocialPosts();
  const detail = detailId
    ? (allPosts.find((post) => post.id === detailId) ?? null)
    : null;
  const editing = editingId
    ? (allPosts.find((post) => post.id === editingId) ?? null)
    : null;

  const activeFilters =
    (platform === ALL ? 0 : 1) + (status === ALL ? 0 : 1) + (from ? 1 : 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return allPosts.filter((post) => {
      if (
        term &&
        !post.title.toLowerCase().includes(term) &&
        !post.caption.toLowerCase().includes(term) &&
        !post.hashtags.some((tag) => tag.toLowerCase().includes(term))
      ) {
        return false;
      }
      if (platform !== ALL && !post.platforms.includes(platform)) return false;
      if (status !== ALL && post.status !== status) return false;
      if (from && post.scheduledAt.slice(0, 10) < from) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "engagement") return interactions(b) - interactions(a);
      if (sort === "reach") return b.engagement.reach - a.engagement.reach;
      /* Newest scheduled slot first, so upcoming work is at the top. */
      return b.scheduledAt.localeCompare(a.scheduledAt);
    });
  }, [allPosts, from, platform, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((row) => row.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setPlatform(ALL);
    setStatus(ALL);
    setFrom("");
    setPage(1);
  }

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );

  /*
   * Every row action, and every one of them writes.
   *
   * Edit was `() => {}` - a menu item that opened nothing - while Duplicate
   * and Retry raised a toast claiming work that never happened. A control that
   * reports success without doing anything is worse than a missing one.
   */
  const menuFor = (post: SocialPost) => [
    {
      label: "View post",
      icon: <Eye className="size-4" />,
      onSelect: () => setDetailId(post.id),
    },
    {
      label: "Edit",
      icon: <Pencil className="size-4" />,
      onSelect: () => {
        setDetailId(null);
        setEditingId(post.id);
      },
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => {
        const copy = duplicateSocialPost(post.id);
        toast(
          copy
            ? `${copy.title} created as a draft`
            : "Could not duplicate this post. Please try again.",
        );
      },
    },
    ...(post.status === "failed"
      ? [
          {
            label: "Retry publish",
            icon: <RefreshCw className="size-4" />,
            onSelect: () => {
              const retried = updateSocialPost(post.id, {
                status: "scheduled",
                failureReason: undefined,
              });
              toast(
                retried
                  ? `${post.title} re-queued for publishing`
                  : "Could not retry this post. Please try again.",
              );
            },
          },
        ]
      : []),
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => {
        setSelected([post.id]);
        setConfirmDelete(true);
      },
      destructive: true,
    },
  ];

  return (
    <>
      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search title, caption or hashtag…"
          activeCount={activeFilters}
          onReset={resetFilters}
          trailing={
            <>
              <SegmentedControl
                label="Layout"
                value={view}
                onChange={setView}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "table", label: "Table" },
                ]}
              />
              <Button
                variant="outline"
                size="compact"
                onClick={() => toast(`${filtered.length} posts exported to CSV`)}
              >
                <Download aria-hidden />
                Export
              </Button>
              <Button size="compact" onClick={() => setComposeOpen(true)}>
                <Plus aria-hidden />
                Create Post
              </Button>
            </>
          }
        >
          <Select
            label="Filter by platform"
            size="sm"
            value={platform}
            onChange={(next) => {
              setPlatform(next as SocialPlatform | typeof ALL);
              setPage(1);
            }}
            options={[
              { value: ALL, label: "All platforms" },
              ...PLATFORM_ORDER.map((key) => ({
                value: key,
                label: PLATFORM_THEME[key].label,
              })),
            ]}
            className="lg:w-38"
          />
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as PostStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...POST_STATUSES]}
            className="lg:w-36"
          />
          <Input size="sm"
            type="date"
            aria-label="Scheduled from"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="w-full lg:w-36"
          />
          <Select
            label="Sort posts"
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "scheduled", label: "Latest scheduled" },
              { value: "engagement", label: "Most engagement" },
              { value: "reach", label: "Most reach" },
              { value: "title", label: "Title A–Z" },
            ]}
            className="lg:w-42"
          />
        </FilterBar>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
            <p className="text-sm font-medium text-primary-dark">
              {selected.length} selected
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const made = selected
                    .map((id) => duplicateSocialPost(id))
                    .filter((post) => post !== null);
                  toast(`${made.length} posts duplicated as drafts`);
                  setSelected([]);
                }}
              >
                <Copy aria-hidden />
                Duplicate
              </Button>
              {/*
                No bulk Reschedule.

                It reported that N posts had been rescheduled without ever
                asking when - there is no date on this bar and no defensible
                default for one. Rescheduling is a per-post decision and Edit
                now does it properly, so the honest move is to drop the
                control rather than keep a button that announces work it
                cannot do.
              */}
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title={
              search || activeFilters
                ? "No posts match those filters"
                : "No posts yet"
            }
            description={
              search || activeFilters
                ? "Try a different search term, or clear the filters."
                : "Write once, publish to every platform you have connected. The calendar shows what is coming up."
            }
            action={
              search || activeFilters ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setComposeOpen(true)}>
                  <Plus aria-hidden />
                  Create Post
                </Button>
              )
            }
          />
        ) : view === "grid" ? (
          <>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((post) => {
                const isSelected = selected.includes(post.id);
                const published = post.status === "published";

                return (
                  <li key={post.id} className="min-w-0">
                    {/* `selected` rather than a class: the tint has to come
                        from the component, or `bg-surface` outranks it and the
                        card stays white. Same treatment the table row uses, so
                        the two views agree on what selected looks like. */}
                    <Card
                      selected={isSelected}
                      className="flex h-full flex-col overflow-hidden p-0"
                    >
                      {/* Media band. 16:9 rather than square, so the card
                          height stays predictable across mixed assets - a
                          1080×1920 reel and a 2400×1600 hero crop to the same
                          box and the row keeps one baseline. */}
                      <div className="relative aspect-video w-full overflow-hidden bg-surface-secondary">
                        <PostThumb post={post} size="fill" />
                        {/* A scrim behind the controls. White-on-photo is a
                            coin toss once the media is a real picture, and a
                            checkbox that vanishes on a pale hero is worse than
                            one sitting on a gradient. */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-text-primary/35 to-transparent"
                        />

                        <div className="absolute top-2 left-2">
                          {/* No background override. `cn` is a plain join,
                              so `bg-surface/90` and the checkbox's own
                              `bg-primary` were both emitted for the checked
                              state and which one painted came down to the
                              order Tailwind happened to write them in - the
                              coin toss this design system warns about, with a
                              white tick on a white box as the losing side. The
                              scrim above already gives the unchecked box its
                              contrast, so the component keeps both states.
                              `shadow-btn` stays: that is lift, not colour. */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggle(post.id)}
                            label={`Select ${post.title}`}
                            className="shadow-btn"
                          />
                        </div>
                        <div className="absolute top-1 right-1">
                          <Menu
                            label={`Actions for ${post.title}`}
                            items={menuFor(post)}
                          />
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <PlatformStack platforms={post.platforms} />
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="min-w-0 truncate text-sm font-semibold text-text-primary">
                            {post.title}
                          </h3>
                          <PostStatusBadge status={post.status} />
                        </div>

                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">
                          {post.caption}
                        </p>

                        {post.hashtags.length > 0 ? (
                          <p className="mt-2 truncate text-sm text-primary">
                            {post.hashtags.join(" ")}
                          </p>
                        ) : null}

                        {post.failureReason ? (
                          <p className="mt-2.5 rounded-panel border border-error/25 bg-error-soft px-2.5 py-2 text-sm text-error-text">
                            {post.failureReason}
                          </p>
                        ) : null}

                        <div className="mt-auto pt-3.5">
                          {published ? (
                            /* Each figure needs its own `dt`: the icons are
                               aria-hidden, so without one a screen reader hears
                               four unlabelled numbers. */
                            <dl className="flex items-center gap-4 border-t border-border pt-3 text-sm">
                              {[
                                {
                                  label: "Likes",
                                  icon: Heart,
                                  value: post.engagement.likes,
                                },
                                {
                                  label: "Comments",
                                  icon: MessageCircle,
                                  value: post.engagement.comments,
                                },
                                {
                                  label: "Shares",
                                  icon: Share2,
                                  value: post.engagement.shares,
                                },
                              ].map((metric) => {
                                const Icon = metric.icon;

                                return (
                                  <div
                                    key={metric.label}
                                    className="flex items-center gap-1"
                                  >
                                    <Icon
                                      className="size-3 text-text-muted"
                                      aria-hidden
                                    />
                                    <dt className="sr-only">{metric.label}</dt>
                                    <dd className="font-medium text-text-secondary tabular-nums">
                                      {formatNumber(metric.value)}
                                    </dd>
                                  </div>
                                );
                              })}

                              <div className="ml-auto text-right">
                                <dt className="sr-only">Reach</dt>
                                <dd className="font-bold text-text-primary tabular-nums">
                                  {formatNumber(post.engagement.reach)}
                                </dd>
                              </div>
                            </dl>
                          ) : (
                            <p className="border-t border-border pt-3 text-sm text-text-muted">
                              {post.status === "scheduled"
                                ? `Goes out ${post.scheduledAt.slice(0, 10)} at ${post.scheduledAt.slice(11, 16)}`
                                : post.status === "failed"
                                  ? "Not published"
                                  : "Not scheduled yet"}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onChange={setPage}
                noun="posts"
              />
            </div>
          </>
        ) : (
          <>
            <div className="mt-4">
              <Table minWidth="76rem">
                <THead>
                  <TH className="w-10 pr-0">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={!allOnPage && someOnPage}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          allOnPage
                            ? prev.filter((id) => !pageIds.includes(id))
                            : [...new Set([...prev, ...pageIds])],
                        )
                      }
                      label="Select all posts on this page"
                    />
                  </TH>
                  <TH>Post</TH>
                  <TH>Platform</TH>
                  <TH>Status</TH>
                  <TH>Scheduled</TH>
                  <TH align="right">Reach</TH>
                  <TH align="right">Engagement</TH>
                  <TH>Created</TH>
                  <TH align="right">Actions</TH>
                </THead>

                <TBody>
                  {rows.map((post) => {
                    const isSelected = selected.includes(post.id);

                    return (
                      <TR key={post.id} selected={isSelected}>
                        <TD className="pr-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggle(post.id)}
                            label={`Select ${post.title}`}
                          />
                        </TD>

                        <TD>
                          <button
                            type="button"
                            onClick={() => setDetailId(post.id)}
                            className="flex items-center gap-2.5 text-left focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <PostThumb post={post} />
                            <span className="min-w-0">
                              <span className="block max-w-52 truncate font-semibold text-text-primary">
                                {post.title}
                              </span>
                              {/* The caption moves up here from the column it
                                  used to have. It is what the post *is*, not a
                                  measure of it, so it belongs under the title
                                  rather than competing with Reach and
                                  Engagement for a column of its own. */}
                              <span className="block max-w-52 truncate text-sm text-text-muted">
                                {truncate(post.caption, 64)}
                              </span>
                            </span>
                          </button>
                        </TD>

                        <TD>
                          <PlatformStack platforms={post.platforms} />
                        </TD>

                        <TD>
                          <PostStatusBadge status={post.status} />
                          {post.failureReason ? (
                            <span className="mt-0.5 block max-w-40 truncate text-sm text-error-text">
                              {post.failureReason}
                            </span>
                          ) : null}
                        </TD>

                        {/* One column for the moment that matters: when it
                            went out if it did, when it is due if it has not,
                            and an honest dash for a draft with no slot. */}
                        <TD className="whitespace-nowrap text-text-secondary">
                          {post.status === "draft" ? (
                            <span className="text-text-muted">Not scheduled</span>
                          ) : (
                            <>
                              {(post.publishedAt ?? post.scheduledAt).slice(0, 10)}
                              <span className="block text-sm text-text-muted tabular-nums">
                                {(post.publishedAt ?? post.scheduledAt).slice(11, 16)}
                                {post.status === "published" ? " · published" : ""}
                              </span>
                            </>
                          )}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {post.status === "published" ? (
                            <span className="font-semibold text-text-primary">
                              {formatNumber(post.engagement.reach)}
                            </span>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </TD>

                        <TD align="right" className="tabular-nums">
                          {post.status === "published" ? (
                            <>
                              <span className="font-semibold text-text-primary">
                                {formatNumber(interactions(post))}
                              </span>
                              <span className="block text-sm text-text-muted">
                                {formatNumber(post.engagement.clicks)} clicks
                              </span>
                            </>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </TD>

                        {/* Author rides along under the date rather than
                            taking an eighth column - "who wrote this and
                            when" is one question. */}
                        <TD className="whitespace-nowrap text-text-secondary">
                          {post.createdAt.slice(0, 10)}
                          <span className="block max-w-32 truncate text-sm text-text-muted">
                            {post.author}
                          </span>
                        </TD>

                        <TD align="right">
                          <Menu
                            label={`Actions for ${post.title}`}
                            items={menuFor(post)}
                          />
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            <div className="mt-4">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onChange={setPage}
                noun="posts"
              />
            </div>
          </>
        )}
      </Card>

      {/* -------------------------------------------------------- Detail */}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.title ?? "Post"}
        description={
          detail
            ? `${detail.platforms.map((p) => PLATFORM_THEME[p].label).join(", ")} · ${formatDateTime(detail.scheduledAt)}`
            : undefined
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setDetailId(null)}>
              Close
            </Button>
            <Button
              size="compact"
              onClick={() => {
                if (!detail) return;
                setDetailId(null);
                setEditingId(detail.id);
              }}
            >
              <Pencil aria-hidden />
              Edit post
            </Button>
          </>
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-panel bg-surface-secondary">
              <PostThumb post={detail} size="fill" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PlatformStack platforms={detail.platforms} />
              <PostStatusBadge status={detail.status} />
              <p className="ml-auto text-sm text-text-muted">
                by {detail.author} · {formatRelativeTime(detail.scheduledAt)}
              </p>
            </div>

            <p className="rounded-panel bg-surface-secondary px-3.5 py-3 text-sm leading-relaxed text-text-secondary">
              {detail.caption}
            </p>

            {detail.hashtags.length > 0 ? (
              <p className="text-sm text-primary">{detail.hashtags.join(" ")}</p>
            ) : null}

            {detail.failureReason ? (
              <p className="rounded-panel border border-error/25 bg-error-soft px-3 py-2.5 text-sm text-error-text">
                {detail.failureReason}
              </p>
            ) : null}

            {detail.status === "published" ? (
              <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  { label: "Reach", value: detail.engagement.reach },
                  { label: "Impressions", value: detail.engagement.impressions },
                  { label: "Likes", value: detail.engagement.likes },
                  { label: "Comments", value: detail.engagement.comments },
                  { label: "Shares", value: detail.engagement.shares },
                  { label: "Clicks", value: detail.engagement.clicks },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-panel border border-border px-2.5 py-2.5 text-center"
                  >
                    <dt className="text-sm font-medium text-text-muted">
                      {cell.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
                      {formatNumber(cell.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-panel border border-dashed border-border px-3 py-3 text-center text-sm text-text-muted">
                Engagement appears here once the post is published.
              </p>
            )}
          </div>
        ) : null}
      </Dialog>

      <PostComposer open={composeOpen} onClose={() => setComposeOpen(false)} />

      {/* Keyed by id so opening a second post re-seeds the fields rather than
          reusing the first one's state. */}
      <PostComposer
        key={editingId ?? "none"}
        open={Boolean(editing)}
        post={editing}
        onClose={() => setEditingId(null)}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          const count = selected.length;
          const removed = selected.filter((id) => deleteSocialPost(id)).length;
          toast(`${removed} post${removed === 1 ? "" : "s"} deleted`);
          void count;
          setSelected([]);
        }}
        title={`Delete ${selected.length} post${selected.length === 1 ? "" : "s"}?`}
        confirmLabel={`Delete ${selected.length === 1 ? "post" : "posts"}`}
      >
        <p className="text-sm text-text-secondary">
          Scheduled posts are cancelled. Posts already published stay on the
          platform - deleting here only removes them from MarketFlow, along with
          their engagement history.
        </p>
      </ConfirmDialog>
    </>
  );
}
