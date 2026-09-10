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
   * pins it, because the three are one composition: the offsets are only
   * legible next to each other.
   */
  pin: string;
  drift: string;
};

/**
 * Three states of the flow, pinned to the monitor's edges.
 *
 * Three, not five: the outcome ("lead qualified") and the proof ("+38% reply
 * rate") both used to hang out here too, and between them they turned the
 * hardware into the thing in the middle of a legend. What is left is the
 * mechanism only — a reply, a wait, a follow-up — and the outcome still reads,
 * one panel further in, as the last step of the flow on the glass.
 *
 * Two on the left and one on the right, at three heights that share no line,
 * because two cards level with each other across a screen read as a table
 * header rather than as annotation.
 *
 * Each is anchored to its edge and then pushed back out across it by half its
 * own width — `left-0 -translate-x-1/2`, `right-0 translate-x-1/2`. Half the
 * card outside, half over the frame, and no pixel offsets, so the overlap is
 * still half a card when the monitor is 520px wide instead of 630px.
 *
 * The right card translates 45% rather than 50%. At exactly 1280px the monitor
 * fills its column and the column ends 70px from the edge of the screen, which
 * is 6px less than half a card; 45% is 68px, and the difference is invisible
 * where a clipped corner would not be.
 *
 * The heights are measured, not chosen. Half a card lands 68px onto the glass,
 * and 68px is more than the width of anything that can be given up, so each
 * one has to sit where the panel behind it has nothing to lose:
 *
 * - Left, the icon rail takes the first 44px of the overlap and the inbox list
 *   the remaining 24px. Its names start 36px in, so they survive; what goes is
 *   the search field's magnifier and an avatar. Both cards on that side clear
 *   the names at any height.
 * - Right, the automation panel has 15px of slack beside "Welcome Message" and
 *   the card needs 68px, so there is no height inside the flow that does not
 *   truncate a step. The flow runs 22.8%–58.5% and the metrics footer starts
 *   at 70.7%; 58.5% drops the card into the gap between them, where its lower
 *   edge reaches only into that footer's top padding. It is the one band on
 *   that edge with room, which is why it is not level with the flow it names.
 */
export const ANNOTATION_CARDS: AnnotationCardData[] = [
  {
    title: "Auto reply",
    detail: "Sent instantly",
    icon: MessageCircle,
    tile: "bg-primary-soft text-primary",
    pin: "top-[14%] left-0 -translate-x-1/2",
    drift: "animate-drift-card",
  },
  {
    title: "Wait 1 day",
    detail: "Scheduled",
    icon: Clock3,
    tile: "bg-primary-subtle text-secondary",
    pin: "top-[58.5%] right-0 translate-x-[45%]",
    drift: "animate-drift-card-mid",
  },
  {
    title: "Follow-up",
    detail: "Template sent",
    icon: Send,
    tile: "bg-info-soft text-info",
    pin: "top-[70%] left-0 -translate-x-1/2",
    drift: "animate-drift-card-late",
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
  "rounded-[13px] border border-white/55 bg-white/96 shadow-[0_12px_30px_rgba(15,23,42,0.16)] backdrop-blur-md";

/** What a card does when the pointer reaches it. */
export const CARD_HOVER =
  "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)] motion-reduce:hover:translate-y-0";
