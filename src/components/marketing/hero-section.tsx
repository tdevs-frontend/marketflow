import { ArrowRight, CalendarCheck, ShieldCheck, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/constants";
import { HeroDashboard } from "./hero-dashboard";

const TRUST_AVATARS = [
  { initials: "SK", className: "bg-surface-secondary text-text-secondary" },
  { initials: "AR", className: "bg-surface-secondary text-text-secondary" },
  { initials: "JM", className: "bg-accent-soft text-info-text" },
  { initials: "TC", className: "bg-primary-soft text-primary-dark" },
];

export function HeroSection() {
  return (
    <section className="hero-surface relative isolate overflow-hidden">
      <div className="custom-container">
        <div className="grid items-center gap-14 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-28 xl:gap-20">
          {/* Left — message */}
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-text-secondary shadow-card">
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
                New
              </span>
              WhatsApp Business API · built for merchants
            </p>

            <h1 className="mt-6 text-[2.75rem] font-bold leading-[1.06] tracking-tight text-balance sm:text-6xl xl:text-[4.25rem]">
              Turn Every Conversation Into{" "}
              <span className="text-primary">Growth</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-text-secondary text-pretty">
              Manage leads, automate WhatsApp conversations, launch campaigns,
              and turn customer interactions into measurable business growth.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={APP_ROUTES.register}
                size="lg"
                className="group"
              >
                Get Started
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </ButtonLink>
              <ButtonLink
                href={APP_ROUTES.features}
                variant="secondary"
                size="lg"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden />
                Book a Demo
              </ButtonLink>
            </div>

            {/* Trust indicator */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {TRUST_AVATARS.map((avatar) => (
                    <span
                      key={avatar.initials}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold ring-2 ring-surface",
                        avatar.className,
                      )}
                    >
                      {avatar.initials}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star
                        key={star}
                        className="h-3.5 w-3.5 fill-warning text-warning"
                        aria-hidden
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-text-primary">
                      4.9/5
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Trusted by{" "}
                    <span className="font-semibold text-text-secondary">
                      2,400+ merchants
                    </span>{" "}
                    across 18 countries
                  </p>
                </div>
              </div>

              <span className="hidden h-9 w-px bg-border sm:block" />

              <p className="inline-flex items-center gap-2 text-xs text-text-muted">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                Official Business API · no credit card required
              </p>
            </div>
          </div>

          {/* Right — product preview */}
          <div className="lg:pl-4">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
