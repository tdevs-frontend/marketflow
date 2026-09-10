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
  inbound: "Hi, I'm interested in the premium plan.",
  inboundTime: "10:24",
  /**
   * Short on purpose. The bubble has to fit inside a 16:10 screen that scales
   * all the way down to a phone column, and every extra line it wraps to is a
   * line the smallest sizes have to clip off the top of the thread.
   */
  reply: "Great! Here's everything you need to get started.",
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

/* ------------------------------------------------------ Pinned annotations */

export type AnnotationCardData = {
  title: string;
  detail: string;
  icon: LucideIcon;
  /** The tinted icon tile — soft ground, saturated glyph. */
  tile: string;
  /**
   * Where the card hangs off the monitor, and on which phase of the shared
   * float. Placement lives with the card rather than in the component that
   * pins it, because the four are one composition: the offsets are only
   * legible next to each other.
   */
  pin: string;
  drift: string;
};

/**
 * The four states of the flow, pinned around the monitor.
 *
 * The same four the automation panel runs through on the glass, lifted out to
 * the hardware's edges — inside, they are a product feature; outside, they are
 * the claim the section is making. Deliberately the same four and no more: a
 * fifth would stop being a sequence and start being a legend.
 *
 * They read clockwise from the top-left, and every one of them sits in the
 * band above the top bezel or the band beside the stand — never over the
 * glass. That is arithmetic rather than taste: the column this lives in is
 * 636px wide at `xl` and the monitor wants 620 of it, so a card hung off the
 * side would have nowhere to go but onto the screen, and the screen is the
 * argument the section is making. The bands are free, the stand leaves a wide
 * empty triangle to flank, and the offsets are staggered by a few pixels each
 * so the group never resolves into a row.
 */
export const ANNOTATION_CARDS: AnnotationCardData[] = [
  {
    title: "Auto reply",
    detail: "Sent instantly",
    icon: MessageCircle,
    tile: "bg-primary-soft text-primary",
    pin: "-top-12 -left-4",
    drift: "animate-drift",
  },
  {
    title: "Wait 1 day",
    detail: "Scheduled",
    icon: Clock3,
    tile: "bg-primary-subtle text-secondary",
    pin: "-top-17 right-48",
    drift: "animate-drift-mid",
  },
  {
    title: "Follow-up",
    detail: "Template sent",
    icon: Send,
    tile: "bg-info-soft text-info",
    pin: "-bottom-5 -left-3",
    drift: "animate-drift-slow",
  },
  {
    title: "Lead qualified",
    detail: "Ready for sales",
    icon: UserRoundCheck,
    tile: "bg-whatsapp-soft text-whatsapp",
    pin: "-bottom-1 -right-3",
    drift: "animate-drift-late",
  },
];

/* -------------------------------------------------------- Shared art bits */

export const ART_HOVER =
  "transition-[translate,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * The floating card shell: white, one hairline highlight, and a shadow soft
 * enough that a card pressed up against the monitor still reads as the same
 * surface rather than as a sticker on top of it.
 */
export const CARD_SHELL =
  "rounded-[13px] border border-white/45 bg-white/96 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-md";

/** What a card does when the pointer reaches it. */
export const CARD_HOVER =
  "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)] motion-reduce:hover:translate-y-0";
