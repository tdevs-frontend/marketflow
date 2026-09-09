import { TrendingUp, UserCheck, Zap } from "lucide-react";

import { AUTOMATION_STEPS } from "./automation-data";
import { AutomationBadge, AutomationStep } from "./automation-step";
import { AutomationPhone } from "./automation-phone";
import { PhoneBadge } from "./phone-badge";
import { QualifiedLeadCard } from "./qualified-lead-card";

const LABEL =
  "A WhatsApp automation: Sarah Mitchell asks about the premium plan on the phone, and the automation replies instantly, waits a day, sends a follow-up, and returns a lead qualified and ready for sales.";

/**
 * The section's illustration: the conversation, and what the automation does
 * with it.
 *
 * There is not a line in it. The sequence is carried by four cards on one shell
 * and one rhythm — read in order, the stack *is* the flow. Proximity and
 * alignment do the work connectors used to.
 *
 * Two compositions, split at `sm`, because the jobs differ rather than the
 * sizes:
 *
 *   `sm` and up   the four automation cards — under the phone through the
 *                 tablet range, beside it from `lg`. The sequence is the
 *                 subject and the phone is where it started.
 *   below `sm`    the phone alone, with three results orbiting it. A 184px
 *                 column cannot fit beside a 248px phone on a 375px screen,
 *                 and four cards stacked under it would push the outcome most
 *                 of a screen below the copy.
 */
export function AutomationVisual() {
  return (
    <div
      role="img"
      aria-label={LABEL}
      className="group/art relative flex w-full items-center justify-center lg:min-h-125"
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

      <div className="flex flex-col items-center gap-7 lg:flex-row">
        {/* The phone, and — below `sm` only — the results anchored to its own
            box, so they hold their positions relative to the device at any
            width rather than to the viewport. */}
        <div className="relative">
          <AutomationPhone />

          <PhoneBadge
            icon={Zap}
            value="Automated"
            label="0.8s response"
            className="absolute top-[30%] -left-3 sm:hidden"
          />
          <PhoneBadge
            icon={TrendingUp}
            value="+38%"
            label="Reply rate"
            className="absolute -top-4 right-0 sm:hidden"
          />
          <PhoneBadge
            icon={UserCheck}
            value="Lead qualified"
            tone="success"
            className="absolute -bottom-4 right-0 sm:hidden"
          />
        </div>

        <div className="hidden w-full flex-col gap-3 sm:flex lg:w-46 lg:gap-2.5">
          <AutomationBadge className="self-center lg:mb-1 lg:self-start" />

          {/* Two across while stacked, one down once it sits beside the phone. */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-2.5">
            {AUTOMATION_STEPS.map((step) => (
              <AutomationStep key={step.title} step={step} />
            ))}
            <QualifiedLeadCard className="lg:mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
