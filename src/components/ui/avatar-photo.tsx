"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar, type AvatarSize } from "@/components/ui/avatar";

/**
 * An `Avatar` that falls back to initials when the photo will not load.
 *
 * `Avatar` itself cannot do this, and the reason is written into it: the
 * *absence* of a URL is what selects the fallback, which keeps it a server
 * component and twenty-odd call sites off the client bundle. A URL that is
 * present but 404s shows the browser's broken-image glyph, because recovering
 * from that needs an `onError` and an `onError` needs a client boundary.
 *
 * This is that boundary, for the one place the trade does not hold: the signed-
 * in person's own photo. Every other avatar in the product renders a URL the
 * fixtures control; this one renders whatever the account service last said,
 * or whatever a merchant uploaded, and either can stop resolving — a moved
 * file, an expired signed URL, a provider that is down. A broken glyph where
 * somebody's face should be is the most conspicuous possible failure, and it
 * sits in the header on every screen.
 *
 * There are **two** ways the image can fail, and catching only the obvious one
 * is why this pattern is so often still broken in production:
 *
 *   *After hydration* — the request is still in flight when React attaches its
 *   handlers, and `onErrorCapture` fires normally.
 *
 *   *Before hydration* — the markup is server-rendered, so the browser starts
 *   the request during parse and can finish failing it before any JavaScript
 *   runs. `error` does not bubble and React was not listening yet, so nothing
 *   catches it and the glyph stays for good. The mount effect below is the
 *   fix: an image that is `complete` with a `naturalWidth` of zero is one that
 *   has already failed, which is how the platform reports it after the fact.
 *
 * The alternative — render initials on the server and swap the photo in after
 * mount — closes the same hole by making every page load flash the initials
 * first. Checking once on mount costs nothing and shows the right thing
 * immediately in the case that actually matters, which is the photo loading.
 */
export function AvatarPhoto({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  /*
   * *Which* URL failed, not whether one did.
   *
   * A boolean would need resetting whenever `src` changes, and resetting state
   * from an effect is a cascading render — the component paints the stale
   * answer, then corrects itself. Storing the URL makes the reset fall out of
   * the comparison: a new photo simply is not the one that failed, so it gets
   * its own attempt with no extra pass. Without that, one broken avatar would
   * poison every subsequent upload for the rest of the session.
   */
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src) && failedSrc === src;

  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!src) return;

    const img = ref.current?.querySelector("img");
    if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  return (
    /* `display: contents` on the wrapper, so it catches the image's error
       event without becoming a box of its own — `Avatar` stays the flex item
       its parents already lay out, at the size and shrink behaviour they
       expect. */
    <span
      ref={ref}
      className="contents"
      onErrorCapture={() => setFailedSrc(src ?? null)}
    >
      <Avatar
        name={name}
        src={!src || failed ? undefined : src}
        size={size}
        className={className}
      />
    </span>
  );
}
