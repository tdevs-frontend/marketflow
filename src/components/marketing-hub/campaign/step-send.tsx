"use client";

import { useState } from "react";
import { AlertCircle, Clock, Eye, Send, TestTube2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatTile, WarningNote } from "./shared";
import type { StepProps } from "./types";
import { blockersIn } from "./validation";

/**
 * Step 7 - the last screen before something irreversible.
 *
 * It states the consequence in plain numbers rather than restating the form,
 * and it offers a test send first. The test is the only thing on this screen
 * that is safe to click twice, which is exactly why it sits next to the one
 * that is not.
 */

export function SendStep({
  draft,
  derived,
  issues,
  confirmed,
  onConfirm,
  goTo,
}: StepProps & {
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
}) {
  const blockers = blockersIn(issues);
  const [testOpen, setTestOpen] = useState(false);

  const scheduled = draft.sendMode === "later";
  const noun = derived.isSocial ? "publish" : "send";

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-panel border px-4 py-4",
          blockers.length > 0
            ? "border-error/25 bg-error-soft"
            : "border-primary-border bg-primary-subtle",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-bold",
            blockers.length > 0 ? "text-error-text" : "text-primary-dark",
          )}
        >
          {blockers.length > 0 ? (
            <AlertCircle className="size-4" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {blockers.length > 0
            ? `${blockers.length} issue${
                blockers.length === 1 ? "" : "s"
              } must be fixed before this can ${noun}`
            : scheduled
              ? `Ready to schedule for ${draft.date || "-"}`
              : `Ready to ${noun} now`}
        </p>

        <p className="mt-1.5 text-base font-medium text-text-secondary">
          {derived.isSocial ? (
            <>
              This post publishes to{" "}
              <span className="font-bold text-text-primary">
                {derived.accounts.length} account
                {derived.accounts.length === 1 ? "" : "s"}
              </span>{" "}
              across {derived.platforms.join(", ") || "-"}
              {scheduled ? ` at ${draft.time} ${draft.timezone}.` : " as soon as you launch."}
            </>
          ) : (
            <>
              <span className="font-bold text-text-primary tabular-nums">
                {formatNumber(derived.eligibility.eligible)}
              </span>{" "}
              eligible contacts in{" "}
              <span className="font-medium text-text-primary">
                {derived.audienceLabel}
              </span>{" "}
              will receive this {derived.channelLabel} message
              {scheduled
                ? ` at ${draft.time} ${
                    draft.useRecipientTimezone
                      ? "in their own timezone."
                      : draft.timezone + "."
                  }`
                : " as soon as you launch."}
            </>
          )}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={derived.isSocial ? "Accounts" : "Recipients"}
          value={formatNumber(derived.recipients)}
        />
        {derived.isSocial ? (
          <StatTile
            label="Potential reach"
            value={formatNumber(derived.potentialReach)}
          />
        ) : (
          <StatTile
            label="Excluded"
            value={formatNumber(
              derived.eligibility.excluded + derived.eligibility.invalid,
            )}
            tone={
              derived.eligibility.excluded + derived.eligibility.invalid > 0
                ? "warning"
                : "neutral"
            }
          />
        )}
        <StatTile
          label={
            draft.channel === "sms"
              ? "Billed segments"
              : derived.isSocial
                ? "Attached media"
                : "Merge tags"
          }
          value={
            draft.channel === "sms"
              ? formatNumber(derived.smsSegmentCount * derived.recipients)
              : derived.isSocial
                ? String(draft.mediaIds.length)
                : String(derived.mergeTags.length)
          }
        />
      </dl>

      {/* ------------------------------------------------------------ Test */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-panel border border-border px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-secondary">
            {derived.isSocial ? "Preview before publishing" : "Send a test first"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-text-muted">
            {derived.isSocial
              ? "Publishes nothing. Opens the post exactly as each platform will render it."
              : "Goes to one address of your choosing, never to the audience."}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}>
          {derived.isSocial ? <Eye aria-hidden /> : <TestTube2 aria-hidden />}
          {derived.isSocial ? "Preview Campaign" : "Send Test"}
        </Button>
      </div>

      {blockers.length > 0 ? (
        <div className="rounded-panel border border-error/25 bg-error-soft px-3.5 py-3">
          <p className="text-sm font-bold text-error-text">
            Fix these before launching
          </p>
          <ul className="mt-2 space-y-1.5">
            {blockers.map((issue) => (
              <li key={issue.id}>
                <Button
                  type="button"
                  onClick={() => goTo(issue.step)}
                  variant="link"
                  size="inline"
                  className="rounded-none text-left text-error-text"
                >
                  {issue.message}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {derived.missingFallbacks.length > 0 ? (
        <WarningNote>
          {derived.missingFallbacks.length} merge tag
          {derived.missingFallbacks.length === 1 ? "" : "s"} still{" "}
          {derived.missingFallbacks.length === 1 ? "has" : "have"} no fallback:{" "}
          {derived.missingFallbacks.map((tag) => `{{${tag}}}`).join(", ")}.
        </WarningNote>
      ) : null}

      <CheckboxField
        id="send-confirm"
        checked={confirmed}
        disabled={blockers.length > 0}
        onCheckedChange={onConfirm}
        label={
          derived.isSocial
            ? scheduled
              ? `Schedule this post on ${derived.accounts.length} account${
                  derived.accounts.length === 1 ? "" : "s"
                }`
              : `Publish to ${derived.accounts.length} account${
                  derived.accounts.length === 1 ? "" : "s"
                } now`
            : scheduled
              ? `Schedule for ${formatNumber(
                  derived.eligibility.eligible,
                )} contacts`
              : `Send to ${formatNumber(
                  derived.eligibility.eligible,
                )} contacts immediately`
        }
        hint={
          derived.isSocial
            ? "A published post can be deleted, but not unseen."
            : "Messages already delivered cannot be recalled."
        }
      />

      <TestDialog
        open={testOpen}
        onClose={() => setTestOpen(false)}
        draft={draft}
        derived={derived}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Test send                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The test send, scoped so it cannot reach the audience.
 *
 * It asks for a destination rather than reusing the campaign's, and the copy
 * says so twice. The one genuinely dangerous mistake this dialog could make is
 * being mistaken for the real send, so its button never says "Send campaign".
 */
function TestDialog({
  open,
  onClose,
  draft,
  derived,
}: {
  open: boolean;
  onClose: () => void;
} & Pick<StepProps, "draft" | "derived">) {
  const toast = useToast();
  const [destination, setDestination] = useState("");

  const label =
    draft.channel === "email"
      ? "Test email address"
      : draft.channel === "sms"
        ? "Test mobile number"
        : "Test WhatsApp number";


  if (derived.isSocial) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Preview campaign"
        description="Social platforms have no test-publish, so this is a preview rather than a send."
        footer={
          <Button variant="outline" size="compact" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">
            The post below is rendered exactly as{" "}
            {derived.platforms.join(", ") || "each platform"} will publish it,
            including where the caption folds.
          </p>
          <p className="rounded-panel bg-surface-secondary px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
            {draft.message || "Nothing written yet."}
          </p>
          <p className="text-sm font-medium text-text-muted">
            Where a platform supports draft posts, launching with a schedule in
            the past publishes as a draft for review instead.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Send test"
      description="Goes to one destination only. The campaign audience is not touched."
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={!destination.trim()}
            onClick={() => {
              toast(`Test ${derived.channelLabel} sent to ${destination}`);
              onClose();
            }}
          >
            <TestTube2 aria-hidden />
            Send test
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label={label}
          htmlFor="test-destination"
          hint="Merge tags render with your fallback values, exactly as a recipient would see them."
        >
          <Input
            id="test-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </Field>

        <p className="flex items-start gap-2 rounded-panel bg-surface-secondary px-3.5 py-2.5 text-sm font-medium text-text-secondary">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
          A test ignores the schedule, quiet hours and the frequency cap - it
          sends immediately to the one address above.
        </p>
      </div>
    </Dialog>
  );
}
