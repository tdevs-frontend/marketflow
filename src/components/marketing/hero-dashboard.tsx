import Image from "next/image";
import { Send, TrendingUp } from "lucide-react";
import dashboardShot from "../../../public/marketflow-dashboard.png";

const SHOT_SIZES = [
  "(min-width: 1600px) 1200px",
  "(min-width: 1280px) 1092px",
  "(min-width: 1024px) 912px",
  "(min-width: 768px) 672px",
  "(min-width: 640px) 492px",
  "90vw",
].join(", ");

export function HeroDashboard() {
  return (
    <div
      role="img"
      aria-label="The MarketFlow dashboard: a navigation sidebar, KPI cards for total leads, WhatsApp conversations, orders and revenue, and a Growth Overview chart. Two stats float over it: reply rate, up 38%, and a new lead captured on WhatsApp."
      className="relative"
    >
      {/* Soft brand glow behind the frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)] blur-2xl"
      />

      {/* Contact shadow on the ground beneath it — the frame's own `shadow-float`
          is a drop shadow and reads as flat on its own at this size. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 -bottom-4 -z-10 h-8 rounded-[50%] bg-text-primary/10 blur-2xl"
      />

      {/* Bezel */}
      <div className="rounded-[calc(var(--radius-card)+6px)] border border-border/70 bg-surface/60 p-1 shadow-float backdrop-blur-sm sm:p-1.5">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {/* Window chrome */}
          <div className="flex items-center gap-2.5 border-b border-border bg-surface px-3 py-2 sm:gap-3 sm:px-4">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </div>

            <p className="flex min-w-0 flex-1 items-center justify-center rounded-field border border-border bg-background px-2.5 py-1">
              <span className="truncate text-[11px] text-text-muted">
                marketflow.app/dashboard
              </span>
            </p>

            <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary-dark sm:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Live
            </span>
          </div>

          {/*
           * The screenshot's viewport, sized by aspect ratio so the shot scales
           * proportionally and never distorts — `object-cover` does the fitting,
           * and the box's ratio alone decides how much of the shot is in view.
           *
           * From `md` the box matches the file exactly, so cover fills it with
           * nothing cropped. Below that a 2.1:1 desktop capture across a phone
           * would be a 140px letterbox strip with the type far too small to
           * read, so the box gets squarer and `object-left-top` holds the crop
           * on the sidebar, the greeting and the KPI cards — the part worth
           * seeing — at roughly 1.4x the scale a full-fit would give.
           */}
          <div className="relative aspect-4/3 sm:aspect-video md:aspect-1908/908">
            <Image
              src={dashboardShot}
              alt=""
              fill
              priority
              quality={90}
              sizes={SHOT_SIZES}
              className="object-cover object-top-left"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-b from-transparent via-hero/85 to-hero"
            />
          </div>
        </div>
      </div>

      {/*
       * Floating: reply-rate lift, overhanging the top-right corner. The 16px
       * outward offset is absorbed by the hero column's own `px-6` gutter, so it
       * holds at every width without widening the page.
       *
       * Both cards keep one fixed design and scale as a whole on small screens
       * rather than restyling part by part, so the proportions never drift. The
       * origin is the anchored corner, so shrinking pulls the card in towards
       * the frame and its overhang stays put. `scale` is its own CSS property in
       * Tailwind v4, so it composes with the `transform` the float animation
       * drives instead of fighting it.
       */}
      <div className="animate-float absolute -top-6 -right-4 origin-top-right scale-75 rounded-card border border-border bg-surface p-3 shadow-float 3xsm:scale-90 sm:scale-100">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary text-white">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Reply rate
            </span>
            <span className="block text-base font-bold leading-tight text-text-primary">+38%</span>
          </span>
        </div>
        <svg viewBox="0 0 120 36" className="mt-2 h-8 w-28" role="presentation" aria-hidden>
          <defs>
            <linearGradient id="mf-hero-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-from)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-brand-from)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M2,30 L19,25 L36,27 L53,17 L70,20 L87,11 L104,8 L118,3 L118,36 L2,36 Z"
            fill="url(#mf-hero-spark)"
          />
          <path
            d="M2,30 L19,25 L36,27 L53,17 L70,20 L87,11 L104,8 L118,3"
            fill="none"
            stroke="var(--color-brand-from)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="118" cy="3" r="3.5" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="2" />
        </svg>
      </div>

      {/* Floating: new lead toast — the diagonally opposite corner, over the
          bottom fade. It stays fully opaque there, so the dissolve behind it
          reads as depth. Same scale-as-a-whole treatment as the card above. */}
      <div className="animate-float-slow absolute -bottom-6 -left-4 flex origin-bottom-left scale-75 items-center gap-2.5 rounded-card border border-border bg-surface px-3.5 py-2.5 shadow-float 3xsm:scale-90 sm:scale-100">
        <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary-soft text-primary">
          <Send className="h-4 w-4" aria-hidden />
        </span>
        <span>
          <span className="block text-xs font-semibold leading-tight text-text-primary">
            New lead captured
          </span>
          <span className="block text-[11px] leading-tight text-text-muted">
            Fatima R. · WhatsApp · replied in 8s
          </span>
        </span>
      </div>
    </div>
  );
}
