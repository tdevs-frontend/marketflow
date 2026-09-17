import { cn, initials } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
  xs: "size-6 text-xs",
  sm: "size-8 text-sm",
  md: "size-10 text-sm",
  lg: "size-12 text-sm",
};

/**
 * A person's photo, or their initials when there is no photo.
 *
 * The initials are deliberately monochrome rather than hashed to a colour per
 * person: a contact list of forty randomly tinted circles is the fastest way to
 * make a clean table look like a template. `tone` exists for the few places
 * where the avatar carries meaning — a channel, an agent, a platform.
 *
 * `src` follows the same rule `ProductThumb` does: the *absence* of a URL is
 * what selects the fallback, so this stays a server component and 24 call sites
 * stay off the client bundle. A URL that is present but 404s shows the broken
 * image rather than the initials — recovering from that needs an `onError`, and
 * an `onError` needs a client boundary.
 */
export function Avatar({
  name,
  src,
  size = "md",
  tone,
  className,
}: {
  name: string;
  /** The person's photo. Falls back to initials when absent. */
  src?: string;
  size?: AvatarSize;
  /** Class pair for ground and ink. Defaults to the neutral grey chip. */
  tone?: string;
  className?: string;
}) {
  /*
   * First name and *last* name, not the first two words: "Maria Del Gomez"
   * reads as MG to the person who owns the name and as MD to a `[first, last]`
   * destructure. One-word names keep the single letter.
   */
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-bold select-none",
        tone ?? "bg-gray text-gray-ink",
        SIZES[size],
        className,
      )}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(first, last)
      )}
    </span>
  );
}

/** Avatar plus name and a secondary line — the identity cell of a table row. */
export function AvatarLabel({
  name,
  secondary,
  src,
  size = "md",
  tone,
  className,
}: {
  name: string;
  secondary?: string;
  src?: string;
  size?: AvatarSize;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar name={name} src={src} size={size} tone={tone} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        {secondary ? (
          <p className="truncate text-sm text-text-muted">
            {secondary}
          </p>
        ) : null}
      </div>
    </div>
  );
}
