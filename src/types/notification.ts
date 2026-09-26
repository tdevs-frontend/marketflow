import { APP_ROUTES } from "@/constants/app";

/**
 * The header bell's feed - what happened, as opposed to what you want to hear
 * about.
 *
 * The distinction is the whole reason this type exists beside
 * `NotificationEventDef` in `types/account`, and the two are easy to confuse:
 *
 *   `NotificationEventDef` is the **catalogue**. It describes a kind of thing
 *   the product can raise - "Order payment failed" - and Settings →
 *   Notifications is where a member says which channels they want it on.
 *
 *   `FeedNotification` is an **occurrence**. It is one payment that actually
 *   failed, on one order, at one time, with somewhere to go and look.
 *
 * A preference has no timestamp and is never read; an occurrence has both and
 * no channels. Collapsing them would give the bell a list of settings and the
 * settings page a list of events.
 *
 * `module` is the link between them: it is the same vocabulary as
 * `NotificationCategory`, so a feed item and the preference that governs it
 * always agree about which part of the product they belong to, and the icon
 * the bell draws is the icon the settings page draws.
 */

/**
 * The module a notification came from.
 *
 * Mirrors `NotificationCategory` with three additions the feed needs and the
 * preference catalogue does not. `inventory` and `order` are separate rows here
 * although both are Commerce preferences: a merchant scanning the bell is
 * sorting "something to pack" from "something to reorder" at a glance, and one
 * shopping-bag icon for both loses that. The settings page has no such problem
 * - there the rows carry their own titles.
 *
 * `security` is the more interesting addition. There is deliberately no
 * security *preference* category, because "your password changed" is not
 * something a person should be able to mute. A security *occurrence* is the
 * opposite - it is exactly what a feed exists to carry, and the bell is where
 * somebody finds out a sign-in was not theirs. Reporting an event and offering
 * a switch for it are different acts.
 */
export type NotificationModule =
  | "security"
  | "order"
  | "inventory"
  | "customer"
  | "marketing"
  | "whatsapp"
  | "email"
  | "sms"
  | "social"
  | "automation"
  | "integration"
  | "workspace"
  | "billing"
  /* Replies and status changes on this workspace's support tickets. */
  | "support";

/**
 * How much the reader should care, which decides the icon's colour and nothing
 * else.
 *
 * Three levels, not five. The bell is scanned, and a palette a reader has to
 * learn is a palette they ignore - `alert` is the only one that changes what
 * somebody does with their afternoon, so it is the only one that gets a warm
 * colour. `success` marks the things that went right and would otherwise read
 * as neutral noise; everything else is `info`.
 */
export type NotificationTone = "info" | "success" | "alert";

export interface FeedNotification {
  id: string;
  module: NotificationModule;
  tone: NotificationTone;
  /** The headline. "New order received". */
  title: string;
  /** One line of what happened, naming the entity. */
  message: string;
  /**
   * The entity or module the event belongs to - an order's product, a
   * conversation's subject, the workflow step that threw.
   *
   * A third line, and only the full page renders it. The bell is scanned
   * standing up and wants title, sentence, time; the page is read sitting
   * down, and the line that says *which* Premium Package or *which* step is
   * the one that saves opening the record. `null` where the message already
   * carries it and a third line would just be a shorter second one.
   */
  context?: string | null;
  /** ISO. Rendered relative to the workspace clock. */
  createdAt: string;
  read: boolean;
  /**
   * Where the notification goes when opened, or `null`.
   *
   * Nullable and checked, because a row that navigates somewhere that does not
   * exist is worse than one that only marks itself read - the reader loses
   * their place and learns not to click the next one. Every value set in
   * `lib/notification-fixtures` is a route this application actually serves;
   * see `APP_ROUTES`.
   */
  href: string | null;
}

/** Routes the feed is allowed to point at, so a typo cannot ship a dead link. */
export const NOTIFICATION_ROUTES = {
  orders: APP_ROUTES.orders,
  inventory: APP_ROUTES.inventory,
  contacts: APP_ROUTES.contacts,
  leads: APP_ROUTES.leads,
  /* The canonical routes, not the `/dashboard/campaigns` and
     `/dashboard/whatsapp` shortcuts, which both 307 elsewhere. A notification
     should land on the page in one move - and for WhatsApp the destination a
     reply belongs at is the inbox, which is where that redirect ends up
     anyway. */
  campaigns: APP_ROUTES.marketingCampaigns,
  whatsapp: APP_ROUTES.whatsappInbox,
  email: APP_ROUTES.email,
  sms: APP_ROUTES.sms,
  social: APP_ROUTES.socialCalendar,
  /* The activity log, not the workflow list: a failed run is something to
     read, and the log is the page that shows why it failed. */
  automation: `${APP_ROUTES.automation}/activity`,
  integrations: APP_ROUTES.integrations,
  team: APP_ROUTES.workspaceTeam,
  billing: APP_ROUTES.settingsBilling,
  /* Security events point at the page that owns the state they report on, so
     "a new device signed in" lands where sessions can actually be ended. */
  security: APP_ROUTES.settingsSecurity,
} as const;
