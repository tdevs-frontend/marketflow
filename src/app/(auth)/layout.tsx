import Link from "next/link";
import type { ReactNode } from "react";

import { APP_ROUTES } from "@/constants";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href={APP_ROUTES.home} className="flex items-center gap-2 font-semibold">
        <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary text-white">
          M
        </span>
        {siteConfig.name}
      </Link>

      <div className="mt-8 w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card">
        {children}
      </div>
    </div>
  );
}
