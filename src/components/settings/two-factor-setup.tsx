"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Check, Copy, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useClipboard } from "@/components/integrations/credential-field";
import { TOTP_CONFIG } from "@/constants/settings";
import {
  CAPABILITIES,
  UNAVAILABLE_REASON,
  cancelTwoFactorEnrollment,
  startTwoFactorEnrollment,
  verifyTwoFactorEnrollment,
} from "@/lib/account-service";
import { useTwoFactorEnrollment } from "@/lib/account-store";
import { formatSetupKey, secondsRemaining } from "@/lib/totp";
import { cn } from "@/lib/utils";
import type { TwoFactorEnrollment } from "@/types/account";

import { QrCode } from "./qr-code";
import { RecoveryCodes } from "./recovery-codes";
import { ServiceNotice } from "./service-notice";

/**
 * Enrolling an authenticator, in the three steps the job actually has.
 *
 * Scan, verify, keep your recovery codes. Each is its own view rather than one
 * long scroll, because each ends with the person doing something on a different
 * device and coming back - and a step boundary is what tells them they have
 * finished one and started the next.
 *
 * The verification is real. `lib/totp` implements RFC 6238 over Web Crypto, so
 * a code from a mistyped secret is rejected here, thirty seconds after the
 * mistake, instead of at a sign-in three weeks later when the person has thrown
 * away the setup key. A flow that accepts any six digits has confirmed nothing
 * and has told the merchant it confirmed something - it is worse than no
 * verification step at all, because it manufactures confidence.
 *
 * What it cannot yet do is gate sign-in, and the notice on step one says so
 * plainly. "You can prove this authenticator is set up correctly" and "your
 * account is defended by it" are different claims, and only the first is true
 * until an account service holds the secret.
 */

type Step = "scan" | "verify" | "done";

/**
 * No `onEnabled` callback.
 *
 * The card that opens this dialog reads the same store, so activation reaches
 * it the moment the service commits - a notification prop would be a second
 * path to the same fact, and the kind that goes stale when somebody adds a
 * third caller.
 */
export function TwoFactorSetupDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("scan");
  const [codes, setCodes] = useState<string[]>([]);

  /*
   * The enrolment lives in the store, not in this component.
   *
   * Two things fall out of that. The dialog holds no copy to get out of step
   * with, so closing and reopening shows the same secret rather than minting a
   * second one while the first is half-typed into somebody's phone. And the
   * effect below has nothing to `setState` - it starts the request, the store
   * publishes the result, and the render follows.
   */
  const enrollment = useTwoFactorEnrollment();

  /* Minted when the dialog opens and only then: a secret created on page load
     is a credential that exists whether or not anybody wanted 2FA. */
  useEffect(() => {
    if (!open) return;
    void startTwoFactorEnrollment();
  }, [open]);

  function close() {
    /* Abandoning discards the secret rather than parking it. A half-finished
       enrolment left lying around is a credential nobody is tracking. */
    if (step !== "done") void cancelTwoFactorEnrollment();

    onClose();
    /* Reset after the close transition so the dialog does not visibly rewind. */
    setTimeout(() => {
      setStep("scan");
      setCodes([]);
    }, 200);
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      size={step === "done" ? "md" : "lg"}
      title={
        step === "scan"
          ? "Scan the QR code"
          : step === "verify"
            ? "Verify your authenticator"
            : "Two-factor authentication enabled"
      }
      description={
        step === "scan"
          ? "Step 1 of 3 - add MarketFlow to your authenticator app."
          : step === "verify"
            ? "Step 2 of 3 - prove the app is set up correctly."
            : "Step 3 of 3 - save your recovery codes somewhere safe."
      }
      footer={
        step === "scan" ? (
          <>
            <Button variant="outline" size="compact" onClick={close}>
              Cancel
            </Button>
            <Button
              size="compact"
              disabled={!enrollment}
              onClick={() => setStep("verify")}
            >
              Next
            </Button>
          </>
        ) : undefined
      }
    >
      {step === "scan" ? (
        <ScanStep enrollment={enrollment} />
      ) : step === "verify" ? (
        <VerifyStep
          onBack={() => setStep("scan")}
          onVerified={(recoveryCodes) => {
            setCodes(recoveryCodes);
            setStep("done");
          }}
        />
      ) : (
        <DoneStep codes={codes} onClose={close} />
      )}
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 - scan                                                              */
/* -------------------------------------------------------------------------- */

function ScanStep({ enrollment }: { enrollment: TwoFactorEnrollment | null }) {
  const { copied, copy } = useClipboard();

  if (!enrollment) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Preparing your setup key…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {!CAPABILITIES.twoFactorEnforced ? (
        <ServiceNotice tone="security" title="Sign-in is not gated by this yet">
          {UNAVAILABLE_REASON.twoFactorEnforced} Setting it up here is a real
          enrolment - the code you enter next is genuinely checked against this
          secret - but do not rely on it as your only protection until the
          account service is connected.
        </ServiceNotice>
      ) : null}

      {/* The QR and the instructions side by side on desktop, stacked on a
          phone with the code first - where the person reading this is very
          likely holding the device they are about to scan it with. */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <QrCode
          value={enrollment.otpauthUri}
          label={`QR code enrolling ${enrollment.account} in ${enrollment.issuer}`}
          className="mx-auto shrink-0 sm:mx-0"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-text-primary">
              Scan with an authenticator app
            </p>
            <p className="text-sm text-text-secondary">
              Open Google Authenticator, 1Password, Authy or any compatible app
              and scan this QR code. It will add an entry for{" "}
              <span className="font-semibold">{enrollment.account}</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-text-primary">
              Can&rsquo;t scan it?
            </p>
            <p className="text-sm text-text-secondary">
              Enter this setup key by hand instead. It is the same secret the QR
              code carries.
            </p>

            {/* Monospace and spaced in fours, because this gets read off a
                screen and typed into a phone one character at a time. */}
            <p className="rounded-btn border border-border bg-surface-secondary px-3 py-2.5 font-mono text-sm break-all text-text-primary select-all">
              {formatSetupKey(enrollment.secret)}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void copy(enrollment.secret, "Setup key")}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "Copied" : "Copy setup key"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 - verify                                                            */
/* -------------------------------------------------------------------------- */

function VerifyStep({
  onBack,
  onVerified,
}: {
  onBack: () => void;
  onVerified: (codes: string[]) => void;
}) {
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const complete = code.length === TOTP_CONFIG.digits;

  async function submit() {
    if (!complete || busy) return;

    setBusy(true);
    setError(null);

    const result = await verifyTwoFactorEnrollment(code);
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      setCode("");
      return;
    }

    onVerified(result.data.recoveryCodes);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Enter the {TOTP_CONFIG.digits}-digit verification code generated by your
        authenticator app.
      </p>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field
          label="Verification code"
          htmlFor={`${id}-code`}
          error={error ?? undefined}
          hint={<CodeCountdown />}
        >
          {/*
            One field, not six boxes. Six single-character inputs need focus
            management, paste splitting and backspace handling to behave, and
            they routinely defeat the password managers and SMS autofill that
            `one-time-code` is there to invite in. One input with
            `inputMode="numeric"` gets the phone keypad and the autofill for
            free.
          */}
          <Input
            id={`${id}-code`}
            value={code}
            error={Boolean(error)}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={TOTP_CONFIG.digits}
            className="max-w-48 text-center font-mono text-lg tracking-[0.4em]"
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, TOTP_CONFIG.digits));
              setError(null);
            }}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="submit" disabled={!complete || busy} aria-busy={busy || undefined}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
            {busy ? "Verifying…" : "Enable 2FA"}
          </Button>

          <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
            Back to the QR code
          </Button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The TOTP step clock, as an external store.
 *
 * The wall clock is exactly what `useSyncExternalStore` is for: a value that
 * exists on the client, does not exist on the server, and changes on its own.
 * An effect that calls `setState` on an interval would work and is a cascading
 * render every second for a number - and it has no server snapshot, so the
 * first paint has to be a placeholder that swaps.
 *
 * The value is cached at module scope and only republished when the whole
 * second actually changes, so `getSnapshot` is stable within a render pass. One
 * timer serves every subscriber and stops when the last one leaves.
 */
/* Annotated, because `TOTP_CONFIG` is `as const` and would otherwise pin this
   to the literal type `30`. */
let cachedSeconds: number = TOTP_CONFIG.periodSeconds;
const countdownListeners = new Set<() => void>();
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function subscribeCountdown(listener: () => void) {
  countdownListeners.add(listener);

  if (!countdownTimer) {
    /* React re-reads the snapshot straight after subscribing, so seeding it
       here is what gets the real value onto the first client paint. */
    cachedSeconds = secondsRemaining();

    /* Polled four times a second so the displayed number turns over within
       250ms of the real boundary rather than drifting behind it. */
    countdownTimer = setInterval(() => {
      const next = secondsRemaining();
      if (next === cachedSeconds) return;

      cachedSeconds = next;
      for (const current of countdownListeners) current();
    }, 250);
  }

  return () => {
    countdownListeners.delete(listener);
    if (countdownListeners.size === 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  };
}

/**
 * How long the code on screen stays valid.
 *
 * Not decoration: the most common reason a correct-looking code is rejected is
 * that it rolled over while somebody was typing it, and a reader who can see
 * three seconds left waits for the next one instead of concluding the setup is
 * broken.
 */
function CodeCountdown() {
  const seconds = useSyncExternalStore(
    subscribeCountdown,
    () => cachedSeconds,
    () => TOTP_CONFIG.periodSeconds,
  );

  return (
    <span className={cn(seconds <= 5 && "text-warning-text")}>
      This code changes in {seconds}s.
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 - done                                                              */
/* -------------------------------------------------------------------------- */

function DoneStep({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  return (
    <div className="space-y-5">
      {/*
        The success line stops where the truth stops.

        "You will be asked for a code next time you sign in" is the sentence
        this step wants to end on, and it is only true once a service checks the
        secret at the door. Saying it anyway would be the most expensive false
        claim in the product: somebody who believes a second factor is guarding
        their account behaves differently about their password.
      */}
      <p className="flex items-start gap-2.5 rounded-panel border border-success/30 bg-success-soft px-4 py-3 text-sm font-medium text-success-text">
        <ShieldCheck className="mt-0.5 size-4.5 shrink-0" aria-hidden />
        {CAPABILITIES.twoFactorEnforced
          ? "Two-factor authentication enabled. You will be asked for a code from your authenticator the next time you sign in."
          : "Two-factor authentication enabled, and your authenticator is verified against this account. Sign-in is not gated by it yet - that arrives with the account service."}
      </p>

      <RecoveryCodes codes={codes} />

      <div className="flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
