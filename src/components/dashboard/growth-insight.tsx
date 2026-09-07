import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * A read on the data with a next step attached.
 *
 * Deliberately not called an AI insight: this is a fixed comparison of two
 * channels, and naming it after a capability the product does not have would
 * be a claim the dashboard cannot back.
 */
export function GrowthInsight({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="growth-insight-title"
      className={cn(
        "flex flex-col justify-between gap-4 rounded-card border border-primary-border bg-primary-soft p-5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex gap-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface text-primary">
          <TrendingUp className="size-4.5" aria-hidden />
        </span>

        <div>
          <h2
            id="growth-insight-title"
            className="text-[11px] font-medium tracking-[0.1em] text-primary-dark uppercase"
          >
            Growth Insight
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-primary">
            WhatsApp campaigns generated{" "}
            <strong className="font-bold">42% more conversions</strong> than email
            campaigns this month. Consider shifting more of your Re-engagement
            budget to WhatsApp.
          </p>
        </div>
      </div>

      <Link
        href={APP_ROUTES.campaigns}
        className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-btn text-sm font-medium text-primary-dark transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none sm:self-center"
      >
        View Campaign Performance
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </section>
  );
}
