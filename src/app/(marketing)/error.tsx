"use client";

import { useEffect } from "react";
import { Home } from "lucide-react";

import { AutomationErrorState } from "@/components/automation/automation-error";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";

/**
 * The public site's error boundary. Inside the marketing layout, so the header
 * and footer stay and a visitor always has somewhere to go.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public route error:", error);
  }, [error]);

  return (
    <div className="custom-container px-4 py-20 sm:py-28">
      <AutomationErrorState
        title="This page couldn't load"
        description="Something went wrong on our side. Try again, or head back to the home page."
        onRetry={reset}
        digest={error.digest}
        secondary={
          <ButtonLink href={APP_ROUTES.home} variant="outline" size="compact">
            <Home aria-hidden />
            Back to Home
          </ButtonLink>
        }
      />
    </div>
  );
}
