"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A sample event payload.
 *
 * Kept to a plain `<pre>` with one accent on the keys rather than a full
 * syntax highlighter: this is four lines of JSON that an integrator reads once
 * to learn the field names, and a tokeniser would be more code than the thing
 * it renders. Copy is the action that actually matters — the next step is
 * always pasting it into a test request.
 */
export function EventPayloadViewer({
  payload,
  className,
}: {
  payload: Record<string, unknown>;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(payload, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard access can be refused — the text is on screen either way,
         so there is nothing useful to say about it. */
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-panel border border-border bg-surface-secondary",
        className,
      )}
    >
      <div className="absolute top-2 right-2 z-10">
        <Tooltip content={copied ? "Copied" : "Copy payload"}>
          <IconButton label="Copy payload" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
          </IconButton>
        </Tooltip>
      </div>

      <pre className="custom-scrollbar overflow-x-auto px-3.5 py-3 font-mono text-sm leading-relaxed text-text-secondary">
        {json.split("\n").map((line, index) => {
          const match = line.match(/^(\s*)"([^"]+)":\s?(.*)$/);

          return (
            <div key={index}>
              {match ? (
                <>
                  {match[1]}
                  <span className="text-primary">&quot;{match[2]}&quot;</span>
                  {": "}
                  <span className="text-text-primary">{match[3]}</span>
                </>
              ) : (
                line
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
