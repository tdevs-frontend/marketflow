import { BrandIcon } from "@/components/ui/brand-icon";
import { PLATFORM_THEME } from "@/constants/channels";
import { cn } from "@/lib/utils";
import type { SocialProvider } from "@/types/social";
import { PlatformMark, type MarkSize } from "@/components/marketing-hub/shared/channel-badge";

/**
 * A provider's mark, whether or not it is a platform we publish to yet.
 *
 * For a connected platform this *is* `PlatformMark` - the same component the
 * Social Planner's calendar and post rows use, so one Instagram glyph appears
 * in both modules and the two read as one product.
 *
 * The fallback exists for providers with no `SocialPlatform` behind them:
 * TikTok is in the catalogue as "Coming Soon" and has no entry in
 * `PLATFORM_THEME`, because that table carries the brand colours the analytics
 * charts key off and adding a colour for a platform with no data would put an
 * empty series in every chart. An unconnectable provider gets the neutral tile
 * instead, which also reads correctly: it is not live yet.
 */
export function ProviderIcon({
  provider,
  size = "md",
  className,
}: {
  provider: SocialProvider;
  size?: MarkSize;
  className?: string;
}) {
  if (provider.platform && PLATFORM_THEME[provider.platform]) {
    return (
      <PlatformMark platform={provider.platform} size={size} className={className} />
    );
  }

  const TILE: Record<MarkSize, string> = {
    sm: "size-6 rounded-btn [&_svg]:size-3.5",
    md: "size-8 rounded-btn [&_svg]:size-4",
    lg: "size-10 rounded-panel [&_svg]:size-5",
  };

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-surface-secondary text-text-muted",
        TILE[size],
        className,
      )}
    >
      <BrandIcon name={provider.icon} className="size-full p-0" />
      <span className="sr-only">{provider.label}</span>
    </span>
  );
}
