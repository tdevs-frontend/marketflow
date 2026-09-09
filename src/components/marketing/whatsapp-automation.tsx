import { ArrowRight, Check, MessageCircle } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { AutomationVisual } from "./whatsapp";

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
         * Twelve columns from `md` up: an even half each on a tablet, then 5/7
         * on a desktop, where the illustration needs the extra column more than
         * the copy does. Below `md` it is one column and the visual follows the
         * text.
         */}
        <div className="grid items-center gap-14 md:grid-cols-12 md:gap-10 lg:gap-14 xl:gap-16">
          {/* Message */}
          <div className="md:col-span-6 lg:col-span-5">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 py-1.5 pr-4 pl-3 text-white backdrop-blur-md">
              <MessageCircle
                className="size-4 text-whatsapp-bright"
                strokeWidth={2}
                aria-hidden
              />
              WhatsApp first automation
            </p>

            <h2
              id="whatsapp-automation-title"
              className="section-title mt-6 text-white text-balance"
            >
              Turn WhatsApp Chats Into{" "}
              <span className="lavender-gradient-text">Automated Journeys</span>
            </h2>

            <p className="mt-6 text-base leading-[1.7] text-white/82 text-pretty">
              Capture leads, send personalized messages, automate follow-ups and
              nurture customers automatically all from one powerful WhatsApp
              workspace.
            </p>

            {/*
             * `secondary`, not `gradient`: the section is already painted in
             * the brand gradient, so the page's usual gradient CTA would be a
             * purple button on a purple ground. The shared `secondary` variant
             * is exactly the inverse this needs — white surface, `primary` ink,
             * a lift and a tint on hover — so the CTA becomes the brightest
             * thing in the section without a bespoke button.
             *
             * The resting glow lives on this wrapper rather than on a
             * `className` override, because `cn()` is a plain join and a second
             * `shadow-*` utility would race the variant's own in the
             * stylesheet. A wrapper cannot race anything, and the button
             * lifting a pixel off its glow on hover is the effect anyway.
             */}
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

            {/*
             * One per row at every width. Three short benefits set two-across
             * save a little height and cost the scan: the eye has to choose a
             * reading order, and an odd count leaves the third stranded under a
             * gap. A single column is read once, top to bottom.
             */}
            <ul className="mt-8 flex flex-col gap-3.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="grid size-5 shrink-0 place-items-center rounded-full border border-whatsapp-bright/25 bg-whatsapp-bright/12 text-whatsapp-bright"
                  >
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium text-white/92">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Automation journey */}
          <div className="md:col-span-6 lg:col-span-7">
            <AutomationVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
