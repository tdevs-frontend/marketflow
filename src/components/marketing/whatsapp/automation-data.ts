import { Clock3, MessageCircle, Send, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AutomationCardData = {
  title: string;
  /** The tiny second line — what the step *is*, never a metric. */
  status: string;
  icon: LucideIcon;
  tile: string;
 
  orbit: string;
  /** The drift phase. Four durations that never fall into step. */
  drift: string;
};

/**
 * The automation, as four cards: what it sends, where it waits, what it sends
 * next, and what comes out the other end.
 */
export const AUTOMATION_CARDS: AutomationCardData[] = [
  {
    title: "Auto reply",
    status: "Sent instantly",
    icon: MessageCircle,
    tile: "bg-primary-soft text-primary",
    orbit: "top-[14%] right-[calc(100%_+_16px)] xl:right-[calc(100%_+_24px)]",
    drift: "animate-drift",
  },
  {
    title: "Wait 1 day",
    status: "Scheduled",
    icon: Clock3,
    tile: "bg-primary-subtle text-secondary",
    orbit: "top-[24%] left-[calc(100%_+_16px)] xl:left-[calc(100%_+_24px)]",
    drift: "animate-drift-mid",
  },
  {
    title: "Follow-up",
    status: "Template sent",
    icon: Send,
    tile: "bg-info-soft text-info",
    orbit: "top-[62%] right-[calc(100%_+_16px)] xl:right-[calc(100%_+_24px)]",
    drift: "animate-drift-slow",
  },
  {
    title: "Lead qualified",
    status: "Ready for sales",
    icon: UserCheck,
    tile: "bg-whatsapp-soft text-whatsapp",
    orbit: "top-[72%] left-[calc(100%_+_16px)] xl:left-[calc(100%_+_24px)]",
    drift: "animate-drift-late",
  },
];

export const CONVERSATION = {
  name: "Sarah Mitchell",
  presence: "Online",
  inbound: "Hi, I'm interested in the premium plan.",
  reply: "Great! Here's everything you need to get started.",
  time: "10:24",
} as const;

export const ART_HOVER =
  "transition-[translate,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * The card shell: white, one hairline highlight, and a shadow soft enough that
 * four of them pressed up against one phone still read as one surface.
 */
export const CARD_SHELL =
  "rounded-[13px] border border-white/35 bg-white/96 shadow-[0_12px_35px_rgba(15,23,42,0.15)] backdrop-blur-md";

/** What a card does when the pointer reaches it. */
export const CARD_HOVER =
  "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(15,23,42,0.22)] motion-reduce:hover:translate-y-0";
