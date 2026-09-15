"use client";

import { Share2, ShieldCheck, TriangleAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CheckboxField } from "@/components/ui/checkbox";
import { PlatformMark } from "../shared/channel-badge";
import {
  ELIGIBILITY_RULE,
  EXCLUDABLE_TAGS,
  EXCLUSION_OPTIONS,
} from "@/lib/campaign-fixtures";
import { AUDIENCES } from "@/lib/marketing-fixtures";
import { SEGMENTS, segmentsForChannel } from "@/lib/segment-fixtures";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AudienceSegment, ExclusionRule } from "@/types/marketing";
import { OptionCard, StepSection, TagPicker } from "./shared";
import type { StepProps } from "./types";

/**
 * Step 2 — who receives this, and who deliberately does not.
 *
 * The exclusion half is the reason this step is worth more than a dropdown. A
 * campaign that goes to everyone who matches a segment is one that goes to
 * people who unsubscribed last week, customers who already bought the thing
 * being advertised, and contacts who got a different campaign an hour ago. The
 * estimate at the bottom is the honest total after all of that.
 */

export function AudienceStep(props: StepProps) {
  return props.derived.isSocial ? <SocialAudience {...props} /> : <ContactAudience {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Messaging channels                                                         */
/* -------------------------------------------------------------------------- */

function ContactAudience(props: StepProps) {
  const { draft, set, errors, derived } = props;

  const savedSegments = segmentsForChannel(derived.messagingChannel);
  const exclusions = draft.exclusions;
  const patch = (next: Partial<typeof exclusions>) =>
    set("exclusions", { ...exclusions, ...next });

  return (
    <div className="space-y-5">
      <StepSection title="Who receives this campaign">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {AUDIENCES.map((item) => (
            <OptionCard
              key={item.value}
              selected={!draft.savedSegmentId && draft.segment === item.value}
              onClick={() => {
                set("segment", item.value as AudienceSegment);
                /* One answer to "who receives this": choosing here drops any
                   saved segment below. */
                set("savedSegmentId", "");
              }}
              title={item.label}
              hint={item.hint}
              trailing={
                <span className="text-sm font-bold text-text-primary tabular-nums">
                  {item.size > 0 ? formatNumber(item.size) : "—"}
                </span>
              }
            />
          ))}
        </div>
        {errors.segment ? (
          <p className="mt-2 text-sm text-error">{errors.segment}</p>
        ) : null}
      </StepSection>

      <StepSection
        title="Saved segments"
        hint={`Built in Audience Segments and reusable across channels. Only segments that can reach ${derived.channelLabel} are listed.`}
      >
        {savedSegments.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border px-3.5 py-4 text-center text-sm text-text-muted">
            None of your segments carry enough {derived.channelLabel} data to
            send to. Build one in Audience Segments, or pick a built-in audience
            above.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {savedSegments.map((item) => (
              <OptionCard
                key={item.id}
                selected={draft.savedSegmentId === item.id}
                onClick={() =>
                  /* Toggling off returns the choice to the built-in audience
                     rather than leaving nothing selected. */
                  set("savedSegmentId", draft.savedSegmentId === item.id ? "" : item.id)
                }
                title={item.name}
                hint={item.description}
                trailing={
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {formatNumber(item.contacts)}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </StepSection>

      {/* ------------------------------------------------------- Exclusions */}
      <StepSection
        title="Exclusions"
        hint="Removed from this send, whatever the audience above says."
      >
        <div className="space-y-2.5">
          {EXCLUSION_OPTIONS.map((option) => {
            const on = option.locked || exclusions.rules.includes(option.value);

            return (
              <div
                key={option.value}
                className={cn(
                  "rounded-panel border px-3.5 py-3",
                  on ? "border-border bg-surface-secondary" : "border-border",
                )}
              >
                <CheckboxField
                  id={`exc-${option.value}`}
                  checked={on}
                  disabled={option.locked}
                  onCheckedChange={(next) =>
                    patch({
                      rules: next
                        ? [...exclusions.rules, option.value]
                        : exclusions.rules.filter(
                            (rule: ExclusionRule) => rule !== option.value,
                          ),
                    })
                  }
                  label={option.label}
                  hint={
                    option.locked
                      ? `${option.hint} — always applied`
                      : option.hint
                  }
                />
              </div>
            );
          })}
        </div>
      </StepSection>

      <StepSection
        title="Exclude a segment"
        hint="Everyone in these segments is removed, even if they match the audience."
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SEGMENTS.filter((item) => item.id !== draft.savedSegmentId).map((item) => {
            const on = exclusions.segmentIds.includes(item.id);

            return (
              <OptionCard
                key={item.id}
                selected={on}
                onClick={() =>
                  patch({
                    segmentIds: on
                      ? exclusions.segmentIds.filter((id: string) => id !== item.id)
                      : [...exclusions.segmentIds, item.id],
                  })
                }
                title={item.name}
                hint={item.description}
                trailing={
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    −{formatNumber(item.contacts)}
                  </span>
                }
              />
            );
          })}
        </div>
      </StepSection>

      <StepSection title="Exclude a tag">
        <TagPicker
          options={EXCLUDABLE_TAGS}
          selected={exclusions.tags}
          onChange={(next) => patch({ tags: next })}
          emptyLabel="No tags excluded"
        />
      </StepSection>

      <EligibilityPanel {...props} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Eligibility                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The live estimate: who is in, who was removed, and who could never receive.
 *
 * Three numbers rather than one, because they have three different fixes.
 * Excluded is a choice this screen made. Invalid is a data problem that no
 * campaign setting can solve. Eligible is what will actually be sent — and it
 * is the only number the Send step is allowed to quote.
 */
function EligibilityPanel({ derived }: StepProps) {
  const { eligibility, channelLabel, messagingChannel } = derived;

  return (
    <div className="rounded-panel border border-primary-border bg-primary-subtle px-4 py-4">
      <p className="flex items-center gap-2 text-sm font-bold text-primary-dark">
        <Users className="size-4" aria-hidden />
        Estimated recipients
      </p>

      <dl className="mt-3 grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-panel border border-border bg-surface px-3.5 py-3">
          <dt className="text-sm font-medium text-text-muted">In audience</dt>
          <dd className="mt-1 text-lg leading-none font-bold text-text-primary tabular-nums">
            {formatNumber(eligibility.total)}
          </dd>
        </div>
        <div className="rounded-panel border border-border bg-surface px-3.5 py-3">
          <dt className="text-sm font-medium text-text-muted">Excluded</dt>
          <dd className="mt-1 text-lg leading-none font-bold text-warning-text tabular-nums">
            {formatNumber(eligibility.excluded)}
          </dd>
        </div>
        <div className="rounded-panel border border-border bg-surface px-3.5 py-3">
          <dt className="text-sm font-medium text-text-muted">
            Invalid for {channelLabel}
          </dt>
          <dd className="mt-1 text-lg leading-none font-bold text-error-text tabular-nums">
            {formatNumber(eligibility.invalid)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-base font-medium text-text-secondary">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
        <strong className="font-bold text-text-primary tabular-nums">
          {formatNumber(eligibility.eligible)}
        </strong>
        eligible contacts will receive this campaign.
      </p>

      <p className="mt-1.5 flex items-start gap-2 text-sm font-medium text-text-muted">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {ELIGIBILITY_RULE[messagingChannel]} Ineligible contacts are never
        silently included.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Social has no recipients, so it reports accounts instead.
 *
 * Showing a contact count here would be the single most misleading number in
 * the wizard: a post does not go to 8,420 people, it goes to three pages whose
 * followers may or may not see it. Follower total is labelled "potential
 * reach" and nothing else, because that is all the integration actually knows.
 */
function SocialAudience({ derived, goTo }: StepProps) {
  if (derived.accounts.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center">
        <Share2 className="mx-auto size-6 text-text-muted" aria-hidden />
        <p className="mt-2 text-sm font-medium text-text-primary">
          No social accounts selected
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
          A social campaign publishes to the accounts you pick on the Details
          step, not to a contact segment.
        </p>
        <button
          type="button"
          onClick={() => goTo("campaign")}
          className="mt-3 text-sm font-bold text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
        >
          Back to details
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StepSection
        title="Publishing to"
        hint="A social campaign publishes to accounts. There is no contact list behind it, and no per-recipient delivery."
      >
        <ul className="space-y-2.5">
          {derived.accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-3 rounded-panel border border-border px-3.5 py-3"
            >
              <PlatformMark platform={account.platform} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text-primary">
                  {account.name}
                </span>
                <span className="block truncate text-sm font-medium text-text-muted">
                  {account.username} · {account.accountType}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                {formatNumber(account.followers)}
              </span>
            </li>
          ))}
        </ul>
      </StepSection>

      <div className="rounded-panel border border-primary-border bg-primary-subtle px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-primary-dark">
          <Share2 className="size-4" aria-hidden />
          {derived.accounts.length} social account
          {derived.accounts.length === 1 ? "" : "s"} selected
        </p>
        <p className="mt-1.5 text-base font-medium text-text-secondary">
          Potential reach{" "}
          <strong className="font-bold text-text-primary tabular-nums">
            {formatNumber(derived.potentialReach)}
          </strong>{" "}
          followers across{" "}
          {derived.platforms.length === 1
            ? "one platform"
            : `${derived.platforms.length} platforms`}
          .
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-text-muted">
          <Badge tone="neutral" size="sm">
            Estimate
          </Badge>
          Followers, not impressions. Actual reach comes back from each platform
          after publishing.
        </p>
      </div>
    </div>
  );
}
