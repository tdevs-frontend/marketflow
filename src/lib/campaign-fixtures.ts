import type { Option } from "@/constants/commerce";
import { REPLY_TO_ADDRESSES, SENDER_IDENTITIES } from "@/lib/email-fixtures";
import { SMS_SENDER_IDS } from "@/lib/sms-fixtures";
import { SEGMENTS } from "@/lib/segment-fixtures";
import type {
  AbTestField,
  AbWinnerMetric,
  AudienceEligibility,
  AudienceExclusions,
  CampaignGoal,
  CampaignObjective,
  ExclusionRule,
  MarketingChannel,
  MergeVariable,
  MessagingChannel,
  SendSpeed,
  VariableSource,
} from "@/types/marketing";
import type { SocialPlatform } from "@/types/social";

/**
 * The reference data the campaign wizard collects against.
 *
 * It sits beside `marketing-fixtures` rather than inside it because these are
 * not campaigns — they are the vocabulary a campaign is *authored* in:
 * objectives, senders, exclusion rules, merge variables, UTM defaults. The
 * split keeps the file that a backend will delete (campaign records) apart from
 * the one it will keep (workspace configuration).
 *
 * Nothing here invents a second copy of data another module owns. Email sender
 * identities come from `email-fixtures`, SMS sender IDs from `sms-fixtures`,
 * social accounts from `social-fixtures` via the Integrations selector, and
 * segments from `segment-fixtures`.
 */

/* -------------------------------------------------------------------------- */
/* Objective and tags                                                         */
/* -------------------------------------------------------------------------- */

export const CAMPAIGN_OBJECTIVES: (Option<CampaignObjective> & {
  hint: string;
})[] = [
  { value: "awareness", label: "Awareness", hint: "Reach as many people as possible" },
  { value: "engagement", label: "Engagement", hint: "Replies, clicks and comments" },
  {
    value: "lead-generation",
    label: "Lead Generation",
    hint: "Capture details from new people",
  },
  {
    value: "sales",
    label: "Sales / Conversion",
    hint: "Drive orders from this send",
  },
  {
    value: "re-engagement",
    label: "Re-engagement",
    hint: "Win back contacts who went quiet",
  },
  { value: "announcement", label: "Announcement", hint: "Tell people something" },
  { value: "retention", label: "Retention", hint: "Keep existing customers active" },
];

export const OBJECTIVE_LABEL: Record<CampaignObjective, string> =
  Object.fromEntries(
    CAMPAIGN_OBJECTIVES.map((item) => [item.value, item.label]),
  ) as Record<CampaignObjective, string>;

/** Internal labels. Shared vocabulary, so reporting can group by one. */
export const CAMPAIGN_TAGS = [
  "Summer Sale",
  "Product Launch",
  "VIP",
  "Retention",
  "Seasonal",
];

/* -------------------------------------------------------------------------- */
/* Conversion goal                                                            */
/* -------------------------------------------------------------------------- */

export const CAMPAIGN_GOALS: Option<CampaignGoal>[] = [
  { value: "none", label: "No conversion goal" },
  { value: "order-completed", label: "Order completed" },
  { value: "product-purchased", label: "Product purchased" },
  { value: "form-submitted", label: "Form submitted" },
  { value: "lead-created", label: "Lead created" },
  { value: "lead-qualified", label: "Lead qualified" },
  { value: "appointment-booked", label: "Appointment booked" },
  { value: "link-clicked", label: "Link clicked" },
];

export const GOAL_LABEL: Record<CampaignGoal, string> = Object.fromEntries(
  CAMPAIGN_GOALS.map((item) => [item.value, item.label]),
) as Record<CampaignGoal, string>;

/* -------------------------------------------------------------------------- */
/* Senders                                                                    */
/* -------------------------------------------------------------------------- */

export interface WhatsAppConnection {
  id: string;
  label: string;
  /** Meta's verification state. An unverified connection cannot send. */
  verified: boolean;
  numbers: { id: string; label: string; quality: "high" | "medium" | "low" }[];
}

export const WHATSAPP_CONNECTIONS: WhatsAppConnection[] = [
  {
    id: "wa-main",
    label: "MarketFlow Business (Cloud API)",
    verified: true,
    numbers: [
      { id: "wa-num-primary", label: "+880 1700 000000 — Primary", quality: "high" },
      { id: "wa-num-support", label: "+880 1700 000011 — Support", quality: "medium" },
    ],
  },
  {
    id: "wa-retail",
    label: "MarketFlow Retail (Cloud API)",
    verified: true,
    numbers: [
      { id: "wa-num-retail", label: "+971 50 000 0000 — Retail", quality: "high" },
    ],
  },
];

/** Re-exported so the wizard has one import for senders, not three. */
export const EMAIL_SENDERS = SENDER_IDENTITIES;

/**
 * Reply-to choices — every mailbox an identity already replies to, plus the
 * one address that is not a mailbox at all. Derived rather than listed again,
 * so adding a sender in Email → Senders offers its reply-to here too.
 */
export const EMAIL_REPLY_TO = [
  ...REPLY_TO_ADDRESSES,
  {
    value: "no-reply@marketflow.io",
    label: "no-reply@marketflow.io (replies discarded)",
  },
];

export interface SmsProvider {
  id: string;
  label: string;
  /** Sender IDs this gateway is allowed to present. */
  senderIds: string[];
}

export const SMS_PROVIDERS: SmsProvider[] = [
  {
    id: "twilio",
    label: "Twilio",
    senderIds: SMS_SENDER_IDS.map((item) => item.value),
  },
  {
    id: "vonage",
    label: "Vonage",
    senderIds: ["MARKETFLOW", "24680"],
  },
];

export const smsSenderOptions = (providerId: string) => {
  const provider = SMS_PROVIDERS.find((item) => item.id === providerId);
  const allowed = new Set(provider?.senderIds ?? []);
  return SMS_SENDER_IDS.filter((item) => allowed.has(item.value));
};

/* -------------------------------------------------------------------------- */
/* Audience exclusions                                                        */
/* -------------------------------------------------------------------------- */

export interface ExclusionOption {
  value: ExclusionRule;
  label: string;
  hint: string;
  /**
   * On, and not switchable.
   *
   * Sending to someone who opted out is not a campaign setting, so the wizard
   * shows these as checked and disabled rather than hiding them — a merchant
   * should be able to see the protection is there.
   */
  locked?: boolean;
  /** Share of the audience this rule removes, for the live estimate. */
  share: number;
}

export const EXCLUSION_OPTIONS: ExclusionOption[] = [
  {
    value: "unsubscribed",
    label: "Unsubscribed contacts",
    hint: "Anyone who opted out of this channel",
    locked: true,
    share: 0.024,
  },
  {
    value: "suppression-list",
    label: "Suppression list",
    hint: "Hard bounces, complaints and manual blocks",
    locked: true,
    share: 0.011,
  },
  {
    value: "existing-customers",
    label: "Existing customers",
    hint: "Anyone who has placed at least one order",
    share: 0.184,
  },
  {
    value: "recently-contacted",
    label: "Recently contacted",
    hint: "Received any campaign in the last 48 hours",
    share: 0.065,
  },
];

/** The two that are always applied, whatever the draft says. */
export const LOCKED_EXCLUSIONS: ExclusionRule[] = EXCLUSION_OPTIONS.filter(
  (item) => item.locked,
).map((item) => item.value);

/** Contact tags offered as an exclusion. Same vocabulary as the CRM. */
export const EXCLUDABLE_TAGS = [
  "Wholesale",
  "Trial",
  "Churned",
  "Staff",
  "Competitor",
];

/* -------------------------------------------------------------------------- */
/* Eligibility                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Share of a list that cannot physically receive on each channel.
 *
 * These are the *data* failures, not the opt-out ones: a contact with no
 * WhatsApp account, an address that hard-bounced, a phone number that is four
 * digits long. A real implementation counts them; the shape is what matters
 * here, because the wizard's job is to show them rather than quietly drop them.
 */
const INVALID_SHARE: Record<MessagingChannel, number> = {
  whatsapp: 0.042,
  email: 0.028,
  sms: 0.035,
};

/** What makes a contact ineligible on each channel, in the merchant's words. */
export const ELIGIBILITY_RULE: Record<MessagingChannel, string> = {
  whatsapp: "Needs a WhatsApp opt-in and a number reachable on WhatsApp.",
  email: "Needs a deliverable address that has not unsubscribed.",
  sms: "Needs a valid mobile number that is not on the suppression list.",
};

/**
 * Resolve an audience down to the people who will actually be sent to.
 *
 * Exclusions are applied as independent shares of the original list rather than
 * compounded, then clamped — overlapping rules double-counting is the only way
 * this arithmetic can produce a number a merchant would call wrong, and
 * over-reporting the exclusion is the safe direction to be wrong in.
 */
export function eligibilityFor(
  channel: MarketingChannel,
  total: number,
  exclusions: AudienceExclusions,
): AudienceEligibility {
  if (channel === "social" || total <= 0) {
    return { total: Math.max(total, 0), excluded: 0, invalid: 0, eligible: Math.max(total, 0) };
  }

  const ruleShare = EXCLUSION_OPTIONS.filter(
    (option) => option.locked || exclusions.rules.includes(option.value),
  ).reduce((sum, option) => sum + option.share, 0);

  const segmentContacts = exclusions.segmentIds.reduce((sum, id) => {
    const segment = SEGMENTS.find((item) => item.id === id);
    return sum + (segment?.contacts ?? 0);
  }, 0);

  /* A tag is a slice of the list, not a list of its own — 3% each keeps the
     estimate honest without pretending to know the overlap. */
  const tagShare = exclusions.tags.length * 0.03;

  const excluded = Math.min(
    Math.round(total * (ruleShare + tagShare)) + Math.min(segmentContacts, total),
    total,
  );
  const invalid = Math.min(
    Math.round((total - excluded) * INVALID_SHARE[channel]),
    total - excluded,
  );

  return { total, excluded, invalid, eligible: total - excluded - invalid };
}

/* -------------------------------------------------------------------------- */
/* Merge variables                                                            */
/* -------------------------------------------------------------------------- */

export const VARIABLE_SOURCE_LABEL: Record<VariableSource, string> = {
  contact: "Contact",
  lead: "Lead",
  customer: "Customer",
  product: "Product",
  order: "Order",
  campaign: "Campaign",
  workspace: "Workspace",
  custom: "Custom Fields",
};

export const MERGE_VARIABLES: MergeVariable[] = [
  { name: "first_name", label: "First name", source: "contact", sample: "Sarah" },
  { name: "last_name", label: "Last name", source: "contact", sample: "Ahmed" },
  { name: "full_name", label: "Full name", source: "contact", sample: "Sarah Ahmed" },
  { name: "city", label: "City", source: "contact", sample: "Dhaka" },
  { name: "phone", label: "Phone", source: "contact", sample: "+880 1700 111222" },

  { name: "lead_source", label: "Lead source", source: "lead", sample: "Website form" },
  { name: "lead_owner", label: "Lead owner", source: "lead", sample: "Imran Hossain" },

  { name: "company_name", label: "Company name", source: "customer", sample: "Bright Retail" },
  { name: "lifetime_value", label: "Lifetime value", source: "customer", sample: "$2,480.00" },
  { name: "last_order_date", label: "Last order date", source: "customer", sample: "2 September" },

  { name: "product_name", label: "Product name", source: "product", sample: "Premium T-Shirt" },
  { name: "product_price", label: "Product price", source: "product", sample: "$32.00" },
  { name: "product_url", label: "Product link", source: "product", sample: "marketflow.io/p/premium-tee" },

  { name: "order_id", label: "Order ID", source: "order", sample: "MF-10248" },
  { name: "order_total", label: "Order total", source: "order", sample: "$149.00" },
  { name: "order_status", label: "Order status", source: "order", sample: "Shipped" },

  { name: "campaign_name", label: "Campaign name", source: "campaign", sample: "Summer Sale 2026" },
  { name: "discount_code", label: "Discount code", source: "campaign", sample: "SUMMER25" },
  { name: "offer_ends", label: "Offer ends", source: "campaign", sample: "30 September" },

  { name: "workspace_name", label: "Workspace name", source: "workspace", sample: "MarketFlow" },
  { name: "support_email", label: "Support email", source: "workspace", sample: "support@marketflow.io" },
  { name: "store_url", label: "Store link", source: "workspace", sample: "marketflow.io" },

  { name: "loyalty_tier", label: "Loyalty tier", source: "custom", sample: "Gold" },
  { name: "renewal_date", label: "Renewal date", source: "custom", sample: "14 October" },
];

/**
 * The sources a channel can actually resolve.
 *
 * A social post is published to a page, not delivered to a person, so there is
 * no contact behind it and `{{first_name}}` would render as whatever fallback
 * was set — for every reader. Offering contact variables there would be
 * offering a foot-gun, so the catalogue is filtered rather than annotated.
 */
export const SOCIAL_VARIABLE_SOURCES: VariableSource[] = [
  "product",
  "campaign",
  "workspace",
];

export const variablesForChannel = (channel: MarketingChannel): MergeVariable[] =>
  channel === "social"
    ? MERGE_VARIABLES.filter((item) =>
        SOCIAL_VARIABLE_SOURCES.includes(item.source),
      )
    : MERGE_VARIABLES;

/** Sample values every preview in the wizard renders against. */
export const VARIABLE_SAMPLES: Record<string, string> = Object.fromEntries(
  MERGE_VARIABLES.map((item) => [item.name, item.sample]),
);

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The `utm_source` a channel defaults to.
 *
 * Social resolves per platform instead — `utm_source=facebook` is what an
 * analytics report needs, and `utm_source=social` is what makes four platforms
 * indistinguishable in it.
 */
export const UTM_SOURCE: Record<MarketingChannel, string> = {
  whatsapp: "whatsapp",
  email: "email",
  sms: "sms",
  social: "social",
};

export const UTM_MEDIUM: Record<MarketingChannel, string> = {
  whatsapp: "whatsapp",
  email: "email",
  sms: "sms",
  social: "social",
};

export const utmSourceFor = (
  channel: MarketingChannel,
  platforms: SocialPlatform[] = [],
): string => {
  if (channel !== "social") return UTM_SOURCE[channel];
  /* One platform selected is unambiguous; several share a campaign, and the
     platform they came from is the thing `utm_content` carries. */
  return platforms.length === 1 ? platforms[0] : UTM_SOURCE.social;
};

/** Lower-case, hyphenated, no punctuation — the shape an analytics tool wants. */
export const utmSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/* -------------------------------------------------------------------------- */
/* Delivery                                                                   */
/* -------------------------------------------------------------------------- */

export const SEND_SPEEDS: (Option<SendSpeed> & { hint: string })[] = [
  {
    value: "standard",
    label: "Standard",
    hint: "Send as fast as the channel allows",
  },
  {
    value: "throttled",
    label: "Throttled",
    hint: "Spread the send out to protect reply handling",
  },
];

export const SPREAD_OPTIONS = [
  { value: "15", label: "Spread delivery over 15 minutes" },
  { value: "30", label: "Spread delivery over 30 minutes" },
  { value: "60", label: "Spread delivery over 1 hour" },
  { value: "180", label: "Spread delivery over 3 hours" },
];

/** Sunday-first, matching the weekday index `Date#getDay` returns. */
export const WEEKDAYS = [
  { index: 0, short: "Sun", label: "Sunday" },
  { index: 1, short: "Mon", label: "Monday" },
  { index: 2, short: "Tue", label: "Tuesday" },
  { index: 3, short: "Wed", label: "Wednesday" },
  { index: 4, short: "Thu", label: "Thursday" },
  { index: 5, short: "Fri", label: "Friday" },
  { index: 6, short: "Sat", label: "Saturday" },
];

export const FREQUENCY_ANY_HOURS = [
  { value: "12", label: "12 hours" },
  { value: "24", label: "24 hours" },
  { value: "48", label: "48 hours" },
  { value: "72", label: "72 hours" },
];

export const FREQUENCY_SAME_DAYS = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
];

/* -------------------------------------------------------------------------- */
/* A/B testing                                                                */
/* -------------------------------------------------------------------------- */

/**
 * What a test can vary, per channel.
 *
 * Kept as data rather than a switch in the component so that adding a channel
 * is a row here, and so the Review step can name the tested field without
 * re-deriving it.
 */
export const AB_TEST_FIELDS: Record<
  MarketingChannel,
  (Option<AbTestField> & { hint: string })[]
> = {
  email: [
    { value: "subject", label: "Subject line", hint: "Same email, two subjects" },
    { value: "content", label: "Email body", hint: "Two versions of the message" },
  ],
  whatsapp: [
    { value: "template", label: "Template", hint: "Two approved templates" },
    { value: "message", label: "Message body", hint: "Two versions of the text" },
  ],
  sms: [{ value: "message", label: "Message", hint: "Two versions of the text" }],
  social: [
    { value: "caption", label: "Caption", hint: "Two versions of the post text" },
  ],
};

export const AB_WINNER_METRICS: Record<
  MarketingChannel,
  Option<AbWinnerMetric>[]
> = {
  email: [
    { value: "open-rate", label: "Open rate" },
    { value: "click-rate", label: "Click rate" },
    { value: "conversion-rate", label: "Conversion rate" },
  ],
  whatsapp: [
    { value: "open-rate", label: "Read rate" },
    { value: "click-rate", label: "Click rate" },
    { value: "conversion-rate", label: "Conversion rate" },
  ],
  sms: [
    { value: "click-rate", label: "Click rate" },
    { value: "conversion-rate", label: "Conversion rate" },
  ],
  social: [
    { value: "engagement", label: "Engagement" },
    { value: "click-rate", label: "Click rate" },
  ],
};
