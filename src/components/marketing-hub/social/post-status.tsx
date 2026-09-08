import { Badge, type BadgeTone } from "@/components/ui/badge";
import { MEDIA_ASSETS } from "@/lib/social-fixtures";
import { cn } from "@/lib/utils";
import type { PostStatus, SocialPost } from "@/types/social";

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

/**
 * A post's first asset as a small tinted tile.
 *
 * Real thumbnails come from the asset URL; until then the media's own `tone`
 * gives each post a stable, distinguishable swatch — which is enough for the
 * calendar, where the job is telling two cards apart rather than judging the
 * image.
 */
export function PostThumb({
  post,
  size = "md",
  className,
}: {
  post: SocialPost;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const asset = MEDIA_ASSETS.find((item) => item.id === post.mediaIds[0]);

  const sizes = {
    sm: "size-6 rounded",
    md: "size-9 rounded-btn",
    lg: "size-14 rounded-panel",
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden",
        sizes[size],
        asset?.tone ?? "bg-surface-secondary",
        className,
      )}
    >
      {asset?.type === "video" ? (
        /* A play triangle rather than a film icon — it reads at 24px. */
        <span className="ml-0.5 block size-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-text-muted" />
      ) : asset ? null : (
        <span className="text-[9px] font-bold text-text-muted">TXT</span>
      )}
    </span>
  );
}
