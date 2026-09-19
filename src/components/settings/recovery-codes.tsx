"use client";

import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClipboard } from "@/components/integrations/credential-field";
import { siteConfig } from "@/config";

/**
 * Recovery codes, shown the one time they exist in readable form.
 *
 * These are the answer to "my phone is at the bottom of a river". They are
 * generated at activation, displayed here, and never retrievable again — the
 * same contract a real service has, and the reason the panel that owns this
 * says "shown once" before generating them rather than after.
 *
 * Both actions are real. Copy goes to the clipboard; Download writes a text
 * file from a blob in the browser, so nothing is round-tripped through a server
 * that does not exist and the codes are not put in a URL on the way. The file
 * names the account and the date, because a folder with three `recovery.txt`
 * files in it helps nobody.
 */
export function RecoveryCodes({
  codes,
  account,
}: {
  codes: string[];
  /** Written into the downloaded file, so the codes can be identified later. */
  account?: string;
}) {
  const { copied, copy } = useClipboard();

  if (codes.length === 0) return null;

  const plain = codes.join("\n");

  function download() {
    const header = [
      `${siteConfig.name} recovery codes`,
      account ? `Account: ${account}` : null,
      `Generated: ${new Date().toISOString()}`,
      "",
      "Each code can be used once. Keep them somewhere you can reach without your phone.",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([`${header}${plain}\n`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `marketflow-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();

    /* Released immediately — the download has already been handed the blob. */
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">Recovery codes</p>
        <p className="mt-0.5 text-sm text-text-secondary">
          Each code works once, and only while two-factor is on. Store them
          somewhere you can reach without your phone — this is the only time
          they are shown.
        </p>
      </div>

      <ul className="grid gap-x-6 gap-y-1.5 rounded-btn border border-border bg-surface-secondary px-4 py-3.5 font-mono text-sm text-text-primary sm:grid-cols-2">
        {codes.map((code) => (
          <li key={code} className="select-all tabular-nums">
            {code}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="outline"
          size="compact"
          onClick={() => void copy(plain, "Recovery codes")}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy codes"}
        </Button>

        <Button variant="outline" size="compact" onClick={download}>
          <Download aria-hidden />
          Download as text
        </Button>
      </div>
    </div>
  );
}
