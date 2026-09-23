"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * When a Settings section fails to render.
 *
 * One boundary for the module rather than a `try` inside each panel, because it
 * is the honest shape of the failure: if the account record cannot be read,
 * Profile has nothing to show and neither does the status line on the overview.
 * The navigation rail lives in the layout and survives, so the reader is not
 * stranded - they can move to another section while this one is broken.
 *
 * `reset` is a real retry. It re-renders the segment, which re-runs whatever
 * threw; a button that only reloaded the page would throw away the rest of the
 * session to fix one panel.
 *
 * The message deliberately does not include `error.message`. A thrown string
 * from deep in a render is not a sentence anybody can act on, and the digest is
 * what actually identifies the failure in a log - so that is what is offered,
 * and only when the server produced one.
 */
export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* The reporting hook. Whatever the product eventually sends errors to, this
       is where a Settings failure reaches it; until then the console is the
       only consumer and swallowing it entirely would be worse. */
    console.error("Settings section failed to render", error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-error-soft text-error-text">
        <TriangleAlert className="size-5" aria-hidden />
      </span>

      <h2 className="text-base sm:text-lg">
        This section could not be loaded
      </h2>

      <p className="max-w-sm text-sm text-text-secondary">
        Something went wrong reading your settings. Nothing has been changed -
        try again, or pick another section from the menu.
      </p>

      <Button variant="outline" size="compact" onClick={reset} className="mt-1">
        <RotateCcw aria-hidden />
        Try again
      </Button>

      {error.digest ? (
        <p className="text-meta text-text-muted">
          Reference <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </Card>
  );
}
