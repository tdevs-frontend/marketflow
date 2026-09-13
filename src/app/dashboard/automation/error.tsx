"use client";

import { useEffect } from "react";

import { AutomationErrorState } from "@/components/automation/automation-error";

/**
 * The error boundary for every page under Automation.
 *
 * `reset()` is the primary action because most failures here are a request
 * that timed out, and retrying is both the likely fix and the cheapest thing
 * to try. The copy is deliberately not `error.message`: that string comes from
 * the server and can carry internals, so it stays generic and the detail stays
 * in the digest — the only thing support can correlate against a log.
 */
export default function AutomationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Replace with the real reporter once one is wired up. Logging here rather
       than in render means it fires once per error, not once per paint. */
    console.error("Automation route error:", error);
  }, [error]);

  return (
    <AutomationErrorState
      title="Unable to load this page"
      description="Something went wrong while loading your automations. Your workflows are unaffected — nothing was paused, published or deleted by this."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
