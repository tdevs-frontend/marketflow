import { PLANS, type Plan, type PlanTier } from "@/constants/pricing";
import { ROLE_LABEL, type MerchantRole } from "@/constants/roles";
import { NOTIFICATION_EVENTS } from "@/constants/settings";
import { CONTACTS } from "@/lib/customer-fixtures";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { WORKFLOWS } from "@/lib/workflow-fixtures";
import { WORKSPACE_NOW, daysAhead, daysAgo } from "@/lib/workspace-clock";
import {
  CURRENT_MEMBER,
  WORKSPACE_ID,
  WORKSPACE_SETTINGS,
  roleById,
} from "@/lib/workspace-fixtures";
import type {
  AccountUser,
  NotificationChannel,
  PlanPeriod,
  Subscription,
  UsageMetric,
  UserNotificationPreferences,
  WorkspaceNotificationPolicy,
} from "@/types/account";

/**
 * What the account service would return, seeded from the workspace the rest of
 * the product already agrees on.
 *
 * The signed-in person is `CURRENT_MEMBER` - the same record the Team table
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
 * The field is offered, starts empty, and saves - rather than being seeded with
 * a plausible-looking "Head of Growth" that the merchant would have to notice
 * was invented before correcting it.
 *
 * `avatarUrl` points at `public/user/`, this person's own file, rather than at
 * one of the `customer-avatar-*.jpg` images - those are each already a named
 * contact in the WhatsApp inbox and four of the faces in the landing hero, and
 * borrowing one would put the same face on a customer and on the person signed
 * in.
 *
 * The file is not load-bearing. Every surface that renders this photo uses
 * `AvatarPhoto`, which falls back to the initials when the image does not
 * resolve - so a moved or missing file shows "NR" rather than a broken glyph.
 */
export const CURRENT_ACCOUNT: AccountUser = (() => {
  const [firstName, ...rest] = CURRENT_MEMBER.name.split(" ");

  return {
    id: CURRENT_MEMBER.id,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    phone: "",
    jobTitle: "",
    avatarUrl: "/user/user-image.jpg",
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
 * The plan and its price come from `constants/pricing` - the same tiers the
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

/* -------------------------------------------------------------------------- */
/* Plan history                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The periods this workspace has been billed for, oldest last.
 *
 * Demo records, in the same sense as `SUBSCRIPTION` above and the contacts and
 * campaigns every other module is seeded from: this is what the account service
 * *would* return, shaped exactly as `PlanPeriod`, so standing up a real
 * endpoint replaces `listPlanHistory`'s body and nothing else in Settings
 * notices.
 *
 * Three rules keep it from contradicting the rest of the product, which is the
 * only way seeded data is worth more than an empty table:
 *
 *   **Prices are looked up, never typed.** `$49` appears nowhere below; the
 *   amount comes from the tier in `constants/pricing`, the same place the
 *   pricing page and the Current plan card read. Editing a tier's price cannot
 *   leave the history quoting a number the product never charged.
 *
 *   **The chain is continuous.** Each period opens the day the one before it
 *   closed, so there is no month the workspace was apparently on nothing.
 *
 *   **It agrees with the subscription.** The open period *is* `SUBSCRIPTION` -
 *   same tier, same cycle, same amount - and the oldest period opens on
 *   `SUBSCRIPTION.startedAt`, which is the date Billing Information shows as
 *   "Subscribed since". The two tabs cannot be caught disagreeing.
 *
 * The arc is an ordinary one: started small, grew into the featured tier, tried
 * the one above it for a quarter, came back down.
 */
const PLAN_PERIODS: {
  id: string;
  plan: PlanTier;
  /** Days before `WORKSPACE_NOW` the period opened. */
  from: number;
  /** Days before it closed, or `null` while it is the one running. */
  to: number | null;
}[] = [
  { id: "per_0004", plan: "growth", from: 60, to: null },
  { id: "per_0003", plan: "business", from: 150, to: 60 },
  { id: "per_0002", plan: "growth", from: 300, to: 150 },
  { id: "per_0001", plan: "starter", from: 420, to: 300 },
];

const tier = (id: PlanTier): Plan | undefined =>
  PLANS.find((plan) => plan.id === id);

export const PLAN_HISTORY: PlanPeriod[] = PLAN_PERIODS.map(
  ({ id, plan, from, to }) => ({
    id,
    planId: plan,
    planName: tier(plan)?.name ?? plan,
    period: "monthly",
    amount: tier(plan)?.monthly ?? 0,
    currency: SUBSCRIPTION.currency,
    startedAt: daysAgo(from),
    endedAt: to === null ? null : daysAgo(to),
    /* Derived from the dates rather than set beside them: a row that says
       "Ended" with no end date, or "Active" with one, is a table nobody can
       read twice the same way. */
    status: to === null ? "active" : "ended",
  }),
);

/* -------------------------------------------------------------------------- */
/* Charges                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every time a period would have been billed, from the periods themselves.
 *
 * Derived rather than written beside them, and that is the whole reason the
 * billing module now has one history instead of two. A hand-written invoice
 * list drifts from the plan history the first time either is edited, and the
 * merchant who catches it is the one reconciling a bank statement - the worst
 * moment for two screens in the same product to disagree. Here there is nothing
 * to drift: a period says Business ran April to July at $99, and these are the
 * three charges that made it up.
 *
 * The month a period is still running is not billed yet. Its next charge is
 * `renewsAt`, which Current subscription already states, and listing it here
 * would put a payment in the history that has not been taken.
 */

/** Adds whole months to an ISO instant, clamping a 31st into a short month. */
function addMonths(iso: string, months: number): Date {
  const date = new Date(iso);
  const day = date.getUTCDate();
  const shifted = new Date(date);

  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);

  const lastDay = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0),
  ).getUTCDate();

  shifted.setUTCDate(Math.min(day, lastDay));
  return shifted;
}

/** One charge, before it is dressed as a `Purchase`. */
export interface PlanCharge {
  at: string;
  period: PlanPeriod;
}

/**
 * The charges a set of periods implies, newest first.
 *
 * Exported as a function over periods rather than as a constant, because the
 * periods are held in the account store and grow: a plan change during the
 * session closes one and opens another, and the history has to gain its charge
 * rather than go on describing the workspace as it was at page load.
 */
export function chargesFor(periods: PlanPeriod[], now = WORKSPACE_NOW): PlanCharge[] {
  const charges: PlanCharge[] = [];

  for (const period of periods) {
    const end = period.endedAt ? new Date(period.endedAt) : new Date(now);
    const step = period.period === "yearly" ? 12 : 1;

    for (let index = 0; ; index += 1) {
      const at = addMonths(period.startedAt, index * step);
      if (at >= end) break;
      charges.push({ at: at.toISOString(), period });
    }
  }

  return charges.sort((a, b) => b.at.localeCompare(a.at));
}

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
