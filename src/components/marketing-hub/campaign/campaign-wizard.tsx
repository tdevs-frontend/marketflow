"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import type { CampaignDraft, MarketingChannel, WizardStep } from "@/types/marketing";
import type { SocialPlatform } from "@/types/social";
import {
  EMPTY_DRAFT,
  applyChannel,
  deriveDraft,
  syncUtmCampaign,
} from "./draft";
import { DetailsStep } from "./step-details";
import { AudienceStep } from "./step-audience";
import { ContentStep } from "./step-content";
import { PersonaliseStep } from "./step-personalise";
import { ScheduleStep } from "./step-schedule";
import { ReviewStep } from "./step-review";
import { SendStep } from "./step-send";
import type { StepProps } from "./types";
import { blockersIn, preflight } from "./validation";

/**
 * The campaign wizard.
 *
 * Seven steps, unchanged, because they are the right seven: what it is, who
 * gets it, what it says, how it is personalised, when it sends, a check, and a
 * confirmation. What changed is the depth of each — sender configuration,
 * exclusions and eligibility, a per-channel composer, tracking and validation.
 *
 * This file owns the draft and nothing else. Each step renders part of it and
 * writes back through `set`; everything computed from the draft is derived on
 * every render rather than stored, so the recipient count on the Send step
 * cannot disagree with the one on the Audience step.
 *
 * Deliberately not a workflow builder. A campaign is one message to one
 * audience at one time — the moment it needs "and then, three days later", it
 * belongs in Automation, which is built for exactly that.
 */

const STEPS: { value: WizardStep; label: string }[] = [
  { value: "campaign", label: "Details" },
  { value: "audience", label: "Audience" },
  { value: "content", label: "Content" },
  { value: "personalization", label: "Personalise" },
  { value: "schedule", label: "Schedule" },
  { value: "review", label: "Review" },
  { value: "send", label: "Send" },
];

const stepIndex = (step: WizardStep) =>
  STEPS.findIndex((item) => item.value === step);

export function CampaignWizard() {
  const router = useRouter();
  const toast = useToast();

  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /* The send step asks for one explicit confirmation. Reset whenever the draft
     changes, so a tick made before an edit never carries over. */
  const [confirmed, setConfirmed] = useState(false);

  /* Preview controls live here rather than in a step: choosing "mobile" on the
     Content step and finding it reset on Review is the kind of small betrayal
     that makes a wizard feel disposable. */
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");

  const step = STEPS[index].value;

  const set = <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
    setDraft((prev) =>
      /* The campaign name doubles as the default `utm_campaign`, so the two
         stay in step until someone edits the UTM themselves. */
      key === "name"
        ? syncUtmCampaign(prev, value as string)
        : { ...prev, [key]: value },
    );
    setConfirmed(false);
  };

  const setChannel = (channel: MarketingChannel) => {
    setDraft((prev) => applyChannel(prev, channel));
    setConfirmed(false);
    setErrors({});
  };

  const derived = useMemo(() => deriveDraft(draft), [draft]);
  const issues = useMemo(() => preflight(draft, derived), [draft, derived]);
  const blockers = blockersIn(issues);

  function goTo(target: WizardStep) {
    const next = stepIndex(target);
    if (next < 0) return;
    setIndex(next);
    setFurthest((value) => Math.max(value, next));
  }

  /**
   * Each step gates the next.
   *
   * Only the blockers that belong to *this* step are enforced here — the full
   * pre-flight runs on Review. Blocking Continue on an empty UTM field while
   * someone is still writing the message would be the wizard arguing with the
   * order it asked the questions in.
   */
  function validateStep(): boolean {
    const next: Record<string, string> = {};

    if (step === "campaign") {
      if (!draft.name.trim()) next.name = "Name the campaign.";
      if (draft.channel === "social" && draft.socialAccountIds.length === 0) {
        next.socialAccountIds = "Pick at least one account to publish to.";
      }
    }

    if (
      step === "audience" &&
      !derived.isSocial &&
      draft.segment === "custom" &&
      !draft.savedSegmentId
    ) {
      /* "Custom" means "not decided yet", so it only blocks when no saved
         segment has been chosen either. */
      next.segment = "Pick a saved segment, or choose a built-in audience.";
    }

    if (step === "content") {
      if (draft.channel === "email" && !draft.subject.trim()) {
        next.subject = "Enter a subject line.";
      }
      if (!draft.message.trim()) {
        next.message = derived.isSocial
          ? "Write the post."
          : "Write the message.";
      }
    }

    if (step === "schedule") {
      if (draft.sendMode === "later" && !draft.date) {
        next.date = "Pick a send date.";
      }
      if (draft.allowedDays.length === 0) {
        next.allowedDays = "Leave at least one day switched on.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    const target = Math.min(index + 1, STEPS.length - 1);
    setIndex(target);
    setFurthest((value) => Math.max(value, target));
  }

  function finish(message: string) {
    toast(message);
    router.push(APP_ROUTES.marketingCampaigns);
  }

  const stepProps: StepProps = {
    draft,
    set,
    setChannel,
    errors,
    derived,
    issues,
    goTo,
    preview: { device, setDevice, platform, setPlatform },
  };

  return (
    <Card className="p-5">
      <Stepper active={index} furthest={furthest} onJump={setIndex} />

      <div className="mt-6 border-t border-border pt-6">
        {step === "campaign" ? <DetailsStep {...stepProps} /> : null}
        {step === "audience" ? <AudienceStep {...stepProps} /> : null}
        {step === "content" ? <ContentStep {...stepProps} /> : null}
        {step === "personalization" ? <PersonaliseStep {...stepProps} /> : null}
        {step === "schedule" ? <ScheduleStep {...stepProps} /> : null}
        {step === "review" ? <ReviewStep {...stepProps} /> : null}
        {step === "send" ? (
          <SendStep
            {...stepProps}
            confirmed={confirmed}
            onConfirm={setConfirmed}
          />
        ) : null}
      </div>

      {/* ------------------------------------------------------------ Nav */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
        <Button
          variant="outline"
          size="compact"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(value - 1, 0))}
        >
          <ChevronLeft aria-hidden />
          Back
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          {/* A draft is a save, not a submission — it never runs validation.
              Someone interrupted halfway through the audience step should be
              able to leave with what they have. */}
          <Button
            variant="outline"
            size="compact"
            onClick={() => finish("Campaign saved as draft")}
          >
            Save Draft
          </Button>

          {step === "send" ? (
            <Button
              size="compact"
              disabled={!confirmed || blockers.length > 0}
              onClick={() =>
                finish(
                  draft.sendMode === "later"
                    ? "Campaign scheduled successfully"
                    : derived.isSocial
                      ? "Campaign published successfully"
                      : "Campaign launched successfully",
                )
              }
            >
              {draft.sendMode === "later" ? (
                <>
                  <Clock aria-hidden />
                  Schedule Campaign
                </>
              ) : (
                <>
                  <Send aria-hidden />
                  {derived.isSocial ? "Publish Campaign" : "Send Campaign"}
                </>
              )}
            </Button>
          ) : (
            <Button size="compact" onClick={goNext}>
              Continue
              <ChevronRight aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

function Stepper({
  active,
  furthest,
  onJump,
}: {
  active: number;
  furthest: number;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((step, index) => {
        const done = index < furthest;
        const current = index === active;
        /* Only steps already reached are clickable — jumping ahead would skip
           the validation that gates each one. */
        const reachable = index <= furthest;

        return (
          <li key={step.value} className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => reachable && onJump(index)}
              disabled={!reachable}
              aria-current={current ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-btn px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                current
                  ? "bg-primary-soft text-primary-dark"
                  : reachable
                    ? "text-text-secondary hover:bg-surface-secondary"
                    : "cursor-not-allowed text-text-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  current
                    ? "bg-primary text-white"
                    : done
                      ? "bg-primary-soft text-primary"
                      : "bg-surface-secondary text-text-muted",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : index + 1}
              </span>
              <span className="whitespace-nowrap">{step.label}</span>
            </button>

            {index < STEPS.length - 1 ? (
              <ChevronRight
                className="size-4 shrink-0 text-border-strong"
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
