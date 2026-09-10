import { TrendingUp, UserRoundCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { ART_HOVER, CARD_HOVER, CARD_SHELL } from "./automation-data";
import { WhatsAppWorkspaceMonitor } from "./workspace-monitor";

const LABEL =
  "The MarketFlow WhatsApp workspace on a desktop monitor: Sarah Mitchell asks about the premium package, the automation replies instantly with the plan, and the premium flow beside it runs from new lead through welcome message, a one-day wait and a follow-up to a qualified lead.";

/**
 * One small annotation pinned to the monitor.
 *
 * Two of these, and only two. The monitor is the visualisation now — the old
 * four-card ring around a phone made the hardware the frame for the cards
 * instead of the other way round.
 */
function FloatingCard({
  icon: Icon,
  value,
  label,
  tone,
  className,
}: {
  icon: typeof TrendingUp;
  value: string;
  label: string;
  tone: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 px-2.5 py-2",
        CARD_SHELL,
        ART_HOVER,
        CARD_HOVER,
        className,
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-[8px] 3xsm:size-8",
          tone,
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} aria-hidden />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[12px] leading-tight font-semibold text-text-primary 3xsm:text-[13px]">
          {value}
        </span>
        <span className="mt-0.5 block truncate text-[10px] leading-none text-text-muted 3xsm:text-[11px]">
          {label}
        </span>
      </span>
    </span>
  );
}

/**
 * The right half of the section: one monitor, lit from behind.
 *
 * Two atmospheric layers under it, both decorative: the workflow dot canvas
 * the section has always used, and a violet bloom sized to the monitor so the
 * hardware sits in the section's light rather than on top of it.
 *
 * The two annotations hang off opposite corners rather than over the glass:
 * one above the top-right bezel, one alongside the stand. The screen is the
 * argument the section is making, so nothing is allowed to sit on top of it —
 * and the wrapper's own padding is what they occupy, which is why neither can
 * push the page sideways. Below `lg` they are gone entirely: the monitor is
 * sharing its row by then, and at that width an annotation is nearly half the
 * size of the thing it is annotating.
 */
export function AutomationVisual() {
  return (
    <div
      role="img"
      aria-label={LABEL}
      className="group/art relative flex w-full items-center justify-center"
    >
      <span
        aria-hidden
        className="workflow-dots pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[118%] min-h-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.28)_0%,rgba(199,210,254,0.10)_42%,transparent_68%)]"
      />

      <div className="relative mx-auto w-full max-w-165 pb-5 lg:pt-9">
        <WhatsAppWorkspaceMonitor className="animate-drift-monitor" />

        <FloatingCard
          icon={TrendingUp}
          value="+38%"
          label="Reply rate"
          tone="bg-primary-soft text-primary"
          className="animate-drift absolute top-0 right-4 hidden lg:flex xl:right-7"
        />
        <FloatingCard
          icon={UserRoundCheck}
          value="Lead qualified"
          label="Ready for sales"
          tone="bg-whatsapp-soft text-whatsapp"
          className="animate-drift-late absolute bottom-0 left-4 hidden lg:flex xl:left-7"
        />
      </div>
    </div>
  );
}
