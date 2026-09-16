"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, Send } from "lucide-react";

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
import { clearWizard, loadWizard, saveWizard } from "./draft-storage";
import { saveCampaign, successMessage, type SubmitMode } from "./submit";
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

/* A store that never changes — `useSyncExternalStore` is being used purely
   for its server/client split, not to subscribe to anything. */
const subscribeToNothing = () => () => {};

const stepIndex = (step: WizardStep) =>
  STEPS.findIndex((item) => item.value === step);

/**
 * Blockers already rendered beside the field they are about.
 *
 * The list above the nav is for problems with nowhere else to appear — an
 * unverified WhatsApp connection, a sender ID the provider will not accept.
 * Anything already marked on its own input is left to that input.
 */
const INLINE_ISSUE_IDS = new Set([
  "name",
  "message",
  "email-subject",
  "date",
  "past-date",
  "days",
  "social-account",
]);

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

  /* Continue's reasons for refusing, revealed only after someone has tried it.
     Listing what is missing before anyone has typed would be nagging. */
  const [showStepIssues, setShowStepIssues] = useState(false);

  /* One submission at a time, and the button says which one is in flight. */
  const [submitting, setSubmitting] = useState<SubmitMode | null>(null);
  const [submitError, setSubmitError] = useState("");

  /* Nothing is written back to storage until the restore has run, or the first
     render would overwrite a saved draft with the empty one. */
  const [restored, setRestored] = useState(false);

  /* Preview controls live here rather than in a step: choosing "mobile" on the
     Content step and finding it reset on Review is the kind of small betrayal
     that makes a wizard feel disposable. */
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");

  const step = STEPS[index].value;

  /*
   * Restore a draft left behind by a refresh.
   *
   * Reading storage in a lazy initialiser would hand the server one draft and
   * the browser another, which is a hydration mismatch. `useSyncExternalStore`
   * is the sanctioned way to ask "are we past hydration yet": it reports false
   * on the server and through the hydrating render, then true — so the restore
   * below runs on a render React already expects to differ.
   *
   * Adjusted during render rather than in an effect, the way the template
   * dialogs already do it: the values are there on the first painted frame,
   * and the wizard never flashes an empty form over a saved one.
   */
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  if (hydrated && !restored) {
    setRestored(true);
    const saved = loadWizard(STEPS.length);
    if (saved) {
      setDraft(saved.draft);
      setIndex(saved.index);
      setFurthest(saved.furthest);
    }
  }

  /* Writing to storage *is* the "update an external system" case effects are
     for, so this one stays an effect. Gated on `restored`, or the first render
     would flush the empty draft over the saved one before it was read. */
  useEffect(() => {
    if (!restored) return;
    saveWizard({ draft, index, furthest });
  }, [restored, draft, index, furthest]);

  const set = <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
    setDraft((prev) =>
      /* The campaign name doubles as the default `utm_campaign`, so the two
         stay in step until someone edits the UTM themselves. */
      key === "name"
        ? syncUtmCampaign(prev, value as string)
        : { ...prev, [key]: value },
    );
    setConfirmed(false);
    /* An edit is an answer to whatever Continue complained about, so the
       complaint goes away until it is asked again. */
    setShowStepIssues(false);
    setSubmitError("");
  };

  const setChannel = (channel: MarketingChannel) => {
    setDraft((prev) => applyChannel(prev, channel));
    setConfirmed(false);
    setErrors({});
    setShowStepIssues(false);
    setSubmitError("");
  };

  const derived = useMemo(() => deriveDraft(draft), [draft]);
  const issues = useMemo(() => preflight(draft, derived), [draft, derived]);
  const blockers = blockersIn(issues);

  /* Blockers this step is responsible for. They gate Continue, so a campaign
     cannot reach Review with a sender that was never configured — and because
     they come from `preflight`, the rule is written once and enforced twice. */
  const stepBlockers = blockers.filter((issue) => issue.step === step);

  function goTo(target: WizardStep) {
    const next = stepIndex(target);
    if (next < 0) return;
    setIndex(next);
    setFurthest((value) => Math.max(value, next));
    setShowStepIssues(false);
    setErrors({});
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
      } else if (blockers.some((issue) => issue.id === "past-date")) {
        next.date = "That time has already passed.";
      }
      if (draft.allowedDays.length === 0) {
        next.allowedDays = "Leave at least one day switched on.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    const fieldsOk = validateStep();
    if (!fieldsOk || stepBlockers.length > 0) {
      setShowStepIssues(true);
      return;
    }

    setShowStepIssues(false);
    const target = Math.min(index + 1, STEPS.length - 1);
    setIndex(target);
    setFurthest((value) => Math.max(value, target));
  }

  /**
   * Save or launch.
   *
   * Draft mode skips every check by design — someone pulled away mid-sentence
   * should keep what they have written, and a save that demands a valid sender
   * is a save that loses work. Launch has already been gated by the Send step's
   * confirmation and the pre-flight blockers.
   */
  async function submit(mode: SubmitMode) {
    /* The guard, not just the disabled attribute: a double-click can land two
       events before React re-renders the button. */
    if (submitting) return;

    setSubmitting(mode);
    setSubmitError("");

    try {
      await saveCampaign(draft, mode);
      /* Cleared before navigating, or coming back to /new would restore a
         campaign that has already been sent. */
      clearWizard();
      toast(successMessage(draft, mode), "success");
      router.push(APP_ROUTES.marketingCampaigns);
      /* `submitting` is deliberately left set: the component is on its way out,
         and releasing the buttons during the route transition would re-open the
         window for a second submission. */
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. The campaign was not saved.",
      );
      toast("Could not save the campaign", "error");
      setSubmitting(null);
    }
  }

  /* Blockers that already have a message against the field they belong to.
     Repeating those in the list above the nav would say the same thing twice. */
  const visibleStepIssues = stepBlockers.filter(
    (issue) => !INLINE_ISSUE_IDS.has(issue.id),
  );

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

      {/* --------------------------------------------- Why Continue refused */}
      {showStepIssues && visibleStepIssues.length > 0 ? (
        <div
          role="alert"
          className="mt-5 rounded-panel border border-error/25 bg-error-soft px-3.5 py-3"
        >
          <p className="text-sm font-bold text-error-text">
            Finish this step before continuing
          </p>
          <ul className="mt-1.5 space-y-1">
            {visibleStepIssues.map((issue) => (
              <li key={issue.id} className="text-sm font-medium text-error-text">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="mt-5 rounded-panel border border-error/25 bg-error-soft px-3.5 py-2.5 text-sm font-medium text-error-text"
        >
          {submitError}
        </p>
      ) : null}

      {/* ------------------------------------------------------------ Nav */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
        <Button
          variant="outline"
          size="compact"
          disabled={index === 0 || submitting !== null}
          onClick={() => {
            setIndex((value) => Math.max(value - 1, 0));
            setShowStepIssues(false);
            setErrors({});
          }}
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
            disabled={submitting !== null}
            onClick={() => submit("draft")}
          >
            {submitting === "draft" ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save Draft"
            )}
          </Button>

          {step === "send" ? (
            <Button
              size="compact"
              disabled={!confirmed || blockers.length > 0 || submitting !== null}
              onClick={() => submit("launch")}
            >
              {submitting === "launch" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  {draft.sendMode === "later" ? "Scheduling…" : "Sending…"}
                </>
              ) : draft.sendMode === "later" ? (
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
            <Button
              size="compact"
              disabled={submitting !== null}
              onClick={goNext}
            >
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
    /* `py-1` keeps the focus ring off the scroll container's clip edge — with
       `overflow-x-auto` the browser clips vertically too, and a ring drawn at
       the button's exact bounds loses its top and bottom. */
    <ol className="flex items-center gap-1 overflow-x-auto py-1">
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
                /* Every state carries a border, transparent where it is not
                   wanted, so the active pill cannot nudge its neighbours by a
                   pixel when the selection moves. */
                "inline-flex items-center gap-2.5 rounded-lg border px-3 py-1.5 transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                current
                  ? "border-primary-border bg-primary-soft"
                  : reachable
                    ? "border-transparent hover:bg-surface-secondary"
                    : "cursor-not-allowed border-transparent",
              )}
            >
              <span
                className={cn(
                  "grid size-5.5 shrink-0 place-items-center rounded-full border text-xs font-bold tabular-nums leading-none",
                  current
                    ? "border-primary bg-primary text-white"
                    : done
                      ? "border-primary-border bg-primary-soft text-primary"
                      : reachable
                        ? "border-border bg-surface-secondary text-text-secondary"
                        : "border-border bg-surface-secondary text-text-muted",
                )}
              >
                {done ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : (
                  index + 1
                )}
              </span>

              {/* Three weights, three inks: the step you are on, the ones you
                  have finished, and the ones ahead. A label that reads at the
                  same strength in all three states is a stepper that tells you
                  nothing about where you are. */}
              <span
                className={cn(
                  "text-base font-medium whitespace-nowrap leading-none",
                  current
                    ? "font-semibold text-text-primary"
                    : done
                      ? "font-medium text-text-primary"
                      : reachable
                        ? "font-medium text-text-secondary"
                        : "font-medium text-text-muted",
                )}
              >
                {step.label}
              </span>
            </button>

            {index < STEPS.length - 1 ? (
              <ChevronRight
                className="ml-2 size-5 shrink-0 text-text-muted"
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
