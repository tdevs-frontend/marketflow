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
        <div className="grid items-center gap-14 md:grid-cols-12 md:gap-10 lg:gap-14 xl:gap-16">
          {/* Message */}
          <div className="md:col-span-6 lg:col-span-5">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 py-1.5 pr-4 pl-3 text-white backdrop-blur-md">
              <BrandIcon name="whatsapp" className="size-4 text-whatsapp-brand" />
              WhatsApp first automation
            </p>

            <h2
              id="whatsapp-automation-title"
              className="section-title mt-6 text-white text-balance"
            >
              Turn WhatsApp Chats Into{" "}
              <span className="text-lavender-deep">Automated Journeys</span>
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

          {/* Automation journey */}
          <div className="md:col-span-6 lg:col-span-7">
            <AutomationVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
