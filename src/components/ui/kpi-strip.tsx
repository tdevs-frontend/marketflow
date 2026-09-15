import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tints the icon tile. Defaults to neutral. */
  tone?: KpiTone;
  hint?: string;
}

/**
 * The tones a tile can take.
 *
 * The first four are identity colours — the brand and the three channel hues —
 * and they exist so a strip of four tiles can be told apart at a glance rather
 * than read one label at a time. The last four are *states*: success, warning
 * and danger mean something happened, and spending them on "this card is the
 * digital one" is how a merchant stops trusting green to mean good news.
 */
export type KpiTone =
  | "neutral"
  | "brand"
  | "accent"
  | "email"
  | "sms"
  | "info"
  | "success"
  | "warning"
  | "danger";

/**
 * Each tone, as the icon tile it colours.
 *
 * The tile is the only coloured thing on the card — the surface stays white
 * with one neutral border, so a strip still reads as a row of one kind of
 * object rather than a set of coloured panels.
 *
 * Every tile is bordered and every border belongs to its own tint. A grey
 * hairline around an amber fill is the mismatch this map exists to prevent:
 * the border is the quiet edge of the same colour, never a second one.
 *
 * Three families ship a border token — `primary`, `email`, `sms` — and use it.
 * The rest have no `-border` step, so rather than invent a hex the border is
 * mixed from the family's own solid hue with an alpha. The alphas are measured,
 * not guessed: the three tokened borders sit at 1.33, 1.31 and 1.27 against
 * their own fills, so each derived one is tuned to that same ~1.30 weight and
 * the whole row reads as one set of tiles.
 *
 *   accent/30  1.31    success/25  1.29    warning/40  1.30
 *   danger/20  1.34    info/20     1.29
 *
 * Note that `info` and `email` are the *same blue* — `--color-info` and
 * `--color-email` are both #2563eb, differing only in how deep their soft is.
 * They are not interchangeable in one row: pick `email` when the thing is the
 * Email channel, `info` when it is a state, and never put both side by side.
 */
const TONES: Record<KpiTone, string> = {
  neutral: "border-border bg-surface-secondary text-text-muted",
  brand: "border-primary-border bg-primary-soft text-primary",
  accent: "border-accent/30 bg-accent-soft text-accent",
  email: "border-email-border bg-email-soft text-email",
  sms: "border-sms-border bg-sms-soft text-sms",
  info: "border-info/20 bg-info-soft text-info-text",
  success: "border-success/25 bg-success-soft text-success-text",
  warning: "border-warning/40 bg-warning-soft text-warning-text",
  danger: "border-error/20 bg-error-soft text-error-text",
};

/**
 * The KPI strip a workspace page opens with. Four or five tiles, one line
 * each — the reader should take in the state of the page before scrolling.
 *
 * This lives in `ui/` rather than in a feature folder because Commerce and
 * Customers both open on it, and a second copy is how two modules end up with
 * tiles that are almost the same height. `commerce/commerce-kpis` re-exports
 * it under its original names, the way `commerce/filter-bar` already does.
 *
 * Hover moves the border and deepens the existing card shadow, and deliberately
 * does *not* lift: `Card`'s `interactive` treatment raises the surface to say
 * "this goes somewhere", and a KPI tile does not.
 */
export function KpiStrip({
  items,
  className,
}: {
  items: Kpi[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        items.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.label}
            className="p-4 hover:border-border-strong hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-text-secondary">
                {item.label}
              </p>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-panel border",
                  TONES[item.tone ?? "neutral"],
                )}
              >
                <Icon className="size-4.5" aria-hidden />
              </span>
            </div>

            <p className="mt-2.5 text-2xl leading-none font-bold text-text-primary">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-2 text-sm font-medium text-text-secondary">
                {item.hint}
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
