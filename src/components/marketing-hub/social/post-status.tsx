"use client";

import { FileText } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useMediaAssets } from "@/lib/media-store";
import { cn } from "@/lib/utils";
import type { PostStatus, SocialPost } from "@/types/social";
import { AssetThumb, VideoOverlay } from "../shared/asset-thumb";

/** Post status, shared by the calendar, the list and the composer. */
const STATUS_TONES: Record<PostStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  published: "success",
  failed: "danger",
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{status}</Badge>;
}

/**
 * The left rule on a calendar card. Status is carried by a border colour there
 * rather than a badge, because a 90px-wide cell has no room for both a
 * platform mark and a word.
 */
export const STATUS_RULE: Record<PostStatus, string> = {
  draft: "border-l-border-strong",
  scheduled: "border-l-info",
  published: "border-l-success",
  failed: "border-l-error",
};

const THUMB_SIZES = {
  sm: "size-6 rounded",
  md: "size-9 rounded-btn",
  lg: "size-14 rounded-panel",
  fill: "size-full rounded-none",
} as const;

/**
 * A post's first asset, as its picture.
 *
 * Three cases and each one has to be recognisable at 24px in a month cell:
 *
 * - An image shows the image.
 * - A video shows its poster frame with a play badge over it, so a reel is
 *   identifiable as a reel without the grid loading any video.
 * - A post with no media shows a document glyph rather than an empty tile -
 *   a text-only update is a real kind of post, and a blank square reads as a
 *   picture that failed to load.
 *
 * Assets come from `useMediaAssets`, the same store the Media Library and the
 * campaign picker read, so a file uploaded in the composer is the picture the
 * calendar draws a second later.
 */
export function PostThumb({
  post,
  size = "md",
  className,
}: {
  post: SocialPost;
  /** `fill` hands sizing to the caller - the grid's 16:9 media band. */
  size?: "sm" | "md" | "lg" | "fill";
  className?: string;
}) {
  const assets = useMediaAssets();
  const asset = assets.find((item) => item.id === post.mediaIds[0]);
  const small = size === "sm";

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden",
        THUMB_SIZES[size],
        asset ? asset.tone : "bg-surface-secondary",
        className,
      )}
    >
      {asset ? (
        <>
          <AssetThumb asset={asset} className="size-full" />
          {asset.type === "video" ? (
            <VideoOverlay
              duration={asset.duration}
              size={small || size === "md" ? "sm" : "md"}
            />
          ) : null}
        </>
      ) : (
        <FileText
          aria-hidden
          className={cn("text-text-muted", small ? "size-3" : "size-4")}
        />
      )}

      <span className="sr-only">
        {asset
          ? `${asset.type === "video" ? "Video" : "Image"}: ${asset.name}`
          : "Text-only post"}
      </span>
    </span>
  );
}
