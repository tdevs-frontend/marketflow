import { ArrowRight } from "lucide-react";

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
         * Six and six from `xl`, stacked below it.
         *
         * `items-center` is what centres each half against the other, and it
         * is also what lets the monitor set the row height — the copy is the
         * shorter of the two at every width.
         *
         * The split starts at `xl` rather than `lg` because an equal half of
         * the `lg` container is 452px, and the workspace drops its whole inbox
         * column below a 520px screen. Stacked, the same viewport gives the
         * monitor its full 650px and every panel survives; a 6/6 that costs a
         * panel is not the 6/6 worth having.
         */}
        <div className="grid items-center gap-14 xl:grid-cols-12 xl:gap-16">
          {/* Message */}
          <div className="xl:col-span-6">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 py-1.5 pr-4 pl-3 text-white backdrop-blur-md">
              <BrandIcon
                name="whatsapp"
                className="size-4 text-whatsapp-brand"
              />
              WhatsApp-first automation
            </p>
            <h2
              id="whatsapp-automation-title"
              className="section-title mt-6 text-white text-balance"
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
           * pushed to one side to make room for the cards — the cards cross
           * the frame's edges, so they need no room of their own. This div is
           * the positioning parent's parent and nothing more: everything the
           * cards are measured against is the wrapper one level in.
           */}
          <div className="flex w-full items-center justify-center xl:col-span-6">
            <AutomationVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
