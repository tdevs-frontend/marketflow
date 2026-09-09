import {
  ArrowRight,
  Check,
  MessageCircle,
  TrendingUp,
  Workflow,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { WhatsAppPreview } from "./whatsapp-preview";

const HIGHLIGHTS = [
  "Automated Follow-ups",
  "Personalized Messages",
  "Real-time Message Tracking",
];

export function WhatsAppAutomation() {
  return (
    <section
      aria-labelledby="whatsapp-automation-title"
      className="section-space-py relative isolate overflow-hidden bg-dark"
    >
      {/* Soft brand bloom behind the product UI */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-64 -z-10 hidden size-176 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent)] lg:block"
      />

      <div className="custom-container">
        <div className="grid items-center gap-14 lg:grid-cols-[45fr_55fr] lg:gap-16 xl:gap-20">
          {/* Message */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pr-4 pl-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase">
              <MessageCircle className="size-4 text-success" aria-hidden />
              WhatsApp-first automation
            </p>

            <h2
              id="whatsapp-automation-title"
              className="mt-6 text-3xl leading-[1.15] font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl"
            >
              Turn WhatsApp Chats Into{" "}
              <span className="brand-gradient-text">Automated Journeys</span>
            </h2>

            <p className="mt-6 text-white/75 text-base leading-[1.7] text-pretty">
              Capture leads, send personalized messages, automate follow-ups and
              nurture customers automatically — all from one powerful WhatsApp
              workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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
            </div>

            <ul className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-x-7">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-base text-white/85"
                >
                  <span
                    aria-hidden
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-success"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="font-medium text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div className="relative">
            <WhatsAppPreview />

            {/* Floating status chips */}
            <div className="absolute -top-4 -right-2 hidden items-center gap-2.5 rounded-btn border border-border bg-surface px-3 py-2 shadow-float md:flex lg:-right-5">
              <span className="grid size-8 place-items-center rounded-btn bg-primary-soft text-primary">
                <TrendingUp className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-xs leading-tight font-bold text-text-primary">
                  +124 Leads
                </span>
                <span className="block text-[11px] leading-tight text-text-muted">
                  This week
                </span>
              </span>
            </div>

            <div className="absolute -bottom-4 -left-2 hidden items-center gap-2.5 rounded-btn border border-border bg-surface px-3 py-2 shadow-float md:flex lg:-left-5">
              <span className="grid size-8 place-items-center rounded-btn bg-primary text-white">
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </span>
              <span>
                <span className="block text-xs leading-tight font-bold text-text-primary">
                  Follow-up Sent
                </span>
                <span className="block text-[11px] leading-tight text-text-muted">
                  Sarah M. · 2s ago
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
