import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import { APP_ROUTES } from "@/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href={APP_ROUTES.home} className="inline-flex items-center">
        <Logo height={36} priority />
      </Link>

      <div className="mt-8 w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card">
        {children}
      </div>
    </div>
  );
}
