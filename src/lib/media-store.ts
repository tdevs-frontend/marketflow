"use client";

import { useSyncExternalStore } from "react";

import { MEDIA_ASSETS } from "@/lib/social-fixtures";
import type { MediaAsset } from "@/types/social";

/**
 * The Media Library, plus whatever has been uploaded this session.
 *
 * `MEDIA_ASSETS` is a fixture — a frozen list that every media surface reads
 * directly, which is why "Upload New" could only ever raise a toast: there was
 * nowhere for a file to go. This is that missing shelf, and deliberately the
 * smallest one that works: a module-level array in front of the fixtures, and a
 * `useSyncExternalStore` subscription so every surface reading it re-renders
 * together.
 *
 * It is not a second library. The campaign picker and the composer preview both
 * read `useMediaAssets()` and get one list in one order, which is the whole
 * reason the wizard never held its own uploads. Marketing → Social → Media
 * still reads `MEDIA_ASSETS` directly and so does not list session uploads yet;
 * pointing it at this hook is the change that finishes the job, and it needs
 * `MEDIA_USAGE` lookups defaulted — an uploaded asset has no usage row.
 *
 * Session-scoped, and honestly so. An upload here is an object URL over a file
 * in this tab's memory — there is no service behind it, and a `blob:` URL dies
 * with the document. Persisting the ids would resurrect a draft on Monday whose
 * images stopped existing on Friday, so a reload starts from the fixtures and a
 * draft's missing ids simply drop out of `chosen`, which already reads as "no
 * media attached".
 */

/** What the library takes, as the `accept` attribute and as the guard. */
export const ACCEPTED_MEDIA =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4";

const ACCEPTED_TYPES = new Set(ACCEPTED_MEDIA.split(","));

/** The cap the library's own upload dialog states. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/* Newest first: someone who has just uploaded is looking for what they
   uploaded, not for the fixture that has been there all along. */
let uploads: MediaAsset[] = [];
let snapshot: MediaAsset[] = MEDIA_ASSETS;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish() {
  snapshot = [...uploads, ...MEDIA_ASSETS];
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

/** Bytes as the unit a person would say out loud. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why this file cannot be uploaded, or `null` if it can. */
export function rejectionFor(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return `${file.name} — JPG, PNG, WebP, GIF and MP4 only.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} — ${formatBytes(file.size)}, over the 100 MB limit.`;
  }
  return null;
}

/**
 * The real dimensions, read off the file itself.
 *
 * Worth the wait: the library shows dimensions on every asset, and a card
 * reading "0 × 0" is worse than a slightly slower upload. A file the browser
 * cannot decode resolves `null` and is reported as a failed upload rather than
 * stored as a broken tile — which is the difference between a corrupt JPEG and
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
 * uploads the rest — a picker that refuses all five because the fourth was a
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
      rejected.push(`${file.name} — could not be read.`);
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
         URL is ever dropped — the same neutral the fixtures fall back to. */
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
