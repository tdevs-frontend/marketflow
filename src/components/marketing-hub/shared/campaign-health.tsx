import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChannelRow } from "@/lib/overview-fixtures";
import type { Campaign } from "@/types/marketing";

/* -------------------------------------------------------------------------- */
/* Derivation                                                                 */
/* -------------------------------------------------------------------------- */

export interface CampaignHealth {
  /** 0–100. See `campaignHealth` for what it is made of. */
  score: number;
  active: number;
  deliveryRate: number;
  engagementRate: number;
  counts: { running: number; completed: number; draft: number };
  /** The three buckets the score is summarised by. */
  healthy: number;
  attention: number;
  paused: number;
}

/**
 * One number for "is the campaign programme all right".
 *
 * Three weighted parts, because a single rate always flatters something.
 * Delivery carries the most (0.45) - a campaign that does not arrive has
 * failed at the only thing it had to do. Engagement is next (0.30) and is the
 * part a marketer can actually move. Reliability (0.25) is the share of
 * campaigns that did not fail outright, which is what stops a programme with a
 * 98% delivery rate and two dead campaigns reading as perfectly well.
 *
 * The weights are stated here rather than tuned per tenant: a score whose
 * meaning changes between accounts is a score nobody can compare.
 */
export function campaignHealth(
  campaigns: Campaign[],
  channels: ChannelRow[],
  engagementRate: number,
): CampaignHealth {
  const by = (status: Campaign["status"]) =>
    campaigns.filter((item) => item.status === status).length;

  const sent = channels.reduce((sum, row) => sum + row.sent, 0);
  const delivered = channels.reduce((sum, row) => sum + row.delivered, 0);
  const deliveryRate = sent === 0 ? 0 : (delivered / sent) * 100;

  const failed = by("failed");
  const paused = by("paused");
  const running = by("running");
  const completed = by("completed");
  const draft = by("draft");
  const scheduled = by("scheduled");

  const total = campaigns.length;
  const reliability = total === 0 ? 100 : (1 - failed / total) * 100;

  return {
    score: Math.round(
      deliveryRate * 0.45 + engagementRate * 0.3 + reliability * 0.25,
    ),
    active: running,
    deliveryRate,
    engagementRate,
    counts: { running, completed, draft },
    /* Anything moving or finished is healthy; only a failure needs a person. */
    healthy: running + scheduled + completed,
    attention: failed,
    paused,
  };
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/** The band the score falls in, which is the only thing that colours the ring. */
function band(score: number): { ink: string; label: string } {
  if (score >= 85) return { ink: "text-success", label: "Healthy" };
  if (score >= 70) return { ink: "text-warning", label: "Watch" };
  return { ink: "text-error", label: "At risk" };
}

/**
 * The score as a ring.
 *
 * `stroke="currentColor"` with the hue on a `text-*` class rather than a
 * `stroke-*` one: the text utilities are the ones every other component in
 * this codebase already proves exist for these tokens, and an SVG that picks
 * up its colour from the cascade cannot drift from the label beside it.
 */
function HealthRing({ score, size = 104 }: { score: number; size?: number }) {
  const width = 9;
  const radius = (size - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const tone = band(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Campaign health score ${score} out of 100`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={width}
          stroke="currentColor"
          className="text-surface-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={width}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={`${filled} ${circumference}`}
          /* Start at twelve o'clock; SVG arcs otherwise begin at three. */
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn(tone.ink, "transition-[stroke-dasharray] duration-500")}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl leading-none font-bold text-text-primary tabular-nums">
            {score}
          </p>
          <p className={cn("mt-1 text-meta font-bold", tone.ink)}>{tone.label}</p>
        </div>
      </div>
    </div>
  );
}

/** One of the three readings beside the ring. */
function MetricRow({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number;
  icon: LucideIcon;
}) {
  const rising = (change ?? 0) >= 0;
  const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-secondary">
        <Icon className="size-3.5 shrink-0 text-text-muted" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="flex shrink-0 items-baseline gap-1.5">
        <span className="text-base font-bold text-text-primary tabular-nums">
          {value}
        </span>
        {change === undefined ? null : (
          <span
            className={cn(
              "inline-flex items-center text-meta font-medium tabular-nums",
              rising ? "text-primary" : "text-error",
            )}
          >
            <TrendIcon className="size-3" aria-hidden />
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </p>
    </div>
  );
}

/** A dotted count in the bottom strip. */
function StatusDot({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", tone)} />
      <span className="font-bold text-text-primary tabular-nums">
        {formatNumber(value)}
      </span>
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Campaign health, as a score and the three readings behind it.
 *
 * The ring exists because the three rates beside it do not combine in a
 * reader's head: 97.8% delivered, 59.7% engaged and two failures out of
 * twenty-one is four facts, and the question being asked is one question. The
 * ring answers it, the rows show the working, and the strip along the bottom
 * says which campaigns the score is made of.
 */
export function CampaignHealthPanel({
  health,
  changes,
  icons,
}: {
  health: CampaignHealth;
  /** Movement against the previous period, which a snapshot cannot derive. */
  changes?: { active?: number; delivery?: number; engagement?: number };
  icons: { active: LucideIcon; delivery: LucideIcon; engagement: LucideIcon };
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <HealthRing score={health.score} />
          <p className="text-meta font-medium text-text-muted">
            {formatNumber(health.healthy)} of{" "}
            {formatNumber(health.healthy + health.attention + health.paused)}{" "}
            campaigns healthy
          </p>
        </div>

        {/* Divided rows rather than tiles: three readings that share a right
            edge are read as a column of figures, which is the comparison the
            ring is asking the reader to check. */}
        <div className="w-full min-w-0 flex-1 divide-y divide-border">
          <MetricRow
            label="Active Campaigns"
            value={formatNumber(health.active)}
            change={changes?.active}
            icon={icons.active}
          />
          <MetricRow
            label="Delivery Rate"
            value={formatPercent(health.deliveryRate)}
            change={changes?.delivery}
            icon={icons.delivery}
          />
          <MetricRow
            label="Engagement Rate"
            value={formatPercent(health.engagementRate)}
            change={changes?.engagement}
            icon={icons.engagement}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3.5">
        <StatusDot label="Running" value={health.counts.running} tone="bg-whatsapp" />
        <StatusDot label="Completed" value={health.counts.completed} tone="bg-border-strong" />
        <StatusDot label="Draft" value={health.counts.draft} tone="bg-surface-secondary" />
        <StatusDot label="Paused" value={health.paused} tone="bg-warning" />
        <StatusDot label="Failed" value={health.attention} tone="bg-error" />
      </div>
    </div>
  );
}
