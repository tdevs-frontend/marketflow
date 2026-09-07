import Link from "next/link";
import type { ReactNode } from "react";

import { AuthBrandPanel } from "@/components/auth";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES } from "@/constants";

/**
 * The shell every auth screen sits in: brand panel left, card right.
 *
 * The split only opens at `lg`. Between tablet and there, a 40% brand column
 * would leave the card too narrow to be comfortable, so those widths get the
 * centred single column instead — the same treatment as mobile, with more air.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-[42fr_58fr] xl:grid-cols-[45fr_55fr]">
      <AuthBrandPanel />

      <main className="flex items-center justify-center px-5 py-12 sm:px-8 lg:py-16">
        <div className="w-full max-w-108">
          {/* Stands in for the brand panel where it is hidden. No visual —
              on a phone it would push the form below the fold. */}
          <div className="mb-8 text-center lg:hidden">
            <Link
              href={APP_ROUTES.home}
              className="inline-flex rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
            >
              <Logo height={34} priority />
            </Link>

            <h2 className="mt-6 text-xl leading-tight text-balance">
              From first <span className="text-primary">conversation</span> to
              final sale.
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-pretty text-text-muted">
              Leads, conversations, campaigns and products in one workspace.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
