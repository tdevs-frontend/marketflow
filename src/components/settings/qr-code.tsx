"use client";

import { useMemo } from "react";

import { encodeQr } from "@/lib/qr";
import { cn } from "@/lib/utils";

/**
 * A QR code, drawn as one SVG path.
 *
 * Encoded in the browser by `lib/qr` - not fetched from an image service. The
 * only thing this product ever puts in a QR code is an `otpauth://` URI
 * carrying a TOTP shared secret, and posting that to a third party to have a
 * PNG drawn would hand over the whole second factor in the course of rendering
 * a square.
 *
 * Two choices worth stating.
 *
 * **It is always dark-on-white, in both themes.** Every other surface in the
 * product follows the theme; this one must not. A QR scanner thresholds the
 * image, and inverted codes are read by some phone cameras and not others -
 * which turns "enable two-factor" into a coin flip that depends on the user's
 * handset. The white plate is drawn explicitly rather than inherited, so a dark
 * theme cannot take it away.
 *
 * **One `<path>`, not `size²` rects.** A version 7 symbol is 45×45 - two
 * thousand elements if each module is its own node, all of which React would
 * diff. Concatenating the run into a single path string makes it one node, and
 * `shape-rendering="crispEdges"` keeps the module boundaries from being
 * antialiased into grey at small sizes, which is what actually breaks scanning.
 */
export function QrCode({
  value,
  size = 208,
  label = "QR code",
  className,
}: {
  /** The text to encode. */
  value: string;
  /** Rendered edge length in pixels, quiet zone included. */
  size?: number;
  /** Accessible name. The instructions beside it carry the detail. */
  label?: string;
  className?: string;
}) {
  const symbol = useMemo(() => {
    try {
      return encodeQr(value);
    } catch {
      /* `encodeQr` throws rather than truncating past its capacity. Nothing
         this product encodes comes close, but a silently wrong QR code is the
         one failure worth refusing to draw - the manual setup key beside it is
         the working path either way. */
      return null;
    }
  }, [value]);

  if (!symbol) return null;

  /* Four modules of margin, as the spec requires. Scanners use the quiet zone
     to find the symbol's edge; without it the finder patterns sit against the
     card and a phone has nothing to lock onto. */
  const quiet = 4;
  const extent = symbol.size + quiet * 2;

  let path = "";
  for (let row = 0; row < symbol.size; row += 1) {
    for (let col = 0; col < symbol.size; col += 1) {
      if (symbol.modules[row][col]) {
        path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${extent} ${extent}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={cn("rounded-btn border border-border", className)}
    >
      <rect width={extent} height={extent} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
