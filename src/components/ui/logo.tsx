import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/** Intrinsic size of `public/marketflow-logo.svg` — mark plus wordmark. */
const SRC = "/marketflow-logo.svg";
const INTRINSIC = { width: 2172, height: 700 };
const RATIO = INTRINSIC.width / INTRINSIC.height;

export function Logo({
  height = 32,
  priority = false,
  className,
}: {
  /** The only dimension to set. Width follows the lockup's aspect ratio. */
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={SRC}
      alt={siteConfig.name}
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
      style={{ height }}
    />
  );
}
