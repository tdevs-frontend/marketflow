"use client";

import { useSyncExternalStore } from "react";

import { MEDIA_ASSETS, MEDIA_FOLDERS } from "@/lib/social-fixtures";
import type { MediaAsset, MediaFolder } from "@/types/social";

/**
 * The Media Library, plus whatever has been uploaded this session.
 *
 * `MEDIA_ASSETS` is a fixture - a frozen list that every media surface reads
 * directly, which is why "Upload New" could only ever raise a toast: there was
 * nowhere for a file to go. This is that missing shelf, and deliberately the
 * smallest one that works: a module-level array in front of the fixtures, and a
 * `useSyncExternalStore` subscription so every surface reading it re-renders
 * together.
 *
 * It is not a second library. Every media surface in the product - the
 * Media Library page, the campaign picker, the post composer, the calendar's
 * thumbnails - reads `useMediaAssets()` and gets one list in one order. That
 * is what makes a file uploaded in the composer appear in the library a frame
 * later, and it is why the wizard never grew an upload shelf of its own.
 *
 * Session-scoped, and honestly so. An upload here is an object URL over a file
 * in this tab's memory - there is no service behind it, and a `blob:` URL dies
 * with the document. Persisting the ids would resurrect a draft on Monday whose
 * images stopped existing on Friday, so a reload starts from the fixtures and a
 * draft's missing ids simply drop out of `chosen`, which already reads as "no
 * media attached".
 */

/** What the library takes, as the `accept` attribute and as the guard. */
export const ACCEPTED_MEDIA =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

const ACCEPTED_TYPES = new Set(ACCEPTED_MEDIA.split(","));

/** The cap the library's own upload dialog states. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/* Newest first: someone who has just uploaded is looking for what they
   uploaded, not for the fixture that has been there all along. */
let uploads: MediaAsset[] = [];

/*
 * Edits and removals applied to the *fixture* rows.
 *
 * `MEDIA_ASSETS` is a frozen module import that the server render also reads,
 * so renaming or deleting one cannot mean touching that array. These two hold
 * the difference instead, and `publish` folds them over the fixtures on every
 * write - which keeps the server snapshot honest and the client's view current.
 */
const overrides = new Map<string, MediaAsset>();
const deleted = new Set<string>();

let snapshot: MediaAsset[] = MEDIA_ASSETS;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish() {
  const library = MEDIA_ASSETS.filter((asset) => !deleted.has(asset.id)).map(
    (asset) => overrides.get(asset.id) ?? asset,
  );

  snapshot = [...uploads, ...library];
  for (const listener of listeners) listener();
}

/**
 * Every asset in the library, uploads first.
 *
 * The server snapshot is the fixture list on purpose: uploads exist only in
 * this tab, so returning them during hydration would be a mismatch by
 * definition.
 */
export function useMediaAssets(): MediaAsset[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => MEDIA_ASSETS,
  );
}

/**
 * Rename an asset in place.
 *
 * Only the label changes - the id and the URL are untouched, so every post
 * already pointing at this file keeps pointing at it. A rename that broke
 * references would be a delete with a friendly name.
 */
export function renameMedia(id: string, name: string): MediaAsset | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const index = snapshot.findIndex((asset) => asset.id === id);
  if (index === -1) return null;

  const renamed = { ...snapshot[index], name: trimmed };

  /* The shelf is uploads in front of fixtures, so a rename has to land in
     whichever of the two actually holds the record. */
  uploads = uploads.map((asset) => (asset.id === id ? renamed : asset));
  overrides.set(id, renamed);
  publish();

  return renamed;
}

/**
 * Remove assets from the library.
 *
 * Fixture entries are tombstoned rather than spliced: `MEDIA_ASSETS` is a
 * frozen import shared with the server render, and mutating it would desync
 * the two. An uploaded file also has its object URL revoked - that is a real
 * handle on a real file in this tab's memory, and dropping the record without
 * releasing it leaks the blob for the life of the document.
 */
export function removeMedia(ids: string[]): number {
  const doomed = new Set(ids);
  let removed = 0;

  for (const asset of snapshot) {
    if (!doomed.has(asset.id)) continue;
    removed += 1;
    if (asset.url?.startsWith("blob:")) URL.revokeObjectURL(asset.url);
  }

  if (removed === 0) return 0;

  uploads = uploads.filter((asset) => !doomed.has(asset.id));
  for (const id of doomed) {
    overrides.delete(id);
    deleted.add(id);
  }

  publish();
  return removed;
}

/* -------------------------------------------------------------------------- */
/* Folders                                                                    */
/* -------------------------------------------------------------------------- */

/*
 * The folder list, and whatever has been added this session.
 *
 * Same shape as the assets above and for the same reason: `MEDIA_FOLDERS` is a
 * frozen fixture the server render reads, so a new folder is held alongside it
 * rather than pushed into it. Keeping folders in the store - instead of every
 * surface importing the fixture - is what makes a folder created in the
 * sidebar immediately selectable as an upload destination, which is the whole
 * point of being able to create one.
 */
let folders: MediaFolder[] = [];
let folderSnapshot: MediaFolder[] = MEDIA_FOLDERS;

const folderListeners = new Set<() => void>();

function subscribeFolders(listener: () => void) {
  folderListeners.add(listener);
  return () => {
    folderListeners.delete(listener);
  };
}

function publishFolders() {
  /* Appended, not prepended: "All Media" has to stay first, and the fixture
     folders are the ones people already know where to find. */
  folderSnapshot = [...MEDIA_FOLDERS, ...folders];
  for (const listener of folderListeners) listener();
}

/** Every folder, the session's additions last. */
export function useMediaFolders(): MediaFolder[] {
  return useSyncExternalStore(
    subscribeFolders,
    () => folderSnapshot,
    () => MEDIA_FOLDERS,
  );
}

/**
 * The folder a new upload defaults to when the browser is on "All Media".
 *
 * Derived rather than `MEDIA_FOLDERS[1]` written out at each call site: "all"
 * is a view rather than a destination, so something has to choose, and three
 * copies of that choice is three places to fix when the list changes.
 */
export const defaultUploadFolder = () =>
  folderSnapshot.find((folder) => folder.id !== "all")?.id ?? "all";

/**
 * Create a folder.
 *
 * Returns `null` on a blank name or one that already exists - the caller shows
 * the reason rather than quietly creating a second "Autumn 2026" that splits
 * the same campaign's assets across two identical-looking shelves.
 */
export function createMediaFolder(name: string): MediaFolder | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const taken = folderSnapshot.some(
    (folder) => folder.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (taken) return null;

  const folder: MediaFolder = {
    id: `mf-${Date.now().toString(36)}-${folders.length}`,
    name: trimmed,
  };

  folders = [...folders, folder];
  publishFolders();

  return folder;
}

/* -------------------------------------------------------------------------- */

/** Bytes as the unit a person would say out loud. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why this file cannot be uploaded, or `null` if it can. */
export function rejectionFor(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return `${file.name} - JPG, PNG, WebP, GIF, MP4 and WebM only.`;
  }
  if (file.size === 0) {
    return `${file.name} - the file is empty.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} - ${formatBytes(file.size)}, over the ${formatBytes(
      MAX_UPLOAD_BYTES,
    )} limit.`;
  }
  return null;
}

/**
 * The real dimensions, read off the file itself.
 *
 * Worth the wait: the library shows dimensions on every asset, and a card
 * reading "0 × 0" is worse than a slightly slower upload. A file the browser
 * cannot decode resolves `null` and is reported as a failed upload rather than
 * stored as a broken tile - which is the difference between a corrupt JPEG and
 * a silent one.
 */
function probe(
  file: File,
  url: string,
): Promise<{ width: number; height: number; duration?: number } | null> {
  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Math.round(video.duration),
        });
      video.onerror = () => resolve(null);
      video.src = url;
    });
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

let sequence = 0;

export interface UploadResult {
  added: MediaAsset[];
  /** One line per file that did not make it, ready to render as-is. */
  rejected: string[];
}

/**
 * Put files in the library.
 *
 * Validates first, then decodes, so a batch with one oversized file still
 * uploads the rest - a picker that refuses all five because the fourth was a
 * PDF makes the person start over for no reason. Every file that fails comes
 * back as a sentence the caller can show.
 */
export async function uploadMedia(
  files: File[],
  folderId: string,
): Promise<UploadResult> {
  const added: MediaAsset[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    const rejection = rejectionFor(file);
    if (rejection) {
      rejected.push(rejection);
      continue;
    }

    const url = URL.createObjectURL(file);
    const measured = await probe(file, url);

    if (!measured) {
      /* Nothing will ever read this URL, so let go of the file now. */
      URL.revokeObjectURL(url);
      rejected.push(`${file.name} - could not be read.`);
      continue;
    }

    sequence += 1;

    added.push({
      id: `up-${Date.now().toString(36)}-${sequence}`,
      name: file.name,
      type: file.type.startsWith("video/") ? "video" : "image",
      folderId,
      size: file.size,
      width: measured.width,
      height: measured.height,
      duration: measured.duration,
      tags: [],
      /* The ground behind the thumbnail while it decodes, and after it if the
         URL is ever dropped - the same neutral the fixtures fall back to. */
      tone: "bg-surface-secondary",
      uploadedAt: new Date().toISOString(),
      url,
    });
  }

  if (added.length > 0) {
    /* Reversed into the shelf so a multi-file batch keeps its picked order on
       screen; `added` itself stays in that order for the caller to select. */
    uploads = [...[...added].reverse(), ...uploads];
    publish();
  }

  return { added, rejected };
}
