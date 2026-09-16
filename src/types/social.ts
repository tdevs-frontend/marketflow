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
  /**
   * The thumbnail, where there is one.
   *
   * Optional because the fixtures have none — they are swatches, and inventing
   * stock photography for them would make an empty library look finished. A
   * file uploaded through `lib/media-store` does have one, so anything
   * rendering an asset shows the real thing when it can and the `tone` swatch
   * when it cannot.
   */
  url?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
}

export type AccountStatus = "connected" | "expired" | "disconnected";

/* -------------------------------------------------------------------------- */
/* Connection layer                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The connection half of a social account.
 *
 * These fields describe the *authorisation*, not the audience — who granted it,
 * what it is allowed to do, and whether it still works. They live on
 * `SocialAccount` rather than in a parallel record in the Integrations module
 * because there is one connected account, and two datasets describing it is how
 * the Planner ends up publishing to a page Integrations thinks is disconnected.
 *
 * Integrations → Social owns these. Marketing → Social Planner reads them.
 */

/** What MarketFlow can do with an account, independent of any one provider. */
export type SocialCapabilityKey = "publish" | "analytics" | "comments" | "media";

/**
 * Whether a capability actually works right now.
 *
 * `needs_reauth` is kept apart from `missing` because the fix differs: one was
 * never granted and may not be available on the plan, the other was granted and
 * has lapsed — and only the second is fixed by pressing Reconnect.
 */
export type CapabilityState = "granted" | "missing" | "needs_reauth";

export interface SocialCapability {
  key: SocialCapabilityKey;
  state: CapabilityState;
  /** Why it is not granted. Only set when `state` is not `granted`. */
  detail?: string;
}

/**
 * Authorisation health, as its own scale.
 *
 * Social APIs fail differently from an SMTP host: the credential is a token
 * that expires on a schedule, so "working" and "working for another 18 days"
 * are genuinely different states and a merchant needs the warning before the
 * scheduled posts start failing. `expiring_soon` is the whole reason this is
 * not a boolean.
 */
export type AuthStatus =
  | "healthy"
  | "expiring_soon"
  | "expired"
  | "permission_missing"
  | "disconnected";

export interface SocialAuth {
  status: AuthStatus;
  /**
   * ISO expiry of the current access token, where the provider issues one that
   * expires. `null` for providers with non-expiring page tokens.
   *
   * The token itself is deliberately absent from this model. Nothing in the
   * client ever needs it, and a field that does not exist cannot be rendered
   * into a DOM node by accident.
   */
  expiresAt: string | null;
  /** Who authorised it, for the audit line on the detail panel. */
  connectedBy: string;
  connectedAt: string;
}

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

  /* ---------------------------------------------------------- Connection */

  /**
   * What this is on the provider's side — "Facebook Page", "Instagram Business
   * account", "LinkedIn Organization". Providers model their resources
   * differently and the noun is part of what the merchant recognises.
   */
  accountType: string;
  /** The provider's own id for the resource. Safe to show; not a credential. */
  externalId: string;
  auth: SocialAuth;
  capabilities: SocialCapability[];
  /** Integration behaviour only — what the Planner is *allowed* to do. */
  publishing: {
    enabled: boolean;
    /** Offered to Social Planner as a publish target. */
    availableToPlanner: boolean;
    /** IANA zone the provider schedules against. */
    timezone: string;
  };
  /** Posts pushed through this account today. */
  postsToday: number;
}

/** A row in the connection-level event log — syncs, refreshes, failures. */
export interface SocialActivityEvent {
  id: string;
  accountId: string;
  platform: SocialPlatform;
  message: string;
  status: "success" | "warning" | "error";
  at: string;
}

/* -------------------------------------------------------------------------- */
/* Provider catalogue                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A platform MarketFlow can connect, whether or not it is built yet.
 *
 * `platform` is `null` for a provider with no publishing pipeline behind it —
 * that is what makes "Coming Soon" honest rather than a card that pretends to
 * connect. Keeping availability in the catalogue means the connect dialog, the
 * hub card and the empty states all agree without any of them special-casing a
 * vendor name.
 */
export type ProviderAvailability = "available" | "coming_soon";

export interface SocialProvider {
  id: string;
  label: string;
  /** What the provider calls the thing you connect — "Page", "Organization". */
  resourceNoun: string;
  /** `null` until the publishing pipeline for it exists. */
  platform: SocialPlatform | null;
  availability: ProviderAvailability;
  /** Brand-icon key resolved by `components/ui/brand-icon`. */
  icon: string;
  /** What connecting it would grant. Shown in the permissions review step. */
  capabilities: SocialCapabilityKey[];
  /** One line under the name in the platform picker. */
  description: string;
}
