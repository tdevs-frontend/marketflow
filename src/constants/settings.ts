import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  MessageSquare,
  PlugZap,
  UserPlus,
  Workflow,
} from "lucide-react";

/**
 * The Settings module's vocabulary.
 *
 * Kept out of the components for one reason: the notification catalogue has to
 * be auditable. Every entry below names a thing the product actually models,
 * and the `source` line says where — so the next person to add a row has to
 * answer "which module raises this?" before the checkbox exists. A preference
 * for an event nothing emits is a promise the product cannot keep, and the
 * merchant only finds out by not being told something.
 */

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export interface NotificationEvent {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  /**
   * The module that raises it. Not rendered — it exists so the catalogue can
   * be checked against the codebase rather than trusted.
   */
  source: string;
  /** On unless turned off. Reserved for the ones that cost money if missed. */
  defaultOn: boolean;
}

/**
 * Things happening to work the signed-in person owns.
 *
 * All three default on: a campaign that stalled, an automation step that threw
 * and a revoked integration each mean a customer heard nothing, and silence is
 * the failure mode. They should have to be turned off deliberately.
 */
export const WORK_EVENTS: NotificationEvent[] = [
  {
    key: "campaign-finished",
    label: "A campaign finishes sending",
    hint: "With the delivery figures once they settle.",
    icon: Megaphone,
    source: "lib/campaign-fixtures — campaign status reaches sent",
    defaultOn: true,
  },
  {
    key: "automation-failed",
    label: "An automation step fails",
    hint: "A failed step usually means a customer heard nothing.",
    icon: Workflow,
    source: "lib/workflow-fixtures — run status failed",
    defaultOn: true,
  },
  {
    key: "integration-disconnected",
    label: "An integration disconnects",
    hint: "A revoked WhatsApp or email connection stops every journey using it.",
    icon: PlugZap,
    source: "lib/integration-fixtures — connection status",
    defaultOn: true,
  },
];

/**
 * When a customer or a teammate needs a person.
 *
 * "Somebody mentions me in a note" used to sit here and has been removed: the
 * product's notes are a `string[]` on a record with no author and no mention
 * parsing, so nothing could ever have raised it.
 */
export const PEOPLE_EVENTS: NotificationEvent[] = [
  {
    key: "conversation-assigned",
    label: "A conversation is assigned to me",
    hint: "From the WhatsApp inbox, or a workflow that routes to an owner.",
    icon: MessageSquare,
    source: "types/whatsapp — conversation assignee",
    defaultOn: true,
  },
  {
    key: "lead-assigned",
    label: "A lead is assigned to me",
    hint: "Only leads where you are the owner.",
    icon: UserPlus,
    source: "lib/customer-fixtures — lead ownerId",
    defaultOn: false,
  },
];

export const NOTIFICATION_GROUPS: {
  id: string;
  title: string;
  description: string;
  events: NotificationEvent[];
}[] = [
  {
    id: "work",
    title: "Your work",
    description: "Campaigns, automations and connections you run.",
    events: WORK_EVENTS,
  },
  {
    id: "people",
    title: "People",
    description: "When a customer or a teammate needs you.",
    events: PEOPLE_EVENTS,
  },
];

export const ALL_NOTIFICATION_EVENTS: NotificationEvent[] =
  NOTIFICATION_GROUPS.flatMap((group) => group.events);

export const NOTIFICATION_CHANNELS = [
  { value: "both", label: "Email and in-app" },
  { value: "email", label: "Email only" },
  { value: "in_app", label: "In-app only" },
];

export const QUIET_HOURS = [
  { value: "off", label: "Never hold notifications" },
  { value: "night", label: "Hold overnight (21:00 – 08:00)" },
  { value: "weekend", label: "Hold overnight and at weekends" },
];

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

/** Dashboard languages. The same four the workspace offers, deliberately. */
export const PROFILE_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
  { value: "es", label: "Spanish" },
  { value: "ar", label: "Arabic" },
];

export const AVATAR_RULES = {
  accept: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 2 * 1024 * 1024,
  hint: "PNG, JPG or WebP, up to 2 MB. Square images look best.",
};
