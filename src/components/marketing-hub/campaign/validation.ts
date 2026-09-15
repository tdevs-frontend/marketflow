import {
  WHATSAPP_CONNECTIONS,
  smsSenderOptions,
} from "@/lib/campaign-fixtures";
import { TEMPLATES } from "@/lib/whatsapp-fixtures";
import { hasCapability, publishableAccounts } from "@/lib/social-fixtures";
import { WORKSPACE_NOW } from "@/lib/workspace-clock";
import type { CampaignDraft, WizardStep } from "@/types/marketing";
import type { DraftDerived } from "./draft";

/**
 * The pre-flight check.
 *
 * Two levels, and the distinction is the whole point. A `blocker` is something
 * that would make the send fail or break a rule — no audience, an unapproved
 * template, a sender that is not connected. A `warning` is something a
 * competent marketer might do on purpose: no fallback on a merge tag, no
 * subject preview text, tracking switched off. Blockers stop the send; warnings
 * are stated and stepped past.
 *
 * Every issue carries the step that fixes it, so the Review list is navigable
 * rather than a wall of text telling someone to go and look.
 */

export type IssueLevel = "blocker" | "warning";

export interface PreflightIssue {
  id: string;
  level: IssueLevel;
  message: string;
  /** Where the fix is. Clicking the issue jumps here. */
  step: WizardStep;
}

export function preflight(
  draft: CampaignDraft,
  derived: DraftDerived,
): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const add = (
    id: string,
    level: IssueLevel,
    step: WizardStep,
    message: string,
  ) => issues.push({ id, level, step, message });

  /* ------------------------------------------------------------- General */

  if (!draft.name.trim()) {
    add("name", "blocker", "campaign", "The campaign has no name.");
  }

  if (!derived.isSocial && derived.audienceSize === 0) {
    add("audience", "blocker", "audience", "No audience is selected.");
  }

  if (!derived.isSocial && derived.eligibility.eligible === 0 && derived.audienceSize > 0) {
    add(
      "eligible",
      "blocker",
      "audience",
      "Every contact in this audience is excluded or ineligible.",
    );
  }

  if (!draft.message.trim()) {
    add(
      "message",
      "blocker",
      "content",
      derived.isSocial ? "The post has no text." : "The message is empty.",
    );
  }

  if (derived.missingFallbacks.length > 0) {
    add(
      "fallbacks",
      "warning",
      "personalization",
      `${derived.missingFallbacks.length} merge tag${
        derived.missingFallbacks.length === 1 ? " has" : "s have"
      } no fallback. Contacts missing that field receive the tag as written.`,
    );
  }

  if (!draft.tracking.clicks && !draft.tracking.conversions) {
    add(
      "tracking",
      "warning",
      "review",
      "Click and conversion tracking are both off — this campaign will not report results.",
    );
  }

  if (draft.goal === "none") {
    add(
      "goal",
      "warning",
      "review",
      "No conversion goal set, so this campaign has nothing to convert against.",
    );
  }

  if (draft.sendMode === "later" && !draft.date) {
    add("date", "blocker", "schedule", "Scheduled, but no send date is set.");
  }

  /*
   * A send time in the past.
   *
   * Compared as text against the workspace clock rather than through `Date`:
   * `WORKSPACE_NOW` is what every other module measures against, and a
   * `Date.now()` here would make `preflight` impure — the server and the
   * client would disagree about whether a draft is late, which is a hydration
   * mismatch in a function that runs during render.
   *
   * Timezone-naive on purpose. It catches the mistake people actually make
   * (picking a date that has already gone by) without pretending to resolve
   * `draft.timezone`, which needs a real zone database the backend will own.
   */
  if (draft.sendMode === "later" && draft.date) {
    const scheduled = `${draft.date}T${draft.time || "00:00"}`;
    if (scheduled <= WORKSPACE_NOW.slice(0, 16)) {
      add(
        "past-date",
        "blocker",
        "schedule",
        "That send time has already passed. Pick a date and time in the future.",
      );
    }
  }

  if (draft.allowedDays.length === 0) {
    add(
      "days",
      "blocker",
      "schedule",
      "Every weekday is switched off, so the campaign can never deliver.",
    );
  }

  if (draft.abTest.enabled && !draft.abTest.variantB.trim()) {
    add("ab-variant", "blocker", "content", "The A/B test has no variant B.");
  }

  /* ------------------------------------------------------------ WhatsApp */

  if (draft.channel === "whatsapp") {
    const connection = WHATSAPP_CONNECTIONS.find(
      (item) => item.id === draft.sender.whatsappConnectionId,
    );

    if (!connection) {
      add("wa-connection", "blocker", "campaign", "No WhatsApp connection selected.");
    } else if (!connection.verified) {
      add(
        "wa-verified",
        "blocker",
        "campaign",
        `${connection.label} is not verified and cannot send.`,
      );
    } else if (!connection.numbers.some((n) => n.id === draft.sender.whatsappNumberId)) {
      add("wa-number", "blocker", "campaign", "No sender number selected.");
    }

    const template = TEMPLATES.find((item) => item.id === draft.templateId);

    if (!draft.templateId) {
      add(
        "wa-template",
        "warning",
        "content",
        "No template selected. This only sends inside an open 24-hour reply window.",
      );
    } else if (template && template.status !== "approved") {
      add(
        "wa-approved",
        "blocker",
        "content",
        `Template ${template.name} is ${template.status} and cannot be sent.`,
      );
    }

    /* A template's variables are positional and must all be mapped; an
       unmapped one is rejected by Meta at send time, not at compose time. */
    if (template) {
      const provided = new Set(derived.mergeTags);
      const unmapped = template.variables.filter((name) => !provided.has(name));
      if (unmapped.length > 0) {
        add(
          "wa-variables",
          "blocker",
          "personalization",
          `Template variables not mapped: ${unmapped
            .map((name) => `{{${name}}}`)
            .join(", ")}.`,
        );
      }
    }
  }

  /* --------------------------------------------------------------- Email */

  if (draft.channel === "email") {
    if (!draft.sender.emailFrom) {
      add("email-sender", "blocker", "campaign", "No sending identity selected.");
    }
    if (!draft.subject.trim()) {
      add("email-subject", "blocker", "content", "The email has no subject line.");
    }
    if (!draft.previewText.trim()) {
      add(
        "email-preview",
        "warning",
        "content",
        "No preview text — most inboxes will show the first line of the body instead.",
      );
    }
    if (!draft.sender.emailReplyTo) {
      add(
        "email-replyto",
        "warning",
        "campaign",
        "No reply-to address, so replies go to the sending identity.",
      );
    }
  }

  /* ----------------------------------------------------------------- SMS */

  if (draft.channel === "sms") {
    if (!draft.sender.smsProviderId) {
      add("sms-provider", "blocker", "campaign", "No SMS provider selected.");
    } else if (
      !smsSenderOptions(draft.sender.smsProviderId).some(
        (item) => item.value === draft.sender.smsSenderId,
      )
    ) {
      add(
        "sms-sender",
        "blocker",
        "campaign",
        "The selected sender ID is not available on this provider.",
      );
    }

    if (derived.smsSegmentCount > 3) {
      add(
        "sms-length",
        "warning",
        "content",
        `This message bills as ${derived.smsSegmentCount} segments per recipient.`,
      );
    }
  }

  /* -------------------------------------------------------------- Social */

  if (draft.channel === "social") {
    if (draft.socialAccountIds.length === 0) {
      add("social-account", "blocker", "campaign", "No social account selected.");
    }

    /* Selection is filtered to publishable accounts, but a token can expire
       between choosing and sending — so it is checked again here. */
    const publishable = new Set(publishableAccounts().map((item) => item.id));
    const stale = draft.socialAccountIds.filter((id) => !publishable.has(id));
    if (stale.length > 0) {
      add(
        "social-permission",
        "blocker",
        "campaign",
        `${stale.length} selected account${
          stale.length === 1 ? " no longer has" : "s no longer have"
        } publishing permission.`,
      );
    }

    const withoutMedia = derived.accounts.filter(
      (account) => account.platform === "instagram",
    );
    if (withoutMedia.length > 0 && draft.mediaIds.length === 0) {
      add(
        "social-media",
        "blocker",
        "content",
        "Instagram requires an image or video on every post.",
      );
    }

    const noMediaCapability = derived.accounts.filter(
      (account) => !hasCapability(account, "media"),
    );
    if (draft.mediaIds.length > 0 && noMediaCapability.length > 0) {
      add(
        "social-media-permission",
        "warning",
        "campaign",
        `${noMediaCapability.length} account${
          noMediaCapability.length === 1 ? "" : "s"
        } cannot upload media and will publish text only.`,
      );
    }
  }

  return issues;
}

export const blockersIn = (issues: PreflightIssue[]) =>
  issues.filter((issue) => issue.level === "blocker");

export const warningsIn = (issues: PreflightIssue[]) =>
  issues.filter((issue) => issue.level === "warning");
