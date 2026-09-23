import { Suspense } from "react";
import type { Metadata } from "next";

import { SecuritySettings, SettingsPageSkeleton } from "@/components/settings";

export const metadata: Metadata = {
  title: "Security",
  description: "Protect your account and manage authentication.",
};

/**
 * The active tab lives in the query string, so the panel reads
 * `useSearchParams` - and a client component that does cannot be statically
 * prerendered unless something above it can suspend. This boundary is that
 * something: the shell is built at build time, the panel resolves on the
 * client against whatever `?tab=` says, and a link to `?tab=sessions` opens on
 * the sessions list.
 *
 * The fallback is the module's own skeleton rather than `null`, so the frame
 * does not collapse for the moment before the panel lands.
 */
export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton sections={1} />}>
      <SecuritySettings />
    </Suspense>
  );
}
