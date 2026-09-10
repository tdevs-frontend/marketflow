import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ANNOTATION_CARDS,
  ART_HOVER,
  CARD_HOVER,
  CARD_SHELL,
  type AnnotationCardData,
} from "./automation-data";
import { WhatsAppWorkspaceMonitor } from "./workspace-monitor";

const LABEL =
  "The MarketFlow WhatsApp workspace on a desktop monitor: Sarah Mitchell asks about the premium package, the automation replies instantly with the plan, and the premium flow beside it runs from new lead through welcome message, a one-day wait and a follow-up to a qualified lead. Four states are called out around the screen: auto reply sent instantly, a scheduled one-day wait, a follow-up template sent, and the lead qualified and ready for sales, at a reply rate of plus 38 per cent.";

/**
 * One state of the flow, called out beside the hardware.
 *
 * The shell carries no width of its own — the caller sets it. Pinned around
 * the hardware the four have to be identical or they stop reading as a set,
 * and 160px is what the longest of them ("Lead qualified") needs at this size;
 * stacked into a grid they should simply fill their track instead. The icon
 * tile carries the colour, so the type stays the product's own ink on all four.
 */
function AnnotationCard({
  card,
  className,
}: {
  card: AnnotationCardData;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5",
        CARD_SHELL,
        ART_HOVER,
        CARD_HOVER,
        className,
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-[10px]",
          card.tile,
        )}
      >
        <card.icon className="size-4.5" strokeWidth={1.8} aria-hidden />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[12.5px] leading-tight font-semibold text-text-primary">
          {card.title}
        </span>
        <span className="mt-0.5 block truncate text-[10.5px] leading-none text-text-muted">
          {card.detail}
        </span>
      </span>
    </span>
  );
}

/**
 * The reply-rate metric, kept deliberately smaller than the four states.
 *
 * It is the number the page's hero already leads with, repeated here so the
 * section connects back to it — but it is evidence, not a step of the flow, so
 * it is sized and stacked to be read last. Half a card wide, no icon tile, and
 * the arrow is the only thing in the composition that moves on hover.
 */
function ReplyRateMetric({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "group/metric flex w-27.5 flex-col px-2.5 py-1.5",
        CARD_SHELL,
        ART_HOVER,
        CARD_HOVER,
        className,
      )}
    >
      <span className="flex items-center gap-1">
        <TrendingUp
          className="size-3 shrink-0 text-primary transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/metric:-translate-y-0.5 motion-reduce:transition-none"
          strokeWidth={2.4}
          aria-hidden
        />
        <span className="text-[13px] leading-none font-bold text-text-primary">
          +38%
        </span>
      </span>
      <span className="mt-1 block text-[10px] leading-none text-text-muted">
        Reply rate
      </span>
    </span>
  );
}

/**
 * The right half of the section: one monitor, annotated, lit from behind.
 *
 * Two atmospheric layers under it, both decorative — the workflow dot canvas
 * the section has always used, and a violet bloom sized to the monitor so the
 * hardware sits in the section's light rather than on top of it.
 *
 * The annotations are absolutely positioned against the monitor's own box, not
 * the column and not the section, which is the whole reason they stay glued to
 * the hardware while it scales. The vertical margins on that box are the room
 * they hang in, so nothing they do can widen the page.
 *
 * Below `xl` the monitor shares its row and the bands it hangs things in close
 * up, so the same four states move to a two-column grid underneath — still
 * four cards reading the same four words, just stacked instead of scattered.
 * The metric does not follow them down: it is the one piece here the hero has
 * already said, and the section can lose it before it loses a flow state.
 */
export function AutomationVisual() {
  return (
    <div
      role="img"
      aria-label={LABEL}
      className="group/art relative flex w-full flex-col items-center"
    >
      <span
        aria-hidden
        className="workflow-dots pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[118%] min-h-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.28)_0%,rgba(199,210,254,0.10)_42%,transparent_68%)]"
      />

      {/* The monitor, and everything pinned to it */}
      <div className="monitor-visualization relative mx-auto w-full max-w-165 xl:mt-24 xl:mb-16">
        <WhatsAppWorkspaceMonitor className="animate-drift-monitor" />

        {ANNOTATION_CARDS.map((card) => (
          <AnnotationCard
            key={card.title}
            card={card}
            className={cn("absolute hidden w-40 xl:flex", card.pin, card.drift)}
          />
        ))}

        <ReplyRateMetric className="animate-drift-early absolute -top-8 -right-3 hidden xl:flex" />
      </div>

      {/* The same four states, where the bands are too tight to pin them */}
      <div className="mt-9 grid w-full max-w-132 grid-cols-1 gap-3 xsm:grid-cols-2 md:max-w-165 md:grid-cols-4 lg:max-w-132 lg:grid-cols-2 xl:hidden">
        {ANNOTATION_CARDS.map((card) => (
          <AnnotationCard
            key={card.title}
            card={card}
            className="w-full min-w-0"
          />
        ))}
      </div>
    </div>
  );
}
