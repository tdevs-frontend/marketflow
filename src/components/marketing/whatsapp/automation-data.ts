import { Clock3, MessageCircle, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AutomationStepData = {
  title: string;
  /** The tiny second line — what the step *is*, never a metric. */
  status: string;
  icon: LucideIcon;
  /**
   * The icon tile. Indigo is the default and the automation acting; the wait
   * takes the violet subtle instead, which is the one place the sequence pauses
   * rather than does something. Two tints, and they are two rungs of the same
   * brand — a third hue here would read as a third kind of step.
   */
  tile?: string;
};

/**
 * The three things the automation does between the message and the outcome.
 * Three, because a fourth turns an illustration into a flow-builder.
 */
export const AUTOMATION_STEPS: AutomationStepData[] = [
  { title: "Auto reply", status: "Sent instantly", icon: MessageCircle },
  {
    title: "Wait 1 day",
    status: "Scheduled",
    icon: Clock3,
    tile: "bg-primary-subtle text-secondary",
  },
  { title: "Follow-up", status: "Template sent", icon: Send },
];

export const CONVERSATION = {
  name: "Sarah Mitchell",
  presence: "Online",
  inbound: "Hi, I'm interested in the premium plan.",
  reply: "Great! Here's everything you need to get started.",
  time: "10:24",
} as const;

/**
 * One hover curve for the whole illustration — a fast start easing to a long
 * settle. `translate` rather than `transform` in the transition list, because
 * Tailwind v4 lifts elements with the standalone `translate` property.
 */
export const ART_HOVER =
  "transition-[translate,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * The shell the two card kinds share: white, one hairline of indigo, and a
 * shadow soft enough that four of them stacked still read as one surface.
 */
export const CARD_SHELL =
  "rounded-[13px] border border-white/30 bg-white/96 shadow-[0_14px_35px_rgba(30,27,75,0.16)]";

/** What a card does when the pointer reaches it. */
export const CARD_HOVER =
  "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_44px_rgba(30,27,75,0.24)] motion-reduce:hover:translate-y-0";
