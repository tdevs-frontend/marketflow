"use client";

import { useEffect } from "react";

import { AutomationErrorState } from "@/components/automation/automation-error";
import { ButtonLink } from "@/components/ui/button";
import { INTEGRATION_ROUTES } from "@/constants/integrations";

/**
 * The error boundary for every page under Integrations.
 *
 * It reuses Automation's error card rather than introducing a second one. The
 * name is module-specific and the component is not — it is the product's
 * failure card, with a title, a retry and a digest — and two of them is how a
 * failed webhook list and a failed workflow list end up looking like different
 * products. Worth renaming if a third module needs it; not worth forking.
 *
 * The copy never surfaces `error.message`: that string comes from the server
 * and can carry internals, so the detail stays in the digest, which is the only
 * thing support can correlate against a log.
 */
export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Replace with the real reporter once one is wired up. Logging here rather
       than in render means it fires once per error, not once per paint. */
    console.error("Integrations route error:", error);
  }, [error]);

  return (
    <AutomationErrorState
      title="Unable to load this page"
      description="Something went wrong while loading your integrations. Your connections are unaffected — nothing was disconnected, rotated or deleted by this."
      onRetry={reset}
      digest={error.digest}
      secondary={
        <ButtonLink href={INTEGRATION_ROUTES.hub} variant="outline" size="compact">
          Back to Integrations
        </ButtonLink>
      }
    />
  );
}
