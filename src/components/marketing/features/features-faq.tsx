"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The questions a prospect actually types before signing up.
 *
 * Product questions with product answers — every one of them is answerable from
 * a section above, and each answer names the real surface rather than
 * restating the pitch. A FAQ whose answers are marketing copy is a second CTA
 * with a chevron on it.
 *
 * Two columns from `md`: the heading holds the left rail and the list runs down
 * the right. Eight items centred under a centred heading is a very long, very
 * narrow ribbon; splitting it gives the list a shorter measure and puts the
 * section's title in the reader's eye for the whole scroll. Below `md` the
 * grid collapses to heading, description, list — which is the reading order
 * already written into the source.
 *
 * A client component, which it did not used to be. This was a `<details>` set
 * until the open and close had to animate: `<details>` toggles its content
 * between rendered and not, so there is no height to interpolate and no moment
 * at which both the outgoing and the incoming state exist. `::details-content`
 * and `interpolate-size` would do it natively, but neither is in Safari yet,
 * and an accordion whose animation is the whole point cannot be smooth in two
 * browsers out of three. So: a button, a panel, and a measured height.
 *
 * What that costs is the free accessibility `<details>` came with, so it is
 * paid back by hand — `aria-expanded` and `aria-controls` on the button, the
 * panel labelled by it, and `inert` on the panel while it is closed so its text
 * is neither read out nor tabbed into while it sits at zero height.
 *
 * The first one is open, so the pattern is obvious without anyone clicking.
 */

const FAQS = [
  {
    q: "What is MarketFlow?",
    a: "MarketFlow is a connected workspace for managing customers, conversations, marketing campaigns, automation, commerce and analytics in one place.",
  },
  {
    q: "Which channels can I use with MarketFlow?",
    a: "MarketFlow supports WhatsApp, Email, SMS and Social channels, so you can manage customer communication and campaigns from one workspace.",
  },
  {
    q: "Can I automate WhatsApp conversations?",
    a: "Yes. MarketFlow lets you create automated workflows using triggers, conditions, delays, messages and follow-up actions.",
  },
  {
    q: "Can I manage contacts and leads in MarketFlow?",
    a: "Yes. Contacts, leads, segments, tags and customer journeys can be managed together, so your team has a complete view of each customer.",
  },
  {
    q: "Can I create Email and SMS campaigns?",
    a: "Yes. You can create campaigns, manage reusable templates and monitor delivery and engagement from the Email and SMS modules.",
  },
  {
    q: "Can I manage social media posts from MarketFlow?",
    a: "Yes. Social Planner lets you plan, create, schedule and review social content across connected social accounts.",
  },
  {
    q: "Can MarketFlow connect with my store and other tools?",
    a: "Yes. MarketFlow includes integrations for services such as Shopify, analytics tools, Webhooks and API access.",
  },
  {
    q: "Can I track campaign performance and revenue?",
    a: "Yes. MarketFlow analytics helps you understand campaign activity, customer engagement, conversions, orders and revenue.",
  },
];

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  /*
   * The panel's open height in pixels, or `null` before it has been measured.
   *
   * `null` is not zero, and the difference matters for exactly one frame: the
   * first item renders open and the server has no idea how tall its answer is.
   * Committing a height of 0 to that first paint and correcting it in an effect
   * animates the item open on arrival, which reads as a page still loading.
   * While the height is `null` an open panel is given no maximum at all and
   * stands at its natural size; the measurement that replaces it is the same
   * number, so nothing moves.
   */
  const [openHeight, setOpenHeight] = useState<number | null>(null);

  const id = useId();
  const buttonId = `${id}-question`;
  const panelId = `${id}-answer`;

  /*
   * Measured from the content, never from the panel — the panel is the element
   * being clamped, so asking it its height is asking it what we just told it.
   *
   * A `ResizeObserver` rather than a measurement per toggle, because the number
   * goes stale for reasons that have nothing to do with clicking: a narrower
   * viewport rewraps a two-line answer onto three, and a late webfont reflows
   * every answer at once. The observer fires on all of those, and on the
   * initial observe, which is what takes the first measurement.
   */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new ResizeObserver(() => {
      setOpenHeight(content.getBoundingClientRect().height);
    });
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "rounded-panel border bg-surface px-5 shadow-card transition-colors sm:px-6 lg:px-7",
        isOpen ? "border-border-strong" : "border-border",
      )}
    >
      <button
        type="button"
        id={buttonId}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="group flex w-full cursor-pointer items-center justify-between gap-5 py-5 text-left text-xl leading-relaxed font-semibold text-text-primary focus-visible:shadow-focus focus-visible:outline-none sm:gap-6"
      >
        {/*
         * The question is its own flex item rather than loose text, so it can
         * be told to wrap. `min-w-0` is the load-bearing half: a flex item's
         * floor is its longest word, not zero, and without it a question that
         * outgrows the row pushes the control off the right edge instead of
         * breaking onto a second line.
         */}
        <span className="min-w-0 flex-1">{question}</span>

        {/*
         * Both glyphs sit in the same grid cell and trade places on a rotation.
         * A plus that merely rotates lands on a cross, and one swapped for a
         * minus outright is the jump this was meant to remove.
         *
         * 36px, fixed in both states — the border, the bed and the glyph all
         * change on open and the box does not, which is what keeps the row from
         * shifting under the cursor mid-click. The icon carries the brand
         * indigo whether it is open or closed; muting it while closed was what
         * made the control hard to find in the first place.
         *
         * `transition-transform` would animate nothing here: Tailwind v4 sets
         * `rotate` as its own property rather than composing a `transform`, so
         * the property being interpolated has to be named.
         */}
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border text-primary transition-colors",
            isOpen
              ? "border-primary-border bg-primary-soft"
              : "border-border bg-surface group-hover:border-primary-border group-hover:bg-primary-soft",
          )}
        >
          <Plus
            className={cn(
              "col-start-1 row-start-1 size-4.5 transition-[rotate,opacity] duration-300 ease-in-out motion-reduce:transition-none",
              isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
            )}
          />
          <Minus
            className={cn(
              "col-start-1 row-start-1 size-4.5 transition-[rotate,opacity] duration-300 ease-in-out motion-reduce:transition-none",
              isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
            )}
          />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!isOpen}
        style={{
          maxHeight: isOpen
            ? openHeight === null
              ? undefined
              : openHeight
            : 0,
        }}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-450 ease-in-out motion-reduce:transition-none",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      >
        <div ref={contentRef}>
          <p className="pb-5 text-base leading-[1.7] font-medium text-text-secondary text-pretty">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FeaturesFaq() {
  /*
   * One index, so one panel. Clicking the open item hands its own index back
   * and closes it, which is the close half of the toggle; clicking another
   * swaps the index and the two panels animate past each other on the same
   * curve, since both stay mounted throughout.
   */
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        {/*
         * Roughly 35/65 from `lg`, a gentler 40/60 at `md` with a tighter gap —
         * the heading needs more of a tablet's width than it does a desktop's
         * before it starts wrapping every second word.
         */}
        <div className="grid gap-10 md:grid-cols-[3fr_3fr] md:gap-10 lg:grid-cols-[6fr_13fr] lg:gap-16">
          <header className="md:pt-1">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-secondary"
              />
              FAQ
            </p>

            <h2 id="faq-title" className="section-title mt-5 text-balance">
              Frequently
              {/* Held on two lines only where the rail is wide enough to want
                  the break; elsewhere it wraps to whatever it is given. */}
              <br className="max-lg:hidden" /> Asked Questions
            </h2>

            <p className="mt-3.5 text-base leading-[1.7] text-text-secondary text-pretty">
              Have questions about MarketFlow? Explore the answers to common
              questions about campaigns, customers, automation, integrations and
              more.
            </p>
          </header>

          {/* 14px between items — enough that each card reads as its own, tight
              enough that eight of them still read as one list. */}
          <div className="space-y-3.5">
            {FAQS.map((faq, index) => (
              <FaqItem
                key={faq.q}
                question={faq.q}
                answer={faq.a}
                isOpen={openIndex === index}
                onToggle={() =>
                  setOpenIndex((current) => (current === index ? null : index))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
