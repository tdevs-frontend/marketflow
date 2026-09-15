"use client";

import { AlertCircle, CheckCircle2, ChevronRight, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CAMPAIGN_GOALS,
  GOAL_LABEL,
  OBJECTIVE_LABEL,
  UTM_MEDIUM,
  WHATSAPP_CONNECTIONS,
  utmSourceFor,
} from "@/lib/campaign-fixtures";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignGoal, UtmParams } from "@/types/marketing";
import { ChannelPreview } from "./previews";
import { StepSection, SummaryRow } from "./shared";
import type { StepProps } from "./types";
import { blockersIn, warningsIn } from "./validation";

/**
 * Step 6 — the pre-flight check.
 *
 * Review used to restate the form. It now does the two things a review is for:
 * it collects the settings that belong to the campaign as a whole rather than
 * to any one step (tracking, UTMs, the conversion goal), and it runs the
 * validation that decides whether this can be sent at all. Every issue is a
 * link to the step that fixes it, because a checklist that tells you what is
 * wrong and not where is a checklist people learn to skip.
 */

export function ReviewStep(props: StepProps) {
  const { draft, derived, issues } = props;
  const blockers = blockersIn(issues);
  const warnings = warningsIn(issues);

  return (
    <div className="space-y-5">
      <ValidationPanel {...props} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <StepSection title="Campaign">
            <div className="rounded-panel border border-border">
              <dl className="divide-y divide-border px-3.5">
                <SummaryRow label="Name" value={draft.name || "Untitled"} />
                <SummaryRow
                  label="Objective"
                  value={OBJECTIVE_LABEL[draft.objective]}
                />
                {draft.tags.length > 0 ? (
                  <SummaryRow label="Tags" value={draft.tags.join(", ")} />
                ) : null}
                <SummaryRow label="Channel" value={derived.channelLabel} />
                <SummaryRow label="Sender" value={<SenderSummary {...props} />} />
                <SummaryRow label="Audience" value={<AudienceSummary {...props} />} />
                {derived.isSocial ? null : (
                  <>
                    <SummaryRow
                      label="Excluded"
                      value={`${formatNumber(
                        derived.eligibility.excluded,
                      )} contacts`}
                    />
                    <SummaryRow
                      label="Invalid for this channel"
                      value={`${formatNumber(derived.eligibility.invalid)} contacts`}
                    />
                    <SummaryRow
                      label="Eligible recipients"
                      value={
                        <span className="font-bold tabular-nums">
                          {formatNumber(derived.eligibility.eligible)}
                        </span>
                      }
                    />
                  </>
                )}
                <SummaryRow
                  label="Personalisation"
                  value={
                    derived.mergeTags.length === 0
                      ? "No merge tags"
                      : `${derived.mergeTags.length} tag${
                          derived.mergeTags.length === 1 ? "" : "s"
                        }, ${derived.missingFallbacks.length} without a fallback`
                  }
                />
                <SummaryRow label="Goal" value={GOAL_LABEL[draft.goal]} />
                <SummaryRow label="Schedule" value={<ScheduleSummary {...props} />} />
                {draft.abTest.enabled ? (
                  <SummaryRow
                    label="A/B test"
                    value={`${draft.abTest.split} / ${
                      100 - draft.abTest.split
                    } split on ${draft.abTest.field}`}
                  />
                ) : null}
              </dl>
            </div>
          </StepSection>

          <TrackingSection {...props} />
          <GoalSection {...props} />
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
            Content preview
          </p>
          <div className="mt-2.5">
            <ChannelPreview
              draft={draft}
              derived={derived}
              device={props.preview.device}
              onDeviceChange={props.preview.setDevice}
              platform={props.preview.platform}
              onPlatformChange={props.preview.setPlatform}
            />
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {blockers.length === 0 && warnings.length === 0
              ? "Everything checks out."
              : `${blockers.length} blocker${
                  blockers.length === 1 ? "" : "s"
                }, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function ValidationPanel({ issues, goTo }: StepProps) {
  const blockers = blockersIn(issues);
  const warnings = warningsIn(issues);

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-panel border border-success/25 bg-success-soft px-4 py-3.5">
        <CheckCircle2 className="size-5 shrink-0 text-success-text" aria-hidden />
        <div>
          <p className="text-sm font-bold text-success-text">Ready to send</p>
          <p className="text-sm font-medium text-text-secondary">
            Every pre-flight check passed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-panel border px-4 py-3.5",
        blockers.length > 0
          ? "border-error/25 bg-error-soft"
          : "border-warning/30 bg-warning-soft",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-sm font-bold",
          blockers.length > 0 ? "text-error-text" : "text-warning-text",
        )}
      >
        {blockers.length > 0 ? (
          <AlertCircle className="size-4" aria-hidden />
        ) : (
          <TriangleAlert className="size-4" aria-hidden />
        )}
        {issues.length} issue{issues.length === 1 ? "" : "s"} need
        {issues.length === 1 ? "s" : ""} attention
        {blockers.length > 0 ? ` · ${blockers.length} blocking` : ""}
      </p>

      <ul className="mt-3 space-y-1.5">
        {[...blockers, ...warnings].map((issue) => (
          <li key={issue.id}>
            <button
              type="button"
              onClick={() => goTo(issue.step)}
              className="flex w-full items-start gap-2.5 rounded-panel border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
            >
              <Badge
                tone={issue.level === "blocker" ? "danger" : "warning"}
                size="sm"
                className="mt-0.5 shrink-0"
              >
                {issue.level === "blocker" ? "Blocking" : "Check"}
              </Badge>
              <span className="min-w-0 flex-1 text-sm font-medium text-text-secondary">
                {issue.message}
              </span>
              <ChevronRight
                className="mt-0.5 size-4 shrink-0 text-text-muted"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

function TrackingSection({ draft, set, derived }: StepProps) {
  const tracking = draft.tracking;
  const patch = (next: Partial<typeof tracking>) =>
    set("tracking", { ...tracking, ...next });

  const patchUtm = (next: Partial<UtmParams>) =>
    /* Any manual edit stops the channel defaults from writing over this again.
       The flag is per-campaign, not per-field — someone who set a source meant
       to own the whole tagging scheme. */
    patch({ utm: { ...tracking.utm, ...next }, utmTouched: true });

  const suggestedSource = utmSourceFor(draft.channel, derived.platforms);

  return (
    <StepSection
      title="Tracking"
      hint="Decides what this campaign can report on afterwards."
    >
      <div className="space-y-2.5">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-panel border border-border px-3.5 py-3">
            <CheckboxField
              id="trk-clicks"
              checked={tracking.clicks}
              onCheckedChange={(next) => patch({ clicks: next })}
              label="Track clicks"
              hint="Rewrites links so opens and clicks can be attributed."
            />
          </div>
          <div className="rounded-panel border border-border px-3.5 py-3">
            <CheckboxField
              id="trk-conversions"
              checked={tracking.conversions}
              onCheckedChange={(next) => patch({ conversions: next })}
              label="Track conversions"
              hint="Counts the goal below against this campaign."
            />
          </div>
          <div className="rounded-panel border border-border px-3.5 py-3">
            <CheckboxField
              id="trk-attribution"
              checked={tracking.attribution}
              onCheckedChange={(next) => patch({ attribution: next })}
              label="Campaign attribution"
              hint="Credits this campaign for conversions within the attribution window."
            />
          </div>
          <div className="rounded-panel border border-border px-3.5 py-3">
            <CheckboxField
              id="trk-revenue"
              checked={tracking.revenue}
              onCheckedChange={(next) => patch({ revenue: next })}
              label="Revenue attribution"
              hint="Carries order value back onto the campaign report."
            />
          </div>
        </div>

        <div className="rounded-panel border border-border px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-text-secondary">UTM parameters</p>
            {tracking.utmTouched ? (
              <button
                type="button"
                onClick={() =>
                  set("tracking", {
                    ...tracking,
                    utmTouched: false,
                    utm: {
                      ...tracking.utm,
                      source: suggestedSource,
                      medium: UTM_MEDIUM[draft.channel],
                    },
                  })
                }
                className="text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
              >
                Reset to channel defaults
              </button>
            ) : (
              <span className="text-sm font-medium text-text-muted">
                Following the channel
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Source" htmlFor="utm-source">
              <Input
                id="utm-source"
                size="sm"
                value={tracking.utm.source}
                onChange={(event) => patchUtm({ source: event.target.value })}
              />
            </Field>
            <Field label="Medium" htmlFor="utm-medium">
              <Input
                id="utm-medium"
                size="sm"
                value={tracking.utm.medium}
                onChange={(event) => patchUtm({ medium: event.target.value })}
              />
            </Field>
            <Field label="Campaign" htmlFor="utm-campaign">
              <Input
                id="utm-campaign"
                size="sm"
                value={tracking.utm.campaign}
                onChange={(event) => patchUtm({ campaign: event.target.value })}
              />
            </Field>
            <Field label="Content" htmlFor="utm-content">
              <Input
                id="utm-content"
                size="sm"
                value={tracking.utm.content}
                placeholder={derived.isSocial ? "e.g. story-link" : "e.g. hero-cta"}
                onChange={(event) => patchUtm({ content: event.target.value })}
              />
            </Field>
          </div>

          {derived.isSocial && derived.platforms.length > 1 ? (
            <p className="mt-2.5 text-sm font-medium text-text-muted">
              Several platforms are selected, so each published post carries its
              own <code className="font-mono">utm_source</code> —{" "}
              {derived.platforms.join(", ")}.
            </p>
          ) : null}
        </div>
      </div>
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Goal                                                                       */
/* -------------------------------------------------------------------------- */

function GoalSection({ draft, set }: StepProps) {
  return (
    <StepSection
      title="Conversion goal"
      hint="Optional. The single event this campaign is judged on."
    >
      <Field label="Goal" htmlFor="cmp-goal">
        <Select
          id="cmp-goal"
          label="Goal"
          hideLabel={false}
          value={draft.goal}
          onChange={(next) => set("goal", next as CampaignGoal)}
          options={CAMPAIGN_GOALS}
        />
      </Field>
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary values                                                             */
/* -------------------------------------------------------------------------- */

function SenderSummary({ draft, derived }: StepProps) {
  if (draft.channel === "whatsapp") {
    const connection = WHATSAPP_CONNECTIONS.find(
      (item) => item.id === draft.sender.whatsappConnectionId,
    );
    const number = connection?.numbers.find(
      (item) => item.id === draft.sender.whatsappNumberId,
    );
    return <>{number?.label ?? "Not set"}</>;
  }

  if (draft.channel === "email") {
    return <>{draft.sender.emailFrom || "Not set"}</>;
  }

  if (draft.channel === "sms") {
    return <>{draft.sender.smsSenderId || "Not set"}</>;
  }

  return (
    <>
      {derived.accounts.length === 0
        ? "No accounts"
        : derived.accounts.map((account) => account.name).join(", ")}
    </>
  );
}

function AudienceSummary({ derived }: StepProps) {
  if (derived.isSocial) {
    return (
      <>
        {derived.accounts.length} account
        {derived.accounts.length === 1 ? "" : "s"} ·{" "}
        {formatNumber(derived.potentialReach)} followers
      </>
    );
  }

  return (
    <>
      {derived.audienceLabel} · {formatNumber(derived.audienceSize)} contacts
    </>
  );
}

function ScheduleSummary({ draft, derived }: StepProps) {
  if (draft.sendMode === "now") {
    return <>{derived.isSocial ? "Publish on launch" : "Immediately on launch"}</>;
  }

  const zone = draft.useRecipientTimezone
    ? "in each recipient's timezone"
    : draft.timezone;

  return (
    <>
      {draft.date || "—"} at {draft.time} ({zone})
    </>
  );
}
