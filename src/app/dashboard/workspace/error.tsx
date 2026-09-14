"use client";

import { useEffect } from "react";

import { AutomationErrorState } from "@/components/automation/automation-error";
import { ButtonLink } from "@/components/ui/button";
import { WORKSPACE_ROUTES } from "@/constants/workspace";

/**
 * The error boundary for every page under Workspace.
 *
 * It reuses the product's failure card rather than introducing a third one —
 * the name is module-specific and the component is not, and Integrations
 * already borrows it for the same reason. Worth renaming the day a fourth
 * module needs it; not worth forking.
 *
 * The copy never surfaces `error.message`: that string comes from the server
 * and can carry internals, so the detail stays in the digest, which is the only
 * thing support can correlate against a log. It also says explicitly that
 * nothing was changed — on a page that grants and revokes access, "did my
 * permission edit half-apply?" is the first thing a merchant will fear.
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Replace with the real reporter once one is wired up. Logging here rather
       than in render means it fires once per error, not once per paint. */
    console.error("Workspace route error:", error);
  }, [error]);

  return (
    <AutomationErrorState
      title="Unable to load this page"
      description="Something went wrong while loading your workspace. Nobody's access changed — no member, role or setting was modified by this."
      onRetry={reset}
      digest={error.digest}
      secondary={
        <ButtonLink href={WORKSPACE_ROUTES.team} variant="outline" size="compact">
          Back to Team Members
        </ButtonLink>
      }
    />
  );
}
