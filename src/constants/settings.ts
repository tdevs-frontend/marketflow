import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CreditCard,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
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
 * The second is the page list. Settings is six routes now rather than one page
 * of tabs, and the sidebar, the in-module strip and the route table all have to
 * agree on what those six are. One array, three readers.
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
}

/**
 * The six sections, in the order they are presented everywhere.
 *
 * Ordered by how often a person needs them and by whose they are: the
 * workspace first, then the person, then the two that belong to somebody with
 * a particular job — the owner who pays, and the developer who integrates.
 *
 * Security is one page holding two sections rather than two routes. Change
 * Password and Two-Factor are read together — "is my account safe" is one
 * question — and splitting them puts a route between the two halves of one
 * answer.
 */
export const SETTINGS_PAGES: SettingsPage[] = [
  {
    title: "General",
    href: APP_ROUTES.settings,
    icon: SettingsIcon,
    description: "Workspace name, locale, business details and default senders.",
  },
  {
    title: "Profile",
    href: APP_ROUTES.settingsProfile,
    icon: UserRound,
    description: "Manage your personal information and account details.",
  },
  {
    title: "Notifications",
    href: APP_ROUTES.settingsNotifications,
    icon: Bell,
    description: "Choose how you receive important workspace notifications.",
  },
  {
    title: "Security",
    href: APP_ROUTES.settingsSecurity,
    icon: ShieldCheck,
    description: "Protect your account and manage authentication.",
  },
  {
    title: "Billing & Subscription",
    href: APP_ROUTES.settingsBilling,
    icon: CreditCard,
    description: "Your plan, what it costs and what this workspace is using.",
  },
  {
    title: "API & Developer",
    href: APP_ROUTES.settingsApi,
    icon: Terminal,
    description: "Keys, webhooks and reference for building against MarketFlow.",
  },
];

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
    key: "automations",
    label: "Automations",
    description: "Workflow runs and the steps inside them.",
    icon: Workflow,
  },
  {
    key: "leads",
    label: "Leads",
    description: "People entering and moving through the pipeline.",
    icon: UserPlus,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "The shared inbox and who is answering it.",
    icon: MessageCircle,
  },
  {
    key: "email",
    label: "Email",
    description: "Sender identities and deliverability.",
    icon: Mail,
  },
  {
    key: "sms",
    label: "SMS",
    description: "Sender IDs and opt-outs.",
    icon: Smartphone,
  },
  {
    key: "orders",
    label: "Orders",
    description: "Sales, payments and stock levels.",
    icon: Package,
  },
  {
    key: "security",
    label: "Security",
    description: "Changes to how your account is protected.",
    icon: ShieldCheck,
  },
  {
    key: "system",
    label: "System",
    description: "Connections and developer access.",
    icon: Terminal,
  },
];

const BOTH: NotificationChannel[] = ["in_app", "email"];
const IN_APP: NotificationChannel[] = ["in_app"];

/**
 * Every notification the product can actually raise.
 *
 * `defaultChannels` is the editorial part. The rule applied throughout: mail is
 * the default only where *not* knowing costs money or leaves a customer waiting
 * — a campaign that failed, an automation that threw, a payment that did not
 * go through, a connection that dropped. Everything else starts in-app, because
 * an inbox that fills with routine dashboard activity is an inbox somebody
 * builds a filter for, and the filter catches the important one too.
 *
 * The security rows are `mandatory`. "Your password changed" and "Two-factor
 * was turned off" are how a person finds out it was not them; a product that
 * lets those be muted has built the attacker a quiet room. They render as a
 * fixed state with a reason rather than as a disabled checkbox nobody can
 * explain.
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
    source: "lib/campaign-fixtures — campaign status reaches sent",
  },
  {
    key: "campaign.failed",
    category: "campaigns",
    title: "Campaign failed",
    description: "A send that stopped part way, with what it reached first.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/campaign-fixtures — campaign status reaches failed",
  },
  {
    key: "campaign.scheduled",
    category: "campaigns",
    title: "Campaign scheduled",
    description: "Confirmation that a campaign is queued, and for when.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/campaign-fixtures — campaign status reaches scheduled",
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
    key: "lead.qualified",
    category: "leads",
    title: "Lead qualified",
    description: "A lead moved into the qualified stage.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/lead — stage reaches qualified",
  },
  {
    key: "lead.assigned",
    category: "leads",
    title: "Lead assigned to me",
    description: "Only leads where you are set as the owner.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/customer-fixtures — lead ownerId",
  },

  /* -- WhatsApp ---------------------------------------------------------- */
  {
    key: "whatsapp.conversation_assigned",
    category: "whatsapp",
    title: "Conversation assigned to me",
    description: "From the shared inbox, or a workflow that routes to an owner.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/whatsapp — conversation assignee",
  },
  {
    key: "whatsapp.message_received",
    category: "whatsapp",
    title: "New message in a conversation I own",
    description: "Inbound replies on threads assigned to you.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/whatsapp — inbound message on an assigned conversation",
  },

  /* -- Email ------------------------------------------------------------- */
  {
    key: "email.sender_verified",
    category: "email",
    title: "Sender identity verified or rejected",
    description: "The result of verifying a from-address you added.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/email — SenderStatus reaches verified or failed",
  },

  /* -- SMS --------------------------------------------------------------- */
  {
    key: "sms.sender_status",
    category: "sms",
    title: "Sender ID approved or blocked",
    description: "Operators can block a sender ID after it is in use.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/sms — SmsSenderStatus reaches active or blocked",
  },
  {
    key: "sms.opt_out",
    category: "sms",
    title: "Contact opts out of SMS",
    description: "Opt-outs are applied immediately and cannot be reversed by you.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/sms — SmsContactStatus reaches opted-out",
  },

  /* -- Orders ------------------------------------------------------------ */
  {
    key: "order.placed",
    category: "orders",
    title: "New order placed",
    description: "Every order, whatever channel it came from.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — order created",
  },
  {
    key: "order.payment_failed",
    category: "orders",
    title: "Payment failed",
    description: "An order whose payment did not go through.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/commerce — PaymentStatus reaches failed",
  },
  {
    key: "order.refunded",
    category: "orders",
    title: "Order refunded",
    description: "Money returned to a customer, and by whom.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — PaymentStatus reaches refunded",
  },
  {
    key: "inventory.low_stock",
    category: "orders",
    title: "Stock runs low",
    description: "A product fell below its own low-stock threshold.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — StockStatus reaches low-stock",
  },

  /* -- Security ---------------------------------------------------------- */
  {
    key: "security.new_login",
    category: "security",
    title: "New sign-in to your account",
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
    title: "Two-factor authentication changed",
    description: "Sent when two-factor is enabled, disabled or re-enrolled.",
    channels: BOTH,
    defaultChannels: BOTH,
    mandatory: true,
    source: "account service — two-factor state changed",
  },

  /* -- System ------------------------------------------------------------ */
  {
    key: "system.integration_disconnected",
    category: "system",
    title: "Integration disconnected",
    description: "A revoked connection stops every journey that uses it.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/integration-fixtures — connection status",
  },
  {
    key: "system.api_key_revoked",
    category: "system",
    title: "API key created or revoked",
    description: "Any change to the keys that can reach your data.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/integration — ApiKeyStatus",
  },
  {
    key: "system.webhook_failing",
    category: "system",
    title: "Webhook endpoint failing",
    description: "Deliveries have been failing long enough to need attention.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/integration — WebhookStatus reaches failing",
  },
];

export const NOTIFICATION_EVENT_BY_KEY: Record<string, NotificationEventDef> =
  Object.fromEntries(NOTIFICATION_EVENTS.map((event) => [event.key, event]));

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
