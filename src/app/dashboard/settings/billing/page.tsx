import { Suspense } from "react";
import type { Metadata } from "next";

import { BillingSettings, SettingsPageSkeleton } from "@/components/settings";

export const metadata: Metadata = {
  title: "Billing & Subscription",
  description:
    "Your plan, what it costs, how it is paid and the plans available.",
};

/**
 * The active tab lives in the query string, so the panel reads
 * `useSearchParams` - and a client component that does cannot be statically
 * prerendered unless something above it can suspend. This boundary is that
 * something: the shell is built at build time, the panel resolves on the
 * client against whatever `?tab=` says, and a link to `?tab=plans` opens on
 * the plans.
 *
 * The fallback is the module's own skeleton rather than `null`, so the frame
 * does not collapse for the moment before the panel lands.
 */
export default function BillingSettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <BillingSettings />
    </Suspense>
  );
}
