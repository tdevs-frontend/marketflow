import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
// Static import so the intrinsic size follows the artwork — swap the file and
// the aspect ratio updates itself.
import logo from "../../../public/marketflow-logo.svg";
import logoLight from "../../../public/marketflow-logo-light.svg";
import mark from "../../../public/favicon.svg";

export function Logo({
  height = 32,
  tone = "dark",
  priority = false,
  className,
}: {
  /** The only dimension to set. Width follows the lockup's aspect ratio. */
  height?: number;
  /**
   * Which ground the lockup sits on. `dark` is the default and means dark ink
   * on a light surface; `light` swaps to the white-ink artwork for dark
   * sections, where the navy wordmark would otherwise disappear. Only that ink
   * differs between the two files — the mark and its greens are identical.
   */
  tone?: "dark" | "light";
  priority?: boolean;
  className?: string;
}) {
  const src = tone === "light" ? logoLight : logo;

  return (
    <Image
      src={src}
      alt={siteConfig.name}
      width={Math.round((height * logo.width) / logo.height)}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
      style={{ height }}
    />
  );
}

/**
 * The bare mark, for surfaces too tight for the full lockup. Decorative by
 * default — pass `label` where it is the only mention of the product.
 */
export function LogoMark({
  size = 36,
  label,
  priority = false,
  className,
}: {
  /** Rendered height. Width follows the mark's aspect ratio. */
  size?: number;
  label?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={mark}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={Math.round((size * mark.width) / mark.height)}
      height={size}
      priority={priority}
      className={cn("w-auto", className)}
      style={{ height: size }}
    />
  );
}
