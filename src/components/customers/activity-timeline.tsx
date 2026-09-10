import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { CustomerActivity } from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";
import { ActivityIcon } from "./customer-badges";

/**
 * One customer's history, newest first.
 *
 * Shared by the contact drawer, the lead drawer and the journey drawer rather
 * than written three times: they show the same events and the only thing that
 * differs is how many. A second copy is how "Lead score +20" ends up with a
 * different icon on one of the three.
 *
 * The connector is drawn by each row rather than by a wrapper, so the line
 * always starts under an icon's centre and the last row can simply omit it —
 * no absolute-positioned rail to keep in sync with the row height.
 */
export function ActivityTimeline({
  entries,
  emptyTitle = "No activity yet",
  emptyDescription = "Messages, campaign events and notes will appear here as they happen.",
  className,
}: {
  entries: CustomerActivity[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  if (entries.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ol className={cn("space-y-0", className)}>
      {entries.map((entry, index) => {
        const last = index === entries.length - 1;

        return (
          <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            {last ? null : (
              <span
                aria-hidden
                className="absolute top-8 left-3.5 h-[calc(100%-1.75rem)] w-px bg-border"
              />
            )}

            <ActivityIcon kind={entry.kind} className="relative z-10" />

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] leading-snug font-medium text-text-primary">
                {entry.title}
              </p>

              {entry.detail ? (
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {entry.detail}
                </p>
              ) : null}

              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted">
                <time dateTime={entry.at} title={formatDateTime(entry.at)}>
                  {formatRelativeTime(entry.at)}
                </time>
                {entry.sourceName ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate text-primary">
                      {entry.sourceName}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A labelled block inside a drawer: heading, then whatever it holds.
 *
 * Every drawer in this module is a stack of these, which is what keeps the
 * three of them looking like one component family.
 */
export function DrawerSection({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("border-t border-border pt-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
          {title}
        </h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A label/value pair, for the fact grids at the top of a drawer. */
export function DrawerFact({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-[13px]",
          strong
            ? "font-bold text-text-primary tabular-nums"
            : "text-text-secondary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
