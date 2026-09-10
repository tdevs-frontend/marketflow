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
  "The MarketFlow WhatsApp workspace on a desktop monitor: Sarah Mitchell asks about the premium plan, the automation replies instantly with the plan, and the premium flow beside it runs from new lead through welcome message, a one-day wait and a follow-up to a qualified lead. Three states are called out at the edges of the screen: auto reply sent instantly, a scheduled one-day wait, and a follow-up template sent.";

/**
 * One state of the flow, called out beside the hardware.
 *
 * All three are the same 152px, set by the caller rather than by the shell:
 * cards riding the edges of one object have to match or they stop reading as a
 * set, and pinned or wrapped they are the same three cards, so there is no
 * width worth varying between the two. The width is also what sets the
 * overlap, since each card is pushed out across its edge by half of itself —
 * making one wider would push it further onto the screen.
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
 * The right half of the section: one monitor, annotated, lit from behind.
 *
 * Two atmospheric layers under it, both decorative — the workflow dot canvas
 * the section has always used, and a violet bloom sized to the monitor so the
 * hardware sits in the section's light rather than on top of it.
 *
 * The annotations are absolutely positioned against the monitor's own box, not
 * the column and not the section, which is the whole reason they stay glued to
 * the hardware while it scales. Each one is anchored to the edge it belongs to
 * (`left-0` or `right-0`) and then pushed back out across it by half its own
 * width, so the overlap is half a card at every size without a single pixel
 * offset anywhere. Heights are percentages of the box for the same reason: the
 * monitor is a different size in every column it lands in, and a card pinned
 * at `top-16` would sit in a different part of the screen at each one.
 *
 * That box must not clip — half of every card is outside it — so nothing in
 * this file may take `overflow-hidden`. It is stated rather than left to the
 * default on the wrapper that would do the damage. The only clip in the whole
 * visual is on the glass itself, inside `WhatsAppWorkspaceMonitor`, where it
 * is what gives the screen its rounded corners.
 *
 * Below `xl` there is no gutter left to straddle, so the three move to a
 * centred wrap underneath: one row of three once about 500px is available,
 * folding to two and then one on the way down. A wrap rather than a column
 * count per breakpoint, because what decides it is the width the cards need,
 * not the width of the phone.
 */
export function AutomationVisual() {
  return (
    <div
      role="img"
      aria-label={LABEL}
      className="group/art relative flex w-full flex-col items-center justify-center"
    >
      <span
        aria-hidden
        className="workflow-dots pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[118%] min-h-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.28)_0%,rgba(199,210,254,0.10)_42%,transparent_68%)]"
      />

      {/* The monitor, and the three states riding its edges */}
      <div className="monitor-visualization relative mx-auto w-full max-w-[650px] overflow-visible">
        <WhatsAppWorkspaceMonitor className="animate-drift-monitor relative z-10" />

        {ANNOTATION_CARDS.map((card) => (
          <AnnotationCard
            key={card.title}
            card={card}
            className={cn(
              "absolute z-20 hidden w-38 xl:flex",
              card.pin,
              card.drift,
            )}
          />
        ))}
      </div>

      {/* The same three, where there is no gutter to straddle */}
      <div className="mt-9 flex w-full flex-wrap justify-center gap-3 xl:hidden">
        {ANNOTATION_CARDS.map((card) => (
          <AnnotationCard key={card.title} card={card} className="w-38" />
        ))}
      </div>
    </div>
  );
}
