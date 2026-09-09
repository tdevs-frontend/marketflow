import Image from "next/image";
import { ArrowRight, CalendarCheck, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { HeroDashboard } from "./hero-dashboard";

import avatar1 from "../../../public/customer-avatar-1.jpg";
import avatar2 from "../../../public/customer-avatar-2.jpg";
import avatar3 from "../../../public/customer-avatar-3.jpg";
import avatar4 from "../../../public/customer-avatar-4.jpg";

const TRUST_AVATARS = [
  { src: avatar1, alt: "MarketFlow customer" },
  { src: avatar2, alt: "MarketFlow customer" },
  { src: avatar3, alt: "MarketFlow customer" },
  { src: avatar4, alt: "MarketFlow customer" },
];

export function HeroSection() {
  return (
    <section className="hero-surface relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border-strong)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-strong)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 mask-[radial-gradient(ellipse_85%_45%_at_50%_20%,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-192 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]"
      />

      <div className="custom-container">
        <div className="px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-240 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-text-secondary shadow-card">
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-dark">
                New
              </span>
              WhatsApp Business API · built for merchants
            </span>

            <h1 className="mx-auto mt-7 max-w-4xl text-[2.75rem] font-bold leading-[1.06] tracking-tight text-balance sm:text-6xl xl:text-[4.25rem]">
              Turn Every Conversation Into{" "}
              <span className="brand-gradient-text">Growth</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary text-pretty">
              Manage leads, automate WhatsApp conversations, launch campaigns,
              and turn customer interactions into measurable business growth.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href={APP_ROUTES.register}
                variant="gradient"
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
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex -space-x-2.5">
                  {TRUST_AVATARS.map((avatar) => (
                    <Image
                      key={avatar.src.src}
                      src={avatar.src}
                      alt={avatar.alt}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-surface"
                    />
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
                  <p className="mt-0.5 text-sm text-text-muted">
                    Trusted by{" "}
                    <span className="font-semibold text-text-secondary">
                      2,400+ merchants
                    </span>{" "}
                    across 18 countries
                  </p>
                </div>
              </div>

            </div>
          </div>
          <div className="mx-auto mt-16 w-full max-w-300">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
