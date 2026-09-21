"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FaqEntry {
  q: string;
  a: string;
}

/**
 * The accordion itself, with no copy of its own.
 *
 * Lifted out of `features/features-faq` so a second FAQ does not mean a second
 * implementation of the open-and-close. The mechanics are subtle enough to be
 * worth having once: a measured height, a `ResizeObserver` that keeps that
 * measurement honest, `inert` on a closed panel, and a plus that becomes a
 * minus by rotation rather than by being swapped out. A duplicate of all that
 * drifts on the first change to either page.
 *
 * `features-faq` still carries its own copy of this and is deliberately
 * untouched — it is on a different route, and migrating it belongs in a change
 * that can be reviewed against `/features`.
 *
 * A client component: this was a `<details>` set until the open and close had
 * to animate. `<details>` toggles its content between rendered and not, so
 * there is no height to interpolate; `::details-content` and
 * `interpolate-size` would do it natively but are not in Safari yet. What that
 * costs is the free accessibility `<details>` came with, so it is paid back by
 * hand — `aria-expanded` and `aria-controls` on the button, the panel labelled
 * by it, and `inert` while it is closed so its text is neither read out nor
 * tabbed into at zero height.
 */
function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
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
        {/* Its own flex item rather than loose text, so it can be told to wrap.
            `min-w-0` is the load-bearing half: a flex item's floor is its
            longest word, not zero, and without it a long question pushes the
            control off the right edge instead of breaking onto a second line. */}
        <span className="min-w-0 flex-1">{question}</span>

        {/*
         * Both glyphs sit in the same grid cell and trade places on a rotation.
         * A plus that merely rotates lands on a cross, and one swapped for a
         * minus outright is the jump this was meant to remove.
         *
         * Fixed in both states — the border, the bed and the glyph all change
         * on open and the box does not, which keeps the row from shifting
         * under the cursor mid-click.
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

/**
 * One open at a time. Clicking the open item hands its own index back and
 * closes it; clicking another swaps the index, and the two panels animate past
 * each other on the same curve since both stay mounted throughout.
 */
export function FaqAccordion({
  items,
  className,
}: {
  items: FaqEntry[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("space-y-3.5", className)}>
      {items.map((item, index) => (
        <FaqItem
          key={item.q}
          question={item.q}
          answer={item.a}
          isOpen={openIndex === index}
          onToggle={() =>
            setOpenIndex((current) => (current === index ? null : index))
          }
        />
      ))}
    </div>
  );
}
