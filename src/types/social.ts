/**
 * Social Planner.
 *
 * A post is multi-platform by design — the same caption goes to Instagram and
 * Facebook in one action — so `platforms` is a list, and the calendar renders
 * one card per post rather than one per platform.
 */

export type SocialPlatform = "instagram" | "facebook" | "linkedin" | "x";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
}

export interface SocialPost {
  id: string;
  /** Short internal name, for the list and the calendar card. */
  title: string;
  caption: string;
  hashtags: string[];
  platforms: SocialPlatform[];
  status: PostStatus;
  mediaIds: string[];
  /** ISO. The scheduled slot, or the publish time once it has gone out. */
  scheduledAt: string;
  publishedAt?: string;
  author: string;
  engagement: PostEngagement;
  /** Set on `failed` — the calendar card says why without a round trip. */
  failureReason?: string;
}

export type MediaType = "image" | "video";

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  folderId: string;
  /** Bytes. */
  size: number;
  width: number;
  height: number;
  /** Seconds, videos only. */
  duration?: number;
  tags: string[];
  /**
   * Placeholder swatch class. Real thumbnails come from the asset URL; until
   * then a flat tinted tile reads as "an image goes here" without pretending
   * to be a stock photo.
   */
  tone: string;
  uploadedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
}

export type AccountStatus = "connected" | "expired" | "disconnected";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  name: string;
  username: string;
  status: AccountStatus;
  followers: number;
  /** Signed percentage change over the period. */
  followerChange: number;
  posts: number;
  engagementRate: number;
  lastSyncedAt: string;
  /** Scopes granted at connect time, shown on the manage panel. */
  permissions: string[];
}
