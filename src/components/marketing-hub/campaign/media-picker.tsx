"use client";

import { useState } from "react";
import { Check, ImagePlus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { MEDIA_ASSETS, MEDIA_FOLDERS } from "@/lib/social-fixtures";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/social";

/**
 * Attach assets to a campaign, from the Media Library that already exists.
 *
 * It reads `MEDIA_ASSETS` — the same list Marketing → Social → Media renders —
 * rather than holding a campaign-local upload. That is the whole point: an
 * image uploaded for a campaign is an asset of the workspace, and a second
 * store would mean the same hero image existing twice with two names, two sizes
 * and no idea which the Planner is using.
 *
 * "Upload new" lands in the library first and is then selected here, which is
 * why it is a toast rather than a second file model.
 */

const GRID_TILE =
  "group relative aspect-square overflow-hidden rounded-panel border transition-colors focus-visible:shadow-focus focus-visible:outline-none";

export function MediaPicker({
  selected,
  onChange,
  /** Instagram rejects a text-only post, so the caller can make this required. */
  required = false,
  max,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  required?: boolean;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const chosen = MEDIA_ASSETS.filter((asset) => selected.includes(asset.id));

  return (
    <div className="space-y-2.5">
      {chosen.length === 0 ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-panel border border-dashed px-3.5 py-4",
            required ? "border-warning/40 bg-warning-soft/40" : "border-border",
          )}
        >
          <p className="text-sm font-medium text-text-muted">
            {required
              ? "This channel needs at least one image or video."
              : "No media attached."}
          </p>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <ImagePlus aria-hidden />
            Select from Media Library
          </Button>
        </div>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2.5">
            {chosen.map((asset) => (
              <li key={asset.id} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    "block size-20 rounded-panel border border-border",
                    asset.tone,
                  )}
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(selected.filter((id) => id !== asset.id))
                  }
                  aria-label={`Remove ${asset.name}`}
                  className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border border-border bg-surface text-text-muted shadow-card transition-colors hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
                <span className="sr-only">{asset.name}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <ImagePlus aria-hidden />
              Change media
            </Button>
            <p className="text-sm font-medium text-text-muted">
              {chosen.length} asset{chosen.length === 1 ? "" : "s"} attached
            </p>
          </div>
        </>
      )}

      <MediaDialog
        open={open}
        onClose={() => setOpen(false)}
        selected={selected}
        onChange={onChange}
        max={max}
      />
    </div>
  );
}

function MediaDialog({
  open,
  onClose,
  selected,
  onChange,
  max,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}) {
  const toast = useToast();
  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  /* Edited in the dialog and committed on Done, so a cancelled browse leaves
     the campaign exactly as it was. */
  const [draft, setDraft] = useState<string[]>(selected);
  const [hydrated, setHydrated] = useState(false);

  /* Re-seed from the campaign once per open, adjusted during render so the
     first paint already shows the right ticks. Without this the dialog keeps
     whatever was last picked in it: Cancel would not discard, and an asset
     removed from the row above would still show as selected on reopen. */
  if (open && !hydrated) {
    setHydrated(true);
    setDraft(selected);
  }
  if (!open && hydrated) setHydrated(false);

  const visible = MEDIA_ASSETS.filter((asset) => {
    if (folder !== "all" && asset.folderId !== folder) return false;
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      asset.name.toLowerCase().includes(needle) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(needle))
    );
  });

  function toggle(asset: MediaAsset) {
    setDraft((prev) => {
      if (prev.includes(asset.id)) {
        return prev.filter((id) => id !== asset.id);
      }
      if (max && prev.length >= max) {
        toast(`Up to ${max} asset${max === 1 ? "" : "s"} on this channel`);
        return prev;
      }
      return [...prev, asset.id];
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Media Library"
      description="The workspace library. Anything you upload here is available to every campaign and post."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            <Check aria-hidden />
            Use {draft.length} asset{draft.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            size="sm"
            value={search}
            placeholder="Search assets"
            aria-label="Search media"
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-56"
          />
          <Select
            size="sm"
            label="Folder"
            value={folder}
            onChange={setFolder}
            options={[
              { value: "all", label: "All folders" },
              ...MEDIA_FOLDERS.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() =>
              toast("Uploads land in the Media Library, then attach from here")
            }
          >
            <Upload aria-hidden />
            Upload New
          </Button>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border px-3.5 py-8 text-center text-sm font-medium text-text-muted">
            No assets match that search.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {visible.map((asset) => {
              const on = draft.includes(asset.id);

              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(asset)}
                    className={cn(
                      GRID_TILE,
                      asset.tone,
                      on ? "border-primary" : "border-border hover:border-border-strong",
                    )}
                  >
                    {on ? (
                      <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}

                    <span className="absolute inset-x-0 bottom-0 truncate bg-text-primary/70 px-1.5 py-1 text-left text-sm font-medium text-white">
                      {asset.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
