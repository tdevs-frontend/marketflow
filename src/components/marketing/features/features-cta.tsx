import Image from "next/image";
import { ArrowRight, CalendarCheck, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

import avatar1 from "../../../../public/customer-avatar-1.jpg";
import avatar2 from "../../../../public/customer-avatar-2.jpg";
import avatar3 from "../../../../public/customer-avatar-3.jpg";
import avatar4 from "../../../../public/customer-avatar-4.jpg";

const TRUST_AVATARS = [avatar1, avatar2, avatar3, avatar4];

/**
 * The closing panel.
 *
 * Built from `FinalCta`'s treatment — same `cta-surface` ground, same dot
 * texture, same eyebrow and button pair — rather than a second closing style,
 * because a visitor who reaches the bottom of this page should recognise where
 * they are. The copy is this page's, not the home page's.
 *
 * The rating and the merchant count are the landing page's existing figures,
 * carried across unchanged. They are not restated more strongly here and no
 * testimonial has been invented to sit beside them: a features page that
 * escalates the claim its own home page makes is the first thing a careful
 * buyer catches.
 */
export function FeaturesCta() {
  return (
    <section
      aria-labelledby="features-cta-title"
      className="cta-surface custom-container relative isolate mb-20 mt-20 overflow-hidden rounded-3xl border border-primary-border/60 px-6 py-14 shadow-[0_20px_60px_rgba(79,70,229,0.08)] sm:rounded-[28px] sm:px-10 sm:py-20 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-primary-border)_1px,transparent_1px)] bg-size-[22px_22px] opacity-40 mask-[radial-gradient(ellipse_75%_70%_at_50%_50%,black,transparent_78%)]"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-primary-border bg-primary-soft py-1.5 pr-4 pl-2.5 text-primary">
          <span aria-hidden className="size-1.5 rounded-full brand-gradient-accent" />
          Start in minutes
        </p>

        <h2 id="features-cta-title" className="section-title mt-6 text-balance">
          Turn every customer interaction into your{" "}
          <span className="brand-gradient-text">next opportunity</span>
        </h2>

        <p className="mx-auto mt-6 max-w-[42rem] text-base leading-relaxed text-text-secondary text-pretty">
          Connect conversations, customers, campaigns, automation and commerce in
          one workspace.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={APP_ROUTES.register} size="lg" className="group">
            Get Started Free
            <ArrowRight
              className="size-4 transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </ButtonLink>
          <ButtonLink href={APP_ROUTES.pricing} variant="secondary" size="lg">
            <CalendarCheck className="size-4" aria-hidden />
            Book a Demo
          </ButtonLink>
        </div>

        {/* The home page's own numbers, unchanged. */}
        <div className="mt-9 flex items-center justify-center gap-3">
          <div className="flex -space-x-2.5">
            {TRUST_AVATARS.map((avatar) => (
              <Image
                key={avatar.src}
                src={avatar}
                alt=""
                className="size-9 rounded-full object-cover ring-2 ring-surface"
              />
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star
                  key={star}
                  className="size-3.5 fill-warning text-warning"
                  aria-hidden
                />
              ))}
              <span className="ml-1 text-xs font-semibold text-text-primary">
                4.9/5
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Trusted by{" "}
              <span className="font-semibold text-text-secondary">2,400+</span>{" "}
              merchants
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
