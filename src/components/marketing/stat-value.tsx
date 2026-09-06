"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Splits "10K+" into its parts so the number can animate and the unit can be tinted. */
type ParsedStat = { prefix: string; digits: string; amount: number; suffix: string };

function parseStat(value: string): ParsedStat | null {
  const match = value.match(/^(\D*?)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const amount = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;

  return { prefix: match[1], digits: match[2], amount, suffix: match[3] };
}

const DURATION = 1200;

/** Small numbers need a decimal mid-flight, or the count has nothing to show. */
function frameValue(amount: number, progress: number) {
  const current = amount * progress;
  return amount < 20 ? current.toFixed(1) : Math.round(current).toLocaleString("en-US");
}

/**
 * Renders a stat figure, counting up once when it scrolls into view.
 *
 * The count is deliberately skipped when the element is already on screen at
 * load (there is no reveal to animate, and resetting to zero would flash) and
 * when the reader prefers reduced motion. The full value is always in the DOM
 * for assistive tech, so the animation never gates the content.
 */
export function StatValue({ value, className }: { value: string; className?: string }) {
  // Memoised so the effect below has a stable dependency.
  const parsed = useMemo(() => parseStat(value), [value]);
  const [digits, setDigits] = useState(parsed?.digits ?? value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !parsed) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let first = true;

    const animate = () => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / DURATION, 1);
        // easeOutCubic — quick to read, settles gently.
        const eased = 1 - Math.pow(1 - progress, 3);
        setDigits(progress === 1 ? parsed.digits : frameValue(parsed.amount, eased));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (first) {
          first = false;
          // Already in view on load: leave the final value alone.
          if (entry.isIntersecting) return observer.disconnect();
          // Off screen: park at zero now, unseen.
          return setDigits(frameValue(parsed.amount, 0));
        }

        if (entry.isIntersecting) {
          observer.disconnect();
          animate();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parsed]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span aria-hidden>
        {parsed.prefix}
        {digits}
      </span>
      <span aria-hidden className="text-primary">
        {parsed.suffix}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
