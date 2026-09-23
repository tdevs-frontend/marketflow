"use client";

import { useSyncExternalStore } from "react";

import { SOCIAL_POSTS } from "@/lib/social-fixtures";
import type { PostStatus, SocialPost } from "@/types/social";

/**
 * The Social Planner's posts, plus whatever has been changed this session.
 *
 * `SOCIAL_POSTS` is a frozen fixture that the calendar, the post list and the
 * analytics leaderboard each read directly, which is why every write in the
 * module was a toast: there was nowhere for an edit to go. The calendar's
 * "Edit post" button closed its own dialog and did nothing, and the composer's
 * Schedule button announced a post it never created. This is the shelf those
 * actions were missing.
 *
 * The same shape as `lib/media-store`, deliberately - one module-level array
 * behind a `useSyncExternalStore` subscription, so every surface reading it
 * re-renders together. Editing a caption in the calendar changes the caption
 * on the Posts page and in Top Performing Posts, because all three are reading
 * one list rather than three copies of one.
 *
 * Session-scoped and honestly so. There is no service behind this; a reload
 * starts from the fixtures again. Persisting would mean writing post records
 * whose media may be `blob:` URLs from a tab that has since closed, and a
 * calendar full of broken images on Monday is worse than a clean slate.
 */

/* The server renders the fixtures, so the first client snapshot has to be the
   identical array or hydration disagrees with itself. */
let snapshot: SocialPost[] = SOCIAL_POSTS;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: SocialPost[]) {
  snapshot = next;
  for (const listener of listeners) listener();
}

/** Every post, newest edits included. */
export function useSocialPosts(): SocialPost[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SOCIAL_POSTS,
  );
}

/** One post by id, or `null`. For a surface holding an id across a re-render. */
export function useSocialPost(id: string | null): SocialPost | null {
  const posts = useSocialPosts();
  return id === null ? null : (posts.find((post) => post.id === id) ?? null);
}

/**
 * The fields a composer may write.
 *
 * Engagement is not among them: it is reported by the platform, not typed by
 * the person editing, and letting an editor set it would make the analytics
 * page a fiction. `id` is absent for the same reason - an edit that could
 * change the identity of the record is a duplicate with extra steps.
 */
export interface PostDraft {
  title: string;
  caption: string;
  hashtags: string[];
  platforms: SocialPost["platforms"];
  mediaIds: string[];
  scheduledAt: string;
  status: PostStatus;
}

/**
 * Apply a patch to one post, in place in the list.
 *
 * Returns the updated record, or `null` when the id is unknown - which the
 * caller should surface rather than swallow, because the only way to get here
 * with a bad id is a stale reference to something already deleted.
 */
export function updateSocialPost(
  id: string,
  patch: Partial<SocialPost>,
): SocialPost | null {
  const index = snapshot.findIndex((post) => post.id === id);
  if (index === -1) return null;

  /* Spread over the existing record, so anything the composer does not know
     about - engagement, publishedAt, the failure reason - survives the edit. */
  const updated: SocialPost = { ...snapshot[index], ...patch, id };

  const next = [...snapshot];
  next[index] = updated;
  commit(next);

  return updated;
}

let sequence = 0;

/** A new post, at the front of the list so it is where the author left it. */
export function createSocialPost(draft: PostDraft, author: string): SocialPost {
  sequence += 1;

  const post: SocialPost = {
    id: `sp-new-${Date.now().toString(36)}-${sequence}`,
    ...draft,
    author,
    createdAt: new Date().toISOString().slice(0, 19),
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  };

  commit([post, ...snapshot]);
  return post;
}

export function deleteSocialPost(id: string): boolean {
  const next = snapshot.filter((post) => post.id !== id);
  if (next.length === snapshot.length) return false;
  commit(next);
  return true;
}

/**
 * Copy a post as a fresh draft.
 *
 * A duplicate is a starting point, not a clone: it comes back as a draft with
 * no engagement, because carrying the original's reach would put invented
 * numbers into the analytics leaderboard the moment it was saved.
 */
export function duplicateSocialPost(id: string): SocialPost | null {
  const source = snapshot.find((post) => post.id === id);
  if (!source) return null;

  sequence += 1;

  const copy: SocialPost = {
    ...source,
    id: `sp-copy-${Date.now().toString(36)}-${sequence}`,
    title: `${source.title} (copy)`,
    status: "draft",
    publishedAt: undefined,
    failureReason: undefined,
    createdAt: new Date().toISOString().slice(0, 19),
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  };

  commit([copy, ...snapshot]);
  return copy;
}

/**
 * Whether a post's schedule may still be moved.
 *
 * A published post has already gone out; its `scheduledAt` is a record of when
 * that happened, not a plan, and editing it would rewrite history. Everything
 * else - draft, scheduled, failed - is still ahead of the send.
 */
export const canReschedule = (status: PostStatus) => status !== "published";
