"use client";

import { useState } from "react";
import { ArrowLeftRight, Eye, History, RotateCcw } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ownerName } from "@/lib/customer-fixtures";
import { formatCount, formatDateTime, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VersionState, Workflow } from "@/types/workflow";

/**
 * Every saved version of a workflow.
 *
 * In a dialog rather than on the builder screen, because version history is
 * something you go looking for perhaps twice a month — and the builder needs
 * its height. The list is the whole feature: which version is live, what is
 * waiting in draft, and what the old ones were, with a way back to any of
 * them.
 *
 * Restoring never overwrites what is running. It copies an old version into
 * the draft, which is then published like any other change — because a "revert"
 * that instantly changes what thousands of contacts are experiencing is not a
 * safety feature, it is a second way to cause the incident.
 */

const STATE: Record<VersionState, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "warning" },
  published: { label: "Published", tone: "success" },
  superseded: { label: "Superseded", tone: "neutral" },
};

export function VersionHistoryDialog({
  open,
  onClose,
  workflow,
  onRestore,
}: {
  open: boolean;
  onClose: () => void;
  workflow: Workflow;
  onRestore?: (version: number) => void;
}) {
  const toast = useToast();
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);
  const [compare, setCompare] = useState<number | null>(null);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Version history"
        description={`Every saved version of ${workflow.name}, newest first.`}
        size="lg"
        footer={
          <Button variant="outline" size="compact" onClick={onClose}>
            Close
          </Button>
        }
      >
        {workflow.versions.length === 0 ? (
          <div className="rounded-panel border border-dashed border-border-strong px-4 py-10 text-center">
            <History className="mx-auto size-5 text-text-muted" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-text-primary">
              No versions yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-text-secondary">
              A version is saved every time this workflow is published. Publish
              it once and the history starts here.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {workflow.versions.map((version) => {
              const state = STATE[version.state];

              return (
                <li
                  key={version.version}
                  className={cn(
                    "rounded-panel border p-3.5",
                    version.state === "published"
                      ? "border-success/40 bg-success-soft/25"
                      : version.state === "draft"
                        ? "border-warning/40 bg-warning-soft/25"
                        : "border-border",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-text-primary">
                      Version {version.version}
                    </p>
                    <Badge tone={state.tone}>{state.label}</Badge>
                    {version.state === "superseded" && version.activeContacts > 0 ? (
                      <Badge tone="info">
                        {formatCount(version.activeContacts)} still running
                      </Badge>
                    ) : null}
                    <span className="ml-auto text-xs text-text-muted">
                      {formatRelativeTime(version.createdAt)}
                    </span>
                  </div>

                  {version.note ? (
                    <p className="mt-1.5 text-xs text-text-secondary">{version.note}</p>
                  ) : null}

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Avatar name={ownerName(version.authorId)} size="xs" />
                      {ownerName(version.authorId)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDateTime(version.createdAt)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {version.nodeCount} steps
                    </span>

                    <span className="ml-auto flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toast(`Opening a read-only view of v${version.version}`, "info")
                        }
                      >
                        <Eye aria-hidden />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCompare(version.version)}
                        disabled={version.version === workflow.publishedVersion}
                      >
                        <ArrowLeftRight aria-hidden />
                        Compare
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestore(version.version)}
                        disabled={version.state === "draft"}
                      >
                        <RotateCcw aria-hidden />
                        Restore as draft
                      </Button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Dialog>

      <Dialog
        open={compare !== null}
        onClose={() => setCompare(null)}
        title={`Compare v${compare ?? ""} with the published version`}
        description="What changed between these two versions."
        footer={
          <Button variant="outline" size="compact" onClick={() => setCompare(null)}>
            Close
          </Button>
        }
      >
        <ul className="space-y-2 text-sm">
          {[
            { change: "added", text: "Wait Until Event — Replies on WhatsApp" },
            { change: "changed", text: "Send WhatsApp — template swapped to welcome_new_lead" },
            { change: "removed", text: "Add Tag — Cold Lead" },
          ].map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-2.5 rounded-panel border border-border px-3 py-2.5"
            >
              <span
                className={cn(
                  "mt-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold uppercase",
                  item.change === "added"
                    ? "bg-success-soft text-success-text"
                    : item.change === "removed"
                      ? "bg-error-soft text-error-text"
                      : "bg-warning-soft text-warning-text",
                )}
              >
                {item.change}
              </span>
              <span className="min-w-0 flex-1 text-text-secondary">{item.text}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-text-muted">
          A full side-by-side diff of the canvas arrives with the versioning
          API. The change list above is what the comparison is built from.
        </p>
      </Dialog>

      <ConfirmDialog
        open={confirmRestore !== null}
        onClose={() => setConfirmRestore(null)}
        onConfirm={() => {
          const version = confirmRestore;
          setConfirmRestore(null);
          if (version === null) return;
          onRestore?.(version);
          toast(`Version ${version} restored as your draft`, "success");
        }}
        title={`Restore version ${confirmRestore ?? ""} as a draft?`}
        description="Nothing that is running changes."
        confirmLabel="Restore as draft"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          This copies that version&apos;s steps and settings over your current
          draft. The published version keeps running until you publish the
          restored one, and anyone already inside the journey is unaffected.
        </p>
      </ConfirmDialog>
    </>
  );
}
