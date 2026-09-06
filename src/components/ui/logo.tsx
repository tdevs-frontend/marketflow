import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
// Static import so the intrinsic size follows the artwork — swap the file and
// the aspect ratio updates itself.
import logo from "../../../public/marketflow-logo.svg";

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
      src={logo}
      alt={siteConfig.name}
      width={Math.round((height * logo.width) / logo.height)}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
      style={{ height }}
    />
  );
}
