import { Icon } from "@/components/ui/icon";
import { BrandIcon } from "@/components/ui/brand-icon";
import {
  CHANNEL_THEME,
  PLATFORM_THEME,
  type Channel,
} from "@/constants/channels";
import { cn } from "@/lib/utils";
import type { SocialPlatform } from "@/types/social";

/**
 * The channel and platform marks.
 *
 * Every one of these reads its colour from `CHANNEL_THEME` / `PLATFORM_THEME`
 * rather than a local class, so adding a channel is one table entry and no
 * component edits — and so a WhatsApp chip is the same green in a table row,
 * a stat card and a calendar cell.
 */

export type MarkSize = "sm" | "md" | "lg";

const TILE: Record<MarkSize, string> = {
  sm: "size-6 rounded-btn [&_svg]:size-3.5",
  md: "size-8 rounded-btn [&_svg]:size-4",
  lg: "size-10 rounded-panel [&_svg]:size-5",
};

/** Tinted tile holding the channel's icon. The identity mark for a module. */
export function ChannelMark({
  channel,
  size = "md",
  filled = false,
  className,
}: {
  channel: Channel;
  size?: MarkSize;
  /** Accent ground with white ink, for headers rather than table rows. */
  filled?: boolean;
  className?: string;
}) {
  const theme = CHANNEL_THEME[channel];

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        TILE[size],
        filled ? theme.solid : cn(theme.soft, theme.text),
        className,
      )}
    >
      <Icon name={theme.icon} />
      <span className="sr-only">{theme.label}</span>
    </span>
  );
}

/** Mark plus label. The channel cell of a cross-channel table. */
export function ChannelBadge({
  channel,
  showLabel = true,
  size = "sm",
  className,
}: {
  channel: Channel;
  showLabel?: boolean;
  size?: MarkSize;
  className?: string;
}) {
  const theme = CHANNEL_THEME[channel];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ChannelMark channel={channel} size={size} />
      {showLabel ? (
        <span className="text-sm text-text-secondary">{theme.label}</span>
      ) : null}
    </span>
  );
}

/**
 * A social platform's own mark.
 *
 * Kept apart from `ChannelMark` because these carry the platform's real brand
 * colour — a recoloured Instagram glyph reads as a mock-up rather than a
 * connected account.
 */
export function PlatformMark({
  platform,
  size = "md",
  filled = false,
  className,
}: {
  platform: SocialPlatform;
  size?: MarkSize;
  filled?: boolean;
  className?: string;
}) {
  const theme = PLATFORM_THEME[platform];

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        TILE[size],
        filled ? theme.solid : cn(theme.soft, theme.text),
        className,
      )}
    >
      <BrandIcon name={theme.icon} className="size-full p-0" />
      <span className="sr-only">{theme.label}</span>
    </span>
  );
}

/**
 * The platforms a post goes to, overlapping.
 *
 * A post is multi-platform by design, so the list needs one cell that says
 * "Instagram and Facebook" without three words of text per row.
 */
export function PlatformStack({
  platforms,
  size = "sm",
  className,
}: {
  platforms: SocialPlatform[];
  size?: MarkSize;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {platforms.map((platform) => (
        <PlatformMark
          key={platform}
          platform={platform}
          size={size}
          className="ring-2 ring-surface not-first:-ml-1.5"
        />
      ))}
      <span className="sr-only">
        {platforms.map((platform) => PLATFORM_THEME[platform].label).join(", ")}
      </span>
    </span>
  );
}

/** Plain coloured dot, for legends and dense calendar cells. */
export function PlatformDot({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const theme = PLATFORM_THEME[platform];

  return (
    <span
      aria-hidden
      /* `swatch`, not an inline `theme.hex`: the theme already carries the
         class for exactly this and the hex field exists only for the chart
         library, which cannot read a custom property. */
      className={cn("size-1.5 shrink-0 rounded-full", theme.swatch, className)}
    />
  );
}
