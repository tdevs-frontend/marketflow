"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";

import { BrandIcon } from "@/components/ui/brand-icon";
import { cn } from "@/lib/utils";

/**
 * The share row, closing an article.
 *
 * Three networks and a copy button. The three are the accounts MarketFlow
 * itself is on — see `footerSocials` — because a share row is a claim about
 * where this piece is worth posting, and offering a network the product does
 * not use is furniture.
 *
 * The marks come from `BrandIcon` rather than Lucide: Lucide dropped its brand
 * icons, so `Facebook`, `Twitter` and `Linkedin` are `undefined` in the
 * version this project ships and would render nothing at all. Lucide draws the
 * one icon that is not a brand — the link.
 *
 * `url` arrives from the server as the article's canonical address, which is
 * what the three share links carry. Copy reads `window.location.href` first,
 * so a reader who arrived with a campaign tag copies the address they are
 * actually looking at, and falls back to the canonical one when there is no
 * window — the two agree in every normal case.
 *
 * Copy is a button and the other three are links, which is the honest shape:
 * one acts on this page, three navigate away.
 */

const COPY_RESET_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

export function ShareArticle({ url, title }: { url: string; title: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* A reader who copies and navigates away within the two seconds would
     otherwise leave a timer holding a setState on an unmounted component. */
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const shared = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const NETWORKS = [
    {
      label: "Share on Facebook",
      icon: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shared}`,
    },
    {
      label: "Share on X",
      icon: "x",
      href: `https://x.com/intent/tweet?url=${shared}&text=${text}`,
    },
    {
      label: "Share on LinkedIn",
      icon: "linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${shared}`,
    },
  ];

  async function handleCopy() {
    const href = typeof window === "undefined" ? url : window.location.href;

    if (timer.current) clearTimeout(timer.current);

    try {
      await navigator.clipboard.writeText(href);
      setCopyState("copied");
    } catch {
      /* Denied permission, or an insecure origin. Saying so beats a button
         that reports success and copied nothing. */
      setCopyState("failed");
    }

    timer.current = setTimeout(() => setCopyState("idle"), COPY_RESET_MS);
  }

  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
      <p className="text-sm font-semibold text-text-primary">
        Share this article
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {NETWORKS.map((network) => (
          <a
            key={network.icon}
            href={network.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={network.label}
            title={network.label}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-primary-border hover:bg-primary-soft hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
          >
            <BrandIcon name={network.icon} className="size-4" />
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:shadow-focus focus-visible:outline-none",
            copyState === "copied"
              ? "border-success/30 bg-success-soft text-success-text"
              : copyState === "failed"
                ? "border-error/30 bg-error-soft text-error-text"
                : "border-border bg-surface text-text-secondary hover:border-primary-border hover:bg-primary-soft hover:text-primary",
          )}
        >
          {copyState === "copied" ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Link2 className="size-4" aria-hidden />
          )}
          {copyState === "copied"
            ? "Copied"
            : copyState === "failed"
              ? "Copy failed"
              : "Copy link"}
        </button>

        {/* The button's own label changes, which a screen reader announces
            only if it happens to be focused. This says it either way. */}
        <span aria-live="polite" className="sr-only">
          {copyState === "copied"
            ? "Article link copied to the clipboard"
            : copyState === "failed"
              ? "Could not copy the link"
              : ""}
        </span>
      </div>
    </div>
  );
}
