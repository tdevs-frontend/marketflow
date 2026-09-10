import {
  BarChart3,
  Clock3,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Send,
  UserPlus,
  UserRoundCheck,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Everything the WhatsApp workspace mock-up on the right of the section is
 * built from.
 *
 * It is one screenshot of a product that does not exist yet, so the numbers,
 * names and copy all live here rather than being scattered through the four
 * panels that render them — a single place to keep the story straight.
 */

/* ------------------------------------------------------------ App sidebar */

export type WorkspaceNavItem = {
  label: string;
  icon: LucideIcon;
  /**
   * A `BrandIcon` name, where the channel's own mark says more than a generic
   * glyph. Only WhatsApp has one, and it is the active item.
   */
  brand?: string;
  active?: boolean;
};

/** Six destinations, which is enough to read as an application shell. */
export const WORKSPACE_NAV: WorkspaceNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "WhatsApp", icon: MessageCircle, brand: "whatsapp", active: true },
  { label: "Contacts", icon: Users },
  { label: "Automation", icon: Workflow },
  { label: "Campaigns", icon: Megaphone },
  { label: "Analytics", icon: BarChart3 },
];

/* ------------------------------------------------------ Conversation list */

export type WorkspaceThread = {
  name: string;
  initials: string;
  preview: string;
  time: string;
  active?: boolean;
  unread?: number;
};

export const WORKSPACE_THREADS: WorkspaceThread[] = [
  {
    name: "Sarah Mitchell",
    initials: "SM",
    preview: "Interested in premium",
    time: "10:24",
    active: true,
  },
  {
    name: "Ahmed Khan",
    initials: "AK",
    preview: "Order confirmed, thanks!",
    time: "09:58",
    unread: 2,
  },
  {
    name: "Emma Roberts",
    initials: "ER",
    preview: "Can we book a demo?",
    time: "09:12",
  },
];

/* ------------------------------------------------------- The conversation */

/**
 * The thread itself. The inbound line is a real buying question and the reply
 * is the automation answering it — the whole point the section is making, in
 * two messages.
 */
export const CONVERSATION = {
  name: "Sarah Mitchell",
  initials: "SM",
  presence: "Online",
  inbound: "Hi, I'm interested in the premium package.",
  inboundTime: "10:24",
  reply:
    "Hi Sarah \u{1F44B} Thanks for reaching out! Here's everything you need to know about our premium package.",
  replyTime: "10:24",
  /** The label above the automated bubble: whose automation sent it. */
  sender: "MarketFlow automation",
  attachment: { title: "Premium Plan", action: "View details" },
} as const;

/* ---------------------------------------------------------- The automation */

export type AutomationStepData = {
  label: string;
  icon: LucideIcon;
  /** The tinted icon tile — soft ground, saturated glyph. */
  tile: string;
};

/**
 * The five steps of the premium flow, top to bottom.
 *
 * Indigo carries the flow, one violet marks the wait, and the green is spent
 * only on the outcome — the same rule the rest of the section follows, where
 * WhatsApp green means success and never decoration.
 */
export const FLOW_STEPS: AutomationStepData[] = [
  { label: "New Lead", icon: UserPlus, tile: "bg-primary-soft text-primary" },
  {
    label: "Welcome Message",
    icon: MessageCircle,
    tile: "bg-primary-soft text-primary",
  },
  { label: "Wait 1 Day", icon: Clock3, tile: "bg-primary-subtle text-secondary" },
  { label: "Follow-up", icon: Send, tile: "bg-primary-soft text-primary" },
  {
    label: "Lead Qualified",
    icon: UserRoundCheck,
    tile: "bg-whatsapp-soft text-whatsapp",
  },
];

/** Two, deliberately. A product panel this size showing five numbers is a
 *  chart, and a chart here would pull the eye off the flow above it. */
export const FLOW_METRICS = [
  { label: "Response", value: "0.8s" },
  { label: "Delivered", value: "98.4%" },
] as const;

/* -------------------------------------------------------- Shared art bits */

export const ART_HOVER =
  "transition-[translate,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * The floating card shell: white, one hairline highlight, and a shadow soft
 * enough that a card pressed up against the monitor still reads as the same
 * surface rather than as a sticker on top of it.
 */
export const CARD_SHELL =
  "rounded-[13px] border border-white/35 bg-white/96 shadow-[0_12px_35px_rgba(15,23,42,0.15)] backdrop-blur-md";

/** What a card does when the pointer reaches it. */
export const CARD_HOVER =
  "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(15,23,42,0.22)] motion-reduce:hover:translate-y-0";
