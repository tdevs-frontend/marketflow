import { PLANS } from "@/constants/pricing";
import { ROLE_LABEL, type MerchantRole } from "@/constants/roles";
import { NOTIFICATION_EVENTS } from "@/constants/settings";
import { CONTACTS } from "@/lib/customer-fixtures";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { WORKFLOWS } from "@/lib/workflow-fixtures";
import { daysAhead, daysAgo } from "@/lib/workspace-clock";
import {
  CURRENT_MEMBER,
  WORKSPACE_ID,
  WORKSPACE_SETTINGS,
  roleById,
} from "@/lib/workspace-fixtures";
import type {
  AccountUser,
  NotificationChannel,
  Subscription,
  UsageMetric,
  UserNotificationPreferences,
  WorkspaceNotificationPolicy,
} from "@/types/account";

/**
 * What the account service would return, seeded from the workspace the rest of
 * the product already agrees on.
 *
 * The signed-in person is `CURRENT_MEMBER` — the same record the Team table
 * lists as "you", the audit trail attributes changes to, and Workspace Settings
 * shows as the owner. Profile used to greet that person as "Guest User" because
 * it read `auth.user`, which is `null` and always has been: no route handlers
 * exist under `app/`, and nothing in the product dispatches `setCredentials`.
 * One screen out of five was disagreeing with the other four, so it is the
 * screen that changed.
 *
 * `lib/account-service` is the seam. It reads these values once and hands them
 * to `lib/account-store`; a real API replaces this file's role in that one
 * function and nothing else in Settings notices.
 */

/* -------------------------------------------------------------------------- */
/* The signed-in person                                                       */
/* -------------------------------------------------------------------------- */

const role = roleById(CURRENT_MEMBER.roleId);

/**
 * Job titles are not on `WorkspaceMember`, and this is the honest consequence.
 *
 * The field is offered, starts empty, and saves — rather than being seeded with
 * a plausible-looking "Head of Growth" that the merchant would have to notice
 * was invented before correcting it.
 */
export const CURRENT_ACCOUNT: AccountUser = (() => {
  const [firstName, ...rest] = CURRENT_MEMBER.name.split(" ");

  return {
    id: CURRENT_MEMBER.id,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    phone: "",
    jobTitle: "",
    avatarUrl: null,
    email: CURRENT_MEMBER.email,
    roleId: CURRENT_MEMBER.roleId,
    role: (role?.merchantRole ?? "viewer") as MerchantRole,
    roleName: role?.name ?? ROLE_LABEL[(role?.merchantRole ?? "viewer") as MerchantRole],
    workspaceId: WORKSPACE_ID,
    workspaceName: WORKSPACE_SETTINGS.general.name,
    status: CURRENT_MEMBER.status,
    joinedAt: CURRENT_MEMBER.joinedAt,
    lastActiveAt: CURRENT_MEMBER.lastActiveAt,
  };
})();

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The workspace's policy, as an administrator would have left it.
 *
 * Everything in the catalogue is available and both channels are permitted,
 * which is the correct default for a workspace nobody has restricted yet. It is
 * a *record* rather than an assumption so that a member's list is genuinely
 * derived from it: turn an event off here and it disappears from every member's
 * Notifications page, which is the behaviour that makes the admin/member split
 * real rather than decorative.
 */
export const DEFAULT_NOTIFICATION_POLICY: WorkspaceNotificationPolicy = {
  enabled: Object.fromEntries(
    NOTIFICATION_EVENTS.map((event) => [event.key, true]),
  ),
  channels: Object.fromEntries(
    NOTIFICATION_EVENTS.map((event) => [event.key, [...event.channels]]),
  ),
};

/** A member's starting preferences: each event on its catalogue default. */
export function defaultNotificationPreferences(): UserNotificationPreferences {
  return {
    channels: Object.fromEntries(
      NOTIFICATION_EVENTS.map((event) => [
        event.key,
        [...event.defaultChannels] as NotificationChannel[],
      ]),
    ),
    emailAddress: "",
    quietHours: "night",
  };
}

/* -------------------------------------------------------------------------- */
/* Subscription                                                               */
/* -------------------------------------------------------------------------- */

const GROWTH = PLANS.find((plan) => plan.id === "growth") ?? PLANS[0];

/**
 * What this workspace subscribes to.
 *
 * The plan and its price come from `constants/pricing` — the same tiers the
 * public pricing page renders, so there is one answer to what MarketFlow costs
 * and a change there cannot leave Billing quoting last quarter's number.
 *
 * `paymentMethod` is `null`, and that is the one value on this page nobody
 * should be tempted to fill in. No payment provider is integrated; a card
 * ending in 4242 would tell a merchant their service cannot lapse, which is the
 * single most expensive thing a billing screen can get wrong. Billing renders
 * the empty state and says why.
 */
export const SUBSCRIPTION: Subscription = {
  planId: GROWTH.id,
  status: "active",
  period: "monthly",
  amount: GROWTH.monthly ?? 0,
  currency: "USD",
  startedAt: daysAgo(420),
  renewsAt: daysAhead(30),
  trialEndsAt: null,
  paymentMethod: null,
};

/**
 * Plan allowances, per tier.
 *
 * Numbers rather than the marketing strings on `Plan.features`, because a meter
 * needs a denominator and parsing "10,000 Contacts" back out of a bullet is how
 * a limit silently becomes `NaN` the day somebody rewords the bullet. `null` is
 * an unmetered entitlement and renders as a count with no bar.
 */
const PLAN_LIMITS: Record<string, Record<string, number | null>> = {
  starter: {
    contacts: 1_000,
    whatsapp: 2_500,
    email: 5_000,
    sms: 1_000,
    automations: 3,
  },
  growth: {
    contacts: 10_000,
    whatsapp: 15_000,
    email: 50_000,
    sms: 10_000,
    automations: 25,
  },
  business: {
    contacts: 50_000,
    whatsapp: 75_000,
    email: 250_000,
    sms: 50_000,
    automations: 100,
  },
  enterprise: {
    contacts: null,
    whatsapp: null,
    email: null,
    sms: null,
    automations: null,
  },
};

/** Messages actually sent on one channel, summed from the campaign records. */
const sentOn = (channel: string): number =>
  CAMPAIGNS.filter((campaign) => campaign.channel === channel).reduce(
    (total, campaign) => total + campaign.sent,
    0,
  );

/**
 * What this workspace has used, counted from the workspace.
 *
 * Every figure is derived, not typed: contacts are the rows in the CRM, message
 * counts are the sums of what the campaigns actually sent, automations are the
 * workflows that exist. A usage meter is the one part of a billing page a
 * merchant checks against their own knowledge of their business, and a
 * hand-written number is the one they catch.
 */
export function usageMetrics(planId: string = SUBSCRIPTION.planId): UsageMetric[] {
  const limits = PLAN_LIMITS[planId] ?? PLAN_LIMITS.growth;

  return [
    {
      key: "contacts",
      label: "Contacts",
      used: CONTACTS.length,
      limit: limits.contacts,
      unit: "contacts",
      hint: "People in the CRM, across every source.",
    },
    {
      key: "whatsapp",
      label: "WhatsApp messages",
      used: sentOn("whatsapp"),
      limit: limits.whatsapp,
      unit: "messages",
      hint: "Sent from campaigns this period.",
    },
    {
      key: "email",
      label: "Email sends",
      used: sentOn("email"),
      limit: limits.email,
      unit: "emails",
      hint: "Delivered and bounced both count against the allowance.",
    },
    {
      key: "sms",
      label: "SMS messages",
      used: sentOn("sms"),
      limit: limits.sms,
      unit: "messages",
      hint: "Billed per segment by the operator.",
    },
    {
      key: "automations",
      label: "Automations",
      used: WORKFLOWS.length,
      limit: limits.automations,
      unit: "workflows",
      hint: "Built in the workflow canvas, live or draft.",
    },
  ];
}
