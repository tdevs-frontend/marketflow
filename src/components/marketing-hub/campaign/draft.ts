import { CHANNEL_THEME } from "@/constants/channels";
import {
  LOCKED_EXCLUSIONS,
  UTM_MEDIUM,
  VARIABLE_SAMPLES,
  eligibilityFor,
  utmSlug,
  utmSourceFor,
} from "@/lib/campaign-fixtures";
import { defaultSenderIdentity } from "@/lib/email-fixtures";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import { segmentsForChannel } from "@/lib/segment-fixtures";
import { publishableAccounts } from "@/lib/social-fixtures";
import type {
  AudienceEligibility,
  CampaignDraft,
  MarketingChannel,
  MessagingChannel,
} from "@/types/marketing";
import type { SocialAccount, SocialPlatform } from "@/types/social";

/**
 * The draft model, and everything derived from it.
 *
 * Deriving rather than storing is the rule here: eligible recipients, merge
 * tags, SMS segments and the selected social accounts are all functions of the
 * draft, so they cannot drift out of step with it. The only things in state are
 * the answers a human gave.
 */

export const EMPTY_DRAFT: CampaignDraft = {
  name: "",
  description: "",
  channel: "whatsapp",
  objective: "engagement",
  tags: [],

  sender: {
    whatsappConnectionId: "wa-main",
    whatsappNumberId: "wa-num-primary",
    emailFrom: defaultSenderIdentity.email,
    emailReplyTo: defaultSenderIdentity.replyTo,
    smsProviderId: "twilio",
    smsSenderId: "MARKETFLOW",
  },
  socialAccountIds: [],

  segment: "all",
  savedSegmentId: "",
  exclusions: { rules: [...LOCKED_EXCLUSIONS], segmentIds: [], tags: [] },

  templateId: "",
  message: "",
  subject: "",
  previewText: "",
  ctaLabel: "",
  ctaUrl: "",
  mediaIds: [],
  hashtags: [],
  shortenLinks: true,

  fallbacks: {},

  tracking: {
    clicks: true,
    conversions: true,
    attribution: true,
    revenue: false,
    utm: { source: "whatsapp", medium: "whatsapp", campaign: "", content: "" },
    utmTouched: false,
  },
  goal: "none",
  abTest: {
    enabled: false,
    field: "message",
    variantA: "",
    variantB: "",
    split: 50,
    winnerMetric: "click-rate",
  },

  sendMode: "now",
  date: "",
  time: "09:00",
  timezone: "Asia/Dhaka",
  useRecipientTimezone: false,
  quietHours: { enabled: true, from: "20:00", to: "08:00" },
  allowedDays: [0, 1, 2, 3, 4, 5, 6],
  frequencyCap: { enabled: false, anyChannelHours: 24, sameChannelDays: 3 },
  sendSpeed: "standard",
  spreadMinutes: 30,
  perPlatformSchedule: false,
};

/** 160 GSM-7 characters per segment, 153 once a message needs more than one. */
export function smsSegments(length: number) {
  if (length === 0) return 0;
  return length <= 160 ? 1 : Math.ceil(length / 153);
}

/**
 * Placeholder names in a draft, deduplicated and in first-appearance order.
 *
 * Scans every field a merge tag can legally appear in - a tag in a subject line
 * or a social caption with no fallback is the most visible way a campaign
 * embarrasses itself.
 */
export function placeholdersIn(draft: CampaignDraft): string[] {
  const source = [
    draft.subject,
    draft.previewText,
    draft.message,
    draft.ctaLabel,
    draft.abTest.enabled ? draft.abTest.variantA : "",
    draft.abTest.enabled ? draft.abTest.variantB : "",
  ].join(" ");

  const found = source.matchAll(/\{\{\s*(\w+)(?:\s*\|\s*[^}]*)?\}\}/g);
  return [...new Set([...found].map((match) => match[1]))];
}

/**
 * Render a draft the way a recipient would see it.
 *
 * Supports the inline default syntax as well as the fallback map:
 * `{{first_name | Customer}}` is the form a merchant can write without leaving
 * the composer, and it wins over the map because it is the more specific
 * statement of intent. Order of resolution is contact value, inline default,
 * mapped fallback, then the raw tag - which is exactly the case the
 * Personalise step exists to catch.
 */
export function renderPersonalised(
  text: string,
  fallbacks: Record<string, string>,
  contact: Record<string, string> = VARIABLE_SAMPLES,
): string {
  return text.replace(
    /\{\{\s*(\w+)\s*(?:\|\s*([^}]*?)\s*)?\}\}/g,
    (match, name: string, inline?: string) =>
      contact[name] ?? inline?.trim() ?? fallbacks[name] ?? match,
  );
}

/** Tags that have neither an inline default nor a mapped fallback. */
export function unsafePlaceholders(draft: CampaignDraft): string[] {
  const inlineDefaults = new Set(
    [
      ...`${draft.subject} ${draft.previewText} ${draft.message} ${draft.ctaLabel}`.matchAll(
        /\{\{\s*(\w+)\s*\|\s*[^}]+\}\}/g,
      ),
    ].map((match) => match[1]),
  );

  return placeholdersIn(draft).filter(
    (tag) => !inlineDefaults.has(tag) && !draft.fallbacks[tag]?.trim(),
  );
}

/** Hashtags and caption as one string, the way the Planner composes a post. */
export function composedCaption(draft: CampaignDraft): string {
  const tags = draft.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`);
  return [draft.message, tags.join(" ")].filter(Boolean).join("\n\n");
}

/* -------------------------------------------------------------------------- */
/* Derivation                                                                 */
/* -------------------------------------------------------------------------- */

export interface DraftDerived {
  channelLabel: string;
  /** Social publishes; the rest deliver. Branches everywhere read this. */
  isSocial: boolean;
  /** Narrowed channel, for the helpers that only accept a messaging one. */
  messagingChannel: MessagingChannel;
  audienceLabel: string;
  audienceSize: number;
  eligibility: AudienceEligibility;
  accounts: SocialAccount[];
  platforms: SocialPlatform[];
  /** Followers across the selected accounts - the only reach figure we have. */
  potentialReach: number;
  mergeTags: string[];
  missingFallbacks: string[];
  messageLength: number;
  smsSegmentCount: number;
  /** What the Send step reports as the size of the send. */
  recipients: number;
}

export function deriveDraft(draft: CampaignDraft): DraftDerived {
  const isSocial = draft.channel === "social";
  const messagingChannel: MessagingChannel = isSocial
    ? "email"
    : (draft.channel as MessagingChannel);

  const savedSegment = isSocial
    ? undefined
    : segmentsForChannel(messagingChannel).find(
        (item) => item.id === draft.savedSegmentId,
      );
  const builtIn = AUDIENCES.find((item) => item.value === draft.segment);

  const audienceSize = savedSegment?.contacts ?? builtIn?.size ?? 0;
  const eligibility = eligibilityFor(draft.channel, audienceSize, draft.exclusions);

  const accounts = publishableAccounts().filter((account) =>
    draft.socialAccountIds.includes(account.id),
  );

  const mergeTags = placeholdersIn(draft);
  const messageLength = draft.message.length;

  return {
    channelLabel: CHANNEL_THEME[draft.channel].label,
    isSocial,
    messagingChannel,
    audienceLabel: savedSegment?.name ?? builtIn?.label ?? "",
    audienceSize,
    eligibility,
    accounts,
    platforms: [...new Set(accounts.map((account) => account.platform))],
    potentialReach: accounts.reduce((sum, account) => sum + account.followers, 0),
    mergeTags,
    missingFallbacks: unsafePlaceholders(draft),
    messageLength,
    smsSegmentCount: smsSegments(messageLength),
    recipients: isSocial ? accounts.length : eligibility.eligible,
  };
}

/* -------------------------------------------------------------------------- */
/* Channel switching                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Re-point everything a channel change invalidates, and nothing else.
 *
 * What survives a switch is the answer to a question the new channel still
 * asks: the name, the objective, the audience, the copy. What does not is the
 * sender configuration for a different channel and the UTM defaults - and the
 * UTMs only when nobody has edited them, because overwriting a value someone
 * typed is worse than leaving one out of date.
 */
export function applyChannel(
  draft: CampaignDraft,
  channel: MarketingChannel,
): CampaignDraft {
  const platforms = channel === "social" ? platformsOf(draft) : [];

  return {
    ...draft,
    channel,
    /* A segment that cannot reach the new channel is no longer an answer. */
    savedSegmentId:
      channel === "social"
        ? ""
        : segmentsForChannel(channel as MessagingChannel).some(
              (item) => item.id === draft.savedSegmentId,
            )
          ? draft.savedSegmentId
          : "",
    /* Templates are per-channel - a WhatsApp template id means nothing to the
       email composer, and leaving it set would silently mis-render Review. */
    templateId: "",
    abTest: {
      ...draft.abTest,
      field: channel === "email" ? "subject" : channel === "social" ? "caption" : "message",
      winnerMetric: channel === "social" ? "engagement" : "click-rate",
    },
    tracking: draft.tracking.utmTouched
      ? draft.tracking
      : {
          ...draft.tracking,
          utm: {
            ...draft.tracking.utm,
            source: utmSourceFor(channel, platforms),
            medium: UTM_MEDIUM[channel],
          },
        },
  };
}

const platformsOf = (draft: CampaignDraft): SocialPlatform[] => [
  ...new Set(
    publishableAccounts()
      .filter((account) => draft.socialAccountIds.includes(account.id))
      .map((account) => account.platform),
  ),
];

/** Keep `utm_campaign` in step with the campaign name until someone edits it. */
export function syncUtmCampaign(draft: CampaignDraft, name: string): CampaignDraft {
  if (draft.tracking.utmTouched) return { ...draft, name };

  return {
    ...draft,
    name,
    tracking: {
      ...draft.tracking,
      utm: { ...draft.tracking.utm, campaign: utmSlug(name) },
    },
  };
}
