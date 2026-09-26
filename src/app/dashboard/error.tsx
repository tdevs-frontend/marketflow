"use client";

import { useEffect } from "react";
import { LayoutDashboard } from "lucide-react";

import { AutomationErrorState } from "@/components/automation/automation-error";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

/**
 * The error boundary for every dashboard page that has no nearer one -
 * Commerce, Forms, Support, Analytics, Notifications and the rest. Modules
 * with their own boundary (Customers, Automation, Marketing, Integrations,
 * Settings, Workspace) keep it.
 *
 * Rendered inside the dashboard layout, so the sidebar and header stay and the
 * merchant is never stranded. The shared error card is reused rather than
 * restated; the copy never shows `error.message`, which can carry internals -
 * the digest is what support correlates against a log.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Replace with the real reporter once one is wired up. */
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <AutomationErrorState
      title="Unable to load this page"
      description="Something went wrong while loading this page. Your data is unaffected - nothing was changed by this."
      onRetry={reset}
      digest={error.digest}
      secondary={
        <ButtonLink href={APP_ROUTES.dashboard} variant="outline" size="compact">
          <LayoutDashboard aria-hidden />
          Back to Dashboard
        </ButtonLink>
      }
    />
  );
}
