import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CreditCard,
  LayoutGrid,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Plug,
  Share2,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Users,
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
 * One group now, and what left it is the point. Billing and Developer used to
 * be the second and third — *what the workspace pays for* and *how other
 * systems reach it* — and neither is an account preference. They are modules a
 * different person opens for a different reason: an owner checks the bill,
 * a developer lives in the API pages, and everybody changes their own
 * password. Both are groups of their own in the dashboard sidebar now; their
 * routes are unchanged, so every existing link still resolves.
 *
 * What is left is a single coherent subject — the person signed in — which is
 * why the rail no longer needs the grouping to explain itself.
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
        description: "Manage your account, notifications and security.",
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
];

/** Flat, in navigation order. For lookups and for the overview grid. */
export const SETTINGS_PAGES: SettingsPage[] = SETTINGS_NAV.flatMap(
  (group) => group.items,
);

/** The sections the overview links to — everything except itself. */
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

/**
 * The modules a merchant can be notified about, in sidebar order.
 *
 * One category per product area rather than six invented buckets, so the page
 * has the same shape as the rest of the dashboard and a reader can find
 * "WhatsApp" where they expect it. The icons are the modules' own, from the
 * same set the sidebar draws.
 */
export const NOTIFICATION_CATEGORIES: NotificationCategoryDef[] = [
  {
    key: "commerce",
    label: "Commerce",
    description: "Orders, payments, stock and the catalogue.",
    icon: ShoppingBag,
  },
  {
    key: "customers",
    label: "Customers",
    description: "People entering the CRM and moving through the pipeline.",
    icon: Users,
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Cross-channel campaigns and the audiences they send to.",
    icon: Megaphone,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Conversations, sends and template approvals.",
    icon: MessageCircle,
  },
  {
    key: "email",
    label: "Email",
    description: "Sends, deliverability and bounces.",
    icon: Mail,
  },
  {
    key: "sms",
    label: "SMS",
    description: "Sends and operator delivery problems.",
    icon: MessageSquare,
  },
  {
    key: "social",
    label: "Social",
    description: "Scheduled posts and connected accounts.",
    icon: Share2,
  },
  {
    key: "automation",
    label: "Automation",
    description: "Workflow runs and the triggers that start them.",
    icon: Workflow,
  },
  {
    key: "integrations",
    label: "Integrations",
    description: "Connected services and webhook delivery.",
    icon: Plug,
  },
  {
    key: "workspace",
    label: "Workspace",
    description: "Members, roles and activity that needs an owner.",
    icon: Building2,
  },
  {
    key: "billing",
    label: "Billing",
    description: "Subscription, payments and renewals.",
    icon: CreditCard,
  },
];

const BOTH: NotificationChannel[] = ["in_app", "email"];
const IN_APP: NotificationChannel[] = ["in_app"];
/** Available, but off until somebody asks for it. See `workflow.started`. */
const MUTED: NotificationChannel[] = [];

/**
 * Every notification the product can actually raise, across every module.
 *
 * Three rules govern what is in this list, and they are worth stating because
 * "notify me about everything" is how a preference centre becomes a page whose
 * only realistic use is switching all of it off.
 *
 * **It has to be an event, not a state.** Analytics figures, activity logs and
 * campaign reports are things a merchant goes and looks at; this file is for
 * moments the product should interrupt them about. Automation Activity answers
 * *what happened*; a row here answers *should I be told when it does*. Nothing
 * below duplicates a page that already exists.
 *
 * **Somebody has to act on it.** Every row is something a merchant would
 * change their afternoon for — an order to pack, a card that declined, a
 * workflow that threw, a template Meta rejected. Rows for "a tag was created"
 * or "a segment recalculated" are not here, because nobody does anything
 * differently on hearing them, and a list padded with those teaches the reader
 * to skim past the one that mattered.
 *
 * **`source` has to name real code.** It is never rendered; it exists so the
 * catalogue can be *checked* rather than trusted. A preference for an event
 * nothing emits is a switch that silently does nothing, and the merchant only
 * discovers it by not being told something. Every entry below names the type
 * or fixture that models the transition it fires on, and the module it names
 * is the module its category is named after.
 *
 * `defaultChannels` is the editorial part, and the rule is unchanged: mail is
 * the default only where *not* knowing costs money or leaves a customer
 * waiting — a failed payment, a campaign that stopped, a webhook that stopped
 * delivering. Everything else starts in-app, because an inbox that fills with
 * routine dashboard activity is an inbox somebody builds a filter for, and the
 * filter catches the important one too.
 */
export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  /* -- Commerce ---------------------------------------------------------- */
  {
    key: "order.created",
    category: "commerce",
    title: "New order",
    description: "A new order has been placed, whatever channel it came from.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — order created",
  },
  {
    key: "order.status_changed",
    category: "commerce",
    title: "Order status changed",
    description: "Paid, shipped, cancelled or refunded.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — OrderStatus / FulfillmentStatus transitions",
  },
  {
    key: "order.payment_failed",
    category: "commerce",
    title: "Order payment failed",
    description: "A customer's payment did not go through and the order is unpaid.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/commerce — PaymentStatus reaches failed",
  },
  {
    key: "inventory.low_stock",
    category: "commerce",
    title: "Low stock",
    description: "A product has fallen to its low-stock threshold.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/commerce — StockStatus reaches low-stock, per lowStockThreshold",
  },
  {
    key: "inventory.out_of_stock",
    category: "commerce",
    title: "Out of stock",
    description: "A product can no longer be sold until it is restocked.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/commerce — StockStatus reaches out-of-stock",
  },
  {
    key: "product.published",
    category: "commerce",
    title: "Product published",
    description: "A product moved out of draft and is now on sale.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/commerce — ProductStatus reaches published",
  },
  {
    key: "discount.status_changed",
    category: "commerce",
    title: "Discount started or expired",
    description: "A discount or coupon became active, or stopped being redeemable.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/commerce — DiscountStatus reaches active or expired",
  },

  /* -- Customers --------------------------------------------------------- */
  {
    key: "contact.created",
    category: "customers",
    title: "New contact",
    description: "Someone new was added to the CRM, from any source.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/customer-fixtures — contact created",
  },
  {
    key: "lead.captured",
    category: "customers",
    title: "New lead",
    description: "A new lead entered the workspace.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/customer-fixtures — lead created",
  },
  {
    key: "lead.assigned",
    category: "customers",
    title: "Lead assigned to you",
    description: "Only leads where you are set as the owner.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/customer-fixtures — lead ownerId set to you",
  },
  {
    key: "lead.qualified",
    category: "customers",
    title: "Lead qualified",
    description: "A lead you own moved into the qualified stage.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/lead — stage reaches qualified",
  },
  {
    key: "journey.stage_changed",
    category: "customers",
    title: "Customer journey update",
    description: "A contact you follow moved to a new stage of their journey.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/customer-fixtures — journey stage transition",
  },

  /* -- Marketing --------------------------------------------------------- */
  {
    key: "campaign.scheduled",
    category: "marketing",
    title: "Campaign scheduled",
    description: "Confirmation that a campaign is queued, and for when.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/marketing-fixtures — campaign status reaches scheduled",
  },
  {
    key: "campaign.completed",
    category: "marketing",
    title: "Campaign completed",
    description: "A campaign finished sending, with what it reached.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/marketing-fixtures — campaign status reaches completed",
  },
  {
    key: "campaign.failed",
    category: "marketing",
    title: "Campaign failed",
    description: "A send stopped part way, with how far it got first.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/marketing-fixtures — campaign status reaches failed",
  },
  {
    key: "campaign.performance_alert",
    category: "marketing",
    title: "Campaign performance alert",
    description: "A live campaign's open or click rate fell well below its channel's norm.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/marketing-fixtures — campaign metrics against channel baseline",
  },
  {
    key: "audience.updated",
    category: "marketing",
    title: "Audience updated",
    description: "A segment's membership changed enough to affect who a campaign would reach.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/segment — SegmentRule evaluation changes membership",
  },

  /* -- WhatsApp ---------------------------------------------------------- */
  {
    key: "whatsapp.conversation_started",
    category: "whatsapp",
    title: "New conversation",
    description: "Someone messaged the business number for the first time.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/whatsapp — conversation created",
  },
  {
    key: "whatsapp.message_received",
    category: "whatsapp",
    title: "New message",
    description: "A reply on a conversation assigned to you.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/whatsapp — inbound message on assigned conversation",
  },
  {
    key: "whatsapp.campaign_completed",
    category: "whatsapp",
    title: "WhatsApp campaign completed",
    description: "A WhatsApp send finished, with delivery and read counts.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/whatsapp-fixtures — campaign status reaches completed",
  },
  {
    key: "whatsapp.campaign_failed",
    category: "whatsapp",
    title: "WhatsApp campaign failed",
    description: "A WhatsApp send stopped, usually on a template or window problem.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/whatsapp-fixtures — campaign status reaches failed",
  },
  {
    key: "whatsapp.template_status",
    category: "whatsapp",
    title: "Template approved or rejected",
    description: "Meta reviewed a message template. Rejections say why.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/marketing — TemplateStatus reaches approved or rejected",
  },

  /* -- Email ------------------------------------------------------------- */
  {
    key: "email.campaign_sent",
    category: "email",
    title: "Email campaign sent",
    description: "A send has been handed to the provider and is going out.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/email-fixtures — campaign status reaches sending",
  },
  {
    key: "email.campaign_completed",
    category: "email",
    title: "Email campaign completed",
    description: "A send finished, with opens, clicks and bounces.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/email-fixtures — campaign status reaches completed",
  },
  {
    key: "email.campaign_failed",
    category: "email",
    title: "Email campaign failed",
    description: "A send stopped part way and the rest was not delivered.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/email-fixtures — campaign status reaches failed",
  },
  {
    key: "email.delivery_issue",
    category: "email",
    title: "Delivery issue",
    description: "Sender verification failed, or the provider is refusing mail.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/email — SenderStatus, provider health",
  },
  {
    key: "email.bounce_alert",
    category: "email",
    title: "Bounce rate alert",
    description: "Hard bounces on a send crossed the level that puts your domain at risk.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/email — EmailContactStatus bounced, rate against send volume",
  },

  /* -- SMS --------------------------------------------------------------- */
  {
    key: "sms.campaign_sent",
    category: "sms",
    title: "SMS campaign sent",
    description: "A send has been handed to the operator and is going out.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/sms-fixtures — campaign status reaches sending",
  },
  {
    key: "sms.campaign_completed",
    category: "sms",
    title: "SMS campaign completed",
    description: "A send finished, with delivered and failed counts.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/sms-fixtures — campaign status reaches completed",
  },
  {
    key: "sms.campaign_failed",
    category: "sms",
    title: "SMS campaign failed",
    description: "A send stopped part way and the rest was not delivered.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/sms-fixtures — campaign status reaches failed",
  },
  {
    key: "sms.delivery_issue",
    category: "sms",
    title: "Delivery issue",
    description: "A sender ID was rejected, or an operator is blocking your traffic.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/sms — SmsSenderStatus, SmsContactStatus",
  },

  /* -- Social ------------------------------------------------------------ */
  {
    key: "social.post_scheduled",
    category: "social",
    title: "Post scheduled",
    description: "Confirmation that a post is queued, and for when.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/social — PostStatus reaches scheduled",
  },
  {
    key: "social.post_published",
    category: "social",
    title: "Post published",
    description: "A scheduled post went live on its account.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/social — PostStatus reaches published",
  },
  {
    key: "social.post_failed",
    category: "social",
    title: "Post failed",
    description: "A scheduled post did not publish, with the platform's reason.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/social — PostStatus reaches failed",
  },
  {
    key: "social.account_disconnected",
    category: "social",
    title: "Account disconnected",
    description: "A social account's authorisation expired, so nothing will publish to it.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/social — AccountStatus / AuthStatus loses authorisation",
  },

  /* -- Automation -------------------------------------------------------- */
  {
    key: "workflow.started",
    category: "automation",
    title: "Workflow started",
    description: "Every run, as it begins. Off by default — busy workflows fire constantly.",
    channels: IN_APP,
    /* Muted rather than absent. It is a real event and somebody debugging a
       trigger genuinely wants it for an afternoon; defaulting it on would bury
       every other row in this list on the first busy day. */
    defaultChannels: MUTED,
    source: "lib/workflow-fixtures — run created",
  },
  {
    key: "workflow.completed",
    category: "automation",
    title: "Workflow completed",
    description: "A run reached its last step.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "lib/workflow-fixtures — run status reaches completed",
  },
  {
    key: "workflow.failed",
    category: "automation",
    title: "Workflow failed",
    description: "A run stopped on an error, with the step that threw.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/workflow-fixtures — run status reaches failed",
  },
  {
    key: "trigger.error",
    category: "automation",
    title: "Trigger error",
    description: "A trigger could not start its workflow — a bad payload or a disabled source.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/workflow — TriggerEvent rejected, TriggerStatus disabled",
  },

  /* -- Integrations ------------------------------------------------------ */
  {
    key: "integration.connected",
    category: "integrations",
    title: "Integration connected",
    description: "A service was linked to this workspace, and by whom.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/integration — IntegrationStatus reaches connected",
  },
  {
    key: "integration.disconnected",
    category: "integrations",
    title: "Integration disconnected",
    description: "A service was unlinked, or its authorisation expired.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/integration — IntegrationStatus leaves connected",
  },
  {
    key: "integration.error",
    category: "integrations",
    title: "Integration error",
    description: "A connected service started failing its health checks.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/integration — HealthStatus reaches failing",
  },
  {
    key: "webhook.failed",
    category: "integrations",
    title: "Webhook delivery failed",
    description: "An endpoint stopped accepting events, so deliveries are being dropped.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/webhook-store — WebhookStatus reaches failing",
  },

  /* -- Workspace --------------------------------------------------------- */
  {
    key: "workspace.member_added",
    category: "workspace",
    title: "Team member added",
    description: "Someone accepted an invitation and joined the workspace.",
    channels: IN_APP,
    defaultChannels: IN_APP,
    source: "types/workspace — MemberStatus reaches active",
  },
  {
    key: "workspace.role_changed",
    category: "workspace",
    title: "Member's role changed",
    description: "A member was moved to a different role.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "lib/workspace-fixtures — member roleId changed",
  },
  {
    key: "workspace.permissions_changed",
    category: "workspace",
    title: "Role permissions changed",
    description: "What a role can do was edited, which changes it for everyone holding it.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/workspace — role permission set edited",
  },

  /* -- Billing ----------------------------------------------------------- */
  {
    key: "billing.subscription_started",
    category: "billing",
    title: "Subscription started",
    description: "A plan became active on this workspace.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/account — Subscription created",
  },
  {
    key: "billing.plan_changed",
    category: "billing",
    title: "Plan changed",
    description: "The workspace moved to a different tier or billing cycle.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "lib/account-store — PlanPeriod opened by changePlan",
  },
  {
    key: "billing.payment_succeeded",
    category: "billing",
    title: "Payment successful",
    description: "A charge went through, with the invoice reference.",
    channels: BOTH,
    defaultChannels: IN_APP,
    source: "types/account — Purchase paymentState reaches paid",
  },
  {
    key: "billing.payment_failed",
    category: "billing",
    title: "Payment failed",
    description: "A charge was declined. The workspace is suspended if it is not settled.",
    channels: BOTH,
    defaultChannels: BOTH,
    /*
     * The one row nobody may mute, and the only one in the catalogue.
     *
     * Every other notification here is a convenience: miss it and you find out
     * on the dashboard. Miss this one and the workspace stops sending, with
     * campaigns mid-flight and customers waiting — and the person who muted it
     * is exactly the person who needed telling. The security notices that used
     * to carry this flag now live in Settings › Security, where the state they
     * report on is owned.
     */
    mandatory: true,
    source: "types/account — Purchase paymentState reaches failed",
  },
  {
    key: "billing.renewal_upcoming",
    category: "billing",
    title: "Renewal coming up",
    description: "A reminder before the subscription renews and is charged again.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/account — Subscription renewsAt approaching",
  },
  {
    key: "billing.subscription_cancelled",
    category: "billing",
    title: "Subscription cancelled",
    description: "The subscription was ended, with the date access stops.",
    channels: BOTH,
    defaultChannels: BOTH,
    source: "types/account — SubscriptionStatus reaches cancelled",
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
