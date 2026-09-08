import { cn, initials } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
};

/**
 * Initials avatar.
 *
 * Deliberately monochrome rather than hashed to a colour per person: a contact
 * list of forty randomly tinted circles is the fastest way to make a clean
 * table look like a template. `tone` exists for the few places where the
 * avatar carries meaning — a channel, an agent, a platform.
 */
export function Avatar({
  name,
  size = "md",
  tone,
  className,
}: {
  name: string;
  size?: AvatarSize;
  /** Class pair for ground and ink. Defaults to the neutral grey chip. */
  tone?: string;
  className?: string;
}) {
  const [first, last] = name.trim().split(/\s+/);

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold select-none",
        tone ?? "bg-gray text-gray-ink",
        SIZES[size],
        className,
      )}
    >
      {initials(first ?? "?", last)}
    </span>
  );
}

/** Avatar plus name and a secondary line — the identity cell of a table row. */
export function AvatarLabel({
  name,
  secondary,
  size = "md",
  tone,
  className,
}: {
  name: string;
  secondary?: string;
  size?: AvatarSize;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar name={name} size={size} tone={tone} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        {secondary ? (
          <p className="truncate text-xs text-text-muted">{secondary}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Overlapping stack, for "who is in this audience" style summaries. */
export function AvatarGroup({
  names,
  max = 4,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: AvatarSize;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((name, index) => (
        <Avatar
          key={`${name}-${index}`}
          name={name}
          size={size}
          className="ring-2 ring-surface not-first:-ml-2"
        />
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            "-ml-2 grid place-items-center rounded-full bg-surface-secondary font-bold text-text-muted ring-2 ring-surface",
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
