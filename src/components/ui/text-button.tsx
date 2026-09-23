import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CommonTextButtonSize = "sm" | "md" | "lg";

const SIZES: Record<CommonTextButtonSize, { text: string; icon: string }> = {
  sm: { text: "gap-1 text-sm", icon: "size-3.5" },
  md: { text: "gap-1 text-base", icon: "size-4.5" },
  lg: { text: "gap-1.5 text-lg", icon: "size-5" },
};

/**
 * A text link with a trailing arrow - "Read article", "Learn More" - the one
 * treatment for every card-footer call to action.
 *
 * `color` takes a theme text class (`text-text-primary`, `text-primary`, ...)
 * and hover always lands on `text-primary`, so the accent stays the brand's
 * whatever the resting ink is.
 *
 * Without `href` it renders a `<span>`: that is for a card that is itself one
 * link, like `BlogCard`, where a second anchor inside would be invalid markup
 * and a duplicate destination for a screen reader. The span then follows the
 * card's hover through `group-hover`, so the whole card lights it up.
 */
export function CommonTextButton({
  label,
  href,
  size = "md",
  color = "text-text-primary",
  className,
}: {
  label: string;
  href?: string;
  size?: CommonTextButtonSize;
  color?: string;
  className?: string;
}) {
  const classes = cn(
    "group/text-button inline-flex w-fit shrink-0 items-center font-semibold transition-colors duration-200 hover:text-primary group-hover:text-primary motion-reduce:transition-none",
    SIZES[size].text,
    color,
    href && "rounded-sm focus-visible:shadow-focus focus-visible:outline-none",
    className,
  );

  const content = (
    <>
      {label}
      <ArrowRight
        /* `translate`, not `transform` - Tailwind v4 writes the utility to
           the former, so a `transition-transform` here animates nothing. */
        className={cn(
          SIZES[size].icon,
          "transition-[translate] duration-200 group-hover:translate-x-0.5 group-hover/text-button:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover/text-button:translate-x-0",
        )}
        aria-hidden
      />
    </>
  );

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  );
}
