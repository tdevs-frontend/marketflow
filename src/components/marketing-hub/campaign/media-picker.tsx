"use client";

import { useRef, useState } from "react";
import { AlertCircle, Check, ImagePlus, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  ACCEPTED_MEDIA,
  defaultUploadFolder,
  uploadMedia,
  useMediaAssets,
  useMediaFolders,
} from "@/lib/media-store";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/social";

/**
 * Attach assets to a campaign, from the Media Library that already exists.
 *
 * It reads `useMediaAssets()` - the same store Marketing → Social → Media and
 * the post composer render - rather than holding a campaign-local upload. That
 * is the whole point: an image uploaded for a campaign is an asset of the
 * workspace, and a second store would mean the same hero image existing twice
 * with two names, two sizes and no idea which the Planner is using.
 *
 * "Upload New" keeps that rule rather than bypassing it: the file goes into the
 * library through `lib/media-store` and is then selected here, so it is
 * available to the Planner and to the next campaign the moment it lands.
 */

const GRID_TILE =
  "group relative aspect-square overflow-hidden rounded-panel border transition-colors focus-visible:shadow-focus focus-visible:outline-none";

/*
 * `AssetThumb` used to live here, which made the campaign wizard the owner of
 * how a media asset looks everywhere else. It has moved to
 * `marketing-hub/shared` alongside the other cross-module pieces and is
 * re-exported so the wizard's own call sites, and anything importing it from
 * here, are unchanged.
 */
import { AssetThumb } from "../shared/asset-thumb";

export { AssetThumb };

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
  const assets = useMediaAssets();
  /* Ordered by the campaign's own list, not the library's, so the first
     attachment stays the one that publishes first. */
  const chosen = selected
    .map((id) => assets.find((asset) => asset.id === id))
    .filter((asset): asset is MediaAsset => Boolean(asset));

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
                <AssetThumb
                  asset={asset}
                  className="size-20 overflow-hidden rounded-panel border border-border"
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
  const assets = useMediaAssets();
  /* The store's list, so a folder created in the Media Library is a
     destination here too rather than only there. */
  const folders = useMediaFolders();
  const fileInput = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  /* Edited in the dialog and committed on Done, so a cancelled browse leaves
     the campaign exactly as it was. */
  const [draft, setDraft] = useState<string[]>(selected);
  const [hydrated, setHydrated] = useState(false);
  /* How many files are being read right now, and what came back broken. The
     count rather than a boolean: "Uploading 3 files" is the honest label, and a
     spinner that cannot say how much is left should at least say how much
     there was. */
  const [uploading, setUploading] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);

  /* Re-seed from the campaign once per open, adjusted during render so the
     first paint already shows the right ticks. Without this the dialog keeps
     whatever was last picked in it: Cancel would not discard, and an asset
     removed from the row above would still show as selected on reopen. */
  if (open && !hydrated) {
    setHydrated(true);
    setDraft(selected);
  }
  if (!open && hydrated) setHydrated(false);

  const visible = assets.filter((asset) => {
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

  /**
   * Read the picked files into the library, then tick what landed.
   *
   * Selecting for the campaign is the point of uploading from here - an upload
   * that leaves the file sitting in the grid untouched makes the person hunt
   * for their own image among forty others. `max` still rules: on a channel
   * that takes one asset, the first one in wins and the rest wait in the
   * library rather than silently replacing it.
   */
  async function upload(files: File[]) {
    if (files.length === 0) return;

    setUploading(files.length);
    setFailures([]);

    try {
      const { added, rejected } = await uploadMedia(
        files,
        /* "All folders" is a view, not a destination. */
        folder === "all" ? defaultUploadFolder() : folder,
      );

      setFailures(rejected);

      if (added.length > 0) {
        setDraft((prev) => {
          const room = max ? Math.max(0, max - prev.length) : added.length;
          return [...prev, ...added.slice(0, room).map((asset) => asset.id)];
        });
        toast(
          `${added.length} file${added.length === 1 ? "" : "s"} added to the Media Library`,
        );
      }
    } catch {
      /* Decoding runs in the browser, so a throw here is the browser itself
         giving up - say so rather than leaving the spinner running. */
      setFailures(["Those files could not be read. Try again."]);
    } finally {
      setUploading(0);
    }
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
          <Button variant="cancel" size="compact" onClick={onClose}>
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
            /* The store's list already carries an "All Media" entry whose id
               is "all", so mapping it straight in put two options with the
               same value in the dropdown. The explicit row wins and the rest
               of the list follows it. */
            options={[
              { value: "all", label: "All folders" },
              ...folders
                .filter((item) => item.id !== "all")
                .map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={uploading > 0}
            onClick={() => fileInput.current?.click()}
          >
            {uploading > 0 ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Upload aria-hidden />
            )}
            {uploading > 0 ? "Uploading…" : "Upload New"}
          </Button>

          {/* The control is the button above; this stays in the DOM because a
              file dialog can only be opened from a real input. */}
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ACCEPTED_MEDIA}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              /* Cleared before the read, so picking the same file twice in a
                 row still fires `change` the second time. */
              event.target.value = "";
              void upload(files);
            }}
          />
        </div>

        {uploading > 0 ? (
          <p className="flex items-center gap-2 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5 text-sm font-medium text-primary-dark">
            <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />
            Reading {uploading} file{uploading === 1 ? "" : "s"}…
          </p>
        ) : null}

        {failures.length > 0 ? (
          <div className="rounded-panel border border-error/25 bg-error-soft px-3.5 py-2.5">
            <p className="flex items-center gap-2 text-sm font-bold text-error-text">
              <AlertCircle aria-hidden className="size-4 shrink-0" />
              {failures.length} file{failures.length === 1 ? "" : "s"} not
              uploaded
            </p>
            <ul className="mt-1 space-y-0.5">
              {failures.map((failure) => (
                <li key={failure} className="text-sm font-medium text-error-text">
                  {failure}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {assets.length === 0 ? (
          <EmptyState
            compact
            title="The library is empty"
            description="Upload an image or video and it is available to every campaign and post."
            action={
              <Button
                size="sm"
                disabled={uploading > 0}
                onClick={() => fileInput.current?.click()}
              >
                <Upload aria-hidden />
                Upload media
              </Button>
            }
          />
        ) : visible.length === 0 ? (
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
                    <AssetThumb asset={asset} className="size-full" />

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
