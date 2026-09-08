import type { Option } from "@/constants/commerce";
import type {
  MediaAsset,
  MediaFolder,
  PostStatus,
  SocialAccount,
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
 * Placeholder swatches. Flat brand-adjacent tints rather than stock imagery —
 * a tile that pretends to be a photograph makes the library look finished when
 * it is empty, and the eye stops treating it as a placeholder.
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
    id: "sa-instagram",
    platform: "instagram",
    name: "MarketFlow",
    username: "@marketflow",
    status: "expired",
    followers: 48_260,
    followerChange: 6.4,
    posts: 284,
    engagementRate: 4.8,
    lastSyncedAt: "2026-09-06T22:10:00Z",
    permissions: ["Publish posts", "Read insights", "Manage comments"],
  },
  {
    id: "sa-facebook",
    platform: "facebook",
    name: "MarketFlow",
    username: "facebook.com/marketflow",
    status: "connected",
    followers: 32_140,
    followerChange: 3.2,
    posts: 312,
    engagementRate: 2.6,
    lastSyncedAt: "2026-09-08T09:40:00Z",
    permissions: ["Publish posts", "Read insights", "Manage comments", "Run ads"],
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
    lastSyncedAt: "2026-09-08T09:38:00Z",
    permissions: ["Publish posts", "Read insights"],
  },
  {
    id: "sa-x",
    platform: "x",
    name: "MarketFlow",
    username: "@marketflow",
    status: "connected",
    followers: 12_480,
    followerChange: -1.4,
    posts: 421,
    engagementRate: 1.9,
    lastSyncedAt: "2026-09-08T09:41:00Z",
    permissions: ["Publish posts", "Read insights"],
  },
];

/* -------------------------------------------------------------------------- */
/* Analytics series                                                           */
/* -------------------------------------------------------------------------- */

export const SOCIAL_TOTALS = {
  reach: 1_284_600,
  reachChange: 18.4,
  impressions: 1_842_180,
  impressionsChange: 22.1,
  engagement: 96_420,
  engagementChange: 14.2,
  followers: 111_820,
  followersChange: 5.8,
  published: 742,
  publishedChange: 9.6,
} as const;

export const SOCIAL_WEEK_LABELS = [
  "Jun 29",
  "Jul 6",
  "Jul 13",
  "Jul 20",
  "Jul 27",
  "Aug 3",
  "Aug 10",
  "Aug 17",
  "Aug 24",
  "Aug 31",
];

export const SOCIAL_SERIES = {
  reach: [
    82_400, 91_200, 96_800, 104_600, 98_400, 112_800, 121_400, 128_600, 136_200,
    148_400,
  ],
  impressions: [
    118_600, 131_400, 139_200, 148_800, 142_600, 162_400, 174_800, 186_200,
    198_400, 214_600,
  ],
  engagement: [6_180, 6_840, 7_120, 7_680, 7_240, 8_320, 8_940, 9_480, 10_120, 11_040],
  followers: [
    98_400, 100_200, 101_800, 103_600, 104_800, 106_400, 108_100, 109_400,
    110_600, 111_820,
  ],
};

/** Reach per platform, for the comparison chart. */
export const PLATFORM_REACH = {
  instagram: [
    38_200, 42_400, 45_100, 48_600, 45_800, 52_400, 56_200, 59_800, 63_400,
    68_200,
  ],
  facebook: [
    24_600, 27_200, 28_800, 31_200, 29_400, 33_600, 36_100, 38_200, 40_600,
    44_200,
  ],
  linkedin: [
    14_200, 15_800, 16_900, 18_200, 17_400, 19_800, 21_400, 22_800, 24_200,
    26_400,
  ],
  x: [5_400, 5_800, 6_000, 6_600, 5_800, 6_400, 7_700, 7_800, 8_000, 9_600],
};

/** Engagement rate by hour bucket, for the "best posting time" panel. */
export const BEST_POSTING_TIMES = [
  { label: "06:00–09:00", rate: 2.8 },
  { label: "09:00–12:00", rate: 5.4 },
  { label: "12:00–15:00", rate: 4.1 },
  { label: "15:00–18:00", rate: 6.2 },
  { label: "18:00–21:00", rate: 4.6 },
];
