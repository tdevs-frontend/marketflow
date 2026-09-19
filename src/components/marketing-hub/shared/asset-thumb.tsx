import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/social";

/**
 * A media asset's picture, at whatever size the caller gives it.
 *
 * The one place in the product that decides what to paint for an asset, so no
 * surface repeats the fallback and none of them can disagree about what a
 * given asset looks like. The campaign wizard's picker, the Planner's calendar
 * and post grid, the composer and the Media Library all render through this —
 * which is what makes "the same asset appears the same everywhere" a property
 * of the code rather than a thing to remember.
 *
 * Three sources, in order:
 *
 * - `poster`, when the asset has one. Videos always do: a grid must not fetch
 *   and decode an MP4 to draw a 200px tile, and it must certainly not autoplay
 *   one.
 * - `url`, for an image — a library path, or a `blob:` from this session's
 *   uploads.
 * - the `tone` swatch, when there is no file. An asset can exist before its
 *   bytes do, and a flat tint is a better answer than a broken-image glyph.
 *
 * A session-uploaded video has a `blob:` url and no poster, so it falls to the
 * `<video>` branch and shows its own first frame. `preload="metadata"` and no
 * `autoplay` is what keeps that honest.
 */
export function AssetThumb({
  asset,
  className,
}: {
  asset: MediaAsset;
  className?: string;
}) {
  const fit = asset.fit === "contain" ? "object-contain" : "object-cover";
  const still = asset.poster ?? (asset.type === "image" ? asset.url : undefined);

  if (still) {
    return (
      /* A `blob:` URL has nothing for the image optimiser to fetch, so this
         stays a plain `img` — `next/image` would route it through
         `/_next/image` and 404 on every upload. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={still}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("block", fit, asset.tone, className)}
      />
    );
  }

  if (asset.type === "video" && asset.url) {
    return (
      <video
        aria-hidden
        src={asset.url}
        muted
        playsInline
        preload="metadata"
        className={cn("block", fit, asset.tone, className)}
      />
    );
  }

  return <span aria-hidden className={cn("block", asset.tone, className)} />;
}

/** Seconds as a clip length — `0:42`, `1:05`. */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * The play badge and run time laid over a video thumbnail.
 *
 * Absolute, so it sits on whatever tile the caller already drew, and
 * `pointer-events-none` so it never intercepts the click that opens the post.
 * A video in a grid has to be identifiable as a video before it is opened —
 * that is the whole job, and it is why nothing here plays.
 */
export function VideoOverlay({
  duration,
  size = "md",
  className,
}: {
  duration?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const small = size === "sm";

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex items-end justify-between gap-1 p-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full bg-text-primary/65 text-white backdrop-blur-[2px]",
          small ? "size-5" : "size-7",
        )}
      >
        <Play className={cn("translate-x-px fill-current", small ? "size-2.5" : "size-3.5")} />
      </span>

      {duration !== undefined && !small ? (
        <span className="rounded bg-text-primary/65 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums backdrop-blur-[2px]">
          {formatDuration(duration)}
        </span>
      ) : null}
    </span>
  );
}
