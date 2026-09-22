"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessagesSquare,
  Target,
  TrendingUp,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The platform, as the journey it covers rather than as a list of modules.
 *
 * The landing page answers "what is in the box" with an ecosystem diagram of
 * eight cards around a hub. This section answers a different question — in what
 * order do these things happen to a customer — and it is the frame every
 * section below it hangs off: WhatsApp is Engage, the automation builder is
 * Automate, commerce is Convert, analytics is Grow.
 *
 * Each stage names the modules that do the work, so the diagram is checkable
 * rather than aspirational. Those names are the real sidebar entries; a stage
 * cannot claim a capability the product does not ship.
 *
 * Deliberately not five cards. Nothing here has a border or a ground of its own
 * except the icon tile and the module chips — the stages are held together by
 * the rule running through them and by the grid, which is what makes this read
 * as one journey rather than as a feature grid with arrows drawn on it.
 *
 * ## The connector
 *
 * One segment per stage rather than a single rule across the row, each drawn
 * from its own tile's centre to the next tile's centre: `left-1/2` plus a width
 * of one column and one gutter. An earlier cut used a single absolutely
 * positioned rule inset by 10% at each end, on the reasoning that a fifth of a
 * five-column row is half a cell — true only while the gutters are zero. With
 * `gap-x-5` the real first centre sits at about 9.2% of the row, so the rule
 * started in open space to the right of the tile it was supposed to grow out
 * of. Segments cannot drift that way: each one is measured from the thing it
 * connects, at every breakpoint, whatever the gutter is.
 *
 * Below `md` the row becomes a column and the rule flips to a vertical one down
 * the left, drawn by every stage but the last so the column ends on a tile.
 */

interface Stage {
  label: string;
  icon: LucideIcon;
  headline: string;
  modules: string[];
  /** Exactly one stage carries the brand. See the note below. */
  accent?: boolean;
}

/**
 * Automate is the only stage wearing the brand.
 *
 * Not because it is the biggest module, but because it is the hinge the
 * sentence turns on: Capture and Engage are things a team does, Convert and
 * Grow are things that come back, and automation is what carries the customer
 * from one half to the other without anyone touching it. One accent in five
 * says which; two would say neither.
 */
const STAGES: Stage[] = [
  {
    label: "Capture Leads",
    icon: UserPlus,
    headline: "A lead arrives from a form, campaign or WhatsApp message.",
    modules: ["Leads", "Contacts", "Forms"],
  },
  {
    label: "Engage Customers",
    icon: MessagesSquare,
    headline: "Your team responds with the full customer history in one place.",
    modules: ["WhatsApp Inbox", "Email", "SMS"],
  },
  {
    label: "Automate Follow-ups",
    icon: Zap,
    headline: "Follow-ups happen automatically based on customer activity.",
    modules: ["Workflows", "Triggers", "Templates"],
    accent: true,
  },
  {
    label: "Convert Customers",
    icon: Target,
    headline: "Orders and customer actions stay connected to the conversation.",
    modules: ["Orders", "Products", "Discounts"],
  },
  {
    label: "Grow Revenue",
    icon: TrendingUp,
    headline: "See which channels and campaigns are driving revenue.",
    modules: ["Analytics", "Segments", "Campaigns"],
  },
];

/**
 * Reveals the row once it is genuinely on screen, one stage at a time.
 *
 * The stagger is the point: five stages arriving together is a fade, five
 * arriving left to right is the journey drawing itself, which is the one thing
 * this section is trying to say. 90ms apart and 500ms each, so the whole row
 * has settled in under a second — long enough to read as a sequence, short
 * enough that a reader scrolling past never waits for it.
 *
 * Fires once. A row that re-animates every time it re-enters the viewport is a
 * distraction on the second pass, and there is nothing new to learn from it.
 *
 * Two escape hatches, both in CSS rather than here. `motion-reduce:` hands
 * anyone who asked for reduced motion the finished state outright, which is
 * why this hook has no media query in it — a branch that calls `setState`
 * straight from an effect body is a cascading render, and the variant does the
 * same job without one. `<noscript>` does it for a reader with no JavaScript:
 * the resting state is an opacity, so it has to be defeated rather than merely
 * left un-animated.
 */
function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setRevealed(true);
        observer.disconnect();
      },
      /* A fifth of the way up from the bottom edge, so the row starts drawing
         as it comes into view rather than after it has already been read. */
      { rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

export function PlatformFlow() {
  const { ref, revealed } = useRevealOnce<HTMLOListElement>();

  return (
    <section
      id="platform"
      aria-labelledby="platform-flow-title"
      className="section-space-py relative isolate overflow-hidden bg-primary-soft"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] bg-size-[22px_22px] opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />

      <noscript>
        {/* The reveal's resting state is an opacity, so without JavaScript the
            row would simply never appear. Defeat it rather than animate it. */}
        <style>{`.js-reveal{opacity:1!important;translate:none!important;scale:none!important}`}</style>
      </noscript>

      <div className="custom-container">
        <header className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <span aria-hidden className="size-1.5 rounded-full bg-secondary" />
            One connected workspace
          </p>

          {/*
           * One rung up the `section-title` ramp — 36 / 48 / 60 rather than
           * 30 / 36 / 48. The class is in `@layer components`, so the three
           * utilities below simply outrank its sizes and nothing else about it
           * changes. Two words need the extra size: the ramp is set for a
           * sentence, and "Customer Journey" at the shared size reads as a
           * label floating over the row rather than as the section's title.
           */}
          <h2
            id="platform-flow-title"
            className="section-title mt-5 text-balance text-4xl sm:text-5xl lg:text-6xl"
          >
            Customer Journey
          </h2>

          <p className="mt-3.5 text-base leading-[1.7] text-text-secondary text-pretty">
            MarketFlow connects every stage of the customer journey in one
            workspace — so a lead captured on Monday and the order it becomes on
            Friday are the same record, not two exports.
          </p>
        </header>

        {/*
         * Five across from `md`, a column below it.
         *
         * The horizontal row starts at the tablet breakpoint rather than at
         * `lg`, which is what keeps a tablet reading as one journey: the
         * alternatives at that width are a 3-then-2 grid or a two-column stack,
         * and both break the chain into groups that mean nothing. Columns get
         * tight there, which is what the smaller type and the `md`-only size
         * step on the tiles are for.
         */}
        <ol ref={ref} className="grid gap-x-5 gap-y-0 md:grid-cols-5">
          {STAGES.map((stage, index) => {
            const last = index === STAGES.length - 1;

            return (
              <li
                key={stage.label}
                style={{ transitionDelay: `${index * 90}ms` }}
                className={cn(
                  "js-reveal relative flex gap-4 pb-8 last:pb-0",
                  "md:flex-col md:items-center md:gap-0 md:pb-0 md:text-center",
                  "transition-[opacity,translate] duration-500 ease-out",
                  revealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0",
                  "motion-reduce:translate-none motion-reduce:opacity-100 motion-reduce:transition-none",
                )}
              >
                {/* The phone's vertical rule. Every stage but the last draws
                    it, so the column ends on a tile rather than on a line. */}
                {last ? null : (
                  <span
                    aria-hidden
                    className="absolute top-12 bottom-0 left-6 w-px -translate-x-1/2 bg-border-strong md:hidden"
                  />
                )}

                {/* This tile's centre to the next tile's centre: one column
                    plus one gutter (`gap-x-5`). Behind the tiles, which paint
                    their own ground over it. Scaled from the left so the line
                    draws itself in the direction the journey runs. */}
                {last ? null : (
                  <span
                    aria-hidden
                    style={{ transitionDelay: `${index * 90 + 160}ms` }}
                    className={cn(
                      "js-reveal pointer-events-none absolute top-6 left-1/2 hidden h-px w-[calc(100%+1.25rem)]",
                      "origin-left bg-[linear-gradient(to_right,var(--color-border-strong),var(--color-border-strong))] md:block",
                      "transition-[opacity,scale] duration-500 ease-out",
                      revealed
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0",
                      "motion-reduce:scale-x-100 motion-reduce:opacity-100 motion-reduce:transition-none",
                    )}
                  />
                )}

                <span
                  className={cn(
                    "relative z-1 grid size-12 shrink-0 place-items-center rounded-2xl border",
                    stage.accent
                      ? "brand-gradient border-transparent text-white shadow-[0_10px_24px_-10px_rgba(79,70,229,0.9)] ring-6 ring-primary/10"
                      : "border-border bg-surface text-primary shadow-card",
                  )}
                >
                  <stage.icon
                    className="size-5"
                    strokeWidth={1.9}
                    aria-hidden
                  />
                </span>

                {/* `flex-1` plus `mt-auto` on the chips: the five headlines run
                    to different line counts, and without it each chip row
                    floats at its own height and the floor of the section goes
                    ragged. Grid stretch gives every column the same height;
                    this is what spends it. */}
                <div className="min-w-0 md:mt-5 md:flex md:flex-1 md:flex-col md:items-center">
                  {/* Two lines reserved between `md` and `lg`, and only
                      there. Five columns are at their tightest in that band, so
                      "Engage Customers", "Automate Follow-ups" and "Convert
                      Customers" wrap while "Capture Leads" and "Grow Revenue"
                      do not — which starts three of the five descriptions a
                      line lower than their neighbours. 3.5rem is two of this
                      element's `sm:text-lg` 1.75rem lines. "Automate Follow-ups" is
                      still wrapping at exactly `lg`, so the reservation is held
                      to `xl` and only then dropped, rather than left in place to
                      add dead space under every title on a desktop. */}
                  <h3 className="text-base sm:text-lg font-bold text-text-primary md:min-h-14 xl:min-h-0">
                    {stage.label}
                  </h3>

                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary text-pretty lg:text-base">
                    {stage.headline}
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-1.5 md:mt-auto md:justify-center md:pt-3">
                    {stage.modules.map((module) => (
                      <li
                        key={module}
                        /* Metadata, not buttons. No pill radius, no hover, no
                           pointer — nothing here goes anywhere, and a chip that
                           looks clickable and is not is worse than a plain
                           label. */
                        className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs leading-5 font-semibold text-text-muted"
                      >
                        {module}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
