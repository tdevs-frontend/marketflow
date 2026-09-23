import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The top of every dashboard page: title, one line of context, and the page's
 * actions.
 *
 * The primary action stays last in the DOM and last in reading order on
 * desktop, but the header stacks below `sm` so on a phone the title is read
 * before the button rather than around it. `secondaryActions` sit to the left
 * of `action` so the one green button on the page is always the rightmost
 * control - that consistency is what makes the CTA findable without looking.
 */
/**
 * The two scales a page header comes in.
 *
 * `page` is the working default, on sixty-odd screens. `overview` is the
 * larger setting the merchant dashboard opens on - a step up in the title, a
 * step up in the subtitle, and the action centred against the block rather
 * than aligned to its top, which is what a two-line header wants when the
 * subtitle is set at body size.
 *
 * A variant rather than a second component, because the alternative is a page
 * hand-rolling its own `h1` next to sixty-six that do not, and that is how the
 * product ends up with a third heading style nobody chose.
 */
export type PageHeaderSize = "page" | "overview";

const HEADER_SCALE: Record<
  PageHeaderSize,
  { root: string; title: string; description: string }
> = {
  page: {
    root: "gap-3 sm:items-start",
    title: "text-2xl font-bold tracking-tight",
    description: "mt-1 max-w-2xl text-sm",
  },
  overview: {
    /* No `tracking-tight`: at 28px the default tracking is what the dashboard
       sets, and tightening it here would make the two titles differ by a
       hairline nobody could name but everybody would see. */
    root: "gap-4 sm:items-center",
    title: "text-2xl sm:text-[1.75rem]",
    description: "mt-1.5 text-base",
  },
};

export function PageHeader({
  title,
  description,
  action,
  secondaryActions,
  size = "page",
}: {
  title: string;
  description?: string;
  /** The page's primary button. */
  action?: ReactNode;
  /** Outline or ghost buttons - Export, Import, Settings. */
  secondaryActions?: ReactNode;
  /** Defaults to `page`. See `HEADER_SCALE`. */
  size?: PageHeaderSize;
}) {
  const scale = HEADER_SCALE[size];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:justify-between",
        scale.root,
      )}
    >
      <div className="min-w-0">
        <h1 className={scale.title}>{title}</h1>
        {description ? (
          <p
            className={cn(
              "font-medium text-text-secondary",
              scale.description,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action || secondaryActions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {secondaryActions}
          {action}
        </div>
      ) : null}
    </div>
  );
}
