"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";

/**
 * The error boundary for every page under Customers.
 *
 * `reset()` is the primary action because most failures here are a fetch that
 * timed out, and retrying is both the likely fix and the cheapest thing to
 * try. The copy is deliberately not `error.message`: that string comes from
 * the server and can carry internals, so it stays generic and the detail stays
 * in the digest — which is the only thing support can correlate against a log.
 */
export default function CustomersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Replace with the real reporter once one is wired up. Logging here rather
       than in render means it fires once per error, not once per paint. */
    console.error("Customers route error:", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-panel bg-error-soft text-error">
        <AlertTriangle className="size-5" aria-hidden />
      </span>

      <h1 className="mt-4 text-lg">Unable to load this page</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
        Something went wrong while loading this data. Your contacts, leads and
        segments are unaffected — nothing was changed by this.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <Button size="compact" onClick={reset}>
          <RefreshCw aria-hidden />
          Retry
        </Button>
        <ButtonLink
          href={APP_ROUTES.contacts}
          variant="outline"
          size="compact"
        >
          Back to Contacts
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
