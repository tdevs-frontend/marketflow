import type { Option } from "@/constants/commerce";
import {
  daysAgo,
  daysAhead,
  hoursAgo,
  minutesAgo,
} from "@/lib/workspace-clock";
import type {
  MediaAsset,
  ReachWindow,
  SocialPlatform,
  SocialTrendPeriod,
  MediaFolder,
  PostStatus,
  CapabilityState,
  SocialAccount,
  SocialActivityEvent,
  SocialCapabilityKey,
  SocialPost,
} from "@/types/social";

/**
 * Social Planner data.
 *
 * Post times are local-naive ISO strings without a `Z`: a content calendar is
 * read in the publisher's own timezone, and stamping UTC on them would shift
 * a 9am post into the previous day for half the world's readers.
 *
 * Anchored to September 2026 so the calendar opens on a month with content in
 * it — past, present and future.
 */

export const CALENDAR_MONTH = { year: 2026, month: 8 } as const; // 8 = September

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export const POST_STATUSES: Option<PostStatus>[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
];

/* -------------------------------------------------------------------------- */
/* Media library                                                              */
/* -------------------------------------------------------------------------- */

export const MEDIA_FOLDERS: MediaFolder[] = [
  { id: "all", name: "All Media" },
  { id: "autumn-2026", name: "Autumn 2026" },
  { id: "product-shots", name: "Product Shots" },
  { id: "brand", name: "Brand Assets" },
  { id: "video", name: "Video" },
  { id: "ugc", name: "Customer Photos" },
];

/**
 * The ground behind each asset.
 *
 * These were the library's *content* when it had no files: flat tints standing
 * in for pictures. Every asset now has a real one, so they have dropped back
 * to what a tone should be — the colour a tile holds while its image decodes,
 * and the colour it keeps if the file ever goes missing. Still per-asset
 * rather than one grey, because a library mid-load should read as a set of
 * distinct things rather than as a wall of skeletons.
 */
const TONES = [
  "bg-primary-soft",
  "bg-accent-soft",
  "bg-email-soft",
  "bg-sms-soft",
  "bg-surface-secondary",
  "bg-warning-soft",
];

export const MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "md-01",
    name: "autumn-hero-01.jpg",
    type: "image",
    folderId: "autumn-2026",
    size: 2_418_432,
    width: 2400,
    height: 1600,
    tags: ["autumn", "hero", "lifestyle"],
    tone: TONES[0],
    uploadedAt: "2026-09-01T09:20:00Z",
    url: "/media/autumn-hero-01.jpg",
  },
  {
    id: "md-02",
    name: "autumn-hero-02.jpg",
    type: "image",
    folderId: "autumn-2026",
    size: 2_186_240,
    width: 2400,
    height: 1600,
    tags: ["autumn", "hero"],
    tone: TONES[1],
    uploadedAt: "2026-09-01T09:22:00Z",
    url: "/media/autumn-hero-02.jpg",
  },
  {
    id: "md-03",
    name: "business-package-flatlay.jpg",
    type: "image",
    folderId: "product-shots",
    size: 1_842_688,
    width: 2000,
    height: 2000,
    tags: ["product", "flatlay", "business"],
    tone: TONES[2],
    uploadedAt: "2026-08-28T14:10:00Z",
    url: "/media/business-package-flatlay.jpg",
  },
  {
    id: "md-04",
    name: "starter-package-detail.jpg",
    type: "image",
    folderId: "product-shots",
    size: 1_248_512,
    width: 1600,
    height: 1600,
    tags: ["product", "detail"],
    tone: TONES[3],
    uploadedAt: "2026-08-28T14:12:00Z",
    url: "/media/starter-package-detail.jpg",
  },
  {
    id: "md-05",
    name: "automation-builder-demo.mp4",
    type: "video",
    folderId: "video",
    size: 24_186_880,
    width: 1920,
    height: 1080,
    duration: 42,
    tags: ["product", "demo", "automation"],
    tone: TONES[4],
    uploadedAt: "2026-08-18T10:40:00Z",
    poster: "/media/automation-builder-demo-poster.png",
  },
  {
    id: "md-06",
    name: "team-behind-the-scenes.mp4",
    type: "video",
    folderId: "video",
    size: 38_240_256,
    width: 1080,
    height: 1920,
    duration: 28,
    tags: ["team", "reel", "vertical"],
    tone: TONES[5],
    uploadedAt: "2026-08-24T16:00:00Z",
    poster: "/media/team-behind-the-scenes-poster.jpg",
  },
  {
    id: "md-07",
    name: "marketflow-logo-light.png",
    type: "image",
    folderId: "brand",
    size: 84_992,
    width: 1200,
    height: 300,
    tags: ["logo", "brand"],
    tone: TONES[0],
    uploadedAt: "2026-05-02T08:00:00Z",
    url: "/media/marketflow-logo-light.svg",
    fit: "contain",
  },
  {
    id: "md-08",
    name: "marketflow-logo-dark.png",
    type: "image",
    folderId: "brand",
    size: 86_016,
    width: 1200,
    height: 300,
    tags: ["logo", "brand"],
    tone: TONES[4],
    uploadedAt: "2026-05-02T08:00:00Z",
    url: "/media/marketflow-logo-dark.svg",
    fit: "contain",
  },
  {
    id: "md-09",
    name: "customer-sarah-store.jpg",
    type: "image",
    folderId: "ugc",
    size: 1_642_496,
    width: 1800,
    height: 1200,
    tags: ["customer", "ugc", "retail"],
    tone: TONES[1],
    uploadedAt: "2026-09-03T11:30:00Z",
    url: "/media/customer-sarah-store.jpg",
  },
  {
    id: "md-10",
    name: "customer-omar-warehouse.jpg",
    type: "image",
    folderId: "ugc",
    size: 1_986_560,
    width: 1800,
    height: 1200,
    tags: ["customer", "ugc", "wholesale"],
    tone: TONES[2],
    uploadedAt: "2026-09-03T11:34:00Z",
    url: "/media/customer-omar-warehouse.jpg",
  },
  {
    id: "md-11",
    name: "pricing-graphic-square.png",
    type: "image",
    folderId: "autumn-2026",
    size: 642_048,
    width: 1080,
    height: 1080,
    tags: ["graphic", "pricing", "square"],
    tone: TONES[3],
    uploadedAt: "2026-09-04T09:15:00Z",
    url: "/media/pricing-graphic-square.jpg",
  },
  {
    id: "md-12",
    name: "webinar-announcement.png",
    type: "image",
    folderId: "autumn-2026",
    size: 728_064,
    width: 1200,
    height: 675,
    tags: ["graphic", "webinar", "landscape"],
    tone: TONES[5],
    uploadedAt: "2026-09-06T13:00:00Z",
    url: "/media/webinar-announcement.jpg",
  },
  {
    id: "md-13",
    name: "office-dhaka-wide.jpg",
    type: "image",
    folderId: "brand",
    size: 2_842_624,
    width: 2600,
    height: 1400,
    tags: ["office", "team", "brand"],
    tone: TONES[0],
    uploadedAt: "2026-07-18T15:20:00Z",
    url: "/media/office-dhaka-wide.jpg",
  },
  {
    id: "md-14",
    name: "feature-carousel-01.png",
    type: "image",
    folderId: "product-shots",
    size: 512_000,
    width: 1080,
    height: 1350,
    tags: ["carousel", "product"],
    tone: TONES[1],
    uploadedAt: "2026-08-30T10:05:00Z",
    url: "/media/feature-carousel-01.jpg",
  },
  {
    id: "md-15",
    name: "feature-carousel-02.png",
    type: "image",
    folderId: "product-shots",
    size: 528_384,
    width: 1080,
    height: 1350,
    tags: ["carousel", "product"],
    tone: TONES[2],
    uploadedAt: "2026-08-30T10:06:00Z",
    url: "/media/feature-carousel-02.jpg",
  },
  {
    id: "md-16",
    name: "testimonial-reel.mp4",
    type: "video",
    folderId: "video",
    size: 31_457_280,
    width: 1080,
    height: 1920,
    duration: 34,
    tags: ["testimonial", "reel", "vertical"],
    tone: TONES[3],
    uploadedAt: "2026-09-02T12:40:00Z",
    poster: "/media/testimonial-reel-poster.jpg",
  },
  {
    id: "md-17",
    name: "seasonal-pattern-tile.png",
    type: "image",
    folderId: "brand",
    size: 196_608,
    width: 800,
    height: 800,
    tags: ["pattern", "brand"],
    tone: TONES[4],
    uploadedAt: "2026-06-14T09:00:00Z",
    url: "/media/seasonal-pattern-tile.svg",
  },
  {
    id: "md-18",
    name: "store-opening-invite.png",
    type: "image",
    folderId: "autumn-2026",
    size: 684_032,
    width: 1080,
    height: 1080,
    tags: ["event", "graphic", "square"],
    tone: TONES[5],
    uploadedAt: "2026-09-06T13:05:00Z",
    url: "/media/store-opening-invite.svg",
  },
];

/* -------------------------------------------------------------------------- */
/* Posts                                                                      */
/* -------------------------------------------------------------------------- */

export const SOCIAL_POSTS: SocialPost[] = [
  {
    id: "sp-01",
    title: "Autumn collection teaser",
    caption:
      "Autumn is here, and so is the new collection. Swipe for the three pieces we are most proud of.",
    hashtags: ["#autumn2026", "#newcollection", "#smallbusiness"],
    platforms: ["instagram", "facebook"],
    status: "published",
    mediaIds: ["md-01", "md-02"],
    createdAt: "2026-08-20T09:00:00",
    scheduledAt: "2026-09-01T09:00:00",
    publishedAt: "2026-09-01T09:00:00",
    author: "Nadia Karim",
    engagement: {
      likes: 1_842,
      comments: 128,
      shares: 96,
      reach: 24_180,
      impressions: 31_460,
      clicks: 842,
    },
  },
  {
    id: "sp-02",
    title: "Automation builder walkthrough",
    caption:
      "Drag a trigger. Drop an action. Publish. The new automation builder is live on every plan — here is the whole thing in 40 seconds.",
    hashtags: ["#marketingautomation", "#saas", "#whatsappmarketing"],
    platforms: ["linkedin", "x"],
    status: "published",
    mediaIds: ["md-05"],
    createdAt: "2026-08-27T14:00:00",
    scheduledAt: "2026-09-02T14:00:00",
    publishedAt: "2026-09-02T14:00:00",
    author: "Imran Hossain",
    engagement: {
      likes: 964,
      comments: 84,
      shares: 214,
      reach: 18_640,
      impressions: 26_180,
      clicks: 1_284,
    },
  },
  {
    id: "sp-03",
    title: "Customer spotlight — Bright Retail",
    caption:
      "Bright Retail runs 12 stores on WhatsApp-first marketing. Sarah told us how she does it, and what she would do differently.",
    hashtags: ["#customerstory", "#retail", "#casestudy"],
    platforms: ["instagram", "facebook", "linkedin"],
    status: "published",
    mediaIds: ["md-09"],
    createdAt: "2026-08-25T11:30:00",
    scheduledAt: "2026-09-03T11:30:00",
    publishedAt: "2026-09-03T11:30:00",
    author: "Nadia Karim",
    engagement: {
      likes: 2_146,
      comments: 186,
      shares: 142,
      reach: 32_480,
      impressions: 44_120,
      clicks: 1_486,
    },
  },
  {
    id: "sp-04",
    title: "Pricing update announcement",
    caption:
      "One change to our pricing from 1 October, and it is a simplification. Full details on the blog.",
    hashtags: ["#pricing", "#product"],
    platforms: ["x", "linkedin"],
    status: "published",
    mediaIds: ["md-11"],
    createdAt: "2026-09-01T10:00:00",
    scheduledAt: "2026-09-04T10:00:00",
    publishedAt: "2026-09-04T10:00:00",
    author: "Tanvir Alam",
    engagement: {
      likes: 412,
      comments: 62,
      shares: 38,
      reach: 9_240,
      impressions: 12_860,
      clicks: 486,
    },
  },
  {
    id: "sp-05",
    title: "Behind the scenes — Dhaka office",
    caption:
      "Thursday afternoon in the Dhaka office. Eleven people, four timezones of customers, one very loud coffee machine.",
    hashtags: ["#teamculture", "#behindthescenes"],
    platforms: ["instagram"],
    status: "published",
    mediaIds: ["md-06"],
    createdAt: "2026-08-31T16:30:00",
    scheduledAt: "2026-09-05T16:30:00",
    publishedAt: "2026-09-05T16:30:00",
    author: "Nadia Karim",
    engagement: {
      likes: 1_284,
      comments: 94,
      shares: 42,
      reach: 16_420,
      impressions: 21_180,
      clicks: 218,
    },
  },
  {
    id: "sp-06",
    title: "Webinar announcement",
    caption:
      "Live on 8 October: WhatsApp automation that actually converts. 45 minutes, real numbers, no slides about synergy.",
    hashtags: ["#webinar", "#whatsappmarketing", "#growth"],
    platforms: ["linkedin", "facebook", "x"],
    status: "published",
    mediaIds: ["md-12"],
    createdAt: "2026-08-23T13:00:00",
    scheduledAt: "2026-09-06T13:00:00",
    publishedAt: "2026-09-06T13:00:00",
    author: "Imran Hossain",
    engagement: {
      likes: 684,
      comments: 48,
      shares: 126,
      reach: 14_280,
      impressions: 19_640,
      clicks: 942,
    },
  },
  {
    id: "sp-07",
    title: "Feature carousel — segments",
    caption:
      "Build a segment once, use it on WhatsApp, Email and SMS. Four slides on how segmentation actually works here.",
    hashtags: ["#segmentation", "#crm", "#marketing"],
    platforms: ["instagram", "linkedin"],
    status: "failed",
    mediaIds: ["md-14", "md-15"],
    createdAt: "2026-08-30T09:00:00",
    scheduledAt: "2026-09-07T09:00:00",
    author: "Tanvir Alam",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
    failureReason: "Instagram access token expired. Reconnect the account and retry.",
  },
  {
    id: "sp-08",
    title: "Customer testimonial reel",
    caption:
      "Three customers, thirty seconds, one question: what changed after you moved to WhatsApp-first?",
    hashtags: ["#testimonial", "#customerstory"],
    platforms: ["instagram", "facebook"],
    status: "scheduled",
    mediaIds: ["md-16"],
    createdAt: "2026-08-29T10:00:00",
    scheduledAt: "2026-09-09T10:00:00",
    author: "Nadia Karim",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-09",
    title: "Store opening invite",
    caption:
      "Our Gulshan store opens Saturday at 10am. First 50 guests leave with something. Bring a friend.",
    hashtags: ["#storeopening", "#dhaka", "#gulshan"],
    platforms: ["instagram", "facebook"],
    status: "scheduled",
    mediaIds: ["md-18"],
    createdAt: "2026-08-26T09:00:00",
    scheduledAt: "2026-09-11T09:00:00",
    author: "Nadia Karim",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-10",
    title: "Wholesale case study",
    caption:
      "Haddad Trading moved 8,000 wholesale orders through WhatsApp last quarter. The full breakdown is on the blog.",
    hashtags: ["#wholesale", "#casestudy", "#b2b"],
    platforms: ["linkedin"],
    status: "scheduled",
    mediaIds: ["md-10"],
    createdAt: "2026-09-08T14:00:00",
    scheduledAt: "2026-09-15T14:00:00",
    author: "Imran Hossain",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-11",
    title: "Autumn offer — final week",
    caption: "Last week of autumn pricing. After Sunday it goes back up.",
    hashtags: ["#autumn2026", "#offer"],
    platforms: ["instagram", "facebook", "x"],
    status: "scheduled",
    mediaIds: ["md-11"],
    createdAt: "2026-09-08T11:00:00",
    scheduledAt: "2026-09-18T11:00:00",
    author: "Tanvir Alam",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-12",
    title: "Product shot — Business Package",
    caption: "Everything in the Business Package, laid out flat.",
    hashtags: ["#product", "#flatlay"],
    platforms: ["instagram"],
    status: "scheduled",
    mediaIds: ["md-03"],
    createdAt: "2026-09-18T15:30:00",
    scheduledAt: "2026-09-22T15:30:00",
    author: "Nadia Karim",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-13",
    title: "October roadmap preview",
    caption:
      "Three things shipping in October. One of them has been the most-requested feature for a year.",
    hashtags: ["#roadmap", "#product", "#saas"],
    platforms: ["linkedin", "x"],
    status: "draft",
    mediaIds: [],
    createdAt: "2026-09-04T10:00:00",
    scheduledAt: "2026-09-25T10:00:00",
    author: "Imran Hossain",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-14",
    title: "Hiring — support engineer",
    caption: "We are hiring a support engineer in Dhaka. Remote-friendly, real ownership.",
    hashtags: ["#hiring", "#dhaka", "#support"],
    platforms: ["linkedin"],
    status: "draft",
    mediaIds: ["md-13"],
    createdAt: "2026-09-10T09:00:00",
    scheduledAt: "2026-09-28T09:00:00",
    author: "Tanvir Alam",
    engagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
    },
  },
  {
    id: "sp-15",
    title: "Late August recap",
    caption: "August in numbers: 482k messages, 8.4k conversions, one very tired team.",
    hashtags: ["#recap", "#growth"],
    platforms: ["x"],
    status: "published",
    mediaIds: [],
    createdAt: "2026-08-30T17:00:00",
    scheduledAt: "2026-08-31T17:00:00",
    publishedAt: "2026-08-31T17:00:00",
    author: "Imran Hossain",
    engagement: {
      likes: 286,
      comments: 34,
      shares: 22,
      reach: 6_840,
      impressions: 9_120,
      clicks: 184,
    },
  },
  {
    id: "sp-16",
    title: "Template library refresh",
    caption:
      "Nine new email templates, all built in the editor rather than hand-coded. Welcome, promotion, win-back and six more.",
    hashtags: ["#templates", "#emailmarketing"],
    platforms: ["facebook", "linkedin"],
    status: "published",
    mediaIds: ["md-14"],
    createdAt: "2026-08-21T12:00:00",
    scheduledAt: "2026-08-27T12:00:00",
    publishedAt: "2026-08-27T12:00:00",
    author: "Nadia Karim",
    engagement: {
      likes: 512,
      comments: 41,
      shares: 64,
      reach: 11_280,
      impressions: 15_460,
      clicks: 612,
    },
  },
];

/**
 * How many posts reference an asset.
 *
 * Derived rather than stored on the asset: a hand-maintained `usedIn` counter
 * drifts the moment a post's media changes, and the one place it must be right
 * is the delete confirmation — an asset wrongly reported as unused gets deleted
 * out from under a scheduled post.
 */
export const mediaUsageCount = (assetId: string) =>
  SOCIAL_POSTS.filter((post) => post.mediaIds.includes(assetId)).length;

/** The same counts as a lookup, for lists that need every asset at once. */
export const MEDIA_USAGE: Record<string, number> = Object.fromEntries(
  MEDIA_ASSETS.map((asset) => [asset.id, mediaUsageCount(asset.id)]),
);

/* -------------------------------------------------------------------------- */
/* Accounts                                                                   */
/* -------------------------------------------------------------------------- */

export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: "sa-facebook",
    platform: "facebook",
    name: "MarketFlow Store",
    username: "@marketflowstore",
    status: "connected",
    followers: 32_140,
    followerChange: 3.2,
    posts: 312,
    engagementRate: 2.6,
    lastSyncedAt: minutesAgo(2),
    accountType: "Facebook Page",
    externalId: "102938475610293",
    auth: {
      status: "healthy",
      expiresAt: null,
      connectedBy: "Sagor Khan",
      connectedAt: daysAgo(142),
    },
    capabilities: [
      { key: "publish", state: "granted" },
      { key: "analytics", state: "granted" },
      { key: "comments", state: "granted" },
      { key: "media", state: "granted" },
    ],
    publishing: { enabled: true, availableToPlanner: true, timezone: "Asia/Dhaka" },
    postsToday: 7,
  },
  {
    id: "sa-instagram",
    platform: "instagram",
    name: "MarketFlow Official",
    username: "@marketflow",
    status: "connected",
    followers: 48_260,
    followerChange: 6.4,
    posts: 284,
    engagementRate: 4.8,
    lastSyncedAt: minutesAgo(4),
    accountType: "Instagram Business account",
    externalId: "17841400008460056",
    auth: {
      status: "expiring_soon",
      expiresAt: daysAhead(18),
      connectedBy: "Sagor Khan",
      connectedAt: daysAgo(142),
    },
    capabilities: [
      { key: "publish", state: "granted" },
      { key: "analytics", state: "granted" },
      { key: "comments", state: "granted" },
      { key: "media", state: "granted" },
    ],
    publishing: { enabled: true, availableToPlanner: true, timezone: "Asia/Dhaka" },
    postsToday: 8,
  },
  {
    id: "sa-linkedin",
    platform: "linkedin",
    name: "MarketFlow",
    username: "linkedin.com/company/marketflow",
    status: "connected",
    followers: 18_940,
    followerChange: 11.8,
    posts: 196,
    engagementRate: 6.2,
    lastSyncedAt: minutesAgo(7),
    accountType: "LinkedIn Company Page",
    externalId: "84120397",
    auth: {
      status: "healthy",
      expiresAt: daysAhead(54),
      connectedBy: "Tanvir Ahmed",
      connectedAt: daysAgo(96),
    },
    capabilities: [
      { key: "publish", state: "granted" },
      { key: "analytics", state: "granted" },
      {
        key: "media",
        state: "granted",
      },
      {
        key: "comments",
        state: "missing",
        detail:
          "LinkedIn does not expose comment threads to third-party tools on Company Pages.",
      },
    ],
    publishing: { enabled: true, availableToPlanner: true, timezone: "Asia/Dhaka" },
    postsToday: 3,
  },
  {
    id: "sa-x",
    platform: "x",
    name: "MarketFlow",
    username: "@marketflow",
    status: "expired",
    followers: 12_480,
    followerChange: -1.4,
    posts: 421,
    engagementRate: 1.9,
    lastSyncedAt: hoursAgo(31),
    accountType: "X Profile",
    externalId: "1489203847561029384",
    auth: {
      status: "expired",
      expiresAt: daysAgo(2),
      connectedBy: "Tanvir Ahmed",
      connectedAt: daysAgo(61),
    },
    capabilities: [
      {
        key: "publish",
        state: "needs_reauth",
        detail: "The access token expired two days ago.",
      },
      {
        key: "analytics",
        state: "needs_reauth",
        detail: "The access token expired two days ago.",
      },
    ],
    publishing: { enabled: true, availableToPlanner: false, timezone: "Asia/Dhaka" },
    postsToday: 0,
  },
];

/* -------------------------------------------------------------------------- */
/* Analytics series                                                           */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Reach                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Reach, as one daily record per platform.
 *
 * This replaces two arrays that never agreed with each other: a ten-point
 * weekly `SOCIAL_SERIES.reach` and a ten-point weekly `PLATFORM_REACH`, whose
 * platform sums came to 1.12M against a headline KPI of 1.28M. Reporting two
 * different reach figures on one page is the duplication this module was
 * carrying, and the fix is structural rather than arithmetic: there is now one
 * record, every window is a slice of it, the previous period is the slice
 * before, and the KPI is its sum. None of them can drift.
 *
 * Generated rather than hand-typed. Three windows times four platforms times
 * two periods is over seven hundred numbers, and the one certainty about
 * seven hundred hand-typed numbers is that a few of them will contradict the
 * totals printed above them. The shape is what carries meaning here and the
 * shape is deliberate: a weekday rhythm with quiet weekends and a midweek
 * peak, over steady compound growth. It is a pure function of the constants
 * below, so it is identical on the server and the client.
 */
const REACH_DAYS = 200;

/** The module's "today" — the same September 2026 the calendar is anchored to. */
const REACH_ANCHOR = new Date(2026, 8, 8);

/** Monday-first multipliers. Nobody reaches anyone on a Saturday. */
const WEEKDAY_SHAPE = [0.94, 1.14, 1.02, 1.16, 1.0, 0.8, 0.74];

/**
 * Where each platform started and how fast it compounds.
 *
 * A rate per platform rather than one shared figure. With a single growth
 * constant every platform posted an identical change — four KPI cards side by
 * side all reading +19.8%, which is both obviously synthetic and useless: the
 * column exists to say which platform is pulling ahead, and it could not. The
 * spread here is about fourteen points, with LinkedIn compounding fastest off
 * the smallest base and X drifting, which is the shape the ranked list and the
 * KPI row are there to expose.
 */
const REACH_PROFILE: Record<SocialPlatform, { start: number; growth: number }> = {
  instagram: { start: 8_190, growth: 0.005 },
  facebook: { start: 4_590, growth: 0.0058 },
  linkedin: { start: 2_160, growth: 0.0071 },
  x: { start: 1_610, growth: 0.0032 },
};

const reachDateAt = (index: number) => {
  const date = new Date(REACH_ANCHOR);
  date.setDate(REACH_ANCHOR.getDate() - (REACH_DAYS - 1 - index));
  return date;
};

const reachLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);

function dailyReach(platform: SocialPlatform): number[] {
  const { start, growth } = REACH_PROFILE[platform];

  return Array.from({ length: REACH_DAYS }, (_, index) => {
    const weekday = (reachDateAt(index).getDay() + 6) % 7;
    /* A fixed sine rather than a random walk: the series has to be the same
       on every render, and a seeded PRNG would be more machinery for the
       same wobble. */
    const wobble = 1 + 0.035 * Math.sin(index * 1.3);
    return Math.round(
      start * Math.pow(1 + growth, index) * WEEKDAY_SHAPE[weekday] * wobble,
    );
  });
}

const REACH_DAILY: Record<SocialPlatform, number[]> = {
  instagram: dailyReach("instagram"),
  facebook: dailyReach("facebook"),
  linkedin: dailyReach("linkedin"),
  x: dailyReach("x"),
};

const REACH_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
];

const sumOf = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Sums each consecutive run of `size`, for the windows drawn weekly. */
const bucket = (values: number[], size: number) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    sumOf(values.slice(index * size, index * size + size)),
  );

/**
 * One window and the window before it.
 *
 * `bucketSize` is 1 for the windows drawn daily and 7 for ninety days, where
 * ninety-one points would be a smear rather than a line.
 */
function reachWindow(days: number, bucketSize: number): ReachWindow {
  const end = REACH_DAYS;
  const start = end - days;
  const previousStart = start - days;

  const slice = (from: number, to: number) =>
    Object.fromEntries(
      REACH_PLATFORMS.map((platform) => [
        platform,
        bucket(REACH_DAILY[platform].slice(from, to), bucketSize),
      ]),
    ) as Record<SocialPlatform, number[]>;

  const byPlatform = slice(start, end);
  const previousByPlatform = slice(previousStart, start);

  const combine = (source: Record<SocialPlatform, number[]>) =>
    source.instagram.map((_, index) =>
      sumOf(REACH_PLATFORMS.map((platform) => source[platform][index])),
    );

  const labels = bucket(
    Array.from({ length: days }, (_, index) => index),
    bucketSize,
  ).map((_, index) => reachLabel(reachDateAt(start + index * bucketSize)));

  return {
    labels,
    byPlatform,
    total: combine(byPlatform),
    previousByPlatform,
    previousTotal: combine(previousByPlatform),
  };
}

export const SOCIAL_REACH_TRENDS: Record<SocialTrendPeriod, ReachWindow> = {
  "7d": reachWindow(7, 1),
  "30d": reachWindow(30, 1),
  "90d": reachWindow(91, 7),
};

export const SOCIAL_TREND_PERIODS: { value: SocialTrendPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

/** Total reach in a window, and how it compares with the one before it. */
export function reachSummary(window: ReachWindow) {
  const total = sumOf(window.total);
  const previous = sumOf(window.previousTotal);

  return {
    total,
    previous,
    change: previous === 0 ? 0 : ((total - previous) / previous) * 100,
    /** Per bucket — a day on the short windows, a week on the long one. */
    average: Math.round(total / Math.max(window.total.length, 1)),
  };
}

/**
 * The period's headline figures.
 *
 * Reach is computed from the 30-day window rather than stated, so the KPI and
 * the chart below it are the same number by construction. Impressions follow
 * it at the ratio the account data has always carried — 1.4 views per account
 * reached — for the same reason: two independent literals is how a page ends
 * up claiming more unique accounts than views.
 */
const REACH_30D = reachSummary(SOCIAL_REACH_TRENDS["30d"]);

export const SOCIAL_TOTALS = {
  reach: REACH_30D.total,
  reachChange: Number(REACH_30D.change.toFixed(1)),
  impressions: Math.round(REACH_30D.total * 1.434),
  impressionsChange: 22.1,
  engagement: 96_420,
  engagementChange: 14.2,
  followers: 111_820,
  followersChange: 5.8,
  published: 742,
  publishedChange: 9.6,
} as const;

/**
 * Engagement rate and reach by hour bucket, for the "best posting time" panel.
 *
 * Reach sits beside the rate because they disagree, and the disagreement is
 * the insight: the lunchtime slot reaches the most accounts and converts the
 * worst, while late afternoon reaches fewer and earns more from them.
 */
export const BEST_POSTING_TIMES = [
  { label: "06:00–09:00", rate: 2.8, reach: 9_240 },
  { label: "09:00–12:00", rate: 5.4, reach: 18_620 },
  { label: "12:00–15:00", rate: 4.1, reach: 21_480 },
  { label: "15:00–18:00", rate: 6.2, reach: 16_840 },
  { label: "18:00–21:00", rate: 4.6, reach: 12_360 },
];

/* -------------------------------------------------------------------------- */
/* Connection layer                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The connection-level event log.
 *
 * Deliberately not the post log — "LinkedIn post published" appears here only
 * as evidence that the *connection* carried it. A merchant reading this is
 * debugging an integration, so the rows that matter are the syncs, the token
 * refreshes and the permission changes, and the publish lines are the
 * heartbeat between them.
 */
export const SOCIAL_ACTIVITY: SocialActivityEvent[] = [
  {
    id: "sac-1",
    accountId: "sa-facebook",
    platform: "facebook",
    message: "Page synced — 312 posts and follower counts up to date.",
    status: "success",
    at: minutesAgo(2),
  },
  {
    id: "sac-2",
    accountId: "sa-instagram",
    platform: "instagram",
    message: "Analytics updated — insights pulled for the last 24 hours.",
    status: "success",
    at: minutesAgo(4),
  },
  {
    id: "sac-3",
    accountId: "sa-linkedin",
    platform: "linkedin",
    message: "Post published — “Behind the build: our Q3 roadmap”.",
    status: "success",
    at: minutesAgo(7),
  },
  {
    id: "sac-4",
    accountId: "sa-instagram",
    platform: "instagram",
    message: "Token refresh scheduled — current token expires in 18 days.",
    status: "warning",
    at: hoursAgo(3),
  },
  {
    id: "sac-5",
    accountId: "sa-x",
    platform: "x",
    message: "Publishing failed — 401 Unauthorized. The access token has expired.",
    status: "error",
    at: hoursAgo(9),
  },
  {
    id: "sac-6",
    accountId: "sa-x",
    platform: "x",
    message: "Connection failed — re-authorisation required.",
    status: "error",
    at: hoursAgo(31),
  },
  {
    id: "sac-7",
    accountId: "sa-facebook",
    platform: "facebook",
    message: "Post published — “Autumn drop is live”.",
    status: "success",
    at: hoursAgo(5),
  },
  {
    id: "sac-8",
    accountId: "sa-linkedin",
    platform: "linkedin",
    message: "Comment permission not granted — comment sync stays off.",
    status: "warning",
    at: daysAgo(96),
  },
];

export function accountById(id: string): SocialAccount | undefined {
  return SOCIAL_ACCOUNTS.find((account) => account.id === id);
}

export function activityForAccount(id: string): SocialActivityEvent[] {
  return SOCIAL_ACTIVITY.filter((event) => event.accountId === id);
}

/** True when the capability is granted and therefore actually usable. */
export function hasCapability(
  account: SocialAccount,
  key: SocialCapabilityKey,
): boolean {
  return account.capabilities.some(
    (capability) => capability.key === key && capability.state === "granted",
  );
}

export function capabilityState(
  account: SocialAccount,
  key: SocialCapabilityKey,
): CapabilityState | undefined {
  return account.capabilities.find((capability) => capability.key === key)?.state;
}

/**
 * The accounts Social Planner may publish through.
 *
 * One predicate, read by the composer, the calendar and the Planner's empty
 * states, so "can we post to this" is answered identically everywhere. An
 * account can be live but withheld from the Planner — `availableToPlanner` is
 * an integration-level switch — and that is the case a boolean on `status`
 * alone could not express.
 */
export function publishableAccounts(
  accounts: SocialAccount[] = SOCIAL_ACCOUNTS,
): SocialAccount[] {
  return accounts.filter(
    (account) =>
      account.status === "connected" &&
      account.publishing.enabled &&
      account.publishing.availableToPlanner &&
      hasCapability(account, "publish"),
  );
}

/** Accounts whose figures the analytics pages are allowed to show. */
export function analyticsAccounts(
  accounts: SocialAccount[] = SOCIAL_ACCOUNTS,
): SocialAccount[] {
  return accounts.filter((account) => hasCapability(account, "analytics"));
}

export interface SocialConnectionTotals {
  accounts: number;
  activePlatforms: number;
  postsToday: number;
  issues: number;
}

/**
 * The Social integration's KPI row, derived rather than typed out.
 *
 * "Active platforms" counts distinct platforms that can actually publish, not
 * distinct platforms with a row — four accounts where one token has expired is
 * three active platforms, and saying four would be the exact lie this page
 * exists to prevent.
 */
export function socialConnectionTotals(
  accounts: SocialAccount[] = SOCIAL_ACCOUNTS,
): SocialConnectionTotals {
  const publishable = publishableAccounts(accounts);

  return {
    accounts: accounts.length,
    activePlatforms: new Set(publishable.map((account) => account.platform)).size,
    postsToday: accounts.reduce((total, account) => total + account.postsToday, 0),
    issues: accounts.filter(
      (account) =>
        account.status !== "connected" ||
        account.capabilities.some((c) => c.state === "needs_reauth"),
    ).length,
  };
}
