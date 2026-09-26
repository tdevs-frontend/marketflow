import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { AutomationVisual, SuccessFeature } from "./whatsapp";

const HIGHLIGHTS = [
  "Automated Follow-ups",
  "Personalized Messages",
  "Real-time Message Tracking",
];

export function WhatsAppAutomation() {
  return (
    <section
      aria-labelledby="whatsapp-automation-title"
      className="automation-ground relative isolate overflow-hidden py-25 lg:py-28"
    >
      <div className="custom-container">
        {/*
         * Six and six from `lg`, stacked below it.
         *
         * `items-center` is what centres each half against the other, and it
         * is also what lets the monitor set the row height - the copy is the
         * shorter of the two at every width.
         *
         * Known cost at `lg`: a half of the 960px container is ~456px, and the
         * workspace drops its inbox column below a 520px screen, so from
         * 1024-1279px the monitor shows rail, conversation and flow only. The
         * annotation cards stay in their wrap under the monitor until `xl`,
         * where the gutters are wide enough to pin them to its edges.
         */}
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Message. `max-w-2xl` only bites while stacked - it keeps the
              paragraph to a readable measure across the full container; a
              half is already narrower. */}
          <div className="max-w-2xl lg:col-span-6">
            <Badge
              as="p"
              variant="glass"
              size="lg"
              casing="none"
              icon={
                <BrandIcon
                  name="whatsapp"
                  className="size-4 text-whatsapp-brand"
                />
              }
            >
              WhatsApp-first automation
            </Badge>
            {/* `xl` only: at 1280-1535px "Into Automated Journeys" runs to
                the column's edge, where the monitor's left annotation cards
                hang 76px into a 64px gap. Two rem back, the title balances
                onto three lines and clears them; from `2xl` the column is
                wide enough that it never reaches that far. */}
            <h2
              id="whatsapp-automation-title"
              className="section-title mt-6 text-white text-balance xl:max-w-[calc(100%-2rem)] 2xl:max-w-none"
            >
              Turn WhatsApp Chats Into Automated Journeys
            </h2>

            <p className="mt-6 text-base leading-[1.7] text-white/82 text-pretty">
              Capture leads, send personalized messages, automate follow-ups and
              nurture customers automatically all from one powerful WhatsApp
              workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-btn shadow-[0_10px_30px_rgba(30,27,75,0.16)] transition-shadow duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_14px_36px_rgba(30,27,75,0.22)] motion-reduce:transition-none">
                <ButtonLink
                  href={APP_ROUTES.automation}
                  variant="secondary"
                  size="lg"
                  className="group"
                >
                  WhatsApp Automation
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </ButtonLink>
              </span>
            </div>

            <ul className="mt-8 flex flex-col gap-3.5">
              {HIGHLIGHTS.map((item) => (
                <SuccessFeature key={item}>{item}</SuccessFeature>
              ))}
            </ul>
          </div>

          {/*
           * The product, on a monitor.
           *
           * The monitor group centres inside its own half rather than being
           * pushed to one side to make room for the cards - the cards cross
           * the frame's edges, so they need no room of their own. This div is
           * the positioning parent's parent and nothing more: everything the
           * cards are measured against is the wrapper one level in.
           */}
          <div className="flex w-full items-center justify-center lg:col-span-6">
            <AutomationVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
