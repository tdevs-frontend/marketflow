import { cn } from "@/lib/utils";
import { AUTOMATION_CARDS } from "./automation-data";
import { AutomationBadge, AutomationCard } from "./automation-card";
import { AutomationPhone } from "./automation-phone";

const LABEL =
  "A WhatsApp automation: Sarah Mitchell asks about the premium plan on the phone, and the automation replies instantly, waits a day, sends a follow-up, and returns a lead qualified and ready for sales.";
export function AutomationVisual() {
  return (
    <div
      role="img"
      aria-label={LABEL}
      className="group/art relative flex w-full items-center justify-center"
    >
      {/* Atmosphere, scoped to the illustration: the workflow canvas, then one
          wide indigo glow that separates the group from the page. */}
      <span
        aria-hidden
        className="workflow-dots pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[130%] min-h-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.30)_0%,rgba(199,210,254,0.12)_38%,transparent_70%)]"
      />

      <div className="relative w-full lg:w-fit">
        <div className="animate-drift-phone relative mx-auto w-fit">
          <AutomationPhone />

          <AutomationBadge className="absolute -bottom-9 left-1/2 -translate-x-1/2" />
        </div>
        <div className="mt-14 grid grid-cols-2 gap-3 3xsm:gap-3.5 lg:contents">
          {AUTOMATION_CARDS.map((card) => (
            <AutomationCard
              key={card.title}
              card={card}
              className={cn("lg:absolute lg:w-40", card.drift, card.orbit)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
