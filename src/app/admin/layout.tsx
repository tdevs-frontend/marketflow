import type { Metadata } from "next";

import { AdminShell } from "@/components/support";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · MarketFlow Admin" },
  robots: { index: false, follow: false },
};

/**
 * The Admin area - a separate surface from the merchant dashboard.
 *
 * `data-surface="app"` gives it the dashboard's one-face typography (see
 * `app/dashboard/layout`); nothing else is shared. It stands in for
 * MarketFlow's separate Admin Dashboard application, which does not live in
 * this repository, so the help desk's two sides can run together here.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div data-surface="app" className="flex min-h-full flex-1 flex-col">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
