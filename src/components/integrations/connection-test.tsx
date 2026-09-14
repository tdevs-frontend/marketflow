"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CredentialSpec } from "@/types/integration";

/**
 * The test-connection experience, in one place.
 *
 * Every provider integration in this module tests the same way and says the
 * same things, because the alternative is four pages that each invent their own
 * word for "it did not work".
 *
 * The rule for failures: name the thing that is wrong. "Something went wrong"
 * sends a merchant to support; "Authentication failed — the access token was
 * rejected" sends them to the one field they need to change. Every branch below
 * produces a message a merchant can act on without opening a ticket.
 */

export type TestOutcome =
  | { ok: true; message: string; detail?: string }
  | { ok: false; message: string; detail?: string };

export type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "success"; message: string; detail?: string }
  | { status: "error"; message: string; detail?: string };

/** How long the mock round-trip takes. A real adapter replaces this with fetch. */
const TEST_LATENCY_MS = 1200;

export function useConnectionTest() {
  const [state, setState] = useState<TestState>({ status: "idle" });
  const timer = useRef(0);
  /* Guards a result landing after the drawer closed, which would set state on
     an unmounted tree and — worse — flash a stale "successful" on reopen. */
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const run = useCallback((resolve: () => TestOutcome) => {
    setState({ status: "testing" });
    window.clearTimeout(timer.current);

    timer.current = window.setTimeout(() => {
      if (!alive.current) return;
      const outcome = resolve();
      setState({
        status: outcome.ok ? "success" : "error",
        message: outcome.message,
        detail: outcome.detail,
      });
    }, TEST_LATENCY_MS);
  }, []);

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    setState({ status: "idle" });
  }, []);

  return { state, run, reset };
}

/**
 * The stand-in for a provider round-trip.
 *
 * Deterministic on purpose — a demo that fails at random teaches nothing. The
 * checks are the ones a real adapter performs first anyway: is everything
 * required present, is the endpoint safe to send a secret to, and is the secret
 * long enough to be a real credential rather than a placeholder.
 */
export function evaluateCredentials(
  fields: CredentialSpec[],
  values: Record<string, string>,
): TestOutcome {
  const missing = fields.filter(
    (field) => !field.optional && !values[field.key]?.trim(),
  );

  if (missing.length > 0) {
    return {
      ok: false,
      message: "Missing required details.",
      detail: `Fill in ${missing.map((field) => field.label).join(", ")} before testing.`,
    };
  }

  const insecure = fields.find(
    (field) =>
      field.kind === "url" && !values[field.key]?.trim().startsWith("https://"),
  );
  if (insecure) {
    return {
      ok: false,
      message: "Endpoint must use HTTPS.",
      detail: `${insecure.label} sends credentials with every request, so it cannot be plain HTTP.`,
    };
  }

  const weak = fields.find(
    (field) => field.kind === "secret" && (values[field.key]?.trim().length ?? 0) < 8,
  );
  if (weak) {
    return {
      ok: false,
      message: "Authentication failed.",
      detail: `The provider rejected the ${weak.label.toLowerCase()}. Check that you copied the whole value and that it has not expired.`,
    };
  }

  return {
    ok: true,
    message: "Connection successful.",
    detail: "Credentials accepted and the provider responded in 214 ms.",
  };
}

/* -------------------------------------------------------------------------- */
/* Result panel                                                               */
/* -------------------------------------------------------------------------- */

const RESULT_TONE = {
  testing: "border-border bg-surface-secondary text-text-secondary",
  success: "border-success-soft bg-success-soft text-success-text",
  error: "border-error-soft bg-error-soft text-error-text",
} as const;

/**
 * Testing / succeeded / failed, as one block that never changes height class.
 *
 * Returns `null` at rest rather than reserving space: an empty outlined box
 * above a form reads as a field the merchant has failed to fill in.
 */
export function ConnectionTestResult({
  state,
  className,
}: {
  state: TestState;
  className?: string;
}) {
  if (state.status === "idle") return null;

  const Icon =
    state.status === "testing"
      ? Loader2
      : state.status === "success"
        ? CheckCircle2
        : AlertTriangle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-panel border px-3.5 py-3",
        RESULT_TONE[state.status],
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          state.status === "testing" && "animate-spin motion-reduce:animate-none",
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {state.status === "testing" ? "Testing connection…" : state.message}
        </p>
        {state.status !== "testing" && state.detail ? (
          <p className="mt-0.5 text-sm opacity-90">{state.detail}</p>
        ) : null}
      </div>
    </div>
  );
}
