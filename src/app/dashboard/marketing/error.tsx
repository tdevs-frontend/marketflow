"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";

/**
 * The error boundary for every page under Marketing.
 *
 * `reset()` is the primary action because most failures here are a fetch that
 * timed out, and retrying is both the likely fix and the cheapest thing to
 * try. The digest is shown rather than hidden — it is the only thing support
 * can correlate against a server log, and a user who cannot quote it has
 * nothing to report.
 *
 * The message itself is deliberately not `error.message`: that string comes
 * from the server and can carry internals, so the copy stays generic and the
 * detail stays in the digest.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Replace with the real reporter once one is wired up. Logging here rather
       than in render means it fires once per error, not once per paint. */
    console.error("Marketing route error:", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-panel bg-error-soft text-error">
        <AlertTriangle className="size-5" aria-hidden />
      </span>

      <h1 className="mt-4 text-lg">Something went wrong loading this page</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
        The page failed to load. Your campaigns, contacts and scheduled sends
        are unaffected — nothing was changed by this.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <Button size="compact" onClick={reset}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
        <ButtonLink href={APP_ROUTES.marketing} variant="outline" size="compact">
          Back to Marketing
        </ButtonLink>
      </div>

      {error.digest ? (
        <p className="mt-5 border-t border-border pt-4 text-[11px] text-text-muted">
          Reference{" "}
          <code className="font-mono text-text-secondary">{error.digest}</code> —
          quote this if you contact support.
        </p>
      ) : null}
    </Card>
  );
}
