import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CreditCard,
  LayoutGrid,
  Megaphone,
  MessagesSquare,
  Package,
  ShieldCheck,
  Terminal,
  UserPlus,
  UserRound,
  Workflow,
} from "lucide-react";

import { APP_ROUTES } from "@/constants/app";
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationEventDef,
  QuietHours,
} from "@/types/account";

/**
 * The Settings module's vocabulary.
 *
 * Kept out of the components for two reasons.
 *
 * The first is the notification catalogue, which has to be *auditable*. Every
 * entry carries a `source` naming the module that raises it, so adding a row
 * means first answering "which part of this product emits that?". A preference
 * for an event nothing emits is a switch the merchant sets once and is then
 * quietly failed by.
 *
 * The second is the page list. Settings is six routes, and the module's left
 * navigation, the route table and every cross-link have to agree on what those
 * six are. One array, read everywhere.
 */

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export interface SettingsPage {
  title: string;
  href: string;
  icon: LucideIcon;
  /** The one-line subtitle the page header renders. */
  description: string;
  /** The shorter line used on the overview cards. */
  summary: string;
}

export interface SettingsNavGroup {
  /** The small caps heading above the group in the left navigation. */
  title: string;
  items: SettingsPage[];
}

/**
 * Settings, grouped the way it is navigated.
 *
 * Three groups, and the grouping is the mental model rather than decoration:
 * the first is *you*, the second is *what the workspace pays for*, the third is
 * *how other systems reach it*. A reader who wants the second or third knows it
 * immediately from the heading and never scans the first.
 *
 * **Overview is a destination, not a section.** It is the only link back to
 * `/dashboard/settings`, which is where the workspace summary and the account
 * status lines live; without it the hub is reachable only from the global
 * sidebar, which is a dead end nobody looks for.
 *
 * **There is no General.** It used to be a second editor for the workspace name,
 * timezone, currency, business details and default senders — every one of which
 * Workspace Settings already owns. Two editors for one value is not a
 * convenience, it is a question about which screen is telling the truth, and
 * the merchant has no way to answer it. The overview carries a read-only
 * summary of those values and one link to the screen that owns them.
 */
export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    title: "Settings",
    items: [
      {
        title: "Overview",
        href: APP_ROUTES.settings,
        icon: LayoutGrid,
        description: "Manage your account, notifications, security and subscription.",
        summary: "Where everything in Settings lives.",
      },
      {
        title: "Profile",
        href: APP_ROUTES.settingsProfile,
        icon: UserRound,
        description: "Manage your personal account information.",
        summary: "Your name, photo and contact details.",
      },
      {
        title: "Notifications",
        href: APP_ROUTES.settingsNotifications,
        icon: Bell,
        description: "Choose which notifications you receive and how they reach you.",
        summary: "What reaches you, and on which channel.",
      },
      {
        title: "Security",
        href: APP_ROUTES.settingsSecurity,
        icon: ShieldCheck,
        description: "Protect your account and manage authentication.",
        summary: "Password, two-factor, sessions and sign-in activity.",
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        title: "Billing & Subscription",
        href: APP_ROUTES.settingsBilling,
        icon: CreditCard,
        description: "Manage your MarketFlow plan, usage and billing.",
        summary: "Your plan, usage and payment.",
      },
    ],
  },
  {
    title: "Developer",
    items: [
      {
        title: "API & Developer",
        href: APP_ROUTES.settingsApi,
        icon: Terminal,
        description: "Manage API access, webhooks and developer integrations.",
        summary: "Keys, webhooks and documentation.",
      },
    ],
  },
];

/** Flat, in navigation order. For lookups and for the overview grid. */
export const SETTINGS_PAGES: SettingsPage[] = SETTINGS_NAV.flatMap(
  (group) => group.items,
);

/** The five sections the overview links to — everything except itself. */
export const SETTINGS_SECTIONS: SettingsPage[] = SETTINGS_PAGES.filter(
  (page) => page.href !== APP_ROUTES.settings,
);

/* -------------------------------------------------------------------------- */
/* Notification catalogue                                                     */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  in_app: "In-app",
  email: "Email",
};

export interface NotificationCategoryDef {
  key: NotificationCategory;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NOTIFICATION_CATEGORIES: NotificationCategoryDef[] = [
  {
    key: "campaigns",
    label: "Campaigns",
    description: "Sends that finish, fail or are queued up.",
    icon: Megaphone,
  },
  {
    key: "leads",
    label: "Leads",
    description: "People entering and moving through the pipeline.",
    icon: UserPlus,
  },
  {
    key: "messaging",
    label: "Messaging",
    description: "Channel activity across WhatsApp, email and SMS.",
    icon: MessagesSquare,
  },
  {
    key: "automations",
    label: "Automations",
    description: "Workflow runs and the steps inside them.",
    icon: Workflow,
  },
  {
    key: "orders",
    label: "Orders",
    description: "Sales and how they progress.",
    icon: Package,
  },
  {
    key: "security",
    label: "Security",
    description: "Changes to how your account is protected.",
    icon: ShieldCheck,
  },
];

const BOTH: NotificationChannel[] = ["in_app", "email"];
const IN_APP: NotificationChannel[] = ["in_app"];

/**
 * Every notification the product can actually raise.
 *
 * `defaultChannels` is the editorial part. The rule applied throughout: mail is
 * the default only where *not* knowing costs money or leaves a customer waiting
 * — a campaign that failed, an automation that threw, an order whose payment did
 * not go through. Everything else starts in-app, because an inbox that fills
 * with routine dashboard activity is an inbox somebody builds a filter for, and
 * the filter catches the important one too.
 *
 * The security rows are `mandatory`. "Your password changed" and "Two-factor was
 * turned off" are how a person finds out it was not them; a product that lets
 * those be muted has built the attacker a quiet room. They render as a fixed
 * state with a reason rather than as a disabled checkbox nobody can explain.
 *
 * The three Messaging rows are deliberately one row per channel rather than one
 * per event. A merchant's question is "do I want to hear about WhatsApp", not
 * "do I want to hear about inbound messages on conversations assigned to me but
 * not about sender verification"; splitting them produced nine rows that were
 * always set the same way. `source` still names every underlying trigger, so
 * the row can be checked against the code.
 */
export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  /* -- Campaigns --------------------------------------------------------- */
  {
    key: "campaign.completed",
    category: "campaigns",
    title: "Campaign completed",
    description: "Get notified when a campaign finishes sending.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/marketing-fixtures — campaign status reaches completed",
  },
  {
    key: "campaign.failed",
    category: "campaigns",
    title: "Campaign failed",
    description: "A send that stopped part way, with what it reached first.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/marketing-fixtures — campaign status reaches failed",
  },
  {
    key: "campaign.scheduled",
    category: "campaigns",
    title: "Campaign scheduled",
    description: "Confirmation that a campaign is queued, and for when.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/marketing-fixtures — campaign status reaches scheduled",
  },

  /* -- Leads ------------------------------------------------------------- */
  {
    key: "lead.captured",
    category: "leads",
    title: "New lead captured",
    description: "Receive an alert when a new lead enters the workspace.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/customer-fixtures — lead created",
  },
  {
    key: "lead.assigned",
    category: "leads",
    title: "Lead assigned",
    description: "Only leads where you are set as the owner.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/customer-fixtures — lead ownerId set to you",
  },
  {
    key: "lead.qualified",
    category: "leads",
    title: "Lead qualified",
    description: "A lead you own moved into the qualified stage.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/lead — stage reaches qualified",
  },

  /* -- Messaging --------------------------------------------------------- */
  {
    key: "messaging.whatsapp",
    category: "messaging",
    title: "WhatsApp activity",
    description: "Conversations assigned to you, and replies on the ones you own.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/whatsapp — conversation assignee, inbound message",
  },
  {
    key: "messaging.email",
    category: "messaging",
    title: "Email activity",
    description: "Sender verification results and deliverability problems.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/email — SenderStatus, EmailProviderStatus",
  },
  {
    key: "messaging.sms",
    category: "messaging",
    title: "SMS activity",
    description: "Sender ID approvals, operator blocks and opt-outs.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/sms — SmsSenderStatus, SmsContactStatus",
  },

  /* -- Automations ------------------------------------------------------- */
  {
    key: "automation.completed",
    category: "automations",
    title: "Automation completed",
    description: "A workflow run reached its last step.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/workflow-fixtures — run status completed",
  },
  {
    key: "automation.failed",
    category: "automations",
    title: "Automation failed",
    description: "Get notified when an automation encounters an error.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/workflow-fixtures — run status failed",
  },

  /* -- Orders ------------------------------------------------------------ */
  {
    key: "order.created",
    category: "orders",
    title: "New order",
    description: "Every order, whatever channel it came from.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — order created",
  },
  {
    key: "order.status_changed",
    category: "orders",
    title: "Order status changed",
    description: "Paid, shipped, cancelled or refunded — including failed payments.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/commerce — OrderStatus and PaymentStatus transitions",
  },

  /* -- Security ---------------------------------------------------------- */
  {
    key: "security.new_login",
    category: "security",
    title: "New login",
    description: "A sign-in from a browser or device you have not used before.",
    channels: BOTH,
    defaultChannels: BOTH,
    mandatory: true,
    source: "account service — session created",
  },
  {
    key: "security.password_changed",
    category: "security",
    title: "Password changed",
    description: "Sent whenever your password is changed or reset.",
    channels: BOTH,
    defaultChannels: BOTH,
    mandatory: true,
    source: "account service — password updated",
  },
  {
    key: "security.two_factor_changed",
    category: "security",
    title: "2FA changed",
    description: "Sent when two-factor is enabled, disabled or re-enrolled.",
    channels: BOTH,
    defaultChannels: BOTH,
    mandatory: true,
    source: "account service — two-factor state changed",
  },
];


/** The catalogue grouped for rendering, skipping categories with no events. */
export function notificationEventsByCategory(
  events: NotificationEventDef[] = NOTIFICATION_EVENTS,
): { category: NotificationCategoryDef; events: NotificationEventDef[] }[] {
  return NOTIFICATION_CATEGORIES.map((category) => ({
    category,
    events: events.filter((event) => event.category === category.key),
  })).filter((group) => group.events.length > 0);
}

export const QUIET_HOURS_OPTIONS: { value: QuietHours; label: string }[] = [
  { value: "off", label: "Never hold notifications" },
  { value: "night", label: "Hold overnight (21:00 – 08:00)" },
  { value: "night_weekend", label: "Hold overnight and at weekends" },
];

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export const AVATAR_RULES = {
  accept: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 2 * 1024 * 1024,
  hint: "PNG, JPG or WebP, up to 2 MB. Square images look best.",
};

/* -------------------------------------------------------------------------- */
/* Password                                                                   */
/* -------------------------------------------------------------------------- */

export const PASSWORD_MIN_LENGTH = 12;

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

/**
 * Four rules, each one a thing the reader can act on.
 *
 * Length first and weighted hardest, because it is the only one that reliably
 * matters. The character-class rules are here because people expect them and
 * they do no harm, not because "at least one symbol" is what makes a
 * passphrase hard to guess.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "An upper and a lower case letter",
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { label: "A number", test: (value) => /\d/.test(value) },
  { label: "A symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const PASSWORD_STRENGTH = [
  { label: "Too short", tone: "bg-error" },
  { label: "Weak", tone: "bg-error" },
  { label: "Fair", tone: "bg-warning" },
  { label: "Good", tone: "bg-info" },
  { label: "Strong", tone: "bg-success" },
];

/** 0–4, where 4 is every rule met at or above the minimum length. */
export function passwordScore(value: string): number {
  if (value.length === 0) return 0;
  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  return value.length < PASSWORD_MIN_LENGTH ? Math.min(passed, 1) : passed;
}

/* -------------------------------------------------------------------------- */
/* Two-factor                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The parameters every authenticator app assumes by default.
 *
 * Written down rather than left implicit because the QR code encodes them: a
 * six-digit code on a thirty-second step is what Google Authenticator, 1Password
 * and Authy all expect, and an `otpauth` URI that disagrees produces codes that
 * look right and never verify.
 */
export const TOTP_CONFIG = {
  issuer: "MarketFlow",
  digits: 6,
  periodSeconds: 30,
  /**
   * How many steps either side of now are accepted.
   *
   * One. That is thirty seconds of clock skew in each direction, which covers
   * a phone that has not synced recently without widening the window a stolen
   * code stays usable in.
   */
  window: 1,
  recoveryCodeCount: 10,
} as const;

/* -------------------------------------------------------------------------- */
/* Developer                                                                  */
/* -------------------------------------------------------------------------- */

export interface DeveloperResource {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

export const DEVELOPER_RESOURCES: DeveloperResource[] = [
  {
    title: "API documentation",
    description: "Endpoints, request shapes and the errors they return.",
    href: "https://docs.marketflow.app/api",
    external: true,
  },
  {
    title: "Webhook documentation",
    description: "Event payloads, signature verification and retry behaviour.",
    href: "https://docs.marketflow.app/webhooks",
    external: true,
  },
  {
    title: "Integration guide",
    description: "Connecting WhatsApp, email, SMS and social from your own stack.",
    href: "https://docs.marketflow.app/integrations",
    external: true,
  },
];
